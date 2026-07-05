<?php

use App\Http\Controllers\Api\AnomalyController;
use App\Http\Controllers\Api\GraphSnapshotController;
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


