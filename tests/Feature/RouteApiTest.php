<?php

namespace Tests\Feature;

use App\Services\Routing\DijkstraRoutingService;
use App\Services\Sessions\SessionManager;
use Tests\TestCase;

class RouteApiTest extends TestCase
{
    protected function tearDown(): void
    {
        app(SessionManager::class)->flush();

        parent::tearDown();
    }

    public function test_it_returns_a_rickshaw_route_for_a_medium_distance_trip(): void
    {
        $response = $this->postJson('/api/route', [
            'start' => 'farmgate',
            'destination' => 'green_road',
            'allowed_modes' => ['car', 'rickshaw', 'walk'],
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.selected_modes.0', 'rickshaw')
            ->assertJsonPath('data.path.0', 'farmgate')
            ->assertJsonPath('data.nodes.0', 'farmgate')
            ->assertJsonPath('data.path.1', 'moghbazar')
            ->assertJsonPath('data.path.2', 'green_road')
            ->assertJsonPath('data.total_cost', 320)
            ->assertJsonCount(2, 'data.segments')
            ->assertJsonCount(2, 'data.route_segments')
            ->assertJsonCount(2, 'data.journey_cards')
            ->assertJsonPath('data.switches', 0)
            ->assertJsonPath('data.justification.mode_switches', 0)
            ->assertJsonPath('data.justification.node_sequence.0', 'farmgate')
            ->assertJsonPath('data.justification.segment_modes.0.mode', 'rickshaw')
            ->assertJsonPath('data.justification.anomaly_checked', true)
            ->assertJsonStructure([
                'data' => [
                    'session_id',
                    'computation_time_ms',
                ],
            ])
            ->assertJsonPath('data.session_saved', true);
    }

    public function test_it_refuses_to_use_car_when_the_graph_has_no_car_corridor(): void
    {
        $response = $this->postJson('/api/route', [
            'start' => 'farmgate',
            'destination' => 'green_road',
            'allowed_modes' => ['car'],
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonPath('message', 'No route is available for the selected travel modes.');
    }

    public function test_it_keeps_the_route_on_rickshaw_when_car_is_not_usable(): void
    {
        $response = $this->postJson('/api/route', [
            'start' => 'farmgate',
            'destination' => 'green_road',
            'allowed_modes' => ['car', 'rickshaw', 'walk'],
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.path', [
                'farmgate',
                'moghbazar',
                'green_road',
            ])
            ->assertJsonPath('data.selected_modes.0', 'rickshaw')
            ->assertJsonPath('data.switches', 0)
            ->assertJsonPath('data.justification.mode_switches', 0);
    }

    public function test_it_saves_a_session_when_session_id_is_supplied(): void
    {
        $response = $this->postJson('/api/route', [
            'session_id' => 'session-1',
            'start' => 'farmgate',
            'destination' => 'green_road',
            'allowed_modes' => ['car', 'rickshaw', 'walk'],
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.session_id', 'session-1')
            ->assertJsonPath('data.session_saved', true);

        $session = app(SessionManager::class)->getSession('session-1');

        $this->assertNotNull($session);
        $this->assertSame('farmgate', $session['request']['start']);
        $this->assertSame('green_road', $session['request']['destination']);
    }

    public function test_it_auto_generates_and_saves_a_session_when_session_id_is_missing(): void
    {
        $response = $this->postJson('/api/route', [
            'start' => 'farmgate',
            'destination' => 'green_road',
            'allowed_modes' => ['car', 'rickshaw', 'walk'],
        ]);

        $sessionId = $response->json('data.session_id');

        $response
            ->assertOk()
            ->assertJsonPath('data.session_saved', true);

        $this->assertNotEmpty($sessionId);
        $this->assertNotNull(app(SessionManager::class)->getSession($sessionId));
    }

    public function test_it_prefers_car_for_a_long_trip_when_the_full_corridor_is_car_accessible(): void
    {
        $response = $this->postJson('/api/route', [
            'start' => 'farmgate',
            'destination' => 'kuril',
            'allowed_modes' => ['car', 'rickshaw', 'walk'],
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.selected_modes.0', 'car')
            ->assertJsonPath('data.selected_modes.1', 'rickshaw')
            ->assertJsonPath('data.switches', 1)
            ->assertJsonPath('data.justification.segment_modes.0.mode', 'car');
    }

    public function test_it_switches_vehicle_on_a_long_city_trip_when_remaining_distance_drops(): void
    {
        $response = $this->postJson('/api/route', [
            'start' => 'farmgate',
            'destination' => 'mirpur_10',
            'allowed_modes' => ['car', 'rickshaw', 'walk'],
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.selected_modes.0', 'car')
            ->assertJsonPath('data.selected_modes.1', 'rickshaw')
            ->assertJsonPath('data.switches', 1)
            ->assertJsonPath('data.segments.3.type', 'mode_switch');
    }

    public function test_it_reroutes_only_impacted_sessions(): void
    {
        $this->postJson('/api/route', [
            'session_id' => 'session-hit',
            'start' => 'farmgate',
            'destination' => 'green_road',
            'allowed_modes' => ['car', 'rickshaw', 'walk'],
        ]);

        $this->postJson('/api/route', [
            'session_id' => 'session-safe',
            'start' => 'farmgate',
            'destination' => 'green_road',
            'allowed_modes' => ['walk'],
        ]);

        $response = $this->postJson('/api/anomaly', [
            'edge_ids' => ['edge_farmgate_moghbazar'],
            'multiplier' => 10,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('reroute_summary.sessions_rerouted', 1)
            ->assertJsonPath('reroute_summary.sessions.0.session_id', 'session-hit');
    }

    public function test_it_can_make_exactly_two_switches_on_a_two_transfer_route(): void
    {
        $graph = [
            'start' => [
                ['id' => 'edge_start_hub', 'to' => 'hub', 'cost' => 1, 'distance_km' => 6.0, 'modes' => ['car', 'rickshaw', 'walk']],
                ['id' => 'edge_start_end', 'to' => 'end', 'cost' => 20, 'distance_km' => 8.0, 'modes' => ['car', 'rickshaw', 'walk']],
            ],
            'hub' => [
                ['id' => 'edge_hub_bridge', 'to' => 'bridge', 'cost' => 1, 'distance_km' => 6.0, 'modes' => ['car', 'rickshaw', 'walk']],
            ],
            'bridge' => [
                ['id' => 'edge_bridge_end', 'to' => 'end', 'cost' => 1, 'distance_km' => 0.5, 'modes' => ['walk']],
            ],
            'end' => [],
        ];

        config()->set('golitransit.transfer_nodes', ['start', 'hub', 'bridge']);
        config()->set('golitransit.mode_switch_penalty', 3000);

        $route = app(DijkstraRoutingService::class)->run($graph, 'start', 'end', ['car', 'rickshaw', 'walk']);

        $this->assertSame(['start', 'end'], $route['path']);
        $this->assertSame(['car'], $route['selected_modes']);
        $this->assertSame(0, $route['mode_switches']);
    }

    public function test_it_requires_valid_payload_fields(): void
    {
        $response = $this->postJson('/api/route', [
            'start' => 'farmgate',
        ]);

        $response
            ->assertStatus(400)
            ->assertJsonStructure([
                'error',
            ]);
    }
}
