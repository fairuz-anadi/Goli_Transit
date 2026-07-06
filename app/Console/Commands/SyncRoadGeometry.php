<?php

namespace App\Console\Commands;

use App\Services\Graph\MapData;
use App\Services\TomTom\TomTomService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class SyncRoadGeometry extends Command
{
    protected $signature = 'golitransit:sync-road-geometry
                            {--dry-run : Show what would be fetched without writing the geometry file}';

    protected $description = 'Fetch real road-following polylines from TomTom for each edge, for map rendering only';

    public function handle(MapData $mapData, TomTomService $tomtom)
    {
        $nodeIndex = [];
        foreach ($mapData->getNodes() as $node) {
            $nodeIndex[$node['id']] = $node;
        }

        // De-duplicate by unordered node pair - forward/reverse edges share one
        // physical road, so this roughly halves the number of API calls needed.
        $pairs = [];
        foreach ($mapData->getEdges() as $edge) {
            $pair = [$edge['from'], $edge['to']];
            sort($pair);
            $key = implode('|', $pair);

            if (!isset($pairs[$key])) {
                $pairs[$key] = ['from' => $pair[0], 'to' => $pair[1], 'sample_edge' => $edge];
            }
        }

        $isDryRun = (bool) $this->option('dry-run');
        $geometry = [];
        $updated = 0;
        $skipped = 0;

        $bar = $this->output->createProgressBar(count($pairs));
        $bar->start();

        foreach ($pairs as $key => $pair) {
            $from = $nodeIndex[$pair['from']] ?? null;
            $to = $nodeIndex[$pair['to']] ?? null;

            if (!$from || !$to) {
                $skipped++;
                $bar->advance();
                continue;
            }

            $points = $tomtom->getRoutePoints(
                $from['lat'],
                $from['lng'],
                $to['lat'],
                $to['lng'],
                $this->travelModeFor($pair['sample_edge'])
            );

            if ($points !== null) {
                $geometry[$key] = $points;
                $updated++;
            } else {
                $skipped++;
            }

            // Small delay to stay comfortably under TomTom's free-tier rate limits.
            usleep(100000);

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $mode = $isDryRun ? '[DRY RUN] ' : '';
        $this->info("{$mode}{$updated} road segments fetched, {$skipped} skipped (out of " . count($pairs) . " unique segments).");

        if (!$isDryRun) {
            Storage::put('road-geometry.json', json_encode($geometry, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
            $this->info('Saved to ' . Storage::path('road-geometry.json'));
        }

        if ($skipped > 0) {
            $this->warn('Skipped segments will fall back to a straight line on the map.');
        }
    }

    protected function travelModeFor(array $edge): string
    {
        if (!$edge['car_allowed'] && !$edge['rickshaw_allowed'] && $edge['walk_allowed']) {
            return 'pedestrian';
        }

        if (!$edge['car_allowed'] && $edge['rickshaw_allowed']) {
            return 'bicycle';
        }

        return 'car';
    }
}
