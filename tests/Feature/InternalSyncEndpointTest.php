<?php

namespace Tests\Feature;

use App\Services\Graph\GraphManager;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class InternalSyncEndpointTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config(['services.internal_cron_secret' => 'test-secret']);
    }

    protected function tearDown(): void
    {
        Cache::forget('golitransit:current_weights');
        app(GraphManager::class)->resetGraph();

        parent::tearDown();
    }

    public function test_it_rejects_requests_without_the_secret(): void
    {
        $this->getJson('/api/internal/sync-traffic')
            ->assertStatus(403);
    }

    public function test_it_rejects_requests_with_the_wrong_secret(): void
    {
        $this->withHeader('Authorization', 'Bearer wrong-secret')
            ->getJson('/api/internal/sync-traffic')
            ->assertStatus(403);
    }

    public function test_it_runs_the_sync_command_when_the_secret_matches(): void
    {
        Http::fake([
            'api.tomtom.com/routing/*' => Http::response([
                'routes' => [
                    ['summary' => ['travelTimeInSeconds' => 300]],
                ],
            ], 200),
        ]);

        $this->withHeader('Authorization', 'Bearer test-secret')
            ->getJson('/api/internal/sync-traffic')
            ->assertOk()
            ->assertJsonPath('exit_code', 0);
    }

    public function test_it_is_forbidden_when_no_secret_is_configured(): void
    {
        config(['services.internal_cron_secret' => null]);

        $this->withHeader('Authorization', 'Bearer anything')
            ->getJson('/api/internal/sync-traffic')
            ->assertStatus(403);
    }
}
