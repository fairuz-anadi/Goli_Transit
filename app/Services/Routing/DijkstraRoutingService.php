<?php

namespace App\Services\Routing;

use App\Services\Routing\TransportModePolicy;
use RuntimeException;

class DijkstraRoutingService
{
    public function __construct(protected TransportModePolicy $policy)
    {
    }

    public function run(array $graph, string $start, string $end, array $modes): array
    {
        if (! isset($graph[$start])) {
            throw new RuntimeException("Unknown start node [{$start}].");
        }

        if (! isset($graph[$end])) {
            throw new RuntimeException("Unknown destination node [{$end}].");
        }

        if ($modes === []) {
            throw new RuntimeException('At least one travel mode must be provided.');
        }

        $transferNodes = config('golitransit.transfer_nodes', []);
        $switchPenalty = $this->policy->switchPenalty();
        $scores = [];
        $actualTotals = [];
        $previous = [];
        $visited = [];

        foreach ($graph as $node => $_edges) {
            foreach ($modes as $mode) {
                $stateKey = $this->stateKey($node, $mode);
                $scores[$stateKey] = INF;
                $actualTotals[$stateKey] = INF;
                $previous[$stateKey] = null;
                $visited[$stateKey] = false;
            }
        }

        foreach ($modes as $mode) {
            $startState = $this->stateKey($start, $mode);
            $scores[$startState] = 0;
            $actualTotals[$startState] = 0;
        }

        while (true) {
            $currentState = $this->getClosestUnvisitedNode($scores, $visited);

            if ($currentState === null) {
                break;
            }

            ['node' => $currentNode, 'mode' => $currentMode] = $this->parseStateKey($currentState);
            $visited[$currentState] = true;

            foreach ($graph[$currentNode] as $edge) {
                if (! in_array($currentMode, $edge['modes'], true)) {
                    continue;
                }

                $neighbor = $edge['to'];
                $neighborState = $this->stateKey($neighbor, $currentMode);
                $candidateScore = $scores[$currentState] + $this->travelScore($edge, $currentMode);
                $candidateActual = $actualTotals[$currentState] + $this->travelCost($edge, $currentMode);

                if ($candidateScore < $scores[$neighborState]) {
                    $scores[$neighborState] = $candidateScore;
                    $actualTotals[$neighborState] = $candidateActual;
                    $previous[$neighborState] = [
                        'edge_id' => $edge['id'],
                        'node' => $currentNode,
                        'mode' => $currentMode,
                        'cost' => $this->travelCost($edge, $currentMode),
                        'distance_km' => $edge['distance_km'] ?? null,
                        'base_weight' => $edge['base_weight'] ?? null,
                        'current_weight' => $edge['current_weight'] ?? null,
                        'traffic_factor' => $edge['traffic_factor'] ?? null,
                        'anomaly_active' => $edge['anomaly_active'] ?? false,
                        'car_allowed' => $edge['car_allowed'] ?? false,
                        'structural_car_allowed' => $edge['structural_car_allowed'] ?? false,
                        'structural_rickshaw_allowed' => $edge['structural_rickshaw_allowed'] ?? false,
                        'structural_walk_allowed' => $edge['structural_walk_allowed'] ?? false,
                        'is_goli' => $edge['is_goli'] ?? false,
                        'is_overpass' => $edge['is_overpass'] ?? false,
                        'switch_penalty' => 0,
                    ];
                }
            }

            if (! in_array($currentNode, $transferNodes, true)) {
                continue;
            }

            foreach ($modes as $nextMode) {
                if ($nextMode === $currentMode) {
                    continue;
                }

                $nextState = $this->stateKey($currentNode, $nextMode);
                $candidateScore = $scores[$currentState] + $switchPenalty;
                $candidateActual = $actualTotals[$currentState] + $switchPenalty;

                if ($candidateScore < $scores[$nextState]) {
                    $scores[$nextState] = $candidateScore;
                    $actualTotals[$nextState] = $candidateActual;
                    $previous[$nextState] = [
                        'edge_id' => null,
                        'node' => $currentNode,
                        'mode' => $currentMode,
                        'cost' => 0,
                        'distance_km' => 0,
                        'switch_penalty' => $switchPenalty,
                    ];
                }
            }
        }

        $bestEndState = null;
        $bestEndScore = INF;

        foreach ($modes as $mode) {
            $stateKey = $this->stateKey($end, $mode);

            if ($scores[$stateKey] < $bestEndScore) {
                $bestEndScore = $scores[$stateKey];
                $bestEndState = $stateKey;
            }
        }

        if ($bestEndState === null || $bestEndScore === INF) {
            throw new RuntimeException('No route is available for the selected travel modes.');
        }

        $segments = $this->buildSegments($previous, $start, $bestEndState);
        $segments = $this->practicalizeJourneyModes($segments, $modes);
        $actualTotalCost = array_sum(array_map(
            static fn (array $segment): int => (int) (($segment['cost'] ?? 0) + ($segment['switch_penalty'] ?? 0)),
            $segments
        ));
        $selectedModes = array_values(array_unique(array_map(
            static fn (array $segment): string => $segment['mode'],
            array_filter($segments, static fn (array $segment): bool => $segment['edge_id'] !== null)
        )));

        return [
            'path' => $this->buildPath($segments, $start),
            'segments' => $segments,
            'total_cost' => $actualTotalCost,
            'selected_modes' => $selectedModes,
            'mode_switches' => count(array_filter(
                $segments,
                static fn (array $segment): bool => $segment['edge_id'] === null
            )),
            'mode_switch_penalty_applied' => array_sum(array_map(
                static fn (array $segment): int => $segment['switch_penalty'],
                $segments
            )),
        ];
    }

