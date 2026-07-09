/*
 * Leaflet + OpenStreetMap port for the React/Inertia frontend.
 * Renders the GoliTransit graph and computed route on top of OSM street
 * tiles. Replaces the previous TomTom Maps SDK integration.
 */
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DHAKA_CENTER = [23.7925, 90.4071];
const DEFAULT_ZOOM = 12;

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

function edgeColor(edge) {
    if (edge.anomaly_active) return ANOMALY_EDGE_COLOR;
    if (edge.is_goli) return GOLI_EDGE_COLOR;
    return NORMAL_EDGE_COLOR;
}

function edgeWidth(edge) {
    const trafficFactor = Number(edge.traffic_factor) || 1;
    return edge.anomaly_active ? Math.min(2 + trafficFactor, 7) : edge.is_goli ? 2.5 : 2;
}

const edgesWarnedNoRoute = new Set();

function edgeLatLngs(edge, from, to) {
    if (Array.isArray(edge.waypoints) && edge.waypoints.length >= 2) {
        return edge.waypoints.map(([lat, lng]) => [lat, lng]);
    }

    if (!edgesWarnedNoRoute.has(edge.id)) {
        edgesWarnedNoRoute.add(edge.id);
        console.warn(
            `No cached OSRM road geometry for edge "${edge.id}" - drawing a straight line instead. ` +
                'Run `php artisan golitransit:sync-road-geometry-osrm` to populate it.'
        );
    }

    return [
        [from.lat, from.lng],
        [to.lat, to.lng],
    ];
}

const USER_LOCATION_PANE = 'userLocationPane';

class LiveMap {
    constructor(map) {
        this.map = map;
        this.markers = [];
        this.edgeLayer = L.layerGroup().addTo(map);
        this.routeLayer = L.layerGroup().addTo(map);
        this.graph = { nodes: [], edges: [] };

        // Dedicated pane so the "you are here" marker always sits above
        // graph nodes/edges regardless of layer add order.
        map.createPane(USER_LOCATION_PANE);
        map.getPane(USER_LOCATION_PANE).style.zIndex = 650;

        this.userLocationMarker = null;
        this.userAccuracyCircle = null;
        this.watchId = null;
        this.lastFix = null;
    }

    clearMarkers() {
        this.markers.forEach((marker) => marker.remove());
        this.markers = [];
    }

    renderGraph(nodes, edges) {
        this.graph = { nodes, edges };
        this.clearMarkers();
        this.edgeLayer.clearLayers();
        this.routeLayer.clearLayers();

        const nodeIndex = Object.fromEntries(nodes.map((node) => [node.id, node]));

        edges.forEach((edge) => {
            const from = nodeIndex[edge.from];
            const to = nodeIndex[edge.to];
            if (!from || !to) return;

            L.polyline(edgeLatLngs(edge, from, to), {
                color: edgeColor(edge),
                weight: edgeWidth(edge),
            }).addTo(this.edgeLayer);
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

            const icon = L.divIcon({ html: el.outerHTML, className: '', iconAnchor: [dotSize / 2, dotSize / 2] });
            const marker = L.marker([node.lat, node.lng], { icon }).addTo(this.map);
            this.markers.push(marker);
        });

        if (nodes.length) {
            const bounds = L.latLngBounds(nodes.map((node) => [node.lat, node.lng]));
            this.map.fitBounds(bounds, { padding: [60, 60] });
        }
    }

