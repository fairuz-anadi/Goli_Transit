<?php

namespace App\Console\Commands\Concerns;

/**
 * Shared pacing for the commands that walk the whole graph calling an external
 * provider (TomTom, OSRM), so their free-tier rate limits are respected.
 *
 * The delay is configuration rather than a literal so the test suite can set it
 * to zero: with a faked HTTP client there is nothing to throttle, and sleeping
 * once per edge added around a minute to every run.
 */
trait ThrottlesExternalApi
{
    protected function throttle(string $configKey = 'golitransit.external_api_delay_microseconds'): void
    {
        $microseconds = (int) config($configKey, 100_000);

        if ($microseconds > 0) {
            usleep($microseconds);
        }
    }
}
