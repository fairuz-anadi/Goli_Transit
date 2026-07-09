<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class WelcomeController extends Controller
{
    public function index(): InertiaResponse
    {
        return Inertia::render('Landing');
    }

    public function planner(): InertiaResponse
    {
        return Inertia::render('Welcome', [
            'laravelVersion' => app()->version(),
            'phpVersion' => phpversion(),
        ]);
    }

    public function controlRoom(): Response
    {
        return response(
            file_get_contents(public_path('control-room.html')),
            200,
            ['Content-Type' => 'text/html; charset=UTF-8']
        );
    }
}
