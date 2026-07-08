const nodePositions = {
  farmgate: { x: 17, y: 28, label: "Farmgate" },
  karwan_bazar: { x: 28, y: 32, label: "Karwan Bazar" },
  tejgaon: { x: 41, y: 26, label: "Tejgaon" },
  mohakhali: { x: 54, y: 22, label: "Mohakhali" },
  banani: { x: 66, y: 16, label: "Banani" },
  gulshan_1: { x: 75, y: 28, label: "Gulshan 1" },
  gulshan_2: { x: 80, y: 39, label: "Gulshan 2" },
  badda: { x: 84, y: 52, label: "Badda" },
  kuril: { x: 92, y: 23, label: "Kuril" },
  green_road: { x: 33, y: 45, label: "Green Road" },
  panthapath: { x: 23, y: 49, label: "Panthapath" },
  shahbagh: { x: 20, y: 58, label: "Shahbagh" },
  motijheel: { x: 14, y: 70, label: "Motijheel" },
  old_dhaka: { x: 9, y: 81, label: "Old Dhaka" },
  sadarghat: { x: 13, y: 91, label: "Sadarghat" },
};

const graphEdges = [
  ["farmgate", "karwan_bazar"],
  ["karwan_bazar", "tejgaon"],
  ["tejgaon", "mohakhali"],
  ["mohakhali", "banani"],
  ["banani", "gulshan_1"],
  ["gulshan_1", "gulshan_2"],
  ["gulshan_2", "badda"],
  ["banani", "kuril"],
  ["karwan_bazar", "green_road"],
  ["green_road", "panthapath"],
  ["panthapath", "shahbagh"],
  ["shahbagh", "motijheel"],
  ["motijheel", "old_dhaka"],
  ["old_dhaka", "sadarghat"],
  ["panthapath", "farmgate"],
  ["green_road", "farmgate"],
];

const scenarios = [
  {
    id: "farmgate-gulshan",
    title: "Farmgate to Gulshan 2",
    start: "farmgate",
    destination: "gulshan_2",
    modes: ["car", "rickshaw", "walk"],
    note: "Balanced demo route for judges: easy to read, easy to explain.",
  },
  {
    id: "motijheel-banani",
    title: "Motijheel to Banani",
    start: "motijheel",
    destination: "banani",
    modes: ["rickshaw", "walk"],
    note: "Highlights transfer points and non-car corridor behavior.",
  },
  {
    id: "olddhaka-kuril",
    title: "Old Dhaka to Kuril",
    start: "old_dhaka",
    destination: "kuril",
    modes: ["car", "rickshaw", "walk"],
    note: "Longer trip for showing reroutes and network depth.",
  },
];

const modeOptions = [
  { id: "car", label: "Car" },
  { id: "rickshaw", label: "Rickshaw" },
  { id: "walk", label: "Walk" },
];

const mockRouteResponse = {
  data: {
    session_id: "demo-farmgate-gulshan",
    start: "farmgate",
    destination: "gulshan_2",
    allowed_modes: ["car", "rickshaw", "walk"],
    selected_modes: ["car"],
    path: ["farmgate", "karwan_bazar", "tejgaon", "banani", "gulshan_1", "gulshan_2"],
    nodes: ["farmgate", "karwan_bazar", "tejgaon", "banani", "gulshan_1", "gulshan_2"],
    segments: [],
    route_segments: [],
    total_cost: 20,
    switches: 0,
    computation_time_ms: 4,
    justification: {
      summary: "Best available route on the current graph using the selected travel modes.",
      mode_switches: 0,
      mode_switch_penalty_applied: 0,
      note: "Mode switching is allowed only at configured transfer nodes.",
    },
    session_saved: true,
  },
};

const mockSnapshotResponse = {
  data: {
    nodes: ["farmgate", "karwan_bazar", "tejgaon", "mohakhali", "banani"],
    edges: [
      {
        id: "edge_farmgate_karwan_bazar",
        from: "farmgate",
        to: "karwan_bazar",
        cost: 4,
        modes: ["car", "rickshaw", "walk"],
      },
      {
        id: "edge_karwan_bazar_tejgaon",
        from: "karwan_bazar",
        to: "tejgaon",
        cost: 4,
        modes: ["car", "rickshaw", "walk"],
      },
    ],
  },
};

const mockAnomalyResponse = {
  message: "Anomaly queued against the selected edges.",
  contract: {
    edge_ids: ["edge_karwan_bazar_tejgaon"],
    multiplier: 10,
  },
  reroute_summary: {
    affected_edge_ids: ["edge_karwan_bazar_tejgaon"],
    sessions_rerouted: 1,
    sessions: [],
  },
};

