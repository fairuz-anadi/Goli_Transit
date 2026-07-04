<?php

namespace Tests\Unit;

use App\Services\Routing\TransportModePolicy;
use Tests\TestCase;

class TransportModePolicyTest extends TestCase
{
    public function test_it_normalizes_distance_bands(): void
    {
        $policy = app(TransportModePolicy::class);

        $this->assertSame(['walk'], $policy->allowedModesForDistance(0.5));
        $this->assertSame(['walk'], $policy->allowedModesForDistance(0.8));
        $this->assertSame(['rickshaw', 'walk'], $policy->allowedModesForDistance(1.0));
        $this->assertSame(['rickshaw', 'walk'], $policy->allowedModesForDistance(1.8));
        $this->assertSame(['car', 'rickshaw', 'walk'], $policy->allowedModesForDistance(2.1));
    }

    public function test_it_prefers_higher_priority_modes_and_sets_a_switch_penalty(): void
    {
        $policy = app(TransportModePolicy::class);

        $this->assertSame('walk', $policy->preferredModeForDistance(0.4));
        $this->assertSame('rickshaw', $policy->preferredModeForDistance(1.2));
        $this->assertSame('car', $policy->preferredModeForDistance(2.3));
        $this->assertGreaterThan(0, $policy->switchPenalty());
    }

    public function test_it_scales_route_costs_from_distance_and_traffic(): void
    {
        $policy = app(TransportModePolicy::class);

        $carCost = $policy->travelCostForMode([
            'base_weight' => 4,
            'current_weight' => 8,
            'distance_km' => 2.5,
        ], 'car');
        $walkCost = $policy->travelCostForMode([
            'base_weight' => 4,
            'current_weight' => 8,
            'distance_km' => 2.5,
        ], 'walk');

        $this->assertGreaterThan(0, $carCost);
        $this->assertGreaterThan($walkCost, $carCost);
    }
}
