<?php

namespace Tests\Unit;

use App\Services\TomTom\TomTomService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TomTomServiceTest extends TestCase
{
    public function test_it_parses_traffic_duration_from_a_successful_response(): void
    {
        Http::fake([
            'api.tomtom.com/routing/*' => Http::response([
                'routes' => [
                    ['summary' => ['travelTimeInSeconds' => 300, 'trafficDelayInSeconds' => 45]],
                ],
            ], 200),
        ]);

        $service = app(TomTomService::class);

        $this->assertSame(5.0, $service->getTrafficDuration(23.758, 90.3892, 23.7515, 90.3908));
        $this->assertSame(45, $service->getTrafficDelaySeconds(23.758, 90.3892, 23.7515, 90.3908));
    }

    public function test_it_returns_null_when_the_routing_request_fails(): void
    {
        Http::fake([
            'api.tomtom.com/routing/*' => Http::response([], 500),
        ]);

        $service = app(TomTomService::class);

        $this->assertNull($service->getTrafficDuration(23.758, 90.3892, 23.7515, 90.3908));
        $this->assertNull($service->getTrafficDelaySeconds(23.758, 90.3892, 23.7515, 90.3908));
    }

    public function test_it_returns_null_when_the_routing_request_throws(): void
    {
        Http::fake(function () {
            throw new \Illuminate\Http\Client\ConnectionException('timed out');
        });

        $service = app(TomTomService::class);

        $this->assertNull($service->getTrafficDuration(23.758, 90.3892, 23.7515, 90.3908));
    }

    public function test_it_parses_flow_segment_data(): void
    {
        Http::fake([
            'api.tomtom.com/traffic/*' => Http::response([
                'flowSegmentData' => ['currentSpeed' => 12, 'freeFlowSpeed' => 40],
            ], 200),
        ]);

        $service = app(TomTomService::class);
        $flow = $service->getFlowSegment(23.758, 90.3892);

        $this->assertSame(12, $flow['currentSpeed']);
    }

    public function test_it_returns_null_when_flow_segment_request_fails(): void
    {
        Http::fake([
            'api.tomtom.com/traffic/*' => Http::response([], 404),
        ]);

        $service = app(TomTomService::class);

        $this->assertNull($service->getFlowSegment(23.758, 90.3892));
    }
}
