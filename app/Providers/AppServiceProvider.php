<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Backstop for TrustProxies: if the app is configured to live on an
        // https origin, never generate http:// asset URLs, even when the
        // forwarded-proto header is missing. Mixed content would otherwise be
        // blocked by the browser and the page would render blank.
        if (str_starts_with((string) config('app.url'), 'https://')) {
            URL::forceScheme('https');
        }
    }
}
