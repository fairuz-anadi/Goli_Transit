<?php

namespace App\Services\Routing;

/**
 * Shared transport policy for the whole app.
 *
 * The policy keeps three concerns in one place:
 * - distance bands decide what can access an edge
 * - vehicle priority decides which valid mode is preferred
 * - switch penalty discourages unnecessary mode changes
 */
class TransportModePolicy
{
    public function thresholds(): array
    {
        return config('golitransit.transport_distance_thresholds', [
            'walk_only_max_km' => 1.0,
            'rickshaw_max_km' => 5.0,
            'car_min_km' => 5.0,
        ]);
    }

    public function allowedModesForDistance(float $distanceKm): array
    {
        $distanceKm = max(0.0, $distanceKm);
        $thresholds = $this->thresholds();
        $walkOnlyMax = (float) ($thresholds['walk_only_max_km'] ?? 1.0);
        $rickshawMax = (float) ($thresholds['rickshaw_max_km'] ?? 5.0);

        if ($distanceKm < $walkOnlyMax) {
            return ['walk'];
        }

        if ($distanceKm <= $rickshawMax) {
            // The original rules left a 3-5 km gap; we normalize it into the
            // same medium band so rickshaw stays the practical option.
            return ['rickshaw', 'walk'];
        }

        return ['car', 'rickshaw', 'walk'];
    }

    public function allowsCar(float $distanceKm): bool
    {
        return in_array('car', $this->allowedModesForDistance($distanceKm), true);
    }

    public function allowsRickshaw(float $distanceKm): bool
    {
        return in_array('rickshaw', $this->allowedModesForDistance($distanceKm), true);
    }

    public function allowsWalk(float $distanceKm): bool
    {
        return in_array('walk', $this->allowedModesForDistance($distanceKm), true);
    }

    public function modePriorityRank(string $mode): int
    {
        $priority = config('golitransit.mode_priority', ['car', 'rickshaw', 'walk']);
        $index = array_search($mode, $priority, true);

        return $index === false ? count($priority) : (int) $index;
    }

    public function modePriorityPenalty(): int
    {
        return (int) config('golitransit.mode_priority_penalty', 1000);
    }

    public function switchPenalty(): int
    {
        return (int) config('golitransit.mode_switch_penalty', 3000);
    }

    public function routeCostScale(): int
    {
        return max(1, (int) config('golitransit.route_cost_scale', 100));
    }

    /**
     * Convert a route edge into a traffic-adjusted cost measured in route units.
     * The distance remains the core signal, but traffic spikes still matter.
     */
    public function travelCost(array $edge): int
    {
        $distanceKm = max(0.0, (float) ($edge['distance_km'] ?? 0));
        $baseWeight = max(1.0, (float) ($edge['base_weight'] ?? 1));
        $currentWeight = max(1.0, (float) ($edge['current_weight'] ?? $baseWeight));
        $trafficFactor = $currentWeight / $baseWeight;
        $scaledDistance = $distanceKm * $this->routeCostScale() * $trafficFactor;

        return max(1, (int) round($scaledDistance));
    }

    /**
     * Lower score is better. Priority rank is intentionally weighted so that
     * car > rickshaw > walk, but only among already allowed modes.
     */
    public function travelScore(array $edge, string $mode): int
    {
        return $this->travelCost($edge) + ($this->modePriorityRank($mode) * $this->modePriorityPenalty());
    }
}
