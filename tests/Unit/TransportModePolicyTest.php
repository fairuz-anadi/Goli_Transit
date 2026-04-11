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
        $this->assertSame(['rickshaw', 'walk'], $policy->allowedModesForDistance(1.0));
        $this->assertSame(['rickshaw', 'walk'], $policy->allowedModesForDistance(3.0));
        $this->assertSame(['rickshaw', 'walk'], $policy->allowedModesForDistance(5.0));
        $this->assertSame(['car', 'rickshaw', 'walk'], $policy->allowedModesForDistance(5.1));
    }

    public function test_it_prefers_higher_priority_modes_and_sets_a_switch_penalty(): void
    {
        $policy = app(TransportModePolicy::class);

        $this->assertSame(0, $policy->modePriorityRank('car'));
        $this->assertSame(1, $policy->modePriorityRank('rickshaw'));
        $this->assertSame(2, $policy->modePriorityRank('walk'));
        $this->assertGreaterThan(0, $policy->switchPenalty());
    }

    public function test_it_scales_route_costs_from_distance_and_traffic(): void
    {
        $policy = app(TransportModePolicy::class);

        $cost = $policy->travelCost([
            'base_weight' => 4,
            'current_weight' => 8,
            'distance_km' => 2.5,
        ]);

        $this->assertGreaterThan(0, $cost);
        $this->assertGreaterThan(250, $cost);
    }
}
