<?php

/*
|--------------------------------------------------------------------------
| Shared HTTP Front Controller
|--------------------------------------------------------------------------
|
| The real front-controller body lives here rather than in public/index.php
| so that more than one entrypoint can boot the application:
|
|   - public/index.php  -> Apache / `php artisan serve` / the Render Docker image
|   - api/index.php     -> the Vercel PHP serverless function
|
| Vercel serves everything inside the `outputDirectory` (public/) as a static
| asset, and it resolves `/` to `public/index.php` when no `public/index.html`
| exists — which shipped the raw PHP source to visitors instead of running the
| app. `public/index.php` is therefore excluded from Vercel via .vercelignore,
| so api/index.php must not depend on it.
|
*/

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// If the application is in maintenance mode, serve the pre-rendered page
// instead of booting the framework.
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/app.php';

$kernel = $app->make(Kernel::class);

$response = $kernel->handle(
    $request = Request::capture()
)->send();

$kernel->terminate($request, $response);
