<?php

namespace App\Services\Routing;

use RuntimeException;
use App\Services\GoogleMaps\GoogleMapsService;

class DijkstraRoutingService
{
    protected GoogleMapsService $googleMaps;

    // Coordinates for your 30 Dhaka nodes
    protected array $nodeCoordinates = [
        'Mirpur'        => ['lat' => 23.8103, 'lng' => 90.4125],
        'Dhanmondi'     => ['lat' => 23.7461, 'lng' => 90.3742],
        'Gulshan'       => ['lat' => 23.7808, 'lng' => 90.4201],
        'Banani'        => ['lat' => 23.7938, 'lng' => 90.4066],
        'Uttara'        => ['lat' => 23.8759, 'lng' => 90.3795],
        'Motijheel'     => ['lat' => 23.7330, 'lng' => 90.4182],
        'Badda'         => ['lat' => 23.7799, 'lng' => 90.4346],
        'Mohakhali'     => ['lat' => 23.7799, 'lng' => 90.4005],
        'Farmgate'      => ['lat' => 23.7580, 'lng' => 90.3893],
        'Shahbagh'      => ['lat' => 23.7393, 'lng' => 90.3957],
        'Rampura'       => ['lat' => 23.7622, 'lng' => 90.4346],
        'Khilgaon'      => ['lat' => 23.7388, 'lng' => 90.4290],
        'Jatrabari'     => ['lat' => 23.7099, 'lng' => 90.4346],
        'Demra'         => ['lat' => 23.7099, 'lng' => 90.4713],
        'Tejgaon'       => ['lat' => 23.7614, 'lng' => 90.3933],
        'Eskaton'       => ['lat' => 23.7461, 'lng' => 90.3957],
        'Paltan'        => ['lat' => 23.7330, 'lng' => 90.4125],
        'New Market'    => ['lat' => 23.7330, 'lng' => 90.3836],
        'Azimpur'       => ['lat' => 23.7236, 'lng' => 90.3836],
        'Lalbagh'       => ['lat' => 23.7196, 'lng' => 90.3893],
        'Sadarghat'     => ['lat' => 23.7099, 'lng' => 90.4066],
        'Kamalapur'     => ['lat' => 23.7236, 'lng' => 90.4236],
        'Bashabo'       => ['lat' => 23.7461, 'lng' => 90.4346],
        'Mugda'         => ['lat' => 23.7461, 'lng' => 90.4236],
        'Malibagh'      => ['lat' => 23.7538, 'lng' => 90.4182],
        'Shantinagar'   => ['lat' => 23.7388, 'lng' => 90.4125],
        'Wari'          => ['lat' => 23.7196, 'lng' => 90.4125],
        'Sutrapur'      => ['lat' => 23.7099, 'lng' => 90.3957],
        'Kotwali'       => ['lat' => 23.7099, 'lng' => 90.4005],
        'Hazaribagh'    => ['lat' => 23.7196, 'lng' => 90.3742],
    ];

    public function __construct()
    {
        $this->googleMaps = new GoogleMapsService();
    }

    public function run(array $graph, string $start, string $end, array $modes): array
    {
        if (! isset($graph[$start])) {
            throw new RuntimeException("Unknown start node [{$start}].");
        }

        if (! isset($graph[$end])) {
            throw new RuntimeException("Unknown destination node [{$end}].");
        }

        if ($modes === []) {
            throw new RuntimeException('At least one travel mode must be provided.');
        }

        // Inflate edge costs with live Google Maps traffic data
        $graph = $this->applyLiveTrafficWeights($graph, $modes);

        $transferNodes = config('golitransit.transfer_nodes', []);
        $switchPenalty = (int) config('golitransit.mode_switch_penalty', 3);
        $distances = [];
        $previous  = [];
        $visited   = [];

        foreach ($graph as $node => $_edges) {
            foreach ($modes as $mode) {
                $stateKey             = $this->stateKey($node, $mode);
                $distances[$stateKey] = INF;
                $previous[$stateKey]  = null;
                $visited[$stateKey]   = false;
            }
        }

        foreach ($modes as $mode) {
            $distances[$this->stateKey($start, $mode)] = 0;
        }

        while (true) {
            $currentState = $this->getClosestUnvisitedNode($distances, $visited);

            if ($currentState === null) {
                break;
            }

            ['node' => $currentNode, 'mode' => $currentMode] = $this->parseStateKey($currentState);
            $visited[$currentState] = true;

            foreach ($graph[$currentNode] as $edge) {
                if (! in_array($currentMode, $edge['modes'], true)) {
                    continue;
                }

                $neighbor          = $edge['to'];
                $neighborState     = $this->stateKey($neighbor, $currentMode);
                $candidateDistance = $distances[$currentState] + $edge['cost'];

                if ($candidateDistance < $distances[$neighborState]) {
                    $distances[$neighborState] = $candidateDistance;
                    $previous[$neighborState]  = [
                        'edge_id'        => $edge['id'],
                        'node'           => $currentNode,
                        'mode'           => $currentMode,
                        'cost'           => $edge['cost'],
                        'switch_penalty' => 0,
                        'live_cost'      => $edge['live_cost'] ?? null,
                    ];
                }
            }

            if (! in_array($currentNode, $transferNodes, true)) {
                continue;
            }

            foreach ($modes as $nextMode) {
                if ($nextMode === $currentMode) {
                    continue;
                }

                $nextState         = $this->stateKey($currentNode, $nextMode);
                $candidateDistance = $distances[$currentState] + $switchPenalty;

                if ($candidateDistance < $distances[$nextState]) {
                    $distances[$nextState] = $candidateDistance;
                    $previous[$nextState]  = [
                        'edge_id'        => null,
                        'node'           => $currentNode,
                        'mode'           => $currentMode,
                        'cost'           => 0,
                        'switch_penalty' => $switchPenalty,
                        'live_cost'      => null,
                    ];
                }
            }
        }

        $bestEndState    = null;
        $bestEndDistance = INF;

        foreach ($modes as $mode) {
            $stateKey = $this->stateKey($end, $mode);

            if ($distances[$stateKey] < $bestEndDistance) {
                $bestEndDistance = $distances[$stateKey];
                $bestEndState    = $stateKey;
            }
        }

        if ($bestEndState === null || $bestEndDistance === INF) {
            throw new RuntimeException('No route is available for the selected travel modes.');
        }

        $segments      = $this->buildSegments($previous, $start, $bestEndState);
        $selectedModes = array_values(array_unique(array_map(
            static fn (array $segment): string => $segment['mode'],
            array_filter($segments, static fn (array $segment): bool => $segment['edge_id'] !== null)
        )));

        return [
            'path'                         => $this->buildPath($segments, $start),
            'segments'                     => $segments,
            'total_cost'                   => $bestEndDistance,
            'selected_modes'               => $selectedModes,
            'mode_switches'                => count(array_filter(
                $segments,
                static fn (array $segment): bool => $segment['edge_id'] === null
            )),
            'mode_switch_penalty_applied'  => array_sum(array_map(
                static fn (array $segment): int => $segment['switch_penalty'],
                $segments
            )),
            'live_traffic_applied'         => true,
        ];
    }