    setUserLocation(lat, lng, accuracy) {
        const latLng = [lat, lng];

        if (!this.userLocationMarker) {
            const el = document.createElement('div');
            el.className = 'live-map-you-are-here';
            el.innerHTML = '<span class="live-map-you-are-here__pulse"></span><span class="live-map-you-are-here__dot"></span>';

            const icon = L.divIcon({
                html: el.outerHTML,
                className: '',
                iconSize: [18, 18],
                iconAnchor: [9, 9],
            });

            this.userLocationMarker = L.marker(latLng, {
                icon,
                pane: USER_LOCATION_PANE,
                zIndexOffset: 1000,
            }).addTo(this.map);
        } else {
            this.userLocationMarker.setLatLng(latLng);
        }

        if (typeof accuracy === 'number' && Number.isFinite(accuracy)) {
            if (!this.userAccuracyCircle) {
                this.userAccuracyCircle = L.circle(latLng, {
                    radius: accuracy,
                    pane: USER_LOCATION_PANE,
                    color: '#1a73e8',
                    weight: 1,
                    fillColor: '#1a73e8',
                    fillOpacity: 0.15,
                }).addTo(this.map);
            } else {
                this.userAccuracyCircle.setLatLng(latLng);
                this.userAccuracyCircle.setRadius(accuracy);
            }
        } else if (this.userAccuracyCircle) {
            this.userAccuracyCircle.remove();
            this.userAccuracyCircle = null;
        }
    }

    clearUserLocation() {
        this.userLocationMarker?.remove();
        this.userLocationMarker = null;
        this.userAccuracyCircle?.remove();
        this.userAccuracyCircle = null;
    }

    /**
     * Starts tracking the browser's geolocation and keeps a single marker
     * (plus optional accuracy circle) in sync with it via watchPosition.
     * Callbacks let the caller (React) surface permission/support errors in
     * the UI instead of failing silently.
     */
    startTrackingUserLocation({ onError, onSupportError, onFix, centerOnFirstFix = true } = {}) {
        this.stopTrackingUserLocation();

        if (!('geolocation' in navigator)) {
            onSupportError?.(new Error('Geolocation is not supported by this browser.'));
            return;
        }

        let firstFix = true;

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                this.setUserLocation(latitude, longitude, accuracy);
                this.lastFix = { lat: latitude, lng: longitude, accuracy, timestamp: position.timestamp };
                onFix?.(this.lastFix);

                if (firstFix && centerOnFirstFix) {
                    firstFix = false;
                    this.map.setView([latitude, longitude], Math.max(this.map.getZoom(), 15));
                }
            },
            (error) => {
                onError?.(error);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 5000,
                timeout: 15000,
            }
        );
    }

    stopTrackingUserLocation() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }

    getLastFix() {
        return this.lastFix;
    }

    /**
     * Forces a fresh position fix (maximumAge: 0) instead of waiting for the
     * next watchPosition tick - used before submitting a "start from my
     * location" search when the cached fix has gone stale.
     */
    requestFreshFix() {
        return new Promise((resolve, reject) => {
            if (!('geolocation' in navigator)) {
                reject(new Error('Geolocation is not supported by this browser.'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    this.setUserLocation(latitude, longitude, accuracy);
                    this.lastFix = { lat: latitude, lng: longitude, accuracy, timestamp: position.timestamp };
                    resolve(this.lastFix);
                },
                (error) => reject(error),
                { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
            );
        });
    }

    renderRoute(path, segments) {
        this.routeLayer.clearLayers();

        const routeEdgeIds = new Set((segments || []).filter((segment) => segment.edge_id).map((segment) => segment.edge_id));
        if (!routeEdgeIds.size) return;

        const nodeIndex = Object.fromEntries(this.graph.nodes.map((node) => [node.id, node]));

        this.graph.edges
            .filter((edge) => routeEdgeIds.has(edge.id))
            .forEach((edge) => {
                const from = nodeIndex[edge.from];
                const to = nodeIndex[edge.to];
                if (!from || !to) return;

                L.polyline(edgeLatLngs(edge, from, to), {
                    color: ROUTE_COLOR,
                    weight: 5,
                    opacity: 0.9,
                }).addTo(this.routeLayer);
            });
    }
}

export async function initLiveMap(container, options = {}) {
    const map = L.map(container, {
        center: options.center || DHAKA_CENTER,
        zoom: options.zoom || DEFAULT_ZOOM,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    return new LiveMap(map);
}
