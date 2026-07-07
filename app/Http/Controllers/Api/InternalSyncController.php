<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class InternalSyncController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $expectedSecret = config('services.internal_cron_secret');

        if (empty($expectedSecret) || $request->bearerToken() !== $expectedSecret) {
            return response()->json([
                'message' => 'Forbidden.',
            ], 403);
        }

        $exitCode = Artisan::call('golitransit:sync-tomtom-traffic');

        return response()->json([
            'message' => $exitCode === 0 ? 'Traffic sync completed.' : 'Traffic sync finished with errors.',
            'exit_code' => $exitCode,
            'output' => Artisan::output(),
        ], $exitCode === 0 ? 200 : 500);
    }
}
