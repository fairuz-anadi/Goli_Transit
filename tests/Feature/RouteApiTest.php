<?php

namespace Tests\Feature;

use App\Services\Sessions\SessionManager;
use Tests\TestCase;

/**
 * End-to-end coverage of POST /api/route.
 *
 * These assertions describe behaviour (which mode wins, whether a switch
 * happens, what is saved) rather than pinning exact street names where the map
 * is free to grow. Where a specific corridor is named it is because the rule
 * being tested depends on it.
 */
class RouteApiTest extends TestCase
{
    private const ALL_MODES = ['car', 'rickshaw', 'walk'];

    /** @return array<string, mixed> */
    private function route(array $payload): array
    {
        return $this->postJson('/api/route', $payload)->json('data');
    }

    public function test_a_medium_city_trip_is_ridden_by_rickshaw(): void
    {
        $response = $this->postJson('/api/route', [
            'start' => 'farmgate',
            'destination' => 'green_road',
            'allowed_modes' => self::ALL_MODES,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.selected_modes', ['rickshaw'])
            ->assertJsonPath('data.switches', 0)
            ->assertJsonPath('data.justification.mode_switches', 0)
            ->assertJsonPath('data.justification.anomaly_checked', true)
            ->assertJsonPath('data.session_saved', true)
            ->assertJsonStructure([
                'data' => ['session_id', 'computation_time_ms', 'path', 'segments', 'route_segments', 'journey_cards'],
            ]);

        $data = $response->json('data');

        $this->assertSame('farmgate', $data['path'][0]);
        $this->assertSame('green_road', end($data['path']));
        $this->assertSame($data['path'], $data['nodes']);
        $this->assertGreaterThan(0, $data['total_cost']);
    }

    public function test_the_path_and_segments_always_agree(): void
    {
        $data = $this->route([
            'start' => 'farmgate',
            'destination' => 'kuril',
            'allowed_modes' => self::ALL_MODES,
        ]);

        $travel = array_values(array_filter(
            $data['segments'],
            static fn (array $segment): bool => $segment['type'] === 'travel'
        ));

        // One more node than travel legs, and each leg continues from the last.
        $this->assertCount(count($travel) + 1, $data['path']);

        foreach ($travel as $index => $segment) {
            $this->assertSame($data['path'][$index], $segment['from']);
            $this->assertSame($data['path'][$index + 1], $segment['to']);
        }

        $this->assertSameSize($data['segments'], $data['route_segments']);
    }

    public function test_every_selected_mode_was_one_the_caller_allowed(): void
    {
        $data = $this->route([
            'start' => 'farmgate',
            'destination' => 'mirpur_10',
            'allowed_modes' => ['rickshaw', 'walk'],
        ]);

        foreach ($data['selected_modes'] as $mode) {
            $this->assertContains($mode, ['rickshaw', 'walk'], 'Router used a mode the caller did not allow.');
        }
    }

    public function test_a_walk_only_destination_is_unreachable_by_car(): void
    {
        // Overpasses are walk-only transfers, so no car corridor reaches one.
        $response = $this->postJson('/api/route', [
            'start' => 'farmgate',
            'destination' => 'farmgate_overpass',
            'allowed_modes' => ['car'],
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonPath('message', 'No route is available for the selected travel modes.');
    }

    public function test_a_goli_destination_is_unreachable_by_car(): void
    {
        $response = $this->postJson('/api/route', [
            'start' => 'farmgate',
            'destination' => 'tejgaon_goli',
            'allowed_modes' => ['car'],
        ]);

        $response->assertStatus(422);
    }

    public function test_a_long_trip_is_driven_when_the_corridor_is_car_accessible(): void
    {
        $response = $this->postJson('/api/route', [
            'start' => 'farmgate',
            'destination' => 'kuril',
            'allowed_modes' => self::ALL_MODES,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.selected_modes', ['car'])
            ->assertJsonPath('data.switches', 0)
            ->assertJsonPath('data.justification.segment_modes.0.mode', 'car');
    }

    public function test_a_long_trip_switches_off_the_car_for_the_final_leg(): void
    {
        $data = $this->route([
            'start' => 'farmgate',
            'destination' => 'mirpur_10',
            'allowed_modes' => self::ALL_MODES,
        ]);

        $this->assertSame('car', $data['selected_modes'][0]);
        $this->assertSame(1, $data['switches']);

        $switches = array_values(array_filter(
            $data['segments'],
            static fn (array $segment): bool => $segment['type'] === 'mode_switch'
        ));

        $this->assertCount(1, $switches);
        $this->assertSame('car', $switches[0]['previous_mode']);
        $this->assertNotSame('car', $switches[0]['mode']);

        // A switch never moves you - it happens standing still at one node.
        $this->assertSame($switches[0]['from'], $switches[0]['to']);
    }

    public function test_it_saves_a_session_when_session_id_is_supplied(): void
    {
        $this->postJson('/api/route', [
            'session_id' => 'session-1',
            'start' => 'farmgate',
            'destination' => 'green_road',
            'allowed_modes' => self::ALL_MODES,
        ])
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
            'allowed_modes' => self::ALL_MODES,
        ]);

        $sessionId = $response->json('data.session_id');

        $response->assertOk()->assertJsonPath('data.session_saved', true);

        $this->assertNotEmpty($sessionId);
        $this->assertNotNull(app(SessionManager::class)->getSession($sessionId));
    }

    public function test_it_reroutes_only_the_sessions_that_used_the_damaged_edge(): void
    {
        // These two trips leave farmgate on different corridors, so an anomaly
        // on the first one must not disturb the second.
        $hit = $this->route([
            'session_id' => 'session-hit',
            'start' => 'farmgate',
            'destination' => 'mirpur_10',
            'allowed_modes' => self::ALL_MODES,
        ]);

        $safe = $this->route([
            'session_id' => 'session-safe',
            'start' => 'farmgate',
            'destination' => 'green_road',
            'allowed_modes' => self::ALL_MODES,
        ]);

        $damagedEdge = $hit['segments'][0]['edge_id'];
        $safeEdges = array_column($safe['segments'], 'edge_id');

        $this->assertNotNull($damagedEdge);
        $this->assertNotContains($damagedEdge, $safeEdges, 'Test setup: the two routes must not share their first edge.');

        $this->postJson('/api/anomaly', [
            'edge_ids' => [$damagedEdge],
            'multiplier' => 10,
        ])
            ->assertOk()
            ->assertJsonPath('reroute_summary.sessions_rerouted', 1)
            ->assertJsonPath('reroute_summary.sessions.0.session_id', 'session-hit');
    }

    public function test_it_rejects_a_payload_missing_the_destination(): void
    {
        $this->postJson('/api/route', ['start' => 'farmgate'])
            ->assertStatus(400)
            ->assertJsonStructure(['error']);
    }

    public function test_it_rejects_an_unknown_node(): void
    {
        // Unknown nodes are caught by request validation (400) rather than
        // reaching the router, which reserves 422 for "no route exists".
        $this->postJson('/api/route', [
            'start' => 'farmgate',
            'destination' => 'atlantis',
            'allowed_modes' => self::ALL_MODES,
        ])
            ->assertStatus(400)
            ->assertJsonStructure(['error']);
    }

    public function test_it_rejects_an_unsupported_mode(): void
    {
        $this->postJson('/api/route', [
            'start' => 'farmgate',
            'destination' => 'green_road',
            'allowed_modes' => ['helicopter'],
        ])->assertStatus(400);
    }
}
