<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

/**
 * Renders the backend service's operator pages.
 *
 * The traveller-facing site is a separate React application (frontend/) that
 * consumes this service's JSON API, so nothing here is meant for the public -
 * these are the Control Room and the consoles that support it.
 */
class WelcomeController extends Controller
{
    public function index(): InertiaResponse
    {
        return Inertia::render('Backend/Index', [
            'laravelVersion' => app()->version(),
            'phpVersion' => phpversion(),
        ]);
    }

    public function controlRoom(): InertiaResponse
    {
        return Inertia::render('ControlRoom');
    }

    public function network(): InertiaResponse
    {
        return Inertia::render('Network');
    }

    public function status(): InertiaResponse
    {
        return Inertia::render('Status');
    }

    public function apiDocs(): InertiaResponse
    {
        return Inertia::render('ApiDocs');
    }

    public function dashboard(): InertiaResponse
    {
        return Inertia::render('Dashboard');
    }
}
