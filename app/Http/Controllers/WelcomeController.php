<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

/**
 * Renders every public page of the app.
 *
 * All of these are Inertia/React pages on purpose: the browser should never be
 * handed a raw JSON endpoint or a standalone static HTML file, so anything a
 * visitor can reach has a real frontend page in resources/js/Pages.
 */
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

    public function about(): InertiaResponse
    {
        return Inertia::render('About');
    }
}
