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
- `GET /api/config/maps` → returns TomTom API key from server config
- `GET /internal/sync-traffic` → `InternalSyncController`

### Web Routes (`routes/web.php`)
- `GET /` → `WelcomeController@index`
- `GET /control-room` → `WelcomeController@controlRoom`
- `GET /dashboard` → authenticated Inertia dashboard
- `GET /health` → simple JSON health check

## Backend Details

- Uses Laravel 10.x and PHP 8.1+
- Sanctum for API/auth support
- Custom config values in `config/golitransit.php` for route planning behavior
- TomTom sync support via a scheduled or cron-triggered internal route

## Frontend Details

- React + Inertia.js frontend under `resources/js`
- Legacy or public demo assets under `frontend/` and `public/`
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
- The public demo includes `control-room.html` for visualization and live exploration.
- Custom route planning logic is driven by `config/golitransit.php` and service classes in `app/Services`.
