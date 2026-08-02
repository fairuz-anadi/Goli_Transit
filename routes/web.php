<?php

use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Every route here renders an Inertia/React page from resources/js/Pages, so
| the frontend owns the whole browsing experience. The only non-page route is
| /health, which exists as JSON because deployment platforms probe it.
|
*/

Route::get('/', [WelcomeController::class, 'index'])->name('landing');
Route::get('/planner', [WelcomeController::class, 'planner'])->name('planner');
Route::get('/control-room', [WelcomeController::class, 'controlRoom'])->name('control-room');
Route::get('/network', [WelcomeController::class, 'network'])->name('network');
Route::get('/status', [WelcomeController::class, 'status'])->name('status');
Route::get('/api-docs', [WelcomeController::class, 'apiDocs'])->name('api-docs');
Route::get('/about', [WelcomeController::class, 'about'])->name('about');

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->name('dashboard');

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
    ]);
})->name('health');
