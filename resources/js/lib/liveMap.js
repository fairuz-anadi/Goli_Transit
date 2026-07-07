/*
 * ES module port of public/js/live-map.js for the React/Inertia frontend.
 * Loads the TomTom Maps SDK for Web, then renders the GoliTransit graph and
 * computed route on top of real street tiles + a live traffic flow layer.
 */
const SDK_VERSION = '6.25.0';
const SDK_JS = `https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/${SDK_VERSION}/maps/maps-web.min.js`;
const SDK_CSS = `https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/${SDK_VERSION}/maps/maps.css`;

const NODE_COLORS = {
    hub: '#17384e',
    overpass: '#d89d23',
    goli: '#1599d0',
    road: '#46677c',
};
const ROUTE_COLOR = '#18a85a';
const GOLI_EDGE_COLOR = 'rgba(21,153,208,.85)';
const NORMAL_EDGE_COLOR = 'rgba(70,103,124,.55)';
const ANOMALY_EDGE_COLOR = '#d5566a';

let sdkLoadPromise = null;
let tomtomKeyPromise = null;

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
    });
}

function loadStylesheet(href) {
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to load ${href}`));
        document.head.appendChild(link);
    });
}

function loadSdk() {
    if (!sdkLoadPromise) {
        sdkLoadPromise = Promise.all([loadStylesheet(SDK_CSS), loadScript(SDK_JS)]);
    }
    return sdkLoadPromise;
}

async function fetchTomTomKey() {
    if (tomtomKeyPromise) return tomtomKeyPromise;

    tomtomKeyPromise = (async () => {
        const response = await fetch('/api/config/maps', { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error('Could not load a TomTom API key from /api/config/maps.');
        const body = await response.json();
        if (!body.tomtom_key) throw new Error('No TomTom API key was returned by /api/config/maps.');
        return body.tomtom_key;
    })();

    return tomtomKeyPromise;
}

function edgeColor(edge) {
    if (edge.anomaly_active) return ANOMALY_EDGE_COLOR;
    if (edge.is_goli) return GOLI_EDGE_COLOR;
    return NORMAL_EDGE_COLOR;
}

function edgeWidth(edge) {
    const trafficFactor = Number(edge.traffic_factor) || 1;
    return edge.anomaly_active ? Math.min(2 + trafficFactor, 7) : edge.is_goli ? 2.5 : 2;
}

function edgeCoordinates(edge, from, to) {
    if (Array.isArray(edge.waypoints) && edge.waypoints.length >= 2) {
        return edge.waypoints.map(([lat, lng]) => [lng, lat]);
    }

    return [
        [from.lng, from.lat],
        [to.lng, to.lat],
    ];
}

function boundsFromNodes(nodes) {
    if (!nodes.length) return null;
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    nodes.forEach((node) => {
        minLng = Math.min(minLng, node.lng);
        maxLng = Math.max(maxLng, node.lng);
        minLat = Math.min(minLat, node.lat);
        maxLat = Math.max(maxLat, node.lat);
    });

    return [
        [minLng, minLat],
        [maxLng, maxLat],
    ];
}

class LiveMap {
    constructor(map, tt) {
        this.map = map;
        this.tt = tt;
        this.markers = [];
        this.graph = { nodes: [], edges: [] };
    }

    removeLayerAndSource(id) {
        if (this.map.getLayer(id)) this.map.removeLayer(id);
        if (this.map.getSource(id)) this.map.removeSource(id);
    }

    clearMarkers() {
        this.markers.forEach((marker) => marker.remove());
        this.markers = [];
    }

    renderGraph(nodes, edges) {
        this.graph = { nodes, edges };
        this.clearMarkers();
        this.removeLayerAndSource('goli-graph-edges');
        this.removeLayerAndSource('goli-graph-route');

        const nodeIndex = Object.fromEntries(nodes.map((node) => [node.id, node]));
        const edgeFeatures = edges
            .map((edge) => {
                const from = nodeIndex[edge.from];
                const to = nodeIndex[edge.to];
                if (!from || !to) return null;

                return {
                    type: 'Feature',
                    properties: {
                        id: edge.id,
                        color: edgeColor(edge),
                        width: edgeWidth(edge),
                    },
                    geometry: {
                        type: 'LineString',
                        coordinates: edgeCoordinates(edge, from, to),
                    },
                };
            })
            .filter(Boolean);

        this.map.addSource('goli-graph-edges', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: edgeFeatures },
        });
        this.map.addLayer({
            id: 'goli-graph-edges',
            type: 'line',
            source: 'goli-graph-edges',
            paint: {
                'line-color': ['get', 'color'],
                'line-width': ['get', 'width'],
            },
        });

        nodes.forEach((node) => {
            const dotSize = node.type === 'hub' ? 12 : 9;
            const color = NODE_COLORS[node.type] || NODE_COLORS.road;

            const el = document.createElement('div');
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.gap = '6px';
            el.title = node.name || node.id;

            const dot = document.createElement('span');
            dot.style.width = `${dotSize}px`;
            dot.style.height = `${dotSize}px`;
            dot.style.flex = '0 0 auto';
            dot.style.borderRadius = '50%';
            dot.style.border = '2px solid #f7fbff';
            dot.style.background = color;
            el.appendChild(dot);

            const label = document.createElement('span');
            label.textContent = node.name || node.id;
            label.style.padding = '1px 6px';
            label.style.borderRadius = '999px';
            label.style.fontSize = '11px';
            label.style.fontWeight = '600';
            label.style.whiteSpace = 'nowrap';
            label.style.color = '#0f2433';
            label.style.background = 'rgba(247,251,255,.88)';
            label.style.boxShadow = '0 1px 3px rgba(15,36,51,.35)';
            el.appendChild(label);

            const marker = new this.tt.Marker({ element: el, anchor: 'left' }).setLngLat([node.lng, node.lat]).addTo(this.map);
            this.markers.push(marker);
        });

        const bounds = boundsFromNodes(nodes);
        if (bounds) {
            this.map.fitBounds(bounds, { padding: 60, duration: 0 });
        }
    }

    renderRoute(path, segments) {
        this.removeLayerAndSource('goli-graph-route');

        const routeEdgeIds = new Set((segments || []).filter((segment) => segment.edge_id).map((segment) => segment.edge_id));
        if (!routeEdgeIds.size) return;

        const nodeIndex = Object.fromEntries(this.graph.nodes.map((node) => [node.id, node]));
        const routeFeatures = this.graph.edges
            .filter((edge) => routeEdgeIds.has(edge.id))
            .map((edge) => {
                const from = nodeIndex[edge.from];
                const to = nodeIndex[edge.to];
                if (!from || !to) return null;

                return {
                    type: 'Feature',
                    properties: { id: edge.id },
                    geometry: {
                        type: 'LineString',
                        coordinates: edgeCoordinates(edge, from, to),
                    },
                };
            })
            .filter(Boolean);

        this.map.addSource('goli-graph-route', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: routeFeatures },
        });
        this.map.addLayer({
            id: 'goli-graph-route',
            type: 'line',
            source: 'goli-graph-route',
            paint: {
                'line-color': ROUTE_COLOR,
                'line-width': 5,
                'line-opacity': 0.9,
            },
        });
    }
}

export async function initLiveMap(container, options = {}) {
    const [key] = await Promise.all([fetchTomTomKey(), loadSdk()]);
    const tt = window.tt;

    const map = tt.map({
        key,
        container,
        center: options.center || [90.4, 23.78],
        zoom: options.zoom || 12,
        showTrafficFlow: true,
        showTrafficIncidents: true,
    });

    return new Promise((resolve) => {
        map.on('load', () => resolve(new LiveMap(map, tt)));
    });
}
