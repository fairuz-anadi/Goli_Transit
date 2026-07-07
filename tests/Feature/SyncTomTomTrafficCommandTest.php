<?php

namespace Tests\Feature;

use App\Services\Graph\GraphManager;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SyncTomTomTrafficCommandTest extends TestCase
{
    protected function tearDown(): void
    {
        Cache::forget('golitransit:current_weights');
        app(GraphManager::class)->resetGraph();

        parent::tearDown();
    }

    protected function firstCarAllowedEdgeId(): string
    {
        $edges = app(GraphManager::class)->getCarAllowedEdgesWithCoordinates();
        $this->assertNotEmpty($edges, 'Expected at least one car-allowed edge in the demo graph.');

        return $edges[0]['id'];
    }

    protected function currentWeightOf(string $edgeId): float
    {
        $edge = collect(app(GraphManager::class)->getGraph()['edges'])->firstWhere('id', $edgeId);
        $this->assertNotNull($edge, "Edge [{$edgeId}] not found in graph snapshot.");

        return (float) $edge['current_weight'];
    }

    public function test_it_updates_car_allowed_edge_weights_from_live_traffic_data(): void
    {
        Http::fake([
            'api.tomtom.com/routing/*' => Http::response([
                'routes' => [
                    ['summary' => ['travelTimeInSeconds' => 900]],
                ],
            ], 200),
        ]);

        $edgeId = $this->firstCarAllowedEdgeId();

        $this->artisan('golitransit:sync-tomtom-traffic')->assertExitCode(0);

        $this->assertSame(15.0, $this->currentWeightOf($edgeId));
    }

    public function test_dry_run_does_not_persist_changes(): void
    {
        Http::fake([
            'api.tomtom.com/routing/*' => Http::response([
                'routes' => [
                    ['summary' => ['travelTimeInSeconds' => 900]],
                ],
            ], 200),
        ]);

        $edgeId = $this->firstCarAllowedEdgeId();
        $before = $this->currentWeightOf($edgeId);

        $this->artisan('golitransit:sync-tomtom-traffic', ['--dry-run' => true])->assertExitCode(0);

        $this->assertSame($before, $this->currentWeightOf($edgeId));
    }

    public function test_it_skips_edges_when_the_traffic_api_fails(): void
    {
        Http::fake([
            'api.tomtom.com/routing/*' => Http::response([], 500),
        ]);

        $edgeId = $this->firstCarAllowedEdgeId();
        $before = $this->currentWeightOf($edgeId);

        $this->artisan('golitransit:sync-tomtom-traffic')->assertExitCode(0);

        $this->assertSame($before, $this->currentWeightOf($edgeId));
    }
}
