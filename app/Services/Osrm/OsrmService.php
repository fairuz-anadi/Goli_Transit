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
     * Get the real road-following route between two locations: polyline
     * points (for map drawing), and the actual road distance/duration OSRM
     * computed for that same route (for routing cost) - all from one API
     * call, since OSRM returns them together. Returns null on failure or
     * "no route" so callers can fall back to a straight line / hand-authored
     * distance between the two endpoints.
     *
     * $profile is an OSRM routing profile: driving, walking, or cycling.
     *
     * @return array{points: array<array{0: float, 1: float}>, distance_km: float, duration_min: float}|null
     */
    public function getRoute(float $fromLat, float $fromLng, float $toLat, float $toLng, string $profile = 'driving'): ?array
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

        $route = $body['routes'][0] ?? null;
        $coordinates = $route['geometry']['coordinates'] ?? null;

        if (!is_array($coordinates) || $coordinates === []) {
            Log::warning('OSRM response had no route geometry coordinates');
            return null;
        }

        if (!isset($route['distance'], $route['duration'])) {
            Log::warning('OSRM response had no distance/duration on the route');
            return null;
        }

        // GeoJSON coordinates are [lng, lat]; flip to [lat, lng] to match the
        // rest of the app's node/edge coordinate convention.
        $points = array_map(
            static fn (array $point): array => [$point[1], $point[0]],
            $coordinates
        );

        return [
            'points' => $points,
            'distance_km' => round($route['distance'] / 1000, 3),
            'duration_min' => round($route['duration'] / 60, 2),
        ];
    }

    /**
     * Snaps a raw GPS fix onto the nearest routable point on the real road
     * network, e.g. to correct a fix that landed inside a building or a few
     * meters off the actual street. Returns null on failure so callers can
     * fall back to using the raw coordinate directly.
     *
     * @return array{lat: float, lng: float, distance_m: float|null}|null
     */
    public function nearest(float $lat, float $lng, string $profile = 'walking'): ?array
    {
        $url = "{$this->baseUrl}/nearest/v1/{$profile}/{$lng},{$lat}";

        try {
            $response = Http::timeout(10)->get($url);
        } catch (\Throwable $e) {
            Log::warning('OSRM nearest request threw an exception', ['message' => $e->getMessage()]);
            return null;
        }

        if (!$response->successful()) {
            Log::warning('OSRM nearest request failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return null;
        }

        $body = $response->json();

        if (($body['code'] ?? null) !== 'Ok') {
            Log::warning('OSRM nearest returned no usable match', ['code' => $body['code'] ?? 'unknown']);
            return null;
        }

        $location = $body['waypoints'][0]['location'] ?? null;

        if (!is_array($location) || count($location) < 2) {
            return null;
        }

        return [
            'lat' => (float) $location[1],
            'lng' => (float) $location[0],
            'distance_m' => isset($body['waypoints'][0]['distance']) ? (float) $body['waypoints'][0]['distance'] : null,
        ];
    }
}
