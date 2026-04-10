<?php

namespace App\Http\Controllers;

use App\Services\Graph\GraphManager;
use App\Services\Routing\DijkstraRoutingService;
use Illuminate\Foundation\Application;
use Inertia\Inertia;

class WelcomeController extends Controller
{
    public function index(GraphManager $graphManager, DijkstraRoutingService $routingService)
    {
        $graph = $graphManager->getGraph();
        $adjacencyGraph = $graphManager->getAdjacencyGraph();
        $sampleRoute = null;
        $sampleRouteError = null;

        try {
            $sampleRoute = $routingService->run(
                $adjacencyGraph,
                'farmgate',
                'gulshan_2',
                ['car', 'rickshaw', 'walk']
            );
        } catch (\Throwable $exception) {
            $sampleRouteError = $exception->getMessage();
        }

        $nodeNameById = [];

        foreach ($graph['nodes'] as $node) {
            $nodeNameById[$node['id']] = $node['name'] ?? ucwords(str_replace('_', ' ', $node['id']));
        }

        $routeLabels = $sampleRoute
            ? array_map(
                static fn (string $nodeId): string => $nodeNameById[$nodeId] ?? ucwords(str_replace('_', ' ', $nodeId)),
                $sampleRoute['path']
            )
            : [];

        return Inertia::render('Welcome', [
            'graph' => [
                'nodeCount' => count($graph['nodes']),
                'edgeCount' => count($graph['edges']),
                'goliEdgeCount' => count(array_filter($graph['edges'], fn (array $edge): bool => $edge['is_goli'])),
                'overpassNodeCount' => count(array_filter($graph['nodes'], fn (array $node): bool => $node['type'] === 'overpass')),
                'nodes' => array_map(static function (array $node): array {
                    return [
                        'id' => $node['id'],
                        'name' => $node['name'],
                        'type' => $node['type'],
                        'lat' => $node['lat'],
                        'lng' => $node['lng'],
                    ];
                }, $graph['nodes']),
                'edges' => array_map(static function (array $edge): array {
                    return [
                        'id' => $edge['id'],
                        'from' => $edge['from'],
                        'to' => $edge['to'],
                        'base_weight' => $edge['base_weight'],
                        'current_weight' => $edge['current_weight'],
                        'is_goli' => $edge['is_goli'],
                        'is_overpass' => $edge['is_overpass'],
                    ];
                }, $graph['edges']),
            ],
            'sampleRoute' => $sampleRoute,
            'routeLabels' => $routeLabels,
            'sampleRouteError' => $sampleRouteError,
            'laravelVersion' => Application::VERSION,
            'phpVersion' => phpversion(),
        ]);
    }
}
