<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;

class WelcomeController extends Controller
{
    public function index(): Response
    {
        return response(
            file_get_contents(public_path('index.html')),
            200,
            ['Content-Type' => 'text/html; charset=UTF-8']
        );
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
