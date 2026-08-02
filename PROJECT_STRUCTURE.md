# Goli Transit Project Summary

## Overview
Goli Transit is a Laravel + React application for multi-modal routing and anomaly-aware route planning. It models Dhaka-style traffic and supports car, rickshaw, and walking route planning with transfer penalties and edge weight anomalies.

## Key Concepts
- Backend: Laravel API and web routes
- Frontend: React with Vite and Inertia.js
- Routing model: multi-modal graph with vehicle permissions, mode switches, and anomaly updates
- Deployment target: Vercel

## Top-level Folder Structure

- `api/` - public API entrypoint and serverless route handling
- `app/` - Laravel application code
  - `Console/` - custom Artisan commands and scheduler
  - `Exceptions/` - exception handling
  - `Http/` - controllers, middleware, requests
  - `Models/` - Eloquent models
  - `Providers/` - service providers
  - `Services/` - custom domain services like graph routing and TomTom integration
- `bootstrap/` - framework boot files
- `config/` - Laravel config files
  - `golitransit.php` - custom transport/routing configuration
- `database/` - migrations, seeders, factories
- `frontend/` - Vite/React app entry files used by the SPA
- `public/` - public assets and HTML landing files
- `resources/` - Laravel view assets and React components
- `routes/` - route definitions for web and API
- `storage/` - application storage and logs
- `tests/` - feature/unit tests
- `vendor/` - Composer dependencies

## Important Files

- `README.md` - project description and architecture overview
- `PROJECT_PROGRESS.md` - project status tracking
- `composer.json` - PHP dependencies and autoload configuration
- `package.json` - JavaScript dependencies and Vite scripts
- `vite.config.js` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `phpunit.xml` - PHPUnit test settings
- `vercel.json` - Vercel deployment configuration
- `app/Models/User.php` - default user model
- `routes/api.php` - API endpoints
- `routes/web.php` - web app routes
- `config/golitransit.php` - mode priority, penalties, transport thresholds, transfer nodes

## Main Routes

### API Routes (`routes/api.php`)
- `POST /api/route` → `RouteController`
- `POST /api/anomaly` → `AnomalyController`
- `GET /api/graph/snapshot` → `GraphSnapshotController`
- `POST /api/graph/reset` → `GraphResetController`
- `GET /internal/sync-traffic` → `InternalSyncController`

### Web Routes (`routes/web.php`)
Every web route renders an Inertia/React page from `resources/js/Pages`.

- `GET /` → `WelcomeController@index` (Landing)
- `GET /planner` → `WelcomeController@planner` (Welcome)
- `GET /control-room` → `WelcomeController@controlRoom` (ControlRoom)
- `GET /network` → `WelcomeController@network` (Network)
- `GET /status` → `WelcomeController@status` (Status)
- `GET /api-docs` → `WelcomeController@apiDocs` (ApiDocs)
- `GET /about` → `WelcomeController@about` (About)
- `GET /dashboard` → Inertia dashboard
- `GET /health` → simple JSON health check (the only non-page route)

## Backend Details

- Uses Laravel 10.x and PHP 8.1+
- Sanctum for API/auth support
- Custom config values in `config/golitransit.php` for route planning behavior
- TomTom sync support via a scheduled or cron-triggered internal route

## Frontend Details

- React + Inertia.js frontend under `resources/js`
  - `Pages/` - one file per route, resolved by name from `WelcomeController`
  - `Layouts/AppLayout.jsx` - shared nav, page header, and footer
  - `Components/Ui/` - Panel, Pill, StatTile, CodeBlock primitives
  - `Components/LiveMap/` - Leaflet map canvas and route panels
  - `lib/api.js` - typed wrapper around the JSON API used by every page
- Standalone concept deck under `frontend/` (not served by the app)
- `postcss.config.js` and `tailwind.config.js` configure styling

## Dependencies

### PHP / Composer
- `laravel/framework` ^10.10
- `laravel/sanctum`
- `inertiajs/inertia-laravel`
- `guzzlehttp/guzzle`
- `tightenco/ziggy`
- development: `phpunit/phpunit`, `fakerphp/faker`, `nunomaduro/collision`

### JS / NPM
- `react`, `react-dom`
- `@inertiajs/react`
- `vite`, `@vitejs/plugin-react`
- `tailwindcss`, `postcss`, `autoprefixer`
- `axios`

## Running the Project

1. Install Composer dependencies:
   ```bash
   composer install
   ```
2. Install NPM dependencies:
   ```bash
   npm install
   ```
3. Start frontend dev server:
   ```bash
   npm run dev
   ```
4. Run Laravel server:
   ```bash
   php artisan serve
   ```

## Notes
- The repository contains the full `vendor/` directory, so most PHP dependencies are already present.
- The Control Room is a React page (`resources/js/Pages/ControlRoom.jsx`); the old
  `public/control-room.html` and its `public/js/live-map.js` helper were removed.
- `public/index.php` is a shim over `bootstrap/http-entry.php` and is excluded from
  Vercel via `.vercelignore` — see the deployment notes in `README.md`.
- Custom route planning logic is driven by `config/golitransit.php` and service classes in `app/Services`.
