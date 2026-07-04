# GoliTransit Project Progress Report

Generated from the current repository state on 2026-07-05.

## 1. Project Summary

GoliTransit is a Dhaka-focused multi-modal routing project built on Laravel 10 with a public HTML/CSS/JavaScript demo layer and a React/Inertia Laravel Breeze scaffold still present in the codebase.

The project models a city graph with named Dhaka locations, directional road edges, travel-mode permissions, goli constraints, overpass/walk paths, anomaly-based edge weight inflation, and session-aware rerouting. The main judge/demo flow is:

1. Load the graph snapshot.
2. Request a route from one node to another.
3. Save the route under a session ID.
4. Trigger an anomaly against edge IDs or a bounding box.
5. Inflate matching edge weights.
6. Reroute active sessions whose previous route used affected edges.

The active public experiences are:

- `/` - traveler-facing planner served from `public/index.html`
- `/control-room` - technical proof/control room served from `public/control-room.html`
- `/health` - backend health check
- `/api/route` - route calculation
- `/api/anomaly` - anomaly application and rerouting
- `/api/graph/snapshot` - graph state inspection

The route provider also registers unprefixed API routes (`/route`, `/anomaly`, `/graph/snapshot`) for Vercel compatibility.

## 2. Current Architecture

```text
+--------------------------------------------------+
| Browser / Demo UI                               |
|                                                  |
| public/index.html                                |
| public/control-room.html                         |
| frontend/index.html, frontend/app.js, styles.css |
+------------------------+-------------------------+
                         |
                         v
+--------------------------------------------------+
| Laravel Web Layer                                |
|                                                  |
| routes/web.php                                   |
| WelcomeController                                |
| /, /control-room, /health                        |
+------------------------+-------------------------+
                         |
                         v
+--------------------------------------------------+
| Laravel API Layer                                |
|                                                  |
| routes/api.php                                   |
| RouteController                                  |
| AnomalyController                                |
| GraphSnapshotController                          |
+------------------------+-------------------------+
                         |
                         v
+--------------------------------------------------+
| Domain Services                                  |
|                                                  |
| DijkstraRoutingService                           |
| DemoGraphService                                 |
| SessionManager                                   |
| GraphManager                                     |
| MapData                                          |
| GoogleMapsService                                |
+------------------------+-------------------------+
                         |
                         v
+--------------------------------------------------+
| Data / Runtime State                             |
|                                                  |
| Static graph arrays in MapData                   |
| In-memory graph state in GraphManager            |
| In-memory session state in SessionManager        |
| Optional Google Maps live traffic calls          |
+--------------------------------------------------+
```

## 3. Main Technology Stack

- Backend: Laravel 10, PHP 8.1+ with Composer platform set to PHP 8.3
- API framework: Laravel controllers, request validation, service container
- Frontend app scaffold: React 18, Inertia, Laravel Breeze, Vite, Tailwind
- Public demo frontend: plain HTML/CSS/JavaScript in `public/` and `frontend/`
- Testing: PHPUnit 10
- Deployment: Vercel PHP runtime via `api/index.php` and `vercel.json`
- API client docs: Postman collection in `postman/GoliTransit.postman_collection.json`
- CI: GitHub Actions workflow in `.github/workflows/ci.yml`

## 4. File Inventory

This list includes project-owned files and excludes dependency internals under `vendor/`.

### Root Files

- `.editorconfig`
- `.env` - local environment file; should be treated as private
- `.env.example`
- `.gitattributes`
- `.gitignore`
- `artisan`
- `composer.json`
- `composer.lock`
- `jsconfig.json`
- `package-lock.json`
- `package.json`
- `phpunit.xml`
- `postcss.config.js`
- `README.md`
- `tailwind.config.js`
- `vercel.json`
- `vite.config.js`
- `PROJECT_PROGRESS.md`

### GitHub Automation

