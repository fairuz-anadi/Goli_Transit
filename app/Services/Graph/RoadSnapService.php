<?php

namespace App\Services\Graph;

use App\Services\Osrm\OsrmService;
use App\Services\Routing\TransportModePolicy;
use RuntimeException;

/**
 * Resolves a raw GPS fix (e.g. from the browser's Geolocation API) into a
 * routable point on GoliTransit's own graph, for one-off "route from my
 * current location" searches - without ever persisting anything back into
 * MapData or the cached GraphManager graph.
 */
class RoadSnapService
{
    public const TEMP_NODE_ID = 'user_location_snap';

    public function __construct(
        protected GraphManager $graphManager,
        protected OsrmService $osrm,
        protected TransportModePolicy $policy,
    ) {
    }

    /**
     * Snaps a raw lat/lng in two stages:
     *   1. OSRM's nearest-road service corrects GPS noise onto the nearest
     *      real street.
     *   2. That corrected point is projected onto the closest edge of this
     *      app's own graph (using each edge's OSRM-derived polyline), since
     *      routing only ever happens over this graph's edges, not the full
     *      OSM road network.
     */
    public function snap(float $lat, float $lng, string $profile = 'walking'): array
    {
        $osrmSnap = $this->osrm->nearest($lat, $lng, $profile);
        $searchLat = $osrmSnap['lat'] ?? $lat;
        $searchLng = $osrmSnap['lng'] ?? $lng;

        $graph = $this->graphManager->getGraph();

        $nodeIndex = [];
        foreach ($graph['nodes'] as $node) {
            $nodeIndex[$node['id']] = $node;
        }

        $best = null;

        foreach ($graph['edges'] as $edge) {
            $from = $nodeIndex[$edge['from']] ?? null;
            $to = $nodeIndex[$edge['to']] ?? null;

            if (!$from || !$to) {
                continue;
            }

            $polyline = (isset($edge['waypoints']) && count($edge['waypoints']) >= 2)
                ? $edge['waypoints']
                : [[$from['lat'], $from['lng']], [$to['lat'], $to['lng']]];

            $projection = $this->projectOntoPolyline($searchLat, $searchLng, $polyline);

            if ($best === null || $projection['distance_m'] < $best['distance_m']) {
                $best = $projection;
                $best['edge'] = $edge;
                $best['from_node'] = $from;
                $best['to_node'] = $to;
            }
        }

        if ($best === null) {
            throw new RuntimeException('No routable road segments are available to snap to.');
        }

        [$projectedLat, $projectedLng] = $best['point'];

        return [
            'raw' => ['lat' => $lat, 'lng' => $lng],
            'osrm_snapped' => $osrmSnap,
            'projected' => ['lat' => $projectedLat, 'lng' => $projectedLng],
            'edge' => $best['edge'],
            'from_node' => $best['from_node'],
            'to_node' => $best['to_node'],
            'fraction' => $best['fraction'],
            'snap_distance_m' => round($this->haversineMeters($lat, $lng, $projectedLat, $projectedLng), 1),
        ];
    }

    /**
     * Splits the snapped edge into two temporary edges - snap point <-> each
     * endpoint - weighted by real distance (the fraction along the edge's
     * OSRM-derived polyline, applied to the edge's OSRM road distance).
     * Allowed modes are re-derived per sub-edge from its own (shorter)
     * distance, since a short last-few-meters stub may permit walking even
     * when the full parent edge required a car.
     *
     * The temporary node/edges exist only in the returned copy of the
     * adjacency graph, for the duration of this one request.
     */
    public function injectTemporaryStartNode(array $adjacencyGraph, array $snap): array
    {
        $edge = $snap['edge'];
        $fraction = max(0.0, min(1.0, $snap['fraction']));
        $distanceKm = (float) ($edge['distance_km'] ?? 0);

        $distanceToFrom = round($distanceKm * $fraction, 4);
        $distanceToTo = round($distanceKm * (1 - $fraction), 4);

        $adjacencyGraph[self::TEMP_NODE_ID] = [
            $this->buildTemporaryEdge($edge, $edge['from'], $distanceToFrom),
            $this->buildTemporaryEdge($edge, $edge['to'], $distanceToTo),
        ];

        return $adjacencyGraph;
    }