const state = {
  apiBase: localStorage.getItem("goli-api-base") || "",
  activeScenario: scenarios[0].id,
  activeTab: "route",
  mode: "demo",
  mapView: "graph", // "graph" | "live"
  routeResponse: mockRouteResponse,
  snapshotResponse: mockSnapshotResponse,
  anomalyResponse: mockAnomalyResponse,
};

const elements = {
  apiBase: document.getElementById("apiBase"),
  saveApiBase: document.getElementById("saveApiBase"),
  connectApi: document.getElementById("connectApi"),
  connectionState: document.getElementById("connectionState"),
  heroMetrics: document.getElementById("heroMetrics"),
  scenarioStack: document.getElementById("scenarioStack"),
  startNode: document.getElementById("startNode"),
  destinationNode: document.getElementById("destinationNode"),
  sessionId: document.getElementById("sessionId"),
  modeChips: document.getElementById("modeChips"),
  routeForm: document.getElementById("routeForm"),
  resetScenario: document.getElementById("resetScenario"),
  runRoute: document.getElementById("runRoute"),
  loadSnapshot: document.getElementById("loadSnapshot"),
  triggerAnomaly: document.getElementById("triggerAnomaly"),
  networkMap: document.getElementById("networkMap"),
  liveMap: document.getElementById("liveMap"),
  mapViewToggle: document.getElementById("mapViewToggle"),
  routeStrip: document.getElementById("routeStrip"),
  routeSummary: document.getElementById("routeSummary"),
  responseConsole: document.getElementById("responseConsole"),
  responseStatus: document.getElementById("responseStatus"),
  tabRow: document.querySelector(".tab-row"),
};

const getActiveScenario = () => scenarios.find((scenario) => scenario.id === state.activeScenario);

const setConnectionMode = (online) => {
  state.mode = online ? "connected" : "demo";
  elements.connectionState.textContent = online ? "Connected to API" : "Offline demo";
  elements.responseStatus.textContent = online ? "Live API" : "Demo data";
};

const readSelectedModes = () =>
  [...elements.modeChips.querySelectorAll("input[type='checkbox']:checked")].map((input) => input.value);

const prettyJson = (value) => JSON.stringify(value, null, 2);

const fallback = (value, backup) => {
  if (value === undefined || value === null) {
    return backup;
  }
  return value;
};

const renderMetrics = () => {
  const route = state.routeResponse?.data ?? {};
  const metrics = [
    { label: "Nodes in sim graph", value: "30+", note: "Dense Dhaka-style coverage" },
    {
      label: "Selected modes",
      value: (route.selected_modes || ["car", "rickshaw", "walk"]).length,
      note: "Switches only at transfer nodes",
    },
    {
      label: "Route cost",
      value: fallback(route.total_cost, 20),
      note: "Penalty-aware shortest path",
    },
  ];

  elements.heroMetrics.innerHTML = metrics
    .map(
      (metric) => `
        <article class="metric">
          <span>${metric.label}</span>
          <strong>${metric.value}</strong>
          <span>${metric.note}</span>
        </article>
      `
    )
    .join("");
};

const renderScenarios = () => {
  const active = getActiveScenario();

  elements.scenarioStack.innerHTML = scenarios
    .map(
      (scenario) => `
        <button class="scenario-card ${scenario.id === active.id ? "active" : ""}" data-scenario="${scenario.id}">
          <span class="eyebrow">Scenario</span>
          <strong>${scenario.title}</strong>
          <p>${scenario.note}</p>
        </button>
      `
    )
    .join("");

  elements.scenarioStack.querySelectorAll("[data-scenario]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeScenario = button.dataset.scenario;
      applyScenarioToForm();
      renderAll();
    });
  });
};

const renderNodeSelects = () => {
  const nodes = Object.entries(nodePositions).map(([id, node]) => ({ id, label: node.label }));

  const options = nodes
    .map((node) => `<option value="${node.id}">${node.label}</option>`)
    .join("");

  elements.startNode.innerHTML = options;
  elements.destinationNode.innerHTML = options;
};

const renderModeChips = () => {
  elements.modeChips.innerHTML = modeOptions
    .map(
      (mode) => `
        <label class="chip">
          <input type="checkbox" value="${mode.id}" checked />
          <span>${mode.label}</span>
        </label>
      `
    )
    .join("");
};