- `.github/dependabot.yml`
- `.github/workflows/ci.yml`
- `.github/workflows/live-verification.yml`

### Vercel Entry

- `api/index.php`

### Application Code

- `app/Console/Kernel.php`
- `app/Console/Commands/BenchmarkRouteCommand.php`
- `app/Console/Commands/SmokeCheckCommand.php`
- `app/Exceptions/Handler.php`
- `app/Http/Kernel.php`
- `app/Http/Controllers/Controller.php`
- `app/Http/Controllers/ProfileController.php`
- `app/Http/Controllers/WelcomeController.php`
- `app/Http/Controllers/Api/AnomalyController.php`
- `app/Http/Controllers/Api/GraphSnapshotController.php`
- `app/Http/Controllers/Api/RouteController.php`
- `app/Http/Controllers/Auth/AuthenticatedSessionController.php`
- `app/Http/Controllers/Auth/ConfirmablePasswordController.php`
- `app/Http/Controllers/Auth/EmailVerificationNotificationController.php`
- `app/Http/Controllers/Auth/EmailVerificationPromptController.php`
- `app/Http/Controllers/Auth/NewPasswordController.php`
- `app/Http/Controllers/Auth/PasswordController.php`
- `app/Http/Controllers/Auth/PasswordResetLinkController.php`
- `app/Http/Controllers/Auth/RegisteredUserController.php`
- `app/Http/Controllers/Auth/VerifyEmailController.php`
- `app/Http/Middleware/Authenticate.php`
- `app/Http/Middleware/EncryptCookies.php`
- `app/Http/Middleware/HandleInertiaRequests.php`
- `app/Http/Middleware/PreventRequestsDuringMaintenance.php`
- `app/Http/Middleware/RedirectIfAuthenticated.php`
- `app/Http/Middleware/TrimStrings.php`
- `app/Http/Middleware/TrustHosts.php`
- `app/Http/Middleware/TrustProxies.php`
- `app/Http/Middleware/ValidateSignature.php`
- `app/Http/Middleware/VerifyCsrfToken.php`
- `app/Http/Requests/ProfileUpdateRequest.php`
- `app/Http/Requests/Auth/LoginRequest.php`
- `app/Models/User.php`
- `app/Providers/AppServiceProvider.php`
- `app/Providers/AuthServiceProvider.php`
- `app/Providers/BroadcastServiceProvider.php`
- `app/Providers/EventServiceProvider.php`
- `app/Providers/RouteServiceProvider.php`
- `app/Services/GoogleMaps/GoogleMapsService.php`
- `app/Services/Graph/GraphManager.php`
- `app/Services/Graph/MapData.php`
- `app/Services/Routing/DemoGraphService.php`
- `app/Services/Routing/DijkstraRoutingService.php`
- `app/Services/Sessions/SessionManager.php`

### Bootstrap and Config

- `bootstrap/app.php`
- `bootstrap/cache/.gitignore`
- `bootstrap/cache/packages.php`
- `bootstrap/cache/services.php`
- `config/app.php`
- `config/auth.php`
- `config/broadcasting.php`
- `config/cache.php`
- `config/cors.php`
- `config/database.php`
- `config/filesystems.php`
- `config/golitransit.php`
- `config/hashing.php`
- `config/logging.php`
- `config/mail.php`
- `config/queue.php`
- `config/sanctum.php`
- `config/services.php`
- `config/session.php`
- `config/view.php`

### Database

- `database/.gitignore`
- `database/factories/UserFactory.php`
- `database/migrations/2014_10_12_000000_create_users_table.php`
- `database/migrations/2014_10_12_100000_create_password_reset_tokens_table.php`
- `database/migrations/2019_08_19_000000_create_failed_jobs_table.php`
- `database/migrations/2019_12_14_000001_create_personal_access_tokens_table.php`
- `database/seeders/DatabaseSeeder.php`

### Standalone Frontend Folder

