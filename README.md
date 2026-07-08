# GoliTransit

_Deployed update at 2026-07-09._

GoliTransit is a multi-modal routing system built for dense Dhaka-style traffic conditions. It combines a simulated city road graph, a routing engine with vehicle-switch penalties, anomaly-triggered rerouting, and a public control-room UI for live exploration.

Live project:

- `https://goli-transit.vercel.app`

Core judge-facing endpoints:

- `GET /health`
- `POST /api/route`
- `POST /api/anomaly`
- `GET /api/graph/snapshot`

## Problem Focus

Traditional route planners assume one vehicle type for the whole journey and often ignore alleyways, overpasses, and mode-switch tradeoffs. GoliTransit is built to model the real constraint-heavy situation of Dhaka:

- cars cannot use many narrow golis
- overpasses are walk-only transfer paths
- the best route may combine car, rickshaw, and walking
- sudden traffic anomalies should degrade parts of the network and trigger rerouting

## What The System Does

GoliTransit currently supports:

- Dhaka-inspired road graph with 30 named nodes and multi-modal edge permissions
- Dijkstra-based routing across `car`, `rickshaw`, and `walk`
- configurable mode-switch penalties at transfer nodes
- session-based route saving for reroute scenarios
- anomaly updates that inflate edge weights and reroute affected sessions
- graph snapshot endpoint for transparent before/after verification
- public control-room frontend that visualizes the graph and route flow

## Architecture

```text
+------------------------------+
| Frontend / Demo Layer        |
| /                            |
| control-room.html            |
+--------------+---------------+
               |
               v
+------------------------------+
| API Layer                    |
| /health                      |
| /api/route                   |
| /api/anomaly                 |
| /api/graph/snapshot          |
+--------------+---------------+
               |
               v
+------------------------------+
| Routing Layer                |
| DijkstraRoutingService       |
| SessionManager               |
| mode switches + rerouting    |
+--------------+---------------+
               |
               v
+------------------------------+
| Graph Layer                  |
| MapData                      |
| GraphManager                 |
| nodes, edges, weights        |
+------------------------------+
```

## Graph Design

The graph uses 30 recognizable Dhaka locations, including:

- `farmgate`
- `karwan_bazar`
- `tejgaon`
- `mohakhali`
- `banani`
- `gulshan_1`
- `gulshan_2`
- `badda`
- `kuril`
- `motijheel`
- `old_dhaka`
- `sadarghat`

Design choices:

- goli edges block cars but still allow rickshaw and walking
- overpasses are modeled as walk-only transfers
- most roads are directional through explicit forward and reverse edges
- each edge stores both `base_weight` and `current_weight`
- anomaly updates target explicit edge IDs or a geographic bounding box

## Transport Rules

Allowed modes:

```json
["car", "rickshaw", "walk"]
```

Edge example:

```json
{
  "id": "edge_farmgate_karwan_bazar",
  "from": "farmgate",
  "to": "karwan_bazar",
  "base_weight": 4,
  "current_weight": 4,
  "distance_km": 1.3,
  "car_allowed": true,
  "rickshaw_allowed": true,
  "walk_allowed": true,
  "is_goli": false,
  "is_overpass": false
}
```

## API

### `GET /health`

Purpose:
- fast uptime and deployment check

Example response:

```json
{
  "status": "ok"
}
```

### `POST /api/route`

Purpose:
- compute the best currently available route using one or more allowed travel modes

Example request:

```json
{
  "session_id": "demo-farmgate-gulshan",
  "start": "farmgate",
  "destination": "gulshan_2",
  "allowed_modes": ["car", "rickshaw", "walk"]
}
```

Example response shape:

```json
{
  "data": {
    "session_id": "demo-farmgate-gulshan",
    "start": "farmgate",
    "destination": "gulshan_2",
    "allowed_modes": ["car", "rickshaw", "walk"],
    "selected_modes": ["car"],
    "path": ["farmgate", "karwan_bazar", "tejgaon", "banani", "gulshan_1", "gulshan_2"],
    "nodes": ["farmgate", "karwan_bazar", "tejgaon", "banani", "gulshan_1", "gulshan_2"],
    "segments": [
      {
        "edge_id": "edge_farmgate_karwan_bazar",
        "from": "farmgate",
        "to": "karwan_bazar",
        "cost": 4,
        "mode": "car",
        "previous_mode": "car",
        "switch_penalty": 0,
        "type": "travel"
      }
    ],
    "route_segments": [
      {
        "edge_id": "edge_farmgate_karwan_bazar",
        "from": "farmgate",
        "to": "karwan_bazar",
        "cost": 4,
        "mode": "car",
        "previous_mode": "car",
        "switch_penalty": 0,
        "type": "travel"
      }
    ],
    "total_cost": 20,
    "switches": 0,
    "computation_time_ms": 4,
    "justification": {
      "summary": "Best available route on the current demo graph using the selected travel modes.",
      "mode_switches": 0,
      "mode_switch_penalty_applied": 0,
      "note": "Mode switching is allowed only at configured transfer nodes."
    },
    "session_saved": true
  }
}
```