const applyScenarioToForm = () => {
  const scenario = getActiveScenario();
  elements.startNode.value = scenario.start;
  elements.destinationNode.value = scenario.destination;
  elements.sessionId.value = scenario.id;

  elements.modeChips.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.checked = scenario.modes.includes(input.value);
  });
};

const loadApiBaseFromInput = () => {
  const value = elements.apiBase.value.trim();
  state.apiBase = value.replace(/\/+$/, "");
  localStorage.setItem("goli-api-base", state.apiBase);
  return state.apiBase;
};

const apiUrl = (path) => {
  const base = state.apiBase || "";
  return `${base}${path}`;
};

const requestJson = async (path, options = {}) => {
  const response = await fetch(apiUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    const message = payload?.message || payload?.error || `Request failed with ${response.status}`;
    throw new Error(message);
  }

  return payload;
};

const computeRoutePayload = () => ({
  session_id: elements.sessionId.value.trim() || undefined,
  start: elements.startNode.value,
  destination: elements.destinationNode.value,
  allowed_modes: readSelectedModes(),
});

const routeNodes = () => state.routeResponse?.data?.path || mockRouteResponse.data.path;

const renderMap = () => {
  const width = 1000;
  const height = 720;
  const activeNodes = new Set(routeNodes());
  const pathPairs = new Set();
  const path = routeNodes();
  for (let index = 0; index < path.length - 1; index += 1) {
    pathPairs.add(`${path[index]}:${path[index + 1]}`);
    pathPairs.add(`${path[index + 1]}:${path[index]}`);
  }

  const edgeMarkup = graphEdges
    .map(([from, to]) => {
      const start = nodePositions[from];
      const end = nodePositions[to];
      const x1 = (start.x / 100) * width;
      const y1 = (start.y / 100) * height;
      const x2 = (end.x / 100) * width;
      const y2 = (end.y / 100) * height;
      const highlighted = pathPairs.has(`${from}:${to}`);
      return `
        <line
          x1="${x1}"
          y1="${y1}"
          x2="${x2}"
          y2="${y2}"
          class="${highlighted ? "edge-highlight" : "edge-base"}"
        />
      `;
    })
    .join("");

  const nodeMarkup = Object.entries(nodePositions)
    .map(([id, node]) => {
      const x = (node.x / 100) * width;
      const y = (node.y / 100) * height;
      const active = activeNodes.has(id) ? "node-active" : "";
      const labelAnchor = node.x > 70 ? "end" : node.x < 30 ? "start" : "middle";
      const labelX = node.x > 70 ? x - 14 : node.x < 30 ? x + 14 : x;
      const labelY = y - 18;

      return `
        <g class="${active}" transform="translate(${x} ${y})">
          <circle r="18" class="node-ring"></circle>
          <circle r="10" class="node-core"></circle>
          <circle r="3.2" fill="#eff6ff"></circle>
          <text x="${labelX - x}" y="${labelY - y}" text-anchor="${labelAnchor}" class="node-label">${node.label}</text>
          <text x="${labelX - x}" y="${labelY - y + 20}" text-anchor="${labelAnchor}" class="node-tag">${
            id.replace(/_/g, " ")
          }</text>
        </g>
      `;
    })
    .join("");

  const gridLines = Array.from({ length: 10 }, (_, index) => {
    const x = ((index + 1) / 11) * width;
    const y = ((index + 1) / 11) * height;
    return `
      <line x1="${x}" y1="0" x2="${x}" y2="${height}" />
      <line x1="0" y1="${y}" x2="${width}" y2="${y}" />
    `;
  }).join("");

  elements.networkMap.innerHTML = `
    <defs>
      <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#58d6ff" />
        <stop offset="100%" stop-color="#ffb86b" />
      </linearGradient>
    </defs>
    <g class="ghost-grid">${gridLines}</g>
    <g opacity="0.55">${edgeMarkup}</g>
    <g>${nodeMarkup}</g>
    <line class="scanline" x1="40" y1="${height - 42}" x2="${width - 40}" y2="${height - 42}"></line>
  `;
};

const renderRouteStrip = () => {
  const path = routeNodes();
  elements.routeStrip.innerHTML = path
    .map(
      (node, index) => `
        <div class="route-node ${index === 0 || index === path.length - 1 ? "active" : ""}">
          <span></span>
          <strong>${nodePositions[node]?.label || node}</strong>
        </div>
      `
    )
    .join("");
};

