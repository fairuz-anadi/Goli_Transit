<?php

namespace App\Services\GoogleMaps;

use Illuminate\Support\Facades\Http;

class GoogleMapsService
{
    protected $apiKey;

    public function __construct()
    {
        $this->apiKey = env('GOOGLE_MAPS_API_KEY');
    }

    // Get travel time & distance between two points
    public function getTravelData($origin, $destination, $mode = 'driving')
    {
        $response = Http::get('https://maps.googleapis.com/maps/api/distancematrix/json', [
            'origins'      => $origin,
            'destinations' => $destination,
            'mode'         => $mode, // driving, walking, transit
            'key'          => $this->apiKey,
        ]);

        return $response->json();
    }

    // Get live traffic duration
    public function getLiveTrafficTime($origin, $destination)
    {
        $response = Http::get('https://maps.googleapis.com/maps/api/directions/json', [
            'origin'                => $origin,
            'destination'           => $destination,
            'departure_time'        => 'now', // enables live traffic
            'traffic_model'         => 'best_guess',
            'key'                   => $this->apiKey,
        ]);

        $data = $response->json();

        // Extract duration in traffic
        return $data['routes'][0]['legs'][0]['duration_in_traffic']['value'] ?? null;
    }
}