### `POST /api/anomaly`

Purpose:
- inflate selected edges and reroute active sessions affected by those edges

Example request by edge IDs:

```json
{
  "edge_ids": ["edge_karwan_bazar_tejgaon", "edge_tejgaon_banani"],
  "multiplier": 10
}
```

Example request by bounding box:

```json
{
  "edge_ids": [],
  "multiplier": 10,
  "bounding_box": {
    "min_lat": 23.75,
    "max_lat": 23.79,
    "min_lng": 90.39,
    "max_lng": 90.42
  }
}
```

Example response shape:

```json
{
  "message": "Anomaly applied successfully.",
  "contract": {
    "edge_ids": ["edge_karwan_bazar_tejgaon", "edge_tejgaon_banani"],
    "multiplier": 10,
    "bounding_box": null
  },
  "reroute_summary": {
    "affected_edge_ids": ["edge_karwan_bazar_tejgaon", "edge_tejgaon_banani"],
    "sessions_rerouted": 1,
    "sessions": []
  },
  "affected_edges": [
    {
      "id": "edge_karwan_bazar_tejgaon",
      "from": "karwan_bazar",
      "to": "tejgaon",
      "base_weight": 4,
      "current_weight": 40
    }
  ],
  "meta": {
    "updated_edges": 2
  }
}
```

### `GET /api/graph/snapshot`

Purpose:
- expose the current graph exactly as the system sees it, including live `current_weight` values

Example response shape:

```json
{
  "data": {
    "nodes": [
      {
        "id": "farmgate",
        "name": "Farmgate",
        "lat": 23.758,
        "lng": 90.3892,
        "type": "hub"
      }
    ],
    "edges": [
      {
        "id": "edge_karwan_bazar_tejgaon",
        "from": "karwan_bazar",
        "to": "tejgaon",
        "base_weight": 4,
        "current_weight": 4,
        "distance_km": 1.5,
        "car_allowed": true,
        "rickshaw_allowed": true,
        "walk_allowed": true,
        "is_goli": false,
        "is_overpass": false
      }
    ]
  },
  "meta": {
    "source": "graph_manager",
    "node_count": 30,
    "edge_count": 64,
    "goli_edge_count": 6,
    "overpass_node_count": 2
  }
}
```

## Frontend Demo

The live homepage is a public control-room UI that:

- loads live graph data from the deployed backend
- visualizes the network as an SVG map
- lets users run a route request from the browser
- lets testers trigger an anomaly and inspect changed edges
- keeps quick links to `/health` and `/api/graph/snapshot`

Recommended demo flow:

1. Open the live homepage
2. Show the graph and node counts
3. Run a route from `farmgate` to `gulshan_2`
4. Trigger anomaly on `edge_karwan_bazar_tejgaon` and `edge_tejgaon_banani`
5. Refresh the snapshot and show updated weights
6. Run the route again and compare the result

## Local Setup

Install dependencies:

```bash
composer install
npm install
```

First-time setup:

```bash
copy .env.example .env
php artisan key:generate --force
```

Run locally:

```bash
php artisan serve
```

Useful checks:

```bash
php artisan route:list
php artisan golitransit:benchmark-route --base-url=http://127.0.0.1:8000
```

## Deployment

This project is deployed on Vercel using:

- [vercel.json](/d:/Project/Hackathon/GoliTransit/vercel.json)
- [index.php](/d:/Project/Hackathon/GoliTransit/api/index.php)

Required Vercel environment variables:

```env
APP_NAME=GoliTransit
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:YOUR_APP_KEY
APP_URL=https://goli-transit.vercel.app
LOG_CHANNEL=stderr
CACHE_DRIVER=array
SESSION_DRIVER=cookie
SESSION_SECURE_COOKIE=true
```

## Submission Assets

Included in this repo:

- final source code
- [README.md](/d:/Project/Hackathon/GoliTransit/README.md)
- [DEPLOY_CHECKLIST.md](/d:/Project/Hackathon/GoliTransit/DEPLOY_CHECKLIST.md)
- [PROJECT_STATUS.md](/d:/Project/Hackathon/GoliTransit/PROJECT_STATUS.md)
- [GoliTransit.postman_collection.json](/d:/Project/Hackathon/GoliTransit/postman/GoliTransit.postman_collection.json)

Still needed by the team before final submission:

- final live endpoint verification on the single kept Vercel project
- demo video

## Dhaka Reference Points

These are good route/demo examples:

- `farmgate` — 23.7580, 90.3892
- `karwan_bazar` — 23.7515, 90.3908
- `tejgaon` — 23.7637, 90.3973
- `mohakhali` — 23.7777, 90.4006
- `banani` — 23.7937, 90.4043
- `gulshan_1` — 23.7806, 90.4166
- `gulshan_2` — 23.7925, 90.4078
- `badda` — 23.7802, 90.4268
- `kuril` — 23.8205, 90.4218
- `motijheel` — 23.7313, 90.4175
- `old_dhaka` — 23.7118, 90.4074
- `sadarghat` — 23.7085, 90.4113