const renderSummary = () => {
  const route = state.routeResponse?.data || {};
  const summary = [
    {
      label: "Session",
      value: route.session_id || "demo-session",
      detail: `${fallback(route.path?.length, 6)} hops visualized`,
    },
    {
      label: "Cost",
      value: fallback(route.total_cost, 20),
      detail: `Switches: ${fallback(route.switches, 0)}`,
    },
    {
      label: "Modes",
      value: (route.selected_modes || ["car"]).join(" / "),
      detail: route.justification?.summary || "Penalty-aware shortest route",
    },
  ];

  elements.routeSummary.innerHTML = summary
    .map(
      (item) => `
        <article class="summary-card">
          <small>${item.label}</small>
          <strong>${item.value}</strong>
          <div class="summary-inline">
            <span class="pill">${item.detail}</span>
          </div>
        </article>
      `
    )
    .join("");
};

const renderConsole = () => {
  const content = {
    route: state.routeResponse,
    snapshot: state.snapshotResponse,
    anomaly: state.anomalyResponse,
  };
  elements.responseConsole.textContent = prettyJson(content[state.activeTab]);
  elements.responseStatus.textContent =
    state.activeTab === "route" ? "Route response" : state.activeTab === "snapshot" ? "Graph snapshot" : "Anomaly result";
};

const renderTabs = () => {
  document.querySelectorAll(".tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === state.activeTab);
  });
};

const renderAll = () => {
  renderMetrics();
  renderScenarios();
  renderMap();
  renderRouteStrip();
  renderSummary();
  renderConsole();
  renderTabs();
};

const applyMockRoute = () => {
  const scenario = getActiveScenario();
  state.routeResponse = {
    data: {
      ...mockRouteResponse.data,
      session_id: elements.sessionId.value.trim() || scenario.id,
      start: elements.startNode.value,
      destination: elements.destinationNode.value,
      allowed_modes: readSelectedModes(),
      selected_modes: readSelectedModes().slice(0, 1),
      path:
        scenario.id === "motijheel-banani"
          ? ["motijheel", "shahbagh", "panthapath", "green_road", "karwan_bazar", "tejgaon", "mohakhali", "banani"]
          : scenario.id === "olddhaka-kuril"
          ? ["old_dhaka", "sadarghat", "motijheel", "shahbagh", "green_road", "farmgate", "karwan_bazar", "tejgaon", "mohakhali", "banani", "kuril"]
          : mockRouteResponse.data.path,
      nodes:
        scenario.id === "motijheel-banani"
          ? ["motijheel", "shahbagh", "panthapath", "green_road", "karwan_bazar", "tejgaon", "mohakhali", "banani"]
          : scenario.id === "olddhaka-kuril"
          ? ["old_dhaka", "sadarghat", "motijheel", "shahbagh", "green_road", "farmgate", "karwan_bazar", "tejgaon", "mohakhali", "banani", "kuril"]
          : mockRouteResponse.data.nodes,
      total_cost: scenario.id === "motijheel-banani" ? 26 : scenario.id === "olddhaka-kuril" ? 34 : 20,
      switches: scenario.id === "motijheel-banani" ? 1 : scenario.id === "olddhaka-kuril" ? 2 : 0,
      computation_time_ms: scenario.id === "olddhaka-kuril" ? 7 : 4,
      selected_modes:
        scenario.id === "motijheel-banani" ? ["rickshaw", "walk"] : scenario.id === "olddhaka-kuril" ? ["car", "walk"] : ["car"],
      justification: {
        summary: scenario.note,
        mode_switches: scenario.id === "olddhaka-kuril" ? 2 : scenario.id === "motijheel-banani" ? 1 : 0,
        mode_switch_penalty_applied: scenario.id === "olddhaka-kuril" ? 6 : scenario.id === "motijheel-banani" ? 3 : 0,
        note: "Mocked locally to keep the design working even when the API is offline.",
      },
      session_saved: true,
    },
  };
};