    protected function getClosestUnvisitedNode(array $distances, array $visited): ?string
    {
        $closestNode = null;
        $closestDistance = INF;

        foreach ($distances as $node => $distance) {
            if ($visited[$node]) {
                continue;
            }

            if ($distance < $closestDistance) {
                $closestDistance = $distance;
                $closestNode = $node;
            }
        }

        return $closestNode;
    }

    protected function buildPath(array $segments, string $start): array
    {
        $path = [$start];

        foreach ($segments as $segment) {
            if ($segment['edge_id'] === null) {
                continue;
            }

            $path[] = $segment['to'];
        }

        return $path;
    }

    protected function buildSegments(array $previous, string $start, string $endState): array
    {
        $segments = [];
        $cursorState = $endState;

        while ($cursorState !== null) {
            ['node' => $cursorNode, 'mode' => $cursorMode] = $this->parseStateKey($cursorState);

            if ($cursorNode === $start && ($previous[$cursorState] ?? null) === null) {
                break;
            }

            $segment = $previous[$cursorState] ?? null;

            if ($segment === null) {
                break;
            }

            if ($segment['edge_id'] === null) {
                array_unshift($segments, [
                    'edge_id' => null,
                    'from' => $segment['node'],
                    'to' => $cursorNode,
                    'cost' => 0,
                    'distance_km' => 0,
                    'base_weight' => null,
                    'current_weight' => null,
                    'traffic_factor' => 1,
                    'anomaly_active' => false,
                    'car_allowed' => false,
                    'structural_car_allowed' => false,
                    'structural_rickshaw_allowed' => false,
                    'structural_walk_allowed' => false,
                    'is_goli' => false,
                    'is_overpass' => false,
                    'mode' => $cursorMode,
                    'previous_mode' => $segment['mode'],
                    'switch_penalty' => $segment['switch_penalty'],
                    'type' => 'mode_switch',
                ]);
            } else {
                array_unshift($segments, [
                    'edge_id' => $segment['edge_id'],
                    'from' => $segment['node'],
                    'to' => $cursorNode,
                    'cost' => $segment['cost'],
                    'distance_km' => $segment['distance_km'] ?? null,
                    'base_weight' => $segment['base_weight'] ?? null,
                    'current_weight' => $segment['current_weight'] ?? null,
                    'traffic_factor' => $segment['traffic_factor'] ?? null,
                    'anomaly_active' => $segment['anomaly_active'] ?? false,
                    'car_allowed' => $segment['car_allowed'] ?? false,
                    'structural_car_allowed' => $segment['structural_car_allowed'] ?? false,
                    'structural_rickshaw_allowed' => $segment['structural_rickshaw_allowed'] ?? false,
                    'structural_walk_allowed' => $segment['structural_walk_allowed'] ?? false,
                    'is_goli' => $segment['is_goli'] ?? false,
                    'is_overpass' => $segment['is_overpass'] ?? false,
                    'mode' => $cursorMode,
                    'previous_mode' => $cursorMode,
                    'switch_penalty' => 0,
                    'type' => 'travel',
                ]);
            }

            $cursorState = $this->stateKey($segment['node'], $segment['mode']);
        }

        return $segments;
    }

