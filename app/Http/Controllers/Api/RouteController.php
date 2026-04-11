<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Routing\DemoGraphService;
use App\Services\Routing\DijkstraRoutingService;
use App\Services\Sessions\SessionManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;
use RuntimeException;

class RouteController extends Controller
{
    public function __invoke(
        Request $request,
        DemoGraphService $graphService,
        DijkstraRoutingService $routingService,
        SessionManager $sessionManager
    ): JsonResponse {
        $startedAt = hrtime(true);
        $graph = $graphService->getGraph();
        $nodes = $graphService->getNodes();

        $validated = $request->validate([
            'start' => ['required', 'string', Rule::in($nodes)],
            'destination' => ['required', 'string', Rule::in($nodes)],
            'allowed_modes' => ['required', 'array', 'min:1'],
            'allowed_modes.*' => ['required', 'string', Rule::in(['car', 'rickshaw', 'walk'])],
            'session_id' => ['nullable', 'string', 'max:100'],
        ]);

        $sessionId = $validated['session_id'] ?? (string) Str::uuid();

        try {
            $route = $routingService->run(
                $graph,
                $validated['start'],
                $validated['destination'],
                $validated['allowed_modes']
            );
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        $route['request'] = [
            'start' => $validated['start'],
            'destination' => $validated['destination'],
            'allowed_modes' => $validated['allowed_modes'],
        ];

        $sessionManager->createSession($sessionId, $route);

        $computationTimeMs = (int) round((hrtime(true) - $startedAt) / 1_000_000);
        $travelSegments = array_values(array_filter(
            $route['segments'],
            static fn (array $segment): bool => $segment['type'] === 'travel'
        ));
        $anomalyAffectedEdges = array_values(array_map(
            static fn (array $segment): string => $segment['edge_id'],
            array_filter(
                $travelSegments,
                static fn (array $segment): bool => ($segment['anomaly_active'] ?? false) && isset($segment['edge_id'])
            )
        ));
        $journeyCards = array_values(array_map(
            static function (array $segment, int $index): array {
                $distance = (float) ($segment['distance_km'] ?? 0);
                $instruction = sprintf(
                    'Take %s from %s to %s.',
                    $segment['mode'],
                    $segment['from'],
                    $segment['to']
                );

                return [
                    'step' => $index + 1,
                    'mode' => $segment['mode'],
                    'instruction' => $instruction,
                    'distance_km' => $distance,
                    'cost' => $segment['cost'],
                    'note' => ($segment['switch_penalty'] ?? 0) > 0
                        ? 'Switch vehicles before continuing on this segment.'
                        : 'Continue on the same mode.',
                    'anomaly_active' => (bool) ($segment['anomaly_active'] ?? false),
                ];
            },
            $travelSegments,
            array_keys($travelSegments)
        ));

        return response()->json([
            'data' => [
                'start' => $validated['start'],
                'destination' => $validated['destination'],
                'allowed_modes' => $validated['allowed_modes'],
                'session_id' => $sessionId,
                'selected_modes' => $route['selected_modes'],
                'path' => $route['path'],
                'nodes' => $route['path'],
                'segments' => $route['segments'],
                'route_segments' => $travelSegments,
                'total_cost' => $route['total_cost'],
                'switches' => $route['mode_switches'],
                'computation_time_ms' => $computationTimeMs,
                'journey_cards' => $journeyCards,
                'justification' => [
                    'summary' => 'Best available anomaly-aware route using distance thresholds, road permissions, and valid switch points.',
                    'computation_time_ms' => $computationTimeMs,
                    'node_sequence' => $route['path'],
                    'segment_modes' => array_values(array_map(
                        static fn (array $segment): array => [
                            'from' => $segment['from'],
                            'to' => $segment['to'],
                            'mode' => $segment['mode'],
                            'distance_km' => $segment['distance_km'],
                        ],
                        $travelSegments
                    )),
                    'mode_switches' => $route['mode_switches'],
                    'mode_switch_penalty_applied' => $route['mode_switch_penalty_applied'],
                    'vehicle_thresholds_km' => config('golitransit.transport_distance_thresholds'),
                    'anomaly_checked' => true,
                    'anomaly_affected_edges' => $anomalyAffectedEdges,
                    'note' => 'Vehicle choice is guided by distance thresholds, then constrained by edge permissions and live anomaly pressure.',
                ],
                'session_saved' => true,
            ],
        ]);
    }
}