const fetchRoute = async () => {
  loadApiBaseFromInput();
  const payload = computeRoutePayload();
  try {
    const response = await requestJson("/api/route", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    state.routeResponse = response;
    setConnectionMode(true);
    state.activeTab = "route";
  } catch (error) {
    applyMockRoute();
    setConnectionMode(false);
    state.activeTab = "route";
    state.anomalyResponse = {
      message: error.message,
      contract: payload,
      reroute_summary: { affected_edge_ids: [], sessions_rerouted: 0, sessions: [] },
    };
  }
  renderAll();
};

const fetchSnapshot = async () => {
  loadApiBaseFromInput();
  try {
    const response = await requestJson("/api/graph/snapshot");
    state.snapshotResponse = response;
    setConnectionMode(true);
    state.activeTab = "snapshot";
  } catch (error) {
    state.snapshotResponse = mockSnapshotResponse;
    setConnectionMode(false);
    state.activeTab = "snapshot";
    state.anomalyResponse = {
      message: error.message,
      contract: { edge_ids: ["edge_karwan_bazar_tejgaon"], multiplier: 10 },
      reroute_summary: { affected_edge_ids: ["edge_karwan_bazar_tejgaon"], sessions_rerouted: 1, sessions: [] },
    };
  }
  renderAll();
};

const triggerAnomaly = async () => {
  loadApiBaseFromInput();
  const payload = {
    edge_ids: ["edge_karwan_bazar_tejgaon", "edge_tejgaon_banani"],
    multiplier: 10,
  };

  try {
    const response = await requestJson("/api/anomaly", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    state.anomalyResponse = response;
    setConnectionMode(true);
    state.activeTab = "anomaly";
  } catch (error) {
    state.anomalyResponse = {
      message: error.message,
      contract: payload,
      reroute_summary: {
        affected_edge_ids: payload.edge_ids,
        sessions_rerouted: 1,
        sessions: [],
      },
    };
    setConnectionMode(false);
    state.activeTab = "anomaly";
  }
  renderAll();
};

/* ------------------------------------------------------------------ */
/* Leaflet live map integration                                        */
/* ------------------------------------------------------------------ */

const DHAKA_CENTER = [23.7925, 90.4071]; // Leaflet uses [lat, lng]
const LEAFLET_VERSION = "1.9.4";

let leafletMapInstance = null;
let leafletLoadPromise = null;

const loadLeafletSdk = () => {
  if (window.L) {
    return Promise.resolve();
  }

  if (leafletLoadPromise) {
    return leafletLoadPromise;
  }

  leafletLoadPromise = (async () => {
    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
    document.head.appendChild(cssLink);

    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Failed to load Leaflet script"));
      document.head.appendChild(script);
    });
  })();

  return leafletLoadPromise;
};

const initLeafletMap = async () => {
  if (leafletMapInstance) {
    // Map already initialized -- just make sure it redraws for the now-visible container.
    setTimeout(() => leafletMapInstance.invalidateSize(), 0);
    return;
  }

  try {
    await loadLeafletSdk();
  } catch (error) {
    elements.liveMap.innerHTML = `<div class="live-map-error">Live map unavailable: ${error.message}</div>`;
    return;
  }

  leafletMapInstance = window.L.map("liveMap", {
    center: DHAKA_CENTER,
    zoom: 13,
  });

  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(leafletMapInstance);
};

const setMapView = (view) => {
  state.mapView = view;

  elements.networkMap.style.display = view === "graph" ? "block" : "none";
  elements.liveMap.style.display = view === "live" ? "block" : "none";

  elements.mapViewToggle.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  if (view === "live") {
    initLeafletMap();
  }
};

const attachEvents = () => {
  elements.apiBase.value = state.apiBase;

  elements.saveApiBase.addEventListener("click", () => {
    loadApiBaseFromInput();
    setConnectionMode(Boolean(state.apiBase));
  });

  elements.connectApi.addEventListener("click", async () => {
    loadApiBaseFromInput();
    if (!state.apiBase) {
      setConnectionMode(false);
      return;
    }
    await fetchSnapshot();
  });

  elements.routeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await fetchRoute();
  });

  elements.resetScenario.addEventListener("click", () => {
    state.activeScenario = scenarios[0].id;
    state.routeResponse = mockRouteResponse;
    state.snapshotResponse = mockSnapshotResponse;
    state.anomalyResponse = mockAnomalyResponse;
    applyScenarioToForm();
    renderAll();
  });

  elements.runRoute.addEventListener("click", async () => {
    await fetchRoute();
  });

  elements.loadSnapshot.addEventListener("click", async () => {
    await fetchSnapshot();
  });

  elements.triggerAnomaly.addEventListener("click", async () => {
    await triggerAnomaly();
  });

  elements.tabRow.addEventListener("click", (event) => {
    const button = event.target.closest(".tab");
    if (!button) {
      return;
    }
    state.activeTab = button.dataset.tab;
    renderTabs();
    renderConsole();
  });

  if (elements.mapViewToggle) {
    elements.mapViewToggle.addEventListener("click", (event) => {
      const button = event.target.closest("[data-view]");
      if (!button) {
        return;
      }
      setMapView(button.dataset.view);
    });
  }
};

const init = () => {
  renderNodeSelects();
  renderModeChips();
  applyScenarioToForm();
  attachEvents();
  setConnectionMode(Boolean(state.apiBase));
  applyMockRoute();
  renderAll();
};

init();