<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * The Laravel app is the backend service: an API plus operator consoles.
 * Traveller-facing pages belong to the separate frontend application, so they
 * must NOT resolve here.
 */
class BackendPagesTest extends TestCase
{
    /** @return array<string, array{0: string, 1: string}> */
    public static function operatorPages(): array
    {
        return [
            'service overview' => ['/', 'Backend/Index'],
            'control room' => ['/control-room', 'ControlRoom'],
            'network explorer' => ['/network', 'Network'],
            'dashboard' => ['/dashboard', 'Dashboard'],
            'system status' => ['/status', 'Status'],
            'api reference' => ['/api-docs', 'ApiDocs'],
        ];
    }

    /**
     * @dataProvider operatorPages
     */
    public function test_operator_pages_render_their_inertia_component(string $path, string $component): void
    {
        $response = $this->get($path);

        $response->assertOk();
        $this->assertStringContainsString(
            e(json_encode($component), false),
            $response->getContent(),
            "Expected {$path} to render the {$component} page."
        );
    }

    public function test_the_health_probe_reports_ok(): void
    {
        $this->getJson('/health')
            ->assertOk()
            ->assertExactJson(['status' => 'ok']);
    }

    public function test_an_unknown_page_renders_the_styled_error_page(): void
    {
        $response = $this->get('/no-such-page');

        $response->assertNotFound();
        $this->assertStringContainsString(e(json_encode('Error'), false), $response->getContent());
    }

    /** @return array<string, array{0: string}> */
    public static function frontendOnlyPaths(): array
    {
        return [
            'planner' => ['/plan'],
            'nearby' => ['/nearby'],
            'coverage' => ['/coverage'],
            'faq' => ['/faq'],
        ];
    }

    /**
     * @dataProvider frontendOnlyPaths
     */
    public function test_traveller_pages_are_not_served_by_the_backend(string $path): void
    {
        $this->get($path)->assertNotFound();
    }

    /**
     * API consumers must always get machine-readable errors, never the Inertia
     * Error page meant for browsers.
     *
     * Note: the status here is currently 500 rather than 404, because the
     * exception handler maps every Throwable on an api/* route to 500. That is
     * a known wart left alone under the no-behaviour-change constraint; this
     * test guards the part that matters, which is the response format.
     */
    public function test_api_errors_stay_json_rather_than_rendering_the_error_page(): void
    {
        $response = $this->getJson('/api/not-a-real-endpoint');

        $this->assertGreaterThanOrEqual(400, $response->getStatusCode());
        $response->assertHeader('content-type', 'application/json');
        $this->assertJson($response->getContent());
        $this->assertStringNotContainsString('data-page', $response->getContent());
    }
}
