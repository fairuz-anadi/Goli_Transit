<h1 align="center">GoliTransit</h1>

<p align="center">
  <strong>Multi-modal route planning for Dhaka — because the fastest way through the city is rarely one vehicle.</strong>
</p>

<p align="center">
  <a href="https://github.com/fairuz-anadi/Goli_Transit/actions/workflows/ci.yml">
    <img alt="CI" src="https://github.com/fairuz-anadi/Goli_Transit/actions/workflows/ci.yml/badge.svg">
  </a>
  <img alt="PHP 8.1+" src="https://img.shields.io/badge/PHP-8.1%2B-777BB4">
  <img alt="Laravel 10" src="https://img.shields.io/badge/Laravel-10-FF2D20">
  <img alt="React 18" src="https://img.shields.io/badge/React-18-61DAFB">
</p>

---

## 🏆 Recognition

- **Champion** — IEEE WIE Day 2026
- **Top 10** — Techathon Nationals 2026
- **Top 10** — Rover Summit 2026

---

## The problem

Mainstream route planners assume you travel by one vehicle for the whole trip, and that every street takes a car. Neither holds in Dhaka:

- large parts of the city are **golis** — alleys too narrow for a car, but fine on a rickshaw or on foot
- **overpasses** are walk-only, and are often the quickest way across a road
- the genuinely fastest journey usually **mixes modes**, and changing vehicle has a real cost
- when a corridor jams, the route should **change**, not stubbornly insist on the blocked road

GoliTransit models all four constraints directly and plans across them in a single search.

## Features

- **Multi-modal routing** across car, rickshaw and walking in one graph search
- **Mode-switch penalties**, so the planner doesn't suggest six vehicle changes to save a minute
- **Transfer nodes** — switching is only allowed where it is actually practical
- **Anomaly injection** — inflate a corridor's cost and watch live trips re-plan around it
- **Session rerouting** — saved journeys affected by a disruption are recalculated automatically
- **Real street geometry** — routes follow OpenStreetMap roads, not straight lines between pins
- **Live location** — plan from where you're standing, and see the nearest stops
- **Operations console** — a Control Room for running routes, raising anomalies and inspecting the graph

## Screenshots

> _Placeholder — add images to `docs/screenshots/` and link them here._

| | |
|---|---|
| **Home** — live map and network counters<br>`docs/screenshots/home.png` | **Plan a trip** — directions and mode breakdown<br>`docs/screenshots/plan.png` |
| **Nearby** — closest stops to you<br>`docs/screenshots/nearby.png` | **Control Room** — anomaly simulation<br>`docs/screenshots/control-room.png` |

## Architecture

Two applications that share nothing but a JSON contract.

```text
┌──────────────────────────────┐        ┌──────────────────────────────┐
│  Public site (React SPA)     │        │  Operator consoles (Inertia) │
│  frontend/ · port 5173       │        │  /control-room /network      │
│  / /plan /nearby /coverage   │        │  /dashboard /status /api-docs│
└──────────────┬───────────────┘        └───────────────┬──────────────┘
               │                                        │
               └──────────────┬─────────────────────────┘
                              │  HTTP · JSON · CORS
                 ┌────────────┴─────────────┐
                 │  API layer               │
                 │  /api/route  /api/anomaly│
                 │  /api/graph/*  /health   │
                 └────────────┬─────────────┘
                              │
                 ┌────────────┴─────────────┐
                 │  Routing layer           │
                 │  DijkstraRoutingService  │
                 │  TransportModePolicy     │
                 │  SessionManager          │
                 └────────────┬─────────────┘
                              │
                 ┌────────────┴─────────────┐
                 │  Graph layer             │
                 │  MapData · GraphManager  │
                 │  58 nodes · 212 edges    │
                 └──────────────────────────┘
```

### How a routing decision is made

**1. The city is a weighted, mode-aware graph.**
Every junction is a node; every street segment is a directed edge. Each edge records `distance_km`, a `base_weight` (its normal cost), a `current_weight` (its cost right now), and which of `car` / `rickshaw` / `walk` may use it. Goli edges refuse cars; overpass edges are walk-only.

**2. Cost combines distance with live congestion.**

```
cost = distance_km × route_cost_scale × trafficFactor(mode)
```

where `trafficFactor` derives from `current_weight / base_weight`. Congestion hurts each mode differently — a car is squared (`f²`), a rickshaw feels ~65% of it, walking barely notices (~10%). That asymmetry is what makes the planner hand you off to a rickshaw when a road seizes up.

