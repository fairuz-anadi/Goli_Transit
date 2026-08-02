<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });

        $this->renderable(function (ValidationException $exception, $request): ?JsonResponse {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'error' => 'Validation failed.',
                'details' => $exception->errors(),
            ], 400);
        });

        $this->renderable(function (Throwable $exception, $request): ?JsonResponse {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'error' => app()->hasDebugModeEnabled()
                    ? $exception->getMessage()
                    : 'Internal server error.',
            ], 500);
        });
    }

    /**
     * Browser-facing failures render the Inertia `Error` page instead of
     * Laravel's built-in HTML templates, so a visitor never drops out of the
     * frontend into a bare framework page.
     */
    public function render($request, Throwable $e): Response
    {
        $response = parent::render($request, $e);

        if (! $this->shouldRenderErrorPage($request, $response)) {
            return $response;
        }

        return Inertia::render('Error', ['status' => $response->getStatusCode()])
            ->toResponse($request)
            ->setStatusCode($response->getStatusCode());
    }

    private function shouldRenderErrorPage(Request $request, Response $response): bool
    {
        // API clients and XHR callers still want machine-readable errors.
        if ($request->is('api/*') || $request->expectsJson()) {
            return false;
        }

        $status = $response->getStatusCode();

        // 500s keep Laravel's detailed debug page while developing locally;
        // everything else always gets the styled frontend page.
        if ($status === 500) {
            return ! app()->hasDebugModeEnabled();
        }

        return in_array($status, [403, 404, 419, 429, 503], true);
    }
}