    protected function practicalizeJourneyModes(array $segments, array $allowedModes): array
    {
        $travelSegments = array_values(array_filter(
            $segments,
            static fn (array $segment): bool => $segment['type'] === 'travel'
        ));

        if ($travelSegments === []) {
            return $segments;
        }

        $remainingDistanceKm = array_sum(array_map(
            static fn (array $segment): float => (float) ($segment['distance_km'] ?? 0),
            $travelSegments
        ));
        $practicalTravelSegments = [];

        foreach ($travelSegments as $segment) {
            $mode = $this->recommendedJourneyMode($segment, $allowedModes, $remainingDistanceKm);
            $segment['mode'] = $mode;
            $segment['cost'] = $this->policy->travelCostForMode($segment, $mode);
            $practicalTravelSegments[] = $segment;
            $remainingDistanceKm -= (float) ($segment['distance_km'] ?? 0);
        }

        $rebuilt = [];
        $previousMode = null;

        foreach ($practicalTravelSegments as $segment) {
            if ($previousMode !== null && $segment['mode'] !== $previousMode) {
                $rebuilt[] = [
                    'edge_id' => null,
                    'from' => $segment['from'],
                    'to' => $segment['from'],
                    'cost' => 0,
                    'distance_km' => 0,
                    'base_weight' => null,
                    'current_weight' => null,
                    'traffic_factor' => 1,
                    'anomaly_active' => $segment['anomaly_active'] ?? false,
                    'car_allowed' => false,
                    'structural_car_allowed' => false,
                    'structural_rickshaw_allowed' => false,
                    'structural_walk_allowed' => false,
                    'is_goli' => false,
                    'is_overpass' => false,
                    'mode' => $segment['mode'],
                    'previous_mode' => $previousMode,
                    'switch_penalty' => $this->policy->switchPenalty(),
                    'type' => 'mode_switch',
                ];
            }

            $segment['previous_mode'] = $previousMode ?? $segment['mode'];
            $rebuilt[] = $segment;
            $previousMode = $segment['mode'];
        }

        return $rebuilt;
    }

    protected function recommendedJourneyMode(array $segment, array $allowedModes, float $remainingDistanceKm): string
    {
        $walkMax = (float) (config('golitransit.transport_distance_thresholds.walk_max_km') ?? 0.8);
        $carPreferenceDistance = (float) config('golitransit.long_trip_car_preference_km', 4.5);
        $distanceKm = (float) ($segment['distance_km'] ?? 0);
        $structuralCar = ($segment['structural_car_allowed'] ?? false) && in_array('car', $allowedModes, true);
        $structuralRickshaw = ($segment['structural_rickshaw_allowed'] ?? false) && in_array('rickshaw', $allowedModes, true);
        $structuralWalk = ($segment['structural_walk_allowed'] ?? true) && in_array('walk', $allowedModes, true);

        if ($segment['is_overpass'] ?? false) {
            return $structuralWalk ? 'walk' : ($structuralRickshaw ? 'rickshaw' : 'car');
        }

        if ($segment['is_goli'] ?? false) {
            return $structuralRickshaw ? 'rickshaw' : ($structuralWalk ? 'walk' : 'car');
        }

        if ($segment['anomaly_active'] ?? false) {
            if ($structuralRickshaw) {
                return 'rickshaw';
            }

            if ($structuralWalk && $distanceKm <= ($walkMax + 0.4)) {
                return 'walk';
            }
        }

        if ($remainingDistanceKm >= $carPreferenceDistance && $structuralCar) {
            return 'car';
        }

        if ($distanceKm <= $walkMax && $structuralWalk) {
            return 'walk';
        }

        if ($structuralRickshaw) {
            return 'rickshaw';
        }

        if ($structuralCar) {
            return 'car';
        }

        return 'walk';
    }

    protected function stateKey(string $node, string $mode): string
    {
        return $node.'|'.$mode;
    }

    protected function parseStateKey(string $stateKey): array
    {
        [$node, $mode] = explode('|', $stateKey, 2);

        return [
            'node' => $node,
            'mode' => $mode,
        ];
    }

    protected function travelCost(array $edge, ?string $mode): int
    {
        return $this->policy->travelCostForMode($edge, $mode);
    }

    protected function travelScore(array $edge, string $mode): int
    {
        return $this->policy->travelScore($edge, $mode);
    }
}
