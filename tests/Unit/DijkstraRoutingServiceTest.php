<?php

namespace Tests\Unit;

use App\Services\Routing\DijkstraRoutingService;
use RuntimeException;
use Tests\TestCase;

/**
 * Exercises the routing engine against small hand-built graphs.
 *
 * Synthetic graphs are used deliberately: the real Dhaka map changes as edges
 * are added, and these assertions are about the algorithm's rules (mode
 * permissions, switch penalties, transfer nodes, cost accumulation) rather than
 * about any particular street.
 */
class DijkstraRoutingServiceTest extends TestCase
{
    private function service(): DijkstraRoutingService
    {
        return app(DijkstraRoutingService::class);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function edge(string $id, string $to, int $cost, float $distanceKm, array $modes, array $overrides = []): array
    {
        return array_merge([
            'id' => $id,
            'to' => $to,
            'cost' => $cost,
            'base_weight' => $cost,
            'current_weight' => $cost,
            'distance_km' => $distanceKm,
            'modes' => $modes,
            'structural_car_allowed' => in_array('car', $modes, true),
            'structural_rickshaw_allowed' => in_array('rickshaw', $modes, true),
            'structural_walk_allowed' => in_array('walk', $modes, true),
            'is_goli' => false,
            'is_overpass' => false,
            'anomaly_active' => false,
        ], $overrides);
    }

    public function test_it_walks_the_only_available_path(): void
    {
        $graph = [
            'a' => [$this->edge('edge_a_b', 'b', 5, 1.0, ['car', 'rickshaw', 'walk'])],
            'b' => [$this->edge('edge_b_c', 'c', 5, 1.0, ['car', 'rickshaw', 'walk'])],
            'c' => [],
        ];

        $route = $this->service()->run($graph, 'a', 'c', ['car', 'rickshaw', 'walk']);

        $this->assertSame(['a', 'b', 'c'], $route['path']);
        $this->assertCount(2, array_filter($route['segments'], fn (array $s): bool => $s['type'] === 'travel'));
        $this->assertGreaterThan(0, $route['total_cost']);
    }

    public function test_it_prefers_the_shorter_of_two_routes(): void
    {
        $graph = [
            'a' => [
                $this->edge('edge_a_long', 'long', 4, 5.0, ['car', 'rickshaw', 'walk']),
                $this->edge('edge_a_short', 'short', 4, 1.0, ['car', 'rickshaw', 'walk']),
            ],
            'long' => [$this->edge('edge_long_z', 'z', 4, 5.0, ['car', 'rickshaw', 'walk'])],
            'short' => [$this->edge('edge_short_z', 'z', 4, 1.0, ['car', 'rickshaw', 'walk'])],
            'z' => [],
        ];

        $route = $this->service()->run($graph, 'a', 'z', ['car', 'rickshaw', 'walk']);

        $this->assertSame(['a', 'short', 'z'], $route['path']);
    }

    public function test_congestion_pushes_the_route_onto_a_slightly_longer_clear_corridor(): void
    {
        // Cost is distance x scale x (current_weight / base_weight), and for a
        // car that traffic factor is squared. The congested corridor is shorter
        // in distance but should still lose.
        $graph = [
            'a' => [
                $this->edge('edge_a_jam', 'jam', 4, 2.0, ['car', 'rickshaw', 'walk'], [
                    'base_weight' => 4,
                    'current_weight' => 40,
                    'anomaly_active' => true,
                ]),
                $this->edge('edge_a_clear', 'clear', 4, 2.4, ['car', 'rickshaw', 'walk']),
            ],
            'jam' => [$this->edge('edge_jam_z', 'z', 4, 2.0, ['car', 'rickshaw', 'walk'], [
                'base_weight' => 4,
                'current_weight' => 40,
                'anomaly_active' => true,
            ])],
            'clear' => [$this->edge('edge_clear_z', 'z', 4, 2.4, ['car', 'rickshaw', 'walk'])],
            'z' => [],
        ];

        $route = $this->service()->run($graph, 'a', 'z', ['car', 'rickshaw', 'walk']);

        $this->assertSame(['a', 'clear', 'z'], $route['path']);
    }

    public function test_it_will_not_use_an_edge_that_forbids_the_requested_mode(): void
    {
        // The only link to 'goli' is rickshaw/walk, so a car-only request cannot reach it.
        $graph = [
            'a' => [$this->edge('edge_a_goli', 'goli', 2, 0.4, ['rickshaw', 'walk'], ['is_goli' => true])],
            'goli' => [],
        ];

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('No route is available for the selected travel modes.');

        $this->service()->run($graph, 'a', 'goli', ['car']);
    }

    public function test_a_goli_edge_is_ridden_not_driven(): void
    {
        $graph = [
            'a' => [$this->edge('edge_a_b', 'b', 2, 0.9, ['rickshaw', 'walk'], ['is_goli' => true])],
            'b' => [],
        ];

        $route = $this->service()->run($graph, 'a', 'b', ['car', 'rickshaw', 'walk']);

        $this->assertSame(['rickshaw'], $route['selected_modes']);
    }

    public function test_an_overpass_edge_is_walked(): void
    {
        $graph = [
            'a' => [$this->edge('edge_a_b', 'b', 2, 0.3, ['walk'], ['is_overpass' => true])],
            'b' => [],
        ];

        $route = $this->service()->run($graph, 'a', 'b', ['car', 'rickshaw', 'walk']);

        $this->assertSame(['walk'], $route['selected_modes']);
    }

    public function test_a_long_corridor_is_driven_when_car_is_allowed(): void
    {
        // Total distance comfortably exceeds long_trip_car_preference_km.
        $graph = [
            'a' => [$this->edge('edge_a_b', 'b', 10, 6.0, ['car', 'rickshaw', 'walk'])],
            'b' => [],
        ];

        $route = $this->service()->run($graph, 'a', 'b', ['car', 'rickshaw', 'walk']);

        $this->assertSame(['car'], $route['selected_modes']);
        $this->assertSame(0, $route['mode_switches']);
    }

    public function test_a_short_hop_is_walked(): void
    {
        $walkMax = (float) config('golitransit.transport_distance_thresholds.walk_max_km');

        $graph = [
            'a' => [$this->edge('edge_a_b', 'b', 1, $walkMax - 0.1, ['car', 'rickshaw', 'walk'])],
            'b' => [],
        ];

        $route = $this->service()->run($graph, 'a', 'b', ['car', 'rickshaw', 'walk']);

        $this->assertSame(['walk'], $route['selected_modes']);
    }

    public function test_a_mode_switch_is_recorded_between_differing_segments(): void
    {
        // A long drivable leg followed by a walk-only overpass forces one switch.
        $graph = [
            'a' => [$this->edge('edge_a_b', 'b', 10, 6.0, ['car', 'rickshaw', 'walk'])],
            'b' => [$this->edge('edge_b_c', 'c', 1, 0.3, ['walk'], ['is_overpass' => true])],
            'c' => [],
        ];

        $route = $this->service()->run($graph, 'a', 'b', ['car', 'rickshaw', 'walk']);
        $this->assertSame(['car'], $route['selected_modes']);

        $full = $this->service()->run($graph, 'a', 'c', ['car', 'rickshaw', 'walk']);

        $switches = array_values(array_filter(
            $full['segments'],
            static fn (array $segment): bool => $segment['type'] === 'mode_switch'
        ));

        $this->assertSame(1, $full['mode_switches']);
        $this->assertCount(1, $switches);
        $this->assertSame('car', $switches[0]['previous_mode']);
        $this->assertSame('walk', $switches[0]['mode']);
        $this->assertGreaterThan(0, $switches[0]['switch_penalty']);
    }

    public function test_the_switch_penalty_is_added_to_the_total_cost(): void
    {
        $graph = [
            'a' => [$this->edge('edge_a_b', 'b', 10, 6.0, ['car', 'rickshaw', 'walk'])],
            'b' => [$this->edge('edge_b_c', 'c', 1, 0.3, ['walk'], ['is_overpass' => true])],
            'c' => [],
        ];

        $route = $this->service()->run($graph, 'a', 'c', ['car', 'rickshaw', 'walk']);

        $segmentCosts = array_sum(array_column($route['segments'], 'cost'));
        $penalties = array_sum(array_column($route['segments'], 'switch_penalty'));

        $this->assertSame($segmentCosts + $penalties, $route['total_cost']);
        $this->assertSame($penalties, $route['mode_switch_penalty_applied']);
    }

    public function test_an_expensive_switch_penalty_keeps_the_journey_on_one_mode(): void
    {
        // Routing through the hub is shorter, but each switch costs 3000, so the
        // direct single-mode edge wins.
        $graph = [
            'start' => [
                $this->edge('edge_start_hub', 'hub', 1, 6.0, ['car', 'rickshaw', 'walk']),
                $this->edge('edge_start_end', 'end', 20, 8.0, ['car', 'rickshaw', 'walk']),
            ],
            'hub' => [$this->edge('edge_hub_bridge', 'bridge', 1, 6.0, ['car', 'rickshaw', 'walk'])],
            'bridge' => [$this->edge('edge_bridge_end', 'end', 1, 0.5, ['walk'])],
            'end' => [],
        ];

        config()->set('golitransit.transfer_nodes', ['start', 'hub', 'bridge']);
        config()->set('golitransit.mode_switch_penalty', 3000);

        $route = $this->service()->run($graph, 'start', 'end', ['car', 'rickshaw', 'walk']);

        $this->assertSame(['start', 'end'], $route['path']);
        $this->assertSame(['car'], $route['selected_modes']);
        $this->assertSame(0, $route['mode_switches']);
    }

    public function test_it_rejects_an_unknown_start_node(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Unknown start node [nowhere].');

        $this->service()->run(['a' => []], 'nowhere', 'a', ['walk']);
    }

    public function test_it_rejects_an_unknown_destination_node(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Unknown destination node [nowhere].');

        $this->service()->run(['a' => []], 'a', 'nowhere', ['walk']);
    }

    public function test_it_requires_at_least_one_mode(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('At least one travel mode must be provided.');

        $this->service()->run(['a' => [], 'b' => []], 'a', 'b', []);
    }

    public function test_it_reports_no_route_when_the_destination_is_disconnected(): void
    {
        $graph = [
            'a' => [],
            'island' => [],
        ];

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('No route is available for the selected travel modes.');

        $this->service()->run($graph, 'a', 'island', ['car', 'rickshaw', 'walk']);
    }
}