- `frontend/README.md`
- `frontend/index.html`
- `frontend/app.js`
- `frontend/styles.css`

### Public Assets and Static Pages

- `public/.htaccess`
- `public/control-room.html`
- `public/favicon.ico`
- `public/index.html`
- `public/index.php`
- `public/robots.txt`
- `public/storage/.gitignore`

### React/Inertia Resources

- `resources/css/app.css`
- `resources/js/app.jsx`
- `resources/js/bootstrap.js`
- `resources/js/Components/ApplicationLogo.jsx`
- `resources/js/Components/Checkbox.jsx`
- `resources/js/Components/DangerButton.jsx`
- `resources/js/Components/Dropdown.jsx`
- `resources/js/Components/InputError.jsx`
- `resources/js/Components/InputLabel.jsx`
- `resources/js/Components/Modal.jsx`
- `resources/js/Components/NavLink.jsx`
- `resources/js/Components/PrimaryButton.jsx`
- `resources/js/Components/ResponsiveNavLink.jsx`
- `resources/js/Components/SecondaryButton.jsx`
- `resources/js/Components/TextInput.jsx`
- `resources/js/Layouts/AuthenticatedLayout.jsx`
- `resources/js/Layouts/GuestLayout.jsx`
- `resources/js/Pages/Dashboard.jsx`
- `resources/js/Pages/Welcome.jsx`
- `resources/js/Pages/Auth/ConfirmPassword.jsx`
- `resources/js/Pages/Auth/ForgotPassword.jsx`
- `resources/js/Pages/Auth/Login.jsx`
- `resources/js/Pages/Auth/Register.jsx`
- `resources/js/Pages/Auth/ResetPassword.jsx`
- `resources/js/Pages/Auth/VerifyEmail.jsx`
- `resources/js/Pages/Profile/Edit.jsx`
- `resources/js/Pages/Profile/Partials/DeleteUserForm.jsx`
- `resources/js/Pages/Profile/Partials/UpdatePasswordForm.jsx`
- `resources/js/Pages/Profile/Partials/UpdateProfileInformationForm.jsx`
- `resources/views/app.blade.php`
- `resources/views/debug-home.blade.php`
- `resources/views/welcome.blade.php`

### Routes

- `routes/api.php`
- `routes/auth.php`
- `routes/channels.php`
- `routes/console.php`
- `routes/web.php`

### Storage Placeholders and Logs

- `storage/app/.gitignore`
- `storage/app/public/.gitignore`
- `storage/logs/.gitignore`
- `storage/logs/laravel.log`

Runtime files under `storage/framework/` are generated by Laravel and are not part of the intended source architecture.

### Tests

- `tests/CreatesApplication.php`
- `tests/TestCase.php`
- `tests/Feature/AnomalyApiTest.php`
- `tests/Feature/ExampleTest.php`
- `tests/Feature/ProfileTest.php`
- `tests/Feature/RouteApiTest.php`
- `tests/Feature/Auth/AuthenticationTest.php`
- `tests/Feature/Auth/EmailVerificationTest.php`
- `tests/Feature/Auth/PasswordConfirmationTest.php`
- `tests/Feature/Auth/PasswordResetTest.php`
- `tests/Feature/Auth/PasswordUpdateTest.php`
- `tests/Feature/Auth/RegistrationTest.php`
- `tests/Unit/ExampleTest.php`

### API Collection

- `postman/GoliTransit.postman_collection.json`

## 5. Backend Feature Details

### Graph Model

The graph is defined in `app/Services/Graph/MapData.php`.

Current graph features:

- 30 named Dhaka-inspired nodes.
- 64 directional edges according to the README and graph snapshot metadata.
- Node types such as `hub`, `road`, `goli`, `overpass`, `terminal`, `historic`, `scenic`, and `gate`.
- Each edge stores:
  - `id`
  - `from`
  - `to`
  - `base_weight`
  - `current_weight`
  - `distance_km`
  - `car_allowed`
  - `rickshaw_allowed`
  - `walk_allowed`
  - `is_goli`
  - `is_overpass`
  - `modes`

