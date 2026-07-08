/*
 * Shared Leaflet + OpenStreetMap live-map renderer for public/index.html and
 * public/control-room.html. Renders the simulated GoliTransit graph/route on
 * top of real OSM street tiles. Replaces the previous TomTom SDK integration.
 */
(function (global) {
  const DHAKA_CENTER = [23.7925, 90.4071];
  const DEFAULT_ZOOM = 12;
  const LEAFLET_VERSION = "1.9.4";
  const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
  const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;

  const NODE_COLORS = {
    hub: "#17384e",
    overpass: "#d89d23",
    goli: "#1599d0",
    road: "#46677c",
  };
  const ROUTE_COLOR = "#18a85a";
  const GOLI_EDGE_COLOR = "rgba(21,153,208,.85)";
  const NORMAL_EDGE_COLOR = "rgba(70,103,124,.55)";
  const ANOMALY_EDGE_COLOR = "#d5566a";

  let sdkLoadPromise = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  function loadStylesheet(href) {
    return new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load ${href}`));
      document.head.appendChild(link);
    });
  }

  function loadSdk() {
    if (global.L) return Promise.resolve();
    if (!sdkLoadPromise) {
      sdkLoadPromise = Promise.all([loadStylesheet(LEAFLET_CSS), loadScript(LEAFLET_JS)]);
    }
    return sdkLoadPromise;
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

  const edgesWarnedNoRoute = new Set();

  function edgeLatLngs(edge, from, to) {
    if (Array.isArray(edge.waypoints) && edge.waypoints.length >= 2) {
      return edge.waypoints.map(([lat, lng]) => [lat, lng]);
    }

    if (!edgesWarnedNoRoute.has(edge.id)) {
      edgesWarnedNoRoute.add(edge.id);
      console.warn(
        `No cached OSRM road geometry for edge "${edge.id}" - drawing a straight line instead. ` +
          "Run `php artisan golitransit:sync-road-geometry-osrm` to populate it."
      );
    }

    return [
      [from.lat, from.lng],
      [to.lat, to.lng],
    ];
  }

  class LiveMap {
    constructor(map) {
      this.map = map;
      this.markers = [];
      this.edgeLayer = global.L.layerGroup().addTo(map);
      this.routeLayer = global.L.layerGroup().addTo(map);
      this.graph = { nodes: [], edges: [] };
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

        global.L.polyline(edgeLatLngs(edge, from, to), {
          color: edgeColor(edge),
          weight: edgeWidth(edge),
        }).addTo(this.edgeLayer);
      });

      nodes.forEach((node) => {
        const dotSize = node.type === "hub" ? 12 : 9;
        const color = NODE_COLORS[node.type] || NODE_COLORS.road;

        const el = document.createElement("div");
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.gap = "6px";
        el.title = node.name || node.id;

        const dot = document.createElement("span");
        dot.style.width = `${dotSize}px`;
        dot.style.height = `${dotSize}px`;
        dot.style.flex = "0 0 auto";
        dot.style.borderRadius = "50%";
        dot.style.border = "2px solid #f7fbff";
        dot.style.background = color;
        el.appendChild(dot);

        const label = document.createElement("span");
        label.textContent = node.name || node.id;
        label.style.padding = "1px 6px";
        label.style.borderRadius = "999px";
        label.style.fontSize = "11px";
        label.style.fontWeight = "600";
        label.style.whiteSpace = "nowrap";
        label.style.color = "#0f2433";
        label.style.background = "rgba(247,251,255,.88)";
        label.style.boxShadow = "0 1px 3px rgba(15,36,51,.35)";
        el.appendChild(label);

        const icon = global.L.divIcon({ html: el.outerHTML, className: "", iconAnchor: [dotSize / 2, dotSize / 2] });
        const marker = global.L.marker([node.lat, node.lng], { icon }).addTo(this.map);
        this.markers.push(marker);
      });

      if (nodes.length) {
        const bounds = global.L.latLngBounds(nodes.map((node) => [node.lat, node.lng]));
        this.map.fitBounds(bounds, { padding: [60, 60] });
      }
    }

    renderRoute(path, segments) {
      this.routeLayer.clearLayers();

      const routeEdgeIds = new Set(
        (segments || []).filter((segment) => segment.edge_id).map((segment) => segment.edge_id)
      );
      if (!routeEdgeIds.size) return;

      const nodeIndex = Object.fromEntries(this.graph.nodes.map((node) => [node.id, node]));

      this.graph.edges
        .filter((edge) => routeEdgeIds.has(edge.id))
        .forEach((edge) => {
          const from = nodeIndex[edge.from];
          const to = nodeIndex[edge.to];
          if (!from || !to) return;

          global.L.polyline(edgeLatLngs(edge, from, to), {
            color: ROUTE_COLOR,
            weight: 5,
            opacity: 0.9,
          }).addTo(this.routeLayer);
        });
    }
  }

  async function initLiveMap(containerId, options = {}) {
    await loadSdk();

    const map = global.L.map(containerId, {
      center: options.center || DHAKA_CENTER,
      zoom: options.zoom || DEFAULT_ZOOM,
    });

    global.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    return new LiveMap(map);
  }

  global.GoliLiveMap = { init: initLiveMap };
})(window);
