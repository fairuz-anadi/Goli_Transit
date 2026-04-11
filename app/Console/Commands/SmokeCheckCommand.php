<?php

namespace App\Console\Commands;

use App\Services\Graph\GraphManager;
use App\Services\Routing\DemoGraphService;
use App\Services\Routing\DijkstraRoutingService;
use App\Services\Sessions\SessionManager;
use Illuminate\Console\Command;
use RuntimeException;

class SmokeCheckCommand extends Command
{
    protected $signature = 'golitransit:smoke-check';

    protected $description = 'Run a submission-focused smoke check for graph, route, anomaly, and rerouting.';

    public function handle(
        GraphManager $graphManager,
        DemoGraphService $graphService,
        DijkstraRoutingService $routingService,
        SessionManager $sessionManager
    ): int {
        $sessionManager->flush();
        $graphManager->resetGraph();

        try {
            $graph = $graphManager->getGraph();
            $adjacencyGraph = $graphService->getGraph();

            $nodeCount = count($graph['nodes'] ?? []);
            $edgeCount = count($graph['edges'] ?? []);

            if ($nodeCount < 20 || $edgeCount < 40) {
                throw new RuntimeException('Graph footprint is smaller than expected.');
            }

            $route = $routingService->run(
                $adjacencyGraph,
                'farmgate',
                'gulshan_2',
                ['car', 'rickshaw', 'walk']
            );

            if (($route['path'][0] ?? null) !== 'farmgate' || end($route['path']) !== 'gulshan_2') {
                throw new RuntimeException('Route path did not resolve the expected start and destination.');
            }

            if (($route['segments'] ?? []) === []) {
                throw new RuntimeException('Route returned no segments.');
            }

            $route['request'] = [
                'start' => 'farmgate',
                'destination' => 'gulshan_2',
                'allowed_modes' => ['car', 'rickshaw', 'walk'],
            ];

            $sessionManager->createSession('smoke-session', $route);

            $routeEdgeIds = array_values(array_filter(array_map(
                static fn (array $segment): ?string => $segment['edge_id'],
                $route['segments']
            )));
            $targetEdgeId = $routeEdgeIds[0] ?? null;

            if ($targetEdgeId === null) {
                throw new RuntimeException('Could not determine a target edge from the computed route.');
            }

            $affectedEdges = $graphManager->updateAnomalyZone([$targetEdgeId], 10);
            $reroutedSessions = $sessionManager->rerouteAffectedSessions(
                array_column($affectedEdges, 'id')
            );

            $updatedGraph = $graphManager->getGraph();
            $updatedEdge = collect($updatedGraph['edges'])
                ->firstWhere('id', $targetEdgeId);

            if (($updatedEdge['current_weight'] ?? null) !== (($updatedEdge['base_weight'] ?? 0) * 10)) {
                throw new RuntimeException('Anomaly multiplier did not update the target edge weight as expected.');
            }

            if (count($reroutedSessions) < 1) {
                throw new RuntimeException('Expected at least one impacted session to reroute during smoke check.');
            }

            $this->table(
                ['Check', 'Result'],
                [
                    ['nodes_loaded', (string) $nodeCount],
                    ['edges_loaded', (string) $edgeCount],
                    ['route_path_length', (string) count($route['path'])],
                    ['route_total_cost', (string) $route['total_cost']],
                    ['target_edge', (string) $targetEdgeId],
                    ['anomaly_updated_edges', (string) count($affectedEdges)],
                    ['sessions_rerouted', (string) count($reroutedSessions)],
                ]
            );

            $this->info('Smoke check passed: graph, route, anomaly, and rerouting are working together.');

            return self::SUCCESS;
        } catch (RuntimeException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        } finally {
            $sessionManager->flush();
            $graphManager->resetGraph();
        }
    }
}
