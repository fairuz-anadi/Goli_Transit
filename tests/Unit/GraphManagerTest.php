<?php

namespace Tests\Unit;

use App\Services\Graph\GraphManager;
use Illuminate\Support\Facades\Cache;
use RuntimeException;
use Tests\TestCase;

class GraphManagerTest extends TestCase
{
    private function manager(): GraphManager
    {
        return app(GraphManager::class);
    }

    /** @return array<string, mixed>|null */
    private function edge(string $id): ?array
    {
        foreach ($this->manager()->getGraph()['edges'] as $edge) {
            if ($edge['id'] === $id) {
                return $edge;
            }
        }

        return null;
    }

    private function anyEdgeId(): string
    {
        return $this->manager()->getGraph()['edges'][0]['id'];
    }

    public function test_the_graph_starts_at_base_weights(): void
    {
        $inflated = array_filter(
            $this->manager()->getGraph()['edges'],
            static fn (array $edge): bool => $edge['current_weight'] !== $edge['base_weight']
        );

        $this->assertSame([], $inflated, 'A freshly reset graph should have no inflated edges.');
    }

    public function test_an_anomaly_multiplies_the_current_weight_only(): void
    {
        $edgeId = $this->anyEdgeId();
        $before = $this->edge($edgeId);

        $affected = $this->manager()->updateAnomalyZone([$edgeId], 10);

        $after = $this->edge($edgeId);

        $this->assertCount(1, $affected);
        $this->assertSame($edgeId, $affected[0]['id']);
        $this->assertSame($before['base_weight'], $after['base_weight'], 'base_weight must never change.');
        $this->assertSame((int) round($before['base_weight'] * 10), $after['current_weight']);
    }

    public function test_an_anomaly_survives_a_graph_rebuild(): void
    {
        $edgeId = $this->anyEdgeId();

        $this->manager()->updateAnomalyZone([$edgeId], 10);
        $inflated = $this->edge($edgeId)['current_weight'];

        // Simulate the next HTTP request rebuilding the graph from MapData.
        $this->manager()->resetGraph();

        $this->assertSame(
            $inflated,
            $this->edge($edgeId)['current_weight'],
            'Anomaly weights are cached so they outlive the request that raised them.'
        );
    }

    public function test_clearing_weights_restores_every_edge_to_base(): void
    {
        $edgeId = $this->anyEdgeId();
        $this->manager()->updateAnomalyZone([$edgeId], 10);

        $this->manager()->clearCurrentWeights();

        $edge = $this->edge($edgeId);
        $this->assertSame($edge['base_weight'], $edge['current_weight']);
        $this->assertNull(Cache::get('golitransit:current_weights'));
    }

    public function test_an_anomaly_never_drops_a_weight_below_one(): void
    {
        $edgeId = $this->anyEdgeId();

        $this->manager()->updateAnomalyZone([$edgeId], 0);

        $this->assertGreaterThanOrEqual(1, $this->edge($edgeId)['current_weight']);
    }

    public function test_an_unknown_edge_id_affects_nothing(): void
    {
        $affected = $this->manager()->updateAnomalyZone(['edge_that_does_not_exist'], 10);

        $this->assertSame([], $affected);
    }

    public function test_a_bounding_box_selects_edges_by_geography(): void
    {
        $affected = $this->manager()->updateAnomalyZoneWithBoundingBox([], 5, [
            'min_lat' => 23.75,
            'max_lat' => 23.79,
            'min_lng' => 90.39,
            'max_lng' => 90.42,
        ]);

        $this->assertNotEmpty($affected, 'Central Dhaka box should match at least one edge.');

        $nodes = [];
        foreach ($this->manager()->getGraph()['nodes'] as $node) {
            $nodes[$node['id']] = $node;
        }

        // An edge belongs to the zone when its midpoint falls inside the box,
        // so a road can be caught even when both of its endpoints sit outside.
        foreach ($affected as $edge) {
            $midLat = ($nodes[$edge['from']]['lat'] + $nodes[$edge['to']]['lat']) / 2;
            $midLng = ($nodes[$edge['from']]['lng'] + $nodes[$edge['to']]['lng']) / 2;

            $this->assertGreaterThanOrEqual(23.75, $midLat, "Edge {$edge['id']} midpoint is south of the box.");
            $this->assertLessThanOrEqual(23.79, $midLat, "Edge {$edge['id']} midpoint is north of the box.");
            $this->assertGreaterThanOrEqual(90.39, $midLng, "Edge {$edge['id']} midpoint is west of the box.");
            $this->assertLessThanOrEqual(90.42, $midLng, "Edge {$edge['id']} midpoint is east of the box.");
        }
    }

    public function test_an_incomplete_bounding_box_is_ignored(): void
    {
        $affected = $this->manager()->updateAnomalyZoneWithBoundingBox([], 10, [
            'min_lat' => 23.75,
            'max_lat' => 23.79,
            // min_lng / max_lng deliberately missing
        ]);

        $this->assertSame([], $affected);
    }

    public function test_setting_an_absolute_weight_is_persisted(): void
    {
        $edgeId = $this->anyEdgeId();

        $this->manager()->setCurrentWeight($edgeId, 42);
        $this->manager()->resetGraph();

        $this->assertSame(42, (int) $this->edge($edgeId)['current_weight']);
    }

    public function test_the_adjacency_graph_exposes_every_node(): void
    {
        $graph = $this->manager()->getGraph();
        $adjacency = $this->manager()->getAdjacencyGraph();

        $this->assertCount(count($graph['nodes']), $adjacency);

        foreach ($graph['nodes'] as $node) {
            $this->assertArrayHasKey($node['id'], $adjacency);
        }
    }

    public function test_neighbours_are_filtered_by_mode(): void
    {
        $adjacency = $this->manager()->getAdjacencyGraph();

        // Find a node that has at least one edge cars may not use.
        $nodeId = null;
        foreach ($adjacency as $id => $edges) {
            foreach ($edges as $edge) {
                if (! in_array('car', $edge['modes'], true)) {
                    $nodeId = $id;
                    break 2;
                }
            }
        }

        $this->assertNotNull($nodeId, 'Expected at least one car-restricted edge in the graph.');

        foreach ($this->manager()->getNeighbours($nodeId, 'car') as $edge) {
            $this->assertContains('car', $edge['modes']);
        }
    }

    public function test_neighbours_of_an_unknown_node_are_rejected(): void
    {
        $this->expectException(RuntimeException::class);

        $this->manager()->getNeighbours('nowhere', 'car');
    }
}
