<?php

declare(strict_types=1);

// Set required environment variables for Vercel lambdas
$_ENV['VIEW_COMPILED_PATH'] = '/tmp';
$_ENV['APP_CONFIG_CACHE'] = '/tmp/config.php';
$_ENV['APP_EVENTS_CACHE'] = '/tmp/events.php';
$_ENV['APP_PACKAGES_CACHE'] = '/tmp/packages.php';
$_ENV['APP_ROUTES_CACHE'] = '/tmp/routes.php';
$_ENV['APP_SERVICES_CACHE'] = '/tmp/services.php';
$_ENV['CACHE_DRIVER'] = 'array';
$_ENV['CACHE_STORE'] = 'array';
$_ENV['SESSION_DRIVER'] = 'cookie';
$_ENV['LOG_CHANNEL'] = 'stderr';

foreach ($_ENV as $key => $value) {
    putenv("{$key}={$value}");
}

// Boot Laravel through the shared front controller.
//
// This deliberately does NOT require public/index.php: that file is excluded
// from Vercel deploys (.vercelignore) because Vercel serves the contents of
// `public/` as static assets and was resolving `/` to it, shipping the raw PHP
// source to visitors instead of rendering the app.
require __DIR__ . '/../bootstrap/http-entry.php';