Important modeled behavior:

- Goli edges can block cars while allowing rickshaw and walk.
- Overpass edges are walk-only.
- Most travel corridors are represented as explicit forward and reverse edges.
- Anomalies modify `current_weight` but preserve `base_weight`.

### Graph Manager

`app/Services/Graph/GraphManager.php` owns the in-memory graph.

Responsibilities:

- Initialize graph from `MapData`.
- Reset graph back to base data.
- Return full graph snapshot.
- Convert edge list into adjacency-list format for routing.
- Filter neighbors by travel mode.
- Apply anomaly multipliers by edge ID.
- Apply anomaly multipliers by bounding-box midpoint matching.

Current limitation:

- The graph is held in a static PHP property, so state persists only within the current PHP process/runtime. It is suitable for demos and tests, but not durable across distributed serverless invocations.

Current cleanup issue:

- `GraphManager.php` contains stray Google Maps experiment code after the class definition. This should be removed or moved into a service method because it creates side effects and references `$edge` outside a valid scope.

### Routing

`app/Services/Routing/DijkstraRoutingService.php` implements a state-expanded Dijkstra search where each state is `node|mode`.

Capabilities:

- Validates start and destination nodes.
- Supports `car`, `rickshaw`, and `walk`.
- Respects per-edge mode permissions.
- Allows mode switching only at configured transfer nodes.
- Applies a configurable mode-switch penalty.
- Returns:
  - path
  - route segments
  - total cost
  - selected modes
  - mode switch count
  - total switch penalty
  - live traffic flag

Configuration is in `config/golitransit.php`:

- `mode_switch_penalty`: default `3`
- `transfer_nodes`: `farmgate`, `karwan_bazar`, `green_road`

Current live-traffic behavior:

- The service attempts to use `GoogleMapsService` when `car` mode is requested.
- If Google Maps calls return data, car edge costs may be inflated.
- Network failure currently caused the smoke check to fail in this local environment, so the fallback handling needs hardening.

### Sessions and Rerouting

`app/Services/Sessions/SessionManager.php` stores route sessions in a static array.

Capabilities:

- Save a computed route under a provided or generated session ID.
- Retrieve one session or all sessions.
- Detect sessions whose previous route used affected anomaly edges.
- Rerun routing for impacted sessions.
- Flush sessions for tests/smoke checks.

Current limitation:

- Sessions are in-memory only. This is fine for a hackathon demo but not production-ready in serverless deployments.

### API Endpoints

Defined in `routes/api.php` and registered twice by `RouteServiceProvider`:

- Prefixed with `/api`
- Also without `/api` for Vercel forwarding compatibility

Endpoints:

- `POST /api/route`
  - Controller: `RouteController`
  - Computes route and stores session.

- `POST /api/anomaly`
  - Controller: `AnomalyController`
  - Accepts `edge_ids`, `multiplier`, and optional `bounding_box`.
  - Updates graph weights and reroutes impacted sessions.

- `GET /api/graph/snapshot`
  - Controller: `GraphSnapshotController`
  - Returns nodes, edges, and graph metadata.

- `GET /health`
  - Defined in `routes/web.php`
  - Returns `{ "status": "ok" }`

## 6. Frontend Details

### Public Traveler UI

File: `public/index.html`

Purpose:

- Gives regular users a polished trip-planning experience.
- Loads graph metadata.
- Lets the user choose start, destination, and allowed modes.
- Presents next-step travel guidance, route summary, journey steps, and a visual network map.
- Links to `/control-room`.

### Public Control Room

File: `public/control-room.html`

Purpose:

