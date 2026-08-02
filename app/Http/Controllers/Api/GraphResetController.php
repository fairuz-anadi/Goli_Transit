<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Graph\GraphManager;
use Illuminate\Http\JsonResponse;

/**
 * Clears every anomaly-inflated edge weight so the graph returns to its base
 * state. Anomalies persist for six hours once triggered, so without this the
 * demo could only be run once.
 */
class GraphResetController extends Controller
{
    public function __invoke(GraphManager $graphManager): JsonResponse
    {
        $graphManager->clearCurrentWeights();

        $edges = $graphManager->getGraph()['edges'];

        return response()->json([
            'message' => 'Graph reset to base weights.',
            'meta' => [
                'edge_count' => count($edges),
                'inflated_edges' => count(array_filter(
                    $edges,
                    static fn (array $edge): bool => $edge['current_weight'] !== $edge['base_weight']
                )),
            ],
        ]);
    }
}
