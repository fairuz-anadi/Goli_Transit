<?php

namespace App\Services\Osrm;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OsrmService
{
    protected string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.osrm.base_url'), '/');
    }

    /**
     * Get the real road-following polyline points between two locations, so
     * the map can draw an edge as an actual street shape instead of a
     * straight line. Returns null on failure or "no route" so callers can
     * fall back to a straight line between the two endpoints.
     *
     * $profile is an OSRM routing profile: driving, walking, or cycling.
     */
    public function getRoutePoints(float $fromLat, float $fromLng, float $toLat, float $toLng, string $profile = 'driving'): ?array
    {
        $url = "{$this->baseUrl}/route/v1/{$profile}/{$fromLng},{$fromLat};{$toLng},{$toLat}";

        try {
            $response = Http::timeout(10)->get($url, [
                'overview' => 'full',
                'geometries' => 'geojson',
            ]);
        } catch (\Throwable $e) {
            Log::warning('OSRM routing request threw an exception', ['message' => $e->getMessage()]);
            return null;
        }

        if (!$response->successful()) {
            Log::warning('OSRM routing request failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return null;
        }

        $body = $response->json();

        if (($body['code'] ?? null) !== 'Ok') {
            Log::warning('OSRM returned no usable route', [
                'code' => $body['code'] ?? 'unknown',
                'message' => $body['message'] ?? null,
            ]);
            return null;
        }

        $coordinates = $body['routes'][0]['geometry']['coordinates'] ?? null;

        if (!is_array($coordinates) || $coordinates === []) {
            Log::warning('OSRM response had no route geometry coordinates');
            return null;
        }

        // GeoJSON coordinates are [lng, lat]; flip to [lat, lng] to match the
        // rest of the app's node/edge coordinate convention.
        return array_map(
            static fn (array $point): array => [$point[1], $point[0]],
            $coordinates
        );
    }
}
