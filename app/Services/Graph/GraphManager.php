<?php

namespace App\Services\Graph;

use App\Services\Routing\TransportModePolicy;
use RuntimeException;

class GraphManager
{
    protected static ?array $graph = null;

    public function __construct(protected MapData $mapData)
    {
        if (static::$graph === null) {
            $this->resetGraph();
        }
    }

    public function resetGraph(): void
    {
        static::$graph = [
            'nodes' => $this->mapData->getNodes(),
            'edges' => array_map(
                fn (array $edge): array => $this->applyAccessRules($edge),
                $this->mapData->getEdges()
            ),
        ];
    }

    public function getGraph(): array
    {
        $this->refreshEdgeAccessRules();

        return static::$graph;
    }

    public function getAdjacencyGraph(): array
    {
        $this->refreshEdgeAccessRules();

        $adjacency = [];

        foreach (static::$graph['nodes'] as $node) {
            $adjacency[$node['id']] = [];
        }

        foreach (static::$graph['edges'] as $edge) {
            $adjacency[$edge['from']][] = [
                'id' => $edge['id'],
                'to' => $edge['to'],
                'cost' => $edge['current_weight'],
                'modes' => $edge['modes'],
                'base_weight' => $edge['base_weight'],
                'current_weight' => $edge['current_weight'],
                'distance_km' => $edge['distance_km'],
                'car_allowed' => $edge['car_allowed'],
                'structural_car_allowed' => $edge['structural_car_allowed'] ?? $edge['car_allowed'],
                'rickshaw_allowed' => $edge['rickshaw_allowed'],
                'structural_rickshaw_allowed' => $edge['structural_rickshaw_allowed'] ?? $edge['rickshaw_allowed'],
                'walk_allowed' => $edge['walk_allowed'],
                'structural_walk_allowed' => $edge['structural_walk_allowed'] ?? $edge['walk_allowed'],
                'is_goli' => $edge['is_goli'],
                'is_overpass' => $edge['is_overpass'],
                'preferred_mode' => $edge['preferred_mode'] ?? null,
                'distance_band' => $edge['distance_band'] ?? null,
                'anomaly_active' => $edge['anomaly_active'] ?? false,
                'traffic_factor' => $edge['traffic_factor'] ?? 1,
            ];
        }

        return $adjacency;
    }

    public function getNeighbours(string $nodeId, string $mode): array
    {
        $adjacency = $this->getAdjacencyGraph();

        if (! array_key_exists($nodeId, $adjacency)) {
            throw new RuntimeException("Unknown node [{$nodeId}].");
        }

        return array_values(array_filter(
            $adjacency[$nodeId],
            static fn (array $edge): bool => in_array($mode, $edge['modes'], true)
        ));
    }

    public function updateAnomalyZone(array $edgeIds, float|int $multiplier): array
    {
        return $this->updateAnomalyZoneWithBoundingBox($edgeIds, $multiplier, null);
    }

    public function updateAnomalyZoneWithBoundingBox(
        array $edgeIds,
        float|int $multiplier,
        ?array $boundingBox = null
    ): array {
        $affected = [];
        $nodeIndex = $this->getNodeIndex();
        $boundedEdgeIds = $boundingBox ? $this->findEdgesInBoundingBox($boundingBox, $nodeIndex) : [];
        $targetEdgeIds = array_values(array_unique(array_merge($edgeIds, $boundedEdgeIds)));

        foreach (static::$graph['edges'] as &$edge) {
            if (! in_array($edge['id'], $targetEdgeIds, true)) {
                continue;
            }

            $edge['current_weight'] = max(1, (int) round($edge['base_weight'] * $multiplier));
            $edge = $this->applyAccessRules($edge);
            $affected[] = $edge;
        }
        unset($edge);

        return $affected;
    }

    protected function getNodeIndex(): array
    {
        $nodeIndex = [];

        foreach (static::$graph['nodes'] as $node) {
            $nodeIndex[$node['id']] = $node;
        }

        return $nodeIndex;
    }

    protected function findEdgesInBoundingBox(array $boundingBox, array $nodeIndex): array
    {
        $minLat = $boundingBox['min_lat'] ?? null;
        $maxLat = $boundingBox['max_lat'] ?? null;
        $minLng = $boundingBox['min_lng'] ?? null;
        $maxLng = $boundingBox['max_lng'] ?? null;

        if ($minLat === null || $maxLat === null || $minLng === null || $maxLng === null) {
            return [];
        }

        $matchingEdgeIds = [];

        foreach (static::$graph['edges'] as $edge) {
            $fromNode = $nodeIndex[$edge['from']] ?? null;
            $toNode = $nodeIndex[$edge['to']] ?? null;

            if ($fromNode === null || $toNode === null) {
                continue;
            }

            $midLat = ($fromNode['lat'] + $toNode['lat']) / 2;
            $midLng = ($fromNode['lng'] + $toNode['lng']) / 2;

            if ($midLat < $minLat || $midLat > $maxLat || $midLng < $minLng || $midLng > $maxLng) {
                continue;
            }

            $matchingEdgeIds[] = $edge['id'];
        }

        return $matchingEdgeIds;
    }

    protected function refreshEdgeAccessRules(): void
    {
        if (static::$graph === null) {
            return;
        }

        static::$graph['edges'] = array_map(
            fn (array $edge): array => $this->applyAccessRules($edge),
            static::$graph['edges']
        );
    }

    protected function applyAccessRules(array $edge): array
    {
        $distance = (float) ($edge['distance_km'] ?? 0);
        $policy = app(TransportModePolicy::class);
        $policyModes = $policy->allowedModesForDistance($distance);
        $structuralModes = array_values(array_filter([
            ($edge['structural_car_allowed'] ?? $edge['car_allowed'] ?? false) ? 'car' : null,
            ($edge['structural_rickshaw_allowed'] ?? $edge['rickshaw_allowed'] ?? false) ? 'rickshaw' : null,
            ($edge['structural_walk_allowed'] ?? $edge['walk_allowed'] ?? false) ? 'walk' : null,
        ]));
        $modes = array_values(array_intersect($policyModes, $structuralModes));

        $edge['car_allowed'] = in_array('car', $modes, true);
        $edge['rickshaw_allowed'] = in_array('rickshaw', $modes, true);
        $edge['walk_allowed'] = in_array('walk', $modes, true);
        $edge['modes'] = $modes;
        $edge['preferred_mode'] = $policy->preferredModeForDistance($distance);
        $edge['distance_band'] = $policy->thresholdLabel($distance);
        $edge['anomaly_active'] = (float) ($edge['current_weight'] ?? 1) > (float) ($edge['base_weight'] ?? 1);
        $edge['traffic_factor'] = round(
            max(1.0, (float) ($edge['current_weight'] ?? 1) / max(1.0, (float) ($edge['base_weight'] ?? 1))),
            2
        );

        return $edge;
    }
}
