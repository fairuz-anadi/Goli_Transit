<?php

namespace App\Console\Commands;

use App\Services\TomTom\TomTomService;
use Illuminate\Console\Command;

class SyncTomTomTraffic extends Command
{
    protected $signature = 'golitransit:sync-tomtom-traffic
                            {--dry-run : Show what would be updated without writing changes}';

    protected $description = 'Refresh current_weight on car-allowed edges using live TomTom traffic data';

    public function handle(TomTomService $tomtom)
    {
        $graph = app(\App\Services\Graph\GraphManager::class);
        $edges = $graph->getCarAllowedEdgesWithCoordinates();
        $isDryRun = $this->option('dry-run');
        $updated = 0;
        $skipped = 0;

        $bar = $this->output->createProgressBar(count($edges));
        $bar->start();

        foreach ($edges as $edge) {
            $minutes = $tomtom->getTrafficDuration(
                $edge['from_lat'],
                $edge['from_lng'],
                $edge['to_lat'],
                $edge['to_lng']
            );

            if ($minutes !== null) {
                if (!$isDryRun) {
                    $graph->setCurrentWeight($edge['id'], $minutes);
                }
                $updated++;
            } else {
                $skipped++;
            }

            // Small delay to stay comfortably under TomTom's free-tier rate limits.
            usleep(100000); // 100ms

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $mode = $isDryRun ? '[DRY RUN] ' : '';
        $this->info("{$mode}{$updated} edges updated, {$skipped} skipped (out of " . count($edges) . " car-allowed edges).");

        if ($skipped > 0) {
            $this->warn("Skipped edges kept their previous current_weight (API failure or no data returned).");
        }
    }
}