**3. The search runs over (node, mode) pairs, not just nodes.**
Dijkstra explores states like `farmgate|car` and `farmgate|rickshaw` separately. An edge is only relaxed for a mode it permits, so a car simply cannot enter a goli. At a configured **transfer node**, the search may move between modes at the same place for a fixed `mode_switch_penalty` — which is what stops it from switching constantly.

**4. Ranking prefers the sensible vehicle for the distance.**
On top of raw cost, `TransportModePolicy` adds a penalty when a mode is a poor fit for the leg's length: under 0.8 km favours walking, 0.8–1.8 km favours a rickshaw, and beyond that a car.

**5. A final pass makes the journey practical.**
Once the cheapest path is found, each leg is re-examined in context: overpasses become walking, golis become rickshaw, a long remaining distance keeps you in the car, and a short final hop becomes a walk. Mode-switch markers are then inserted wherever consecutive legs differ — which is why `selected_modes` can differ from the modes the search itself used.

**6. Disruptions reshape the map.**
`POST /api/anomaly` multiplies `current_weight` on the targeted edges (by id, or by geographic bounding box using each edge's midpoint). The new weights are cached for six hours so they survive the request, and every saved session that used an affected edge is re-planned. `POST /api/graph/reset` restores base weights.

## API

Base URL is the backend service. CORS is open on `/api/*` and `/health`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Uptime probe → `{"status":"ok"}` |
| `GET` | `/api/graph/snapshot` | Full graph with live weights and counts |
| `POST` | `/api/route` | Compute the best multi-modal route |
| `POST` | `/api/anomaly` | Inflate edges and reroute affected sessions |
| `POST` | `/api/graph/reset` | Clear every inflated weight |

<details>
<summary><strong>POST /api/route</strong></summary>

```json
{
  "session_id": "demo-farmgate-gulshan",
  "start": "farmgate",
  "destination": "gulshan_2",
  "allowed_modes": ["car", "rickshaw", "walk"]
}
```

Responds with `data.path`, `data.segments` (each `travel` or `mode_switch`), `data.selected_modes`, `data.total_cost`, `data.switches`, `data.justification` and `data.session_saved`.

Errors: `400` for an invalid payload or unknown node, `422` when no route exists under the requested modes.
</details>

<details>
<summary><strong>POST /api/anomaly</strong></summary>

```json
{
  "edge_ids": ["edge_karwan_bazar_tejgaon", "edge_tejgaon_banani"],
  "multiplier": 10
}
```

Or disrupt an area instead — an edge is included when its midpoint falls inside the box:

```json
{
  "edge_ids": [],
  "multiplier": 10,
  "bounding_box": { "min_lat": 23.75, "max_lat": 23.79, "min_lng": 90.39, "max_lng": 90.42 }
}
```
</details>

## Tech stack

| Layer | Technology |
| --- | --- |
| Backend | PHP 8.1+, Laravel 10 |
| Operator UI | React 18 + Inertia.js, Tailwind CSS |
| Public site | React 18 + React Router 7, Vite, Tailwind CSS |
| Mapping | Leaflet + OpenStreetMap, OSRM road geometry |
| Traffic | TomTom Routing/Traffic API (optional) |
| Testing | PHPUnit 10 |
| Style | Laravel Pint |
| CI | GitHub Actions |
| Hosting | Vercel (serverless PHP), Docker/Render |

## Local setup

**Requirements:** PHP 8.1+, Composer, Node 20+. No database needed — the graph lives in code.

```bash
git clone https://github.com/fairuz-anadi/Goli_Transit.git
cd Goli_Transit

composer install
npm install

cp .env.example .env
php artisan key:generate
```

Run the two services in separate terminals:

```bash
php artisan serve    # backend + Control Room → http://127.0.0.1:8000
```

```bash
npm run dev          # public site           → http://localhost:5173
```

| Service | URL | Serves |
| --- | --- | --- |
| Public site | `http://localhost:5173` | Everything a traveller sees |
| Backend | `http://127.0.0.1:8000` | JSON API + operator consoles |

To point the site at a different backend, copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL`.

### Public site pages

| Path | Page |
| --- | --- |
| `/` | Home — hero, live map, popular trips |
| `/plan` | Plan a trip — planner, map, insights, directions |
| `/nearby` | Nearby — closest stops to your live location |
| `/trips` | Recent trips — stored in your browser only |
| `/coverage` | Coverage — every stop, searchable |
| `/how-it-works`, `/faq`, `/about` | Explainers |

`/plan` accepts `?from=<node_id>&to=<node_id>`, so trip links are shareable.

### Backend pages (operators)

| Path | Page |
| --- | --- |
| `/` | Service overview and endpoint list |
| `/control-room` | Run routes, trigger anomalies, inspect the graph |
| `/network` | Searchable node and edge browser |
| `/dashboard` | Graph composition and congestion analysis |
| `/status` | Live health and latency for every endpoint |
| `/api-docs` | Endpoint docs with runnable examples |

### Commands

```bash
php artisan test                      # full suite
./vendor/bin/pint                     # fix code style
./vendor/bin/pint --test              # check style without writing
php artisan golitransit:smoke-check   # graph + route + anomaly + reroute, end to end
php artisan route:list --except-vendor
```

### npm scripts

| Script | Builds |
| --- | --- |
| `npm run dev` | Public site dev server (5173) |
| `npm run build:site` | Public site → `frontend/dist` |
| `npm run dev:backend` | Vite dev server for the Inertia pages |
| `npm run build` | Backend Inertia assets → `public/build` |

## Testing

```bash
php artisan test
```

- **Unit** — the routing engine against hand-built graphs (mode permissions, switch penalties, transfer nodes, cost accumulation), graph/anomaly management, and structural invariants of the Dhaka map itself
- **Feature** — every API endpoint and operator page, session saving and selective rerouting, validation and error shapes

CI runs on every push and pull request: Composer validation, Pint, route registration, the full suite, the smoke check, and both frontend builds.

## Deployment

### Vercel (current)

Deployed at **`goli-transit.vercel.app`** via [vercel.json](vercel.json) and [api/index.php](api/index.php).

Vercel's filesystem is read-only, so the deployment depends on a specific configuration. **Do not change these:**

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

`api/index.php` additionally redirects every framework cache path to `/tmp`, the only writable location.

**Why `public/index.php` is excluded from Vercel.** Everything inside the `outputDirectory` (`public/`) is published as a *static asset*, and Vercel resolves `/` to `public/index.php` when no `public/index.html` exists — which served raw PHP source at the homepage. So:

- the front-controller body lives in `bootstrap/http-entry.php`
- `public/index.php` is a thin shim for Apache, `php artisan serve` and Docker
- `api/index.php` requires `bootstrap/http-entry.php` directly
- `public/index.php` is listed in `.vercelignore`

Do not re-add a `public/index.html`: it would shadow `/` again.

> **Anomalies do not persist on Vercel.** `CACHE_DRIVER=array` means inflated weights live for a single invocation, so `/api/anomaly` followed by `/api/graph/snapshot` shows base weights again. A shared store (Redis, DynamoDB, database) would be needed there. The Docker deployment uses the file cache and persists correctly.

The public site is **not** deployed by this project — it needs its own static deployment with `VITE_API_BASE_URL` pointed at the backend.

### Docker / Render

[Dockerfile](Dockerfile) builds the frontend assets, installs PHP dependencies and serves through Apache with `public/` as the document root. It respects Render's `PORT`.

## Project structure

```text
app/
  Console/Commands/     TomTom + OSRM sync, benchmark, smoke check
  Http/Controllers/     Api/ (routing, anomaly, graph) + operator pages
  Services/
    Graph/              MapData, GraphManager, road snapping
    Routing/            DijkstraRoutingService, TransportModePolicy
    Sessions/           SessionManager
config/golitransit.php  Mode priority, penalties, distance bands, transfer nodes
frontend/               Standalone public site (React + React Router)
resources/js/           Inertia operator pages + shared map components
routes/                 api.php, web.php
tests/                  Unit + Feature
```

## Dhaka reference points

Useful start/destination pairs for demos:

| Node | Coordinates |
| --- | --- |
| `farmgate` | 23.7580, 90.3892 |
| `karwan_bazar` | 23.7515, 90.3908 |
| `tejgaon` | 23.7637, 90.3973 |
| `mohakhali` | 23.7777, 90.4006 |
| `banani` | 23.7937, 90.4043 |
| `gulshan_1` | 23.7806, 90.4166 |
| `gulshan_2` | 23.7925, 90.4078 |
| `badda` | 23.7802, 90.4268 |
| `kuril` | 23.8205, 90.4218 |
| `motijheel` | 23.7313, 90.4175 |
| `old_dhaka` | 23.7118, 90.4074 |
| `sadarghat` | 23.7085, 90.4113 |

## Demo flow

1. Open the site and show the live map and network counters
2. Plan `farmgate → gulshan_2` and walk through the mode breakdown
3. In the Control Room, trigger the corridor preset on `edge_karwan_bazar_tejgaon` and `edge_tejgaon_banani`
4. Show the inflated weight against its base in the highlighted-edge table
5. Re-run the route and compare the path and cost
6. Press **Clear anomalies**, then confirm every endpoint on `/status`

## License

MIT
