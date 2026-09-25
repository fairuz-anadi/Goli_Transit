<?php

use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes (backend service)
|--------------------------------------------------------------------------
|
| This application is the GoliTransit *backend*: the routing API plus the
| operations surface that runs alongside it. The public traveller-facing site
| is a separate React application in frontend/, served on its own port, which
| talks to this service only over the JSON API in routes/api.php.
|
| So the only pages here are operator tools - the Control Room and its
| supporting consoles. Do not add public marketing or traveller pages to this
| file; they belong in the frontend app.
|
*/

Route::get('/', [WelcomeController::class, 'index'])->name('backend.index');

Route::get('/control-room', [WelcomeController::class, 'controlRoom'])->name('control-room');
Route::get('/network', [WelcomeController::class, 'network'])->name('network');
Route::get('/status', [WelcomeController::class, 'status'])->name('status');
Route::get('/api-docs', [WelcomeController::class, 'apiDocs'])->name('api-docs');
Route::get('/dashboard', [WelcomeController::class, 'dashboard'])->name('dashboard');

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
    ]);
})->name('health');
