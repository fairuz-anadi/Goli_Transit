<?php

namespace Tests;

use App\Services\Graph\GraphManager;
use App\Services\Sessions\SessionManager;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    /**
     * GraphManager keeps the graph in a static property and persists anomaly
     * weights to the cache, so an anomaly raised in one test would otherwise
     * leak into every test that runs after it in the same process. Resetting
     * here keeps the suite order-independent.
     */
    protected function setUp(): void
    {
        parent::setUp();

        // The sync commands pace themselves for provider rate limits. Tests fake
        // the HTTP client, so there is nothing to throttle - and sleeping once
        // per edge added about a minute to every run. Set here rather than in
        // phpunit.xml because a value in .env takes precedence over <env>.
        config()->set('golitransit.external_api_delay_microseconds', 0);
        config()->set('golitransit.osrm_api_delay_microseconds', 0);

        app(GraphManager::class)->clearCurrentWeights();
        app(SessionManager::class)->flush();
    }

    protected function tearDown(): void
    {
        app(SessionManager::class)->flush();

        parent::tearDown();
    }
}
