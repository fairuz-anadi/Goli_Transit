<?php

use App\Http\Controllers\Api\AnomalyController;
use App\Http\Controllers\Api\GraphSnapshotController;
use App\Http\Controllers\Api\InternalSyncController;
use App\Http\Controllers\Api\RouteController;
use Illuminate\Support\Facades\Route;
/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::post('/route', RouteController::class);
Route::post('/anomaly', AnomalyController::class);
Route::get('/graph/snapshot', GraphSnapshotController::class);

/*
|--------------------------------------------------------------------------
| Add this to routes/api.php
|--------------------------------------------------------------------------
| Hands the TomTom key to the frontend at runtime instead of hardcoding it
| in app.js. Since TomTom keys aren't split into browser/server pairs the
| way Google's are, this is still worth doing so the key lives in one
| config source of truth (.env) rather than being duplicated in JS.
*/


Route::get('/config/maps', function () {
    return response()->json([
        'tomtom_key' => config('services.tomtom.key'),
    ]);
});

/*
|--------------------------------------------------------------------------
| Internal cron trigger
|--------------------------------------------------------------------------
| Vercel's serverless runtime has no persistent process to run Laravel's
| scheduler, so Kernel::schedule() never fires in production. This route
| is what Vercel Cron actually calls to run the TomTom sync (Vercel Cron
| always invokes via GET, and auto-sends `Authorization: Bearer $CRON_SECRET`
| when that env var is set) so it can't be triggered by anyone else.
*/

Route::get('/internal/sync-traffic', InternalSyncController::class);


