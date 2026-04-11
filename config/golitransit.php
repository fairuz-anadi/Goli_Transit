<?php

return [
    'mode_priority' => ['car', 'rickshaw', 'walk'],
    'mode_priority_penalty' => env('GOLITRANSIT_MODE_PRIORITY_PENALTY', 1000),
    'mode_switch_penalty' => env('GOLITRANSIT_MODE_SWITCH_PENALTY', 3000),
    'route_cost_scale' => env('GOLITRANSIT_ROUTE_COST_SCALE', 100),

    // Distance bands are intentionally normalized:
    // - < 1 km: walk only
    // - 1 km through 5 km: rickshaw + walk
    // - > 5 km: car + rickshaw + walk
    // The original request left a gap between 3 km and 5 km, so we treat it
    // as part of the medium corridor where rickshaw remains the practical fit.
    'transport_distance_thresholds' => [
        'walk_only_max_km' => env('GOLITRANSIT_WALK_ONLY_MAX_KM', 1.0),
        'rickshaw_max_km' => env('GOLITRANSIT_RICKSHAW_MAX_KM', 5.0),
        'car_min_km' => env('GOLITRANSIT_CAR_MIN_KM', 5.0),
    ],

    // Only these nodes are allowed to switch transport modes in the A3 baseline.
    'transfer_nodes' => [
        'farmgate',
        'karwan_bazar',
        'green_road',
    ],
];