    /**
     * Fetch live traffic from Google Maps and inflate car edge costs.
     */
    protected function applyLiveTrafficWeights(array $graph, array $modes): array
    {
        // Only fetch live data if 'car' mode is requested
        if (! in_array('car', $modes, true)) {
            return $graph;
        }

        foreach ($graph as $fromNode => &$edges) {
            foreach ($edges as &$edge) {
                // Only inflate car edges
                if (! in_array('car', $edge['modes'], true)) {
                    continue;
                }

                $toNode = $edge['to'];

                // Skip if coordinates not defined
                if (
                    ! isset($this->nodeCoordinates[$fromNode]) ||
                    ! isset($this->nodeCoordinates[$toNode])
                ) {
                    continue;
                }

                $origin      = $this->nodeCoordinates[$fromNode]['lat'].','.$this->nodeCoordinates[$fromNode]['lng'];
                $destination = $this->nodeCoordinates[$toNode]['lat'].','.$this->nodeCoordinates[$toNode]['lng'];

                try {
                    $liveSeconds = $this->googleMaps->getLiveTrafficTime($origin, $destination);

                    if ($liveSeconds !== null) {
                        $liveMinutes = round($liveSeconds / 60, 1);

                        $edge['live_cost']     = $liveMinutes;
                        $edge['original_cost'] = $edge['cost'];

                        // Use live cost only if worse than original
                        $edge['cost'] = max($edge['cost'], $liveMinutes);
                    }
                } catch (\Exception $e) {
                    // Keep original cost if API call fails
                    $edge['live_cost'] = null;
                }
            }
        }

        return $graph;
    }

    protected function getClosestUnvisitedNode(array $distances, array $visited): ?string
    {
        $closestNode     = null;
        $closestDistance = INF;

        foreach ($distances as $node => $distance) {
            if ($visited[$node]) {
                continue;
            }

            if ($distance < $closestDistance) {
                $closestDistance = $distance;
                $closestNode     = $node;
            }
        }

        return $closestNode;
    }

    protected function buildPath(array $segments, string $start): array
    {
        $path = [$start];

        foreach ($segments as $segment) {
            if ($segment['edge_id'] === null) {
                continue;
            }

            $path[] = $segment['to'];
        }

        return $path;
    }

    protected function buildSegments(array $previous, string $start, string $endState): array
    {
        $segments    = [];
        $cursorState = $endState;

        while ($cursorState !== null) {
            ['node' => $cursorNode, 'mode' => $cursorMode] = $this->parseStateKey($cursorState);

            if ($cursorNode === $start && ($previous[$cursorState] ?? null) === null) {
                break;
            }

            $segment = $previous[$cursorState] ?? null;

            if ($segment === null) {
                break;
            }

            if ($segment['edge_id'] === null) {
                array_unshift($segments, [
                    'edge_id'        => null,
                    'from'           => $segment['node'],
                    'to'             => $cursorNode,
                    'cost'           => 0,
                    'mode'           => $cursorMode,
                    'previous_mode'  => $segment['mode'],
                    'switch_penalty' => $segment['switch_penalty'],
                    'type'           => 'mode_switch',
                    'live_cost'      => null,
                ]);
            } else {
                array_unshift($segments, [
                    'edge_id'        => $segment['edge_id'],
                    'from'           => $segment['node'],
                    'to'             => $cursorNode,
                    'cost'           => $segment['cost'],
                    'mode'           => $cursorMode,
                    'previous_mode'  => $cursorMode,
                    'switch_penalty' => 0,
                    'type'           => 'travel',
                    'live_cost'      => $segment['live_cost'] ?? null,
                ]);
            }

            $cursorState = $this->stateKey($segment['node'], $segment['mode']);
        }

        return $segments;
    }

    protected function stateKey(string $node, string $mode): string
    {
        return $node.'|'.$mode;
    }

    protected function parseStateKey(string $stateKey): array
    {
        [$node, $mode] = explode('|', $stateKey, 2);

        return [
            'node' => $node,
            'mode' => $mode,
        ];
    }
}
