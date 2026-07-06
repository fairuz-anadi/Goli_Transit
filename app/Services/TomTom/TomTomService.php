<?php

namespace App\Services\TomTom;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TomTomService
{
    protected string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.tomtom.key');
    }

    /**
     * Get real-time, traffic-aware driving duration (in minutes) between two points.
     * Returns null on failure so callers can fall back to base_weight.
     */
    public function getTrafficDuration(float $fromLat, float $fromLng, float $toLat, float $toLng): ?float
    {
        $url = "https://api.tomtom.com/routing/1/calculateRoute/{$fromLat},{$fromLng}:{$toLat},{$toLng}/json";

        try {
            $response = Http::timeout(10)->get($url, [
                'key' => $this->apiKey,
                'traffic' => 'true',
                'travelMode' => 'car',
            ]);
        } catch (\Throwable $e) {
            Log::warning('TomTom Routing request threw an exception', ['message' => $e->getMessage()]);
            return null;
        }

        if (!$response->successful()) {
            Log::warning('TomTom Routing request failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return null;
        }

        $seconds = $response->json('routes.0.summary.travelTimeInSeconds');

        return $seconds !== null ? round($seconds / 60, 2) : null;
    }

    /**
     * Get the traffic delay (in seconds) for a route, separate from raw travel time.
     * Useful if you want to store delay and base time separately.
     */
    public function getTrafficDelaySeconds(float $fromLat, float $fromLng, float $toLat, float $toLng): ?int
    {
        $url = "https://api.tomtom.com/routing/1/calculateRoute/{$fromLat},{$fromLng}:{$toLat},{$toLng}/json";

        try {
            $response = Http::timeout(10)->get($url, [
                'key' => $this->apiKey,
                'traffic' => 'true',
                'travelMode' => 'car',
            ]);
        } catch (\Throwable $e) {
            Log::warning('TomTom Routing request threw an exception', ['message' => $e->getMessage()]);
            return null;
        }

        if (!$response->successful()) {
            return null;
        }

        return $response->json('routes.0.summary.trafficDelayInSeconds');
    }

    /**
     * Get current flow speed data for a specific point on the road network.
     * Useful for spot-checking congestion without a full route calculation.
     *
     * zoom: 0-22, higher = more precise road segment matching. 10 is a reasonable default.
     */
    public function getFlowSegment(float $lat, float $lng, int $zoom = 10): ?array
    {
        $url = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/{$zoom}/json";

        try {
            $response = Http::timeout(10)->get($url, [
                'key' => $this->apiKey,
                'point' => "{$lat},{$lng}",
            ]);
        } catch (\Throwable $e) {
            Log::warning('TomTom Flow Segment request threw an exception', ['message' => $e->getMessage()]);
            return null;
        }

        if (!$response->successful()) {
            Log::warning('TomTom Flow Segment request failed', ['status' => $response->status()]);
            return null;
        }

        return $response->json('flowSegmentData');
    }
}