- Judge/demo-oriented technical proof page.
- Shows graph metrics.
- Runs route requests.
- Triggers anomaly requests.
- Refreshes graph snapshots.
- Visualizes normal roads, goli edges, active route edges, anomaly edges, and overpass nodes.
- Retries both `/api/*` and unprefixed endpoint styles for Vercel compatibility.

### Standalone Frontend Concept

Folder: `frontend/`

Purpose:

- A separate static hackathon deck/demo concept.
- Can run without Laravel by opening `frontend/index.html`.
- Allows an API base URL to be configured.
- Falls back to mock data if the backend is unavailable.

### React/Inertia Scaffold

Folder: `resources/js/`

Purpose:

- Laravel Breeze React/Inertia authentication scaffold.
- Includes login, registration, password reset, dashboard, and profile screens.

Current project direction:

- The public demo currently relies more heavily on static pages in `public/` than on the React/Inertia pages.

## 7. Deployment Setup

Deployment is configured for Vercel:

- `vercel.json` uses `vercel-php@0.7.4`.
- `api/index.php` forwards dynamic requests to Laravel's normal `public/index.php`.
- Rewrites send all routes to `/api/index.php`, while preserving `/build/*`.
- `outputDirectory` is `public/build`.

Important deployment environment variables described by the README:

- `APP_NAME`
- `APP_ENV`
- `APP_DEBUG`
- `APP_KEY`
- `APP_URL`
- `LOG_CHANNEL`
- `CACHE_DRIVER`
- `SESSION_DRIVER`
- `SESSION_SECURE_COOKIE`
- Optional: `GOOGLE_MAPS_API_KEY`

## 8. Automation and Verification

### Git State Observed

Current branch:

- `final`

Recent commits:

- `351d3ef Fix live verification URL handling`
- `a89d949 Add CI, live verification, and smoke check`
- `f7c80d5 Add route intelligence, replay, comparison, and disruption features`
- `76a055d final check`
- `622a70b Refine traveler UI with better gradients and mode picker`

Working tree had existing modified files before this report was created:

- `app/Services/GoogleMaps/GoogleMapsService.php` added
- `app/Services/Graph/GraphManager.php` modified
- `app/Services/Graph/MapData.php` modified
- `app/Services/Routing/DijkstraRoutingService.php` modified
- `bootstrap/cache/packages.php` modified
- `bootstrap/cache/services.php` modified

### Route Registration Check

`php artisan route:list` completed successfully and showed 28 routes, including:

- `/`
- `/control-room`
- `/health`
- `/api/route`
- `/api/anomaly`
- `/api/graph/snapshot`
- `/route`
- `/anomaly`
- `/graph/snapshot`
- Laravel Breeze auth routes

### Test Status

Targeted test command:

```bash
php artisan test tests\Feature\AnomalyApiTest.php tests\Feature\RouteApiTest.php
```

Result:

- 2 passed
- 9 failed
- 1 deprecated warning

Main reasons observed:

- Tests expect old route data such as destination `gulshan`; current graph uses `gulshan_1` and `gulshan_2`.
- Some expected paths/costs no longer match the updated graph.
- One anomaly test returned HTTP 500.
- Some validation tests expect a different JSON shape/status than current controllers return.
- The reroute test expects HTTP 202, while the current anomaly endpoint returns HTTP 200.
- PHP deprecation warning appears in `config/database.php` for `PDO::MYSQL_ATTR_SSL_CA` under the current PHP version.

Full feature suite command:

```bash
php artisan test --testsuite=Feature
```

Result:

- Timed out after 120 seconds.
- Multiple Breeze auth tests failed.
- Deprecation warnings appeared repeatedly from `config/database.php`.

Smoke check command:

```bash
php artisan golitransit:smoke-check
```

Result:

- Failed locally because Google Maps traffic calls could not connect to `maps.googleapis.com`.
- This shows the routing/smoke path currently depends on network availability when car mode is included.

Frontend build command:

```bash
npm.cmd run build
```

Result:

