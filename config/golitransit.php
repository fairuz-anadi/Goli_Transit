<?php

return [
    'mode_priority' => ['car', 'rickshaw', 'walk'],
    'mode_priority_penalty' => env('GOLITRANSIT_MODE_PRIORITY_PENALTY', 1000),
    'mode_switch_penalty' => env('GOLITRANSIT_MODE_SWITCH_PENALTY', 120),
    'route_cost_scale' => env('GOLITRANSIT_ROUTE_COST_SCALE', 100),

    // Distance-based vehicle selection tuned for the current demo graph:
    // - 0.0 km through 0.8 km: walk first
    // - 0.8 km through 1.8 km: rickshaw first
    // - above 1.8 km: car first
    'transport_distance_thresholds' => [
        'walk_max_km' => env('GOLITRANSIT_WALK_MAX_KM', 0.8),
        'rickshaw_max_km' => env('GOLITRANSIT_RICKSHAW_MAX_KM', 1.8),
        'car_min_km' => env('GOLITRANSIT_CAR_MIN_KM', 1.8),
    ],

    // If the remaining trip is still long, car can stay the main corridor mode,
    // but the planner should still switch to rickshaw or walk when the road
    // type, anomaly pressure, or final-mile distance makes that more practical.
    'long_trip_car_preference_km' => env('GOLITRANSIT_LONG_TRIP_CAR_PREFERENCE_KM', 4.5),

    // Only these nodes are allowed to switch transport modes in the A3 baseline.
    'transfer_nodes' => [
        'farmgate',
        'karwan_bazar',
        'green_road',
    ],
];