    protected function buildTemporaryEdge(array $edge, string $toNodeId, float $distanceKm): array
    {
        $baseWeight = max(1.0, (float) ($edge['base_weight'] ?? 1));
        $currentWeight = max(1.0, (float) ($edge['current_weight'] ?? $baseWeight));
        $trafficRatio = $currentWeight / $baseWeight;

        $structuralCar = $edge['structural_car_allowed'] ?? $edge['car_allowed'] ?? false;
        $structuralRickshaw = $edge['structural_rickshaw_allowed'] ?? $edge['rickshaw_allowed'] ?? false;
        $structuralWalk = $edge['structural_walk_allowed'] ?? $edge['walk_allowed'] ?? false;

        $policyModes = $this->policy->allowedModesForDistance($distanceKm);
        $modes = array_values(array_filter([
            $structuralCar && in_array('car', $policyModes, true) ? 'car' : null,
            $structuralRickshaw && in_array('rickshaw', $policyModes, true) ? 'rickshaw' : null,
            $structuralWalk && in_array('walk', $policyModes, true) ? 'walk' : null,
        ]));

        $scaledBaseWeight = max(0.01, $baseWeight * $distanceKm / max(0.001, (float) ($edge['distance_km'] ?? 1)));
        $scaledCurrentWeight = $scaledBaseWeight * $trafficRatio;

        return [
            'id' => 'temp_edge_'.self::TEMP_NODE_ID.'_to_'.$toNodeId,
            'to' => $toNodeId,
            'cost' => round($scaledCurrentWeight, 4),
            'modes' => $modes,
            'base_weight' => round($scaledBaseWeight, 4),
            'current_weight' => round($scaledCurrentWeight, 4),
            'distance_km' => $distanceKm,
            'car_allowed' => in_array('car', $modes, true),
            'structural_car_allowed' => $structuralCar,
            'rickshaw_allowed' => in_array('rickshaw', $modes, true),
            'structural_rickshaw_allowed' => $structuralRickshaw,
            'walk_allowed' => in_array('walk', $modes, true),
            'structural_walk_allowed' => $structuralWalk,
            'is_goli' => $edge['is_goli'] ?? false,
            'is_overpass' => $edge['is_overpass'] ?? false,
            'preferred_mode' => $this->policy->preferredModeForDistance($distanceKm),
            'distance_band' => $this->policy->thresholdLabel($distanceKm),
            'anomaly_active' => $edge['anomaly_active'] ?? false,
            'traffic_factor' => $edge['traffic_factor'] ?? 1,
        ];
    }

    protected function projectOntoPolyline(float $lat, float $lng, array $polyline): array
    {
        $segmentLengths = [];
        for ($i = 0; $i < count($polyline) - 1; $i++) {
            $segmentLengths[] = $this->haversineMeters(
                $polyline[$i][0],
                $polyline[$i][1],
                $polyline[$i + 1][0],
                $polyline[$i + 1][1]
            );
        }

        $totalLength = array_sum($segmentLengths);
        $runningLength = 0.0;
        $best = null;

        for ($i = 0; $i < count($polyline) - 1; $i++) {
            [$aLat, $aLng] = $polyline[$i];
            [$bLat, $bLng] = $polyline[$i + 1];

            $projection = $this->projectPointOntoSegment($lat, $lng, $aLat, $aLng, $bLat, $bLng);
            $lengthToProjection = $runningLength + $segmentLengths[$i] * $projection['t'];

            if ($best === null || $projection['distance_m'] < $best['distance_m']) {
                $best = [
                    'point' => $projection['point'],
                    'distance_m' => $projection['distance_m'],
                    'fraction' => $totalLength > 0 ? $lengthToProjection / $totalLength : 0.5,
                ];
            }

            $runningLength += $segmentLengths[$i];
        }

        return $best ?? [
            'point' => $polyline[0],
            'distance_m' => $this->haversineMeters($lat, $lng, $polyline[0][0], $polyline[0][1]),
            'fraction' => 0.0,
        ];
    }

    /**
     * Projects (lat, lng) onto the segment A->B using a local flat-earth
     * approximation in meters - accurate enough at the scale of a single
     * road segment.
     */
    protected function projectPointOntoSegment(
        float $lat,
        float $lng,
        float $aLat,
        float $aLng,
        float $bLat,
        float $bLng
    ): array {
        $mPerDegLat = 111_320.0;
        $mPerDegLng = 111_320.0 * cos(deg2rad($aLat));

        $px = ($lng - $aLng) * $mPerDegLng;
        $py = ($lat - $aLat) * $mPerDegLat;
        $bx = ($bLng - $aLng) * $mPerDegLng;
        $by = ($bLat - $aLat) * $mPerDegLat;

        $segmentLengthSq = $bx * $bx + $by * $by;
        $t = $segmentLengthSq > 0
            ? max(0.0, min(1.0, ($px * $bx + $py * $by) / $segmentLengthSq))
            : 0.0;

        $projX = $bx * $t;
        $projY = $by * $t;

        $projLng = $aLng + ($segmentLengthSq > 0 ? $projX / $mPerDegLng : 0.0);
        $projLat = $aLat + ($segmentLengthSq > 0 ? $projY / $mPerDegLat : 0.0);

        $dx = $px - $projX;
        $dy = $py - $projY;

        return [
            'point' => [$projLat, $projLng],
            'distance_m' => sqrt($dx * $dx + $dy * $dy),
            't' => $t,
        ];
    }

    protected function haversineMeters(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadiusM = 6_371_000.0;
        $phi1 = deg2rad($lat1);
        $phi2 = deg2rad($lat2);
        $deltaPhi = deg2rad($lat2 - $lat1);
        $deltaLambda = deg2rad($lng2 - $lng1);

        $a = sin($deltaPhi / 2) ** 2 + cos($phi1) * cos($phi2) * sin($deltaLambda / 2) ** 2;

        return $earthRadiusM * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
