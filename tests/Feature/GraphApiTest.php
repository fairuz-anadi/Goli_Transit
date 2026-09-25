<?php

namespace Tests\Feature;

use App\Services\Graph\GraphManager;
use Tests\TestCase;

class GraphApiTest extends TestCase
{
    public function test_the_snapshot_reports_counts_that_match_its_payload(): void
    {
        $response = $this->getJson('/api/graph/snapshot')->assertOk();

        $data = $response->json('data');
        $meta = $response->json('meta');

        $this->assertCount($meta['node_count'], $data['nodes']);
        $this->assertCount($meta['edge_count'], $data['edges']);
        $this->assertSame(
            count(array_filter($data['edges'], static fn (array $e): bool => $e['is_goli'])),
            $meta['goli_edge_count']
        );
        $this->assertSame(
            count(array_filter($data['nodes'], static fn (array $n): bool => $n['type'] === 'overpass')),
            $meta['overpass_node_count']
        );
    }

    public function test_the_snapshot_exposes_live_weights_after_an_anomaly(): void
    {
        $edgeId = app(GraphManager::class)->getGraph()['edges'][0]['id'];

        $this->postJson('/api/anomaly', ['edge_ids' => [$edgeId], 'multiplier' => 10])->assertOk();

        $edges = $this->getJson('/api/graph/snapshot')->assertOk()->json('data.edges');
        $edge = collect($edges)->firstWhere('id', $edgeId);

        $this->assertGreaterThan($edge['base_weight'], $edge['current_weight']);
    }

    public function test_resetting_the_graph_clears_every_inflated_edge(): void
    {
        $edgeId = app(GraphManager::class)->getGraph()['edges'][0]['id'];
        $this->postJson('/api/anomaly', ['edge_ids' => [$edgeId], 'multiplier' => 10])->assertOk();

        $this->postJson('/api/graph/reset')
            ->assertOk()
            ->assertJsonPath('meta.inflated_edges', 0)
            ->assertJsonStructure(['message', 'meta' => ['edge_count', 'inflated_edges']]);

        $edges = $this->getJson('/api/graph/snapshot')->json('data.edges');

        foreach ($edges as $edge) {
            $this->assertSame($edge['base_weight'], $edge['current_weight']);
        }
    }

    public function test_an_anomaly_requires_edges_or_a_bounding_box(): void
    {
        $this->postJson('/api/anomaly', ['edge_ids' => [], 'multiplier' => 10])
            ->assertStatus(400)
            ->assertJsonPath('error', 'Provide either edge_ids or bounding_box.');
    }

    public function test_an_anomaly_rejects_a_multiplier_below_one(): void
    {
        $this->postJson('/api/anomaly', ['edge_ids' => ['edge_karwan_bazar_tejgaon'], 'multiplier' => 0])
            ->assertStatus(400)
            ->assertJsonStructure(['error']);
    }
}
