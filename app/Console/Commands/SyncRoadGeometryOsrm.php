<?php

namespace App\Console\Commands;

use App\Services\Graph\MapData;
use App\Services\Osrm\OsrmService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class SyncRoadGeometryOsrm extends Command
{
    protected $signature = 'golitransit:sync-road-geometry-osrm
                            {--dry-run : Show what would be fetched without writing the geometry file}
                            {--missing-only : Only fetch pairs not already present in the existing geometry file, merging into it instead of overwriting}';

    protected $description = 'Fetch real road-following geometry, distance, and duration from OSRM for each edge';

    protected const OUTPUT_FILE = 'road-geometry-osrm.json';

    public function handle(MapData $mapData, OsrmService $osrm)
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
        $missingOnly = (bool) $this->option('missing-only');

        $existingGeometry = [];
        if ($missingOnly && Storage::exists(self::OUTPUT_FILE)) {
            $decoded = json_decode(Storage::get(self::OUTPUT_FILE), true);
            $existingGeometry = is_array($decoded) ? $decoded : [];
        }

        $geometry = [];
        $updated = 0;
        $skipped = 0;
        $alreadyPresent = 0;

        $bar = $this->output->createProgressBar(count($pairs));
        $bar->start();

        foreach ($pairs as $key => $pair) {
            if ($missingOnly && isset($existingGeometry[$key])) {
                $alreadyPresent++;
                $bar->advance();
                continue;
            }

            $from = $nodeIndex[$pair['from']] ?? null;
            $to = $nodeIndex[$pair['to']] ?? null;

            if (!$from || !$to) {
                $skipped++;
                $bar->advance();
                continue;
            }

            $profile = $this->profileFor($pair['sample_edge']);

            $route = $osrm->getRoute(
                $from['lat'],
                $from['lng'],
                $to['lat'],
                $to['lng'],
                $profile
            );

            if ($route !== null) {
                $geometry[$key] = [
                    'points' => $route['points'],
                    'distance_km' => $route['distance_km'],
                    'duration_min' => $route['duration_min'],
                    'profile' => $profile,
                ];
                $updated++;
            } else {
                $skipped++;
            }

            // The public OSRM demo server's usage policy asks for roughly one
            // request per second - stay comfortably under that.
            usleep(1_000_000);

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $mode = $isDryRun ? '[DRY RUN] ' : '';
        $presentNote = $missingOnly ? ", {$alreadyPresent} already present (untouched)" : '';
        $this->info("{$mode}{$updated} road segments fetched, {$skipped} skipped{$presentNote} (out of " . count($pairs) . " unique segments).");

        if (!$isDryRun) {
            $finalGeometry = $missingOnly ? array_merge($existingGeometry, $geometry) : $geometry;
            Storage::put(self::OUTPUT_FILE, json_encode($finalGeometry, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
            $this->info('Saved to ' . Storage::path(self::OUTPUT_FILE));
        }

        if ($skipped > 0) {
            $this->warn('Skipped segments will fall back to the hand-authored distance and a straight line on the map.');
        }
    }

    /**
     * Map GoliTransit's travel modes to the closest OSRM routing profile.
     * OSRM has no rickshaw profile, so cycling is the closest match.
     */
    protected function profileFor(array $edge): string
    {
        if ($edge['car_allowed'] ?? false) {
            return 'driving';
        }

        if ($edge['rickshaw_allowed'] ?? false) {
            return 'cycling';
        }

        return 'walking';
    }
}
