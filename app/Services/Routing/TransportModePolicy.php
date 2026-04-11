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
        $thresholds = config('golitransit.transport_distance_thresholds', []);

        return [
            'walk_max_km' => (float) ($thresholds['walk_max_km'] ?? $thresholds['walk_only_max_km'] ?? 0.8),
            'rickshaw_max_km' => (float) ($thresholds['rickshaw_max_km'] ?? 1.8),
            'car_min_km' => (float) ($thresholds['car_min_km'] ?? 1.8),
        ];
    }

    public function allowedModesForDistance(float $distanceKm): array
    {
        $distanceKm = max(0.0, $distanceKm);
        $thresholds = $this->thresholds();
        $walkMax = (float) ($thresholds['walk_max_km'] ?? 0.8);
        $rickshawMax = (float) ($thresholds['rickshaw_max_km'] ?? 1.8);

        if ($distanceKm <= $walkMax) {
            return ['walk'];
        }

        if ($distanceKm <= $rickshawMax) {
            return ['rickshaw', 'walk'];
        }

        return ['car', 'rickshaw', 'walk'];
    }

    public function preferredModeForDistance(float $distanceKm): string
    {
        return $this->allowedModesForDistance($distanceKm)[0];
    }

    public function thresholdLabel(float $distanceKm): string
    {
        return match ($this->preferredModeForDistance($distanceKm)) {
            'walk' => 'short_connector',
            'rickshaw' => 'medium_city_leg',
            default => 'long_main_road_leg',
        };
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
        return $this->travelCostForMode($edge, null);
    }

    public function travelCostForMode(array $edge, ?string $mode): int
    {
        $distanceKm = max(0.0, (float) ($edge['distance_km'] ?? 0));
        $baseWeight = max(1.0, (float) ($edge['base_weight'] ?? 1));
        $currentWeight = max(1.0, (float) ($edge['current_weight'] ?? $baseWeight));
        $trafficFactor = $currentWeight / $baseWeight;
        $scaledDistance = $distanceKm * $this->routeCostScale();
        $modeTrafficFactor = $this->trafficFactorForMode($trafficFactor, $mode);

        return max(1, (int) round($scaledDistance * $modeTrafficFactor));
    }

    public function trafficFactorForMode(float $trafficFactor, ?string $mode): float
    {
        $trafficFactor = max(1.0, $trafficFactor);

        return match ($mode) {
            'car' => $trafficFactor ** 2,
            'rickshaw' => 1 + (($trafficFactor - 1) * 0.65),
            'walk' => 1 + (($trafficFactor - 1) * 0.1),
            default => $trafficFactor,
        };
    }

    public function distancePreferencePenalty(array $edge, string $mode): int
    {
        $distanceKm = max(0.0, (float) ($edge['distance_km'] ?? 0));
        $allowedModes = $this->allowedModesForDistance($distanceKm);
        $rank = array_search($mode, $allowedModes, true);

        if ($rank === false) {
            return 10_000;
        }

        return $rank * 180;
    }

    /**
     * Lower score is better. Priority rank is intentionally weighted so that
     * car > rickshaw > walk, but only among already allowed modes.
     */
    public function travelScore(array $edge, string $mode): int
    {
        return $this->travelCostForMode($edge, $mode)
            + $this->distancePreferencePenalty($edge, $mode)
            + ($this->modePriorityRank($mode) * 20);
    }
}