- Failed because `vite` was not recognized.
- This likely means Node dependencies are not installed in the current checkout, despite `package-lock.json` existing.
- Running `npm install` or `npm ci` should restore `node_modules/.bin/vite`.

PowerShell note:

- `npm run build` failed due to PowerShell script execution policy for `npm.ps1`.
- `npm.cmd run build` bypassed that policy issue but then revealed the missing `vite` executable.

## 9. How Far the Project Has Gone

Completed or mostly completed:

- Laravel project setup is in place.
- Public traveler and control-room UIs exist.
- Vercel deployment entrypoint and rewrite config exist.
- Core graph data exists with 30 Dhaka-inspired nodes.
- Multi-modal edge permissions exist.
- Dijkstra-style routing exists.
- Transfer-node mode switching exists.
- Mode-switch penalties exist.
- Route sessions are saved in memory.
- Anomaly endpoint can target edge IDs or bounding boxes.
- Graph snapshot endpoint exposes current graph state.
- Postman collection exists for manual API testing.
- CI workflow exists with Composer validation, dependency install, route listing, smoke check, and frontend build.
- A benchmark command exists for `/api/route`.
- A smoke-check command exists for graph, route, anomaly, and rerouting.

Partially complete:

- Live Google Maps traffic integration has started, but it needs safer failure handling and cleaner integration with graph node IDs.
- Tests exist, but several are out of sync with the current graph and endpoint behavior.
- React/Inertia Breeze auth scaffold exists, but the active demo UI is static HTML rather than the React app.
- Vercel compatibility has been handled by registering both prefixed and unprefixed API routes, but this should be clearly documented because it creates duplicate route names/paths.

Not production-ready yet:

- Graph and session state are in memory, not persisted.
- Serverless runtime behavior may lose session/anomaly state between invocations.
- Google Maps API dependency can break route computation/smoke checks if network access or API keys fail.
- Test suite is not currently green.
- Frontend build cannot run until Node dependencies are installed.
- `.env` exists locally and must not be committed or shared.

## 10. Recommended Next Steps

1. Remove stray executable code from the bottom of `app/Services/Graph/GraphManager.php`.
2. Make Google Maps traffic optional and non-blocking:
   - Do not call it without a configured API key.
   - Catch Laravel `ConnectionException`.
   - Keep base graph weights if live traffic fails.
3. Align `DijkstraRoutingService::$nodeCoordinates` with current graph node IDs such as `farmgate`, `gulshan_2`, `karwan_bazar`, etc.
4. Update `tests/Feature/RouteApiTest.php` to use the current graph nodes and expected paths.
5. Update anomaly tests to match current response statuses and JSON structure, or update controllers to match the intended test contract.
6. Decide whether duplicate unprefixed API routes are a permanent Vercel compatibility feature or a temporary workaround.
7. Install Node dependencies and verify `npm.cmd run build`.
8. Rerun `php artisan test` after test and live-traffic cleanup.
9. Consider storing graph/session state in cache, database, Redis, or another durable backend if the demo must preserve anomalies across requests in serverless production.
10. Clean generated cache files from source control if they are not intentionally tracked.

## 11. Overall Progress Assessment

The project is past the prototype stage for demo storytelling: it has a real graph, route engine, anomaly workflow, public UI, control-room UI, deployment config, and API collection.

The main remaining work is stabilization. The code has moved faster than the tests, so the current implementation and test expectations disagree. The Google Maps integration also needs to be made optional and fault-tolerant so the core routing system works even when external traffic data is unavailable.

Estimated status:

- Demo concept and UX: high progress
- Core routing model: medium-high progress
- API surface: medium-high progress
- Deployment wiring: medium progress
- Automated test reliability: low-medium progress
- Production readiness: early stage

In short: GoliTransit already has the main hackathon product shape. The next milestone should be making the implementation deterministic, testable, and safe when external services are unavailable.
