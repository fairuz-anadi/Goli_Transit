import { useEffect, useMemo, useRef, useState } from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link } from '@inertiajs/react';
import LiveMapCanvas from '@/Components/LiveMap/LiveMapCanvas';
import RoutePlannerForm, { USER_LOCATION_START } from '@/Components/LiveMap/RoutePlannerForm';
import JourneySteps from '@/Components/LiveMap/JourneySteps';
import RouteInsights from '@/Components/LiveMap/RouteInsights';
import { preferenceGuide } from '@/lib/routeNarration';

const STAT_ACCENTS = {
    cyan: 'from-cyan-50 to-cyan-100 text-cyan-600',
    emerald: 'from-emerald-50 to-emerald-100 text-emerald-600',
    amber: 'from-amber-50 to-amber-100 text-amber-600',
    violet: 'from-violet-50 to-violet-100 text-violet-600',
};

function StatCard({ label, value, detail, icon, accent = 'cyan' }) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm">
            <div className="flex items-start justify-between gap-2">
                <div className="text-[0.65rem] uppercase tracking-[0.28em] text-slate-500 font-semibold">{label}</div>
                <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br transition-transform duration-300 group-hover:scale-110 ${STAT_ACCENTS[accent]}`}>
                    {icon}
                </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</div>
            <div className="mt-1 text-xs leading-5 text-slate-500">{detail}</div>
        </div>
    );
}

const LEGEND_DOTS = {
    cyan: 'bg-cyan-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
};

function LegendDot({ color, label }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-wide text-slate-500">
            <span className={`h-1.5 w-1.5 rounded-full ${LEGEND_DOTS[color]}`} />
            {label}
        </span>
    );
}

function RadarGraphic() {
    return (
        <div className="relative hidden h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-200/70 bg-white shadow-inner sm:flex">
            <div className="absolute inset-2 rounded-full border border-cyan-100" />
            <div
                className="absolute inset-0 animate-spin [background:conic-gradient(from_0deg,rgba(6,182,212,0)_0deg,rgba(6,182,212,0.4)_60deg,rgba(6,182,212,0)_130deg)]"
                style={{ animationDuration: '3s' }}
            />
            <span className="absolute left-4 top-3.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="absolute bottom-4 right-3.5 h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" style={{ animationDelay: '0.6s' }} />
            <span className="relative h-1.5 w-1.5 rounded-full bg-slate-300" />
        </div>
    );
}

const DEFAULT_START = 'farmgate';
const DEFAULT_DESTINATION = 'gulshan_2';
const ANOMALY_EDGE_IDS = ['edge_karwan_bazar_tejgaon', 'edge_tejgaon_banani'];

export default function Welcome({ laravelVersion, phpVersion }) {
    const [graph, setGraph] = useState({ nodes: [], edges: [] });
    const [meta, setMeta] = useState({});
    const [currentRoute, setCurrentRoute] = useState(null);
    const [previousRoute, setPreviousRoute] = useState(null);
    const [start, setStart] = useState(DEFAULT_START);
    const [destination, setDestination] = useState(DEFAULT_DESTINATION);
    const [sessionId, setSessionId] = useState('traveler-demo-route');
    const [allowedModes, setAllowedModes] = useState(['car', 'rickshaw', 'walk']);
    const [preference, setPreference] = useState('fastest');
    const [plannerState, setPlannerState] = useState('Loading live route planner...');
    const [mapAlert, setMapAlert] = useState({
        title: 'No disruption is active right now',
        body: 'If road pressure changes, this area will explain which corridor was affected and how the route responded.',
    });
    const [userLocation, setUserLocation] = useState(null);
    const liveMapCanvasRef = useRef(null);

    const userLocationReady = Boolean(userLocation);

    const displayGraph = useMemo(() => {
        const startNode = currentRoute?.resolved_start_node;
        const startEdges = currentRoute?.resolved_start_edges;

        if (!startNode) return graph;

        return {
            nodes: [...graph.nodes, startNode],
            edges: [...graph.edges, ...(startEdges ?? [])],
        };
    }, [graph, currentRoute]);

    function runRouteWith(payload) {
        setPlannerState('Computing route...');

        fetch('/api/route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(payload),
        })
            .then(async (response) => {
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || `Route request failed (${response.status})`);
                setPreviousRoute(currentRoute);
                setCurrentRoute(result.data);
                setPlannerState('Trip loaded');
            })
            .catch(() => setPlannerState('Route unavailable'));
    }

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const response = await fetch('/api/graph/snapshot', { headers: { Accept: 'application/json' } });
                const snapshot = await response.json();
                if (cancelled) return;

                const nodes = snapshot.data?.nodes ?? [];
                const edges = snapshot.data?.edges ?? [];
                setGraph({ nodes, edges });
                setMeta(snapshot.meta ?? {});

                const defaultStart = nodes.find((node) => node.id === DEFAULT_START)?.id ?? nodes[0]?.id;
                const defaultDestination = nodes.find((node) => node.id === DEFAULT_DESTINATION)?.id ?? nodes[nodes.length - 1]?.id;

                if (defaultStart) setStart(defaultStart);
                if (defaultDestination) setDestination(defaultDestination);

                if (defaultStart && defaultDestination) {
                    runRouteWith({
                        session_id: sessionId,
                        start: defaultStart,
                        destination: defaultDestination,
                        allowed_modes: allowedModes,
                    });
                }
            } catch (error) {
                setPlannerState('Live graph unavailable');
            }
        })();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleModeToggle(mode) {
        setAllowedModes((previous) => (previous.includes(mode) ? previous.filter((item) => item !== mode) : [...previous, mode]));
    }

    function handlePreferenceChange(value) {
        setPreference(value);
    }

    const STALE_FIX_MS = 30_000;

    async function handleSubmit() {
        if (!allowedModes.length) {
            setPlannerState('Select at least one travel mode');
            return;
        }

        if (start === USER_LOCATION_START) {
            if (!userLocation) {
                setPlannerState('Waiting for a location fix...');
                return;
            }

            let fix = userLocation;

            if (Date.now() - fix.timestamp > STALE_FIX_MS) {
                setPlannerState('Refreshing your location...');
                try {
                    fix = await liveMapCanvasRef.current?.requestFreshFix();
                    setUserLocation(fix);
                } catch (error) {
                    setPlannerState('Could not refresh your location');
                    return;
                }
            }

            runRouteWith({
                session_id: sessionId || undefined,
                start: USER_LOCATION_START,
                start_lat: fix.lat,
                start_lng: fix.lng,
                destination,
                allowed_modes: allowedModes,
            });
            return;
        }

        runRouteWith({
            session_id: sessionId || undefined,
            start,
            destination,
            allowed_modes: allowedModes,
        });
    }

    function handleReset() {
        const resetStart = graph.nodes.find((node) => node.id === DEFAULT_START)?.id ?? start;
        const resetDestination = graph.nodes.find((node) => node.id === DEFAULT_DESTINATION)?.id ?? destination;
        const resetSessionId = 'traveler-demo-route';

        setStart(resetStart);
        setDestination(resetDestination);
        setSessionId(resetSessionId);
        runRouteWith({
            session_id: resetSessionId,
            start: resetStart,
            destination: resetDestination,
            allowed_modes: allowedModes,
        });
    }

    async function handleSimulateDisruption() {
        const activeEdges = (currentRoute?.segments ?? []).map((segment) => segment.edge_id).filter(Boolean).slice(0, 2);
        const edgeIds = activeEdges.length ? activeEdges : ANOMALY_EDGE_IDS;

        try {
            await fetch('/api/anomaly', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ edge_ids: edgeIds, multiplier: 8 }),
            });

            setMapAlert({
                title: 'A live disruption was simulated',
                body: `Pressure was added to ${edgeIds.join(', ')}. Re-planning now shows how the route reacts.`,
            });

            const snapshotResponse = await fetch('/api/graph/snapshot', { headers: { Accept: 'application/json' } });
            const snapshot = await snapshotResponse.json();
            setGraph(snapshot.data ?? graph);
            setMeta(snapshot.meta ?? meta);

            runRouteWith({ session_id: sessionId, start, destination, allowed_modes: allowedModes });
        } catch (error) {
            setMapAlert({
                title: 'Disruption simulation failed',
                body: 'The route could not be refreshed after simulating a live disruption.',
            });
        }
    }

    const graphStats = [
        {
            label: 'Stations',
            value: meta.node_count ?? '—',
            detail: 'Mapped across the transit graph',
            accent: 'cyan',
            icon: (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
        },
        {
            label: 'Connections',
            value: meta.edge_count ?? '—',
            detail: 'Weighted links between hubs',
            accent: 'emerald',
            icon: (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5" />
                </svg>
            ),
        },
        {
            label: 'Goli edges',
            value: meta.goli_edge_count ?? '—',
            detail: 'Highlighted corridor segments',
            accent: 'amber',
            icon: (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
        },
        {
            label: 'Overpasses',
            value: meta.overpass_node_count ?? '—',
            detail: 'Transfer-ready nodes',
            accent: 'violet',
            icon: (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />
                </svg>
            ),
        },
    ];

    return (
        <>
            <Head title="GoliTransit — Route Planner" />
            <div className="relative min-h-screen overflow-hidden bg-white text-slate-900">
                {/* Ambient gradient orbs */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-32 -right-24 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-cyan-100/50 to-transparent blur-3xl animate-float" />
                    <div className="absolute top-1/3 -left-32 h-[360px] w-[360px] rounded-full bg-gradient-to-tr from-emerald-100/40 to-transparent blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-gradient-to-t from-amber-50/50 to-transparent blur-3xl" />
                </div>

                {/* Subtle background texture */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.05),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(251,146,60,0.03),transparent_40%)]" />
                <div className="pointer-events-none absolute inset-0 opacity-[0.015] [background-image:linear-gradient(rgba(0,0,0,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.5)_1px,transparent_1px)] [background-size:64px_64px]" />

                {/* ── Navigation Bar ── */}
                <nav className="relative z-10 border-b border-slate-100 bg-white/80 backdrop-blur-xl animate-fade-in">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm group-hover:border-cyan-400/40 transition-colors">
                                <ApplicationLogo className="h-7 w-7 text-cyan-600" />
                            </div>
                            <div>
                                <div className="text-sm font-bold tracking-tight text-slate-900">GoliTransit</div>
                                <div className="text-[0.6rem] uppercase tracking-[0.22em] text-slate-400">Route Planner</div>
                            </div>
                        </Link>

                        <div className="flex items-center gap-2.5">
                            <Link
                                href="/"
                                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                            >
                                ← Home
                            </Link>
                            <Link
                                href="/control-room"
                                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                            >
                                Control Room
                            </Link>
                            <Link
                                href={route('dashboard')}
                                className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-semibold text-cyan-700 shadow-sm transition hover:bg-cyan-100/60"
                            >
                                Dashboard
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* ── Main Content ── */}
                <main className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-6 sm:px-8">

                    {/* Hero Banner with Stats */}
                    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 animate-fade-in-up">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3.5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-cyan-700">
                                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                                    Live transit intelligence
                                </div>
                                <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                    Know what to ride next.
                                </h2>
                                <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
                                    Plan routes across Dhaka's streets in real time — live routing, anomaly rerouting, and graph analysis on an interactive map.
                                </p>
                            </div>
                            <div className="flex items-center gap-4 self-start lg:self-end">
                                <RadarGraphic />
                                <button
                                    type="button"
                                    onClick={handleSimulateDisruption}
                                    className="group inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-5 py-2.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-100 hover:shadow-md"
                                >
                                    <svg className="h-3.5 w-3.5 group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    Simulate Disruption
                                </button>
                            </div>
                        </div>
                        <div className="mt-6 grid gap-3 grid-cols-2 xl:grid-cols-4">
                            {graphStats.map((item) => (
                                <StatCard key={item.label} label={item.label} value={item.value} detail={item.detail} icon={item.icon} accent={item.accent} />
                            ))}
                        </div>
                    </section>

                    {/* ── Trip Form + Route Summary ── */}
                    <section className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
                        {/* Left: Trip Form */}
                        <div className="animate-slide-in-left delay-200">
                            <RoutePlannerForm
                                nodes={graph.nodes}
                                start={start}
                                destination={destination}
                                sessionId={sessionId}
                                allowedModes={allowedModes}
                                preference={preference}
                                preferenceHint={preferenceGuide(preference)}
                                plannerState={plannerState}
                                userLocationReady={userLocationReady}
                                onStartChange={setStart}
                                onDestinationChange={setDestination}
                                onSessionIdChange={setSessionId}
                                onModeToggle={handleModeToggle}
                                onPreferenceChange={handlePreferenceChange}
                                onSubmit={handleSubmit}
                                onReset={handleReset}
                            />
                        </div>

                        {/* Right: Route Summary */}
                        <div className="animate-slide-in-right delay-200">
                            {currentRoute ? (
                                <div className="h-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm animate-scale-in">
                                    <div className="flex items-center gap-2.5 mb-5">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-[0.6rem] uppercase tracking-[0.24em] text-emerald-600 font-semibold">Route found</p>
                                            <p className="text-sm font-bold text-slate-900">Trip Summary</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-3">
                                            <div className="text-[0.6rem] uppercase tracking-wider text-slate-400 font-semibold">Total Cost</div>
                                            <div className="mt-1 text-xl font-bold text-slate-900 mono">{currentRoute.total_cost?.toFixed(1) ?? '—'}</div>
                                        </div>
                                        <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-3">
                                            <div className="text-[0.6rem] uppercase tracking-wider text-slate-400 font-semibold">Switches</div>
                                            <div className="mt-1 text-xl font-bold text-slate-900 mono">{currentRoute.switches ?? 0}</div>
                                        </div>
                                        <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-3">
                                            <div className="text-[0.6rem] uppercase tracking-wider text-slate-400 font-semibold">Stops</div>
                                            <div className="mt-1 text-xl font-bold text-slate-900 mono">{currentRoute.path?.length ?? '—'}</div>
                                        </div>
                                        <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-3">
                                            <div className="text-[0.6rem] uppercase tracking-wider text-slate-400 font-semibold">Segments</div>
                                            <div className="mt-1 text-xl font-bold text-slate-900 mono">{currentRoute.segments?.length ?? '—'}</div>
                                        </div>
                                    </div>

                                    {/* Modes Used */}
                                    {currentRoute.selected_modes && (
                                        <div className="mt-4 flex flex-wrap gap-1.5">
                                            {currentRoute.selected_modes.map((m) => (
                                                <span key={m} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wide border ${
                                                    m === 'car' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                                                    m === 'rickshaw' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    m === 'walk' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${
                                                        m === 'car' ? 'bg-cyan-500' :
                                                        m === 'rickshaw' ? 'bg-emerald-500' :
                                                        m === 'walk' ? 'bg-amber-500' : 'bg-slate-400'
                                                    }`} />
                                                    {m}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Path Preview */}
                                    {currentRoute.path && (
                                        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/40 px-3.5 py-2.5">
                                            <div className="text-[0.55rem] uppercase tracking-wider text-slate-400 font-semibold mb-1">Path</div>
                                            <p className="text-xs text-slate-600 leading-5 mono">
                                                {currentRoute.path.map((p, i) => (
                                                    <span key={i}>
                                                        {i > 0 && <span className="text-cyan-400 mx-0.5">→</span>}
                                                        <span className="text-slate-700">{displayGraph.nodes.find(n => n.id === p)?.name || p}</span>
                                                    </span>
                                                ))}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 rounded-[28px] border border-dashed border-slate-200 bg-slate-50/40 p-6 text-center">
                                    <RadarGraphic />
                                    <p className="text-sm font-semibold text-slate-500">Your trip summary will appear here</p>
                                    <p className="max-w-xs text-xs leading-5 text-slate-400">Pick a start and destination, then plan a route to see cost, switches, and mode breakdown.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ── Full-Width: Live Map ── */}
                    <section className="relative mt-6 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-lg shadow-slate-200/60 animate-fade-in-up delay-300">
                        {/* Accent top edge */}
                        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400" />

                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-6 py-5 sm:px-8">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 text-cyan-600 shadow-sm">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </div>
                                <div>
                                    <p className="text-[0.62rem] uppercase tracking-[0.26em] text-slate-500 font-semibold">Live map</p>
                                    <h3 className="text-base font-bold tracking-tight text-slate-900">Interactive Dhaka Network</h3>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="hidden items-center gap-3 rounded-full border border-slate-200 bg-white px-3.5 py-2 md:flex">
                                    <LegendDot color="cyan" label="Car" />
                                    <LegendDot color="emerald" label="Rickshaw" />
                                    <LegendDot color="amber" label="Walk" />
                                </div>
                                <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[0.62rem] uppercase tracking-wider text-emerald-700 font-semibold">Connected</span>
                                </div>
                            </div>
                        </div>

                        {/* Map surface */}
                        <div className="relative h-[70vh] min-h-[560px] max-h-[780px]">
                            <LiveMapCanvas
                                ref={liveMapCanvasRef}
                                graph={displayGraph}
                                route={currentRoute}
                                onLocationFix={setUserLocation}
                                className="h-full rounded-none"
                            />
                        </div>

                        {/* Alert Banner */}
                        <div className="flex items-start gap-3 border-t border-amber-100 bg-amber-50/50 px-6 py-4 transition-all duration-300 sm:px-8">
                            <span className="mt-0.5 text-amber-500 flex-shrink-0">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </span>
                            <div>
                                <strong className="block text-sm font-semibold text-amber-800">{mapAlert.title}</strong>
                                <p className="mt-0.5 text-xs leading-5 text-amber-700/80">{mapAlert.body}</p>
                            </div>
                        </div>
                    </section>

                    {/* ── Full-Width: Route Insights ── */}
                    <section className="mt-6 animate-fade-in-up delay-300">
                        <RouteInsights route={currentRoute} previousRoute={previousRoute} preference={preference} nodes={displayGraph.nodes} />
                    </section>

                    {/* ── Full-Width: Journey Steps ── */}
                    <section className="mt-6 animate-fade-in-up delay-400">
                        <JourneySteps route={currentRoute} nodes={displayGraph.nodes} />
                    </section>

                    {/* ── Footer bar ── */}
                    <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4">
                        <div className="flex items-center gap-3">
                            <ApplicationLogo className="h-4 w-4 text-slate-400" />
                            <span className="text-xs text-slate-400 font-medium">GoliTransit</span>
                            <span className="text-xs text-slate-300">·</span>
                            <span className="text-xs text-slate-400">Laravel {laravelVersion}</span>
                            <span className="text-xs text-slate-300">·</span>
                            <span className="text-xs text-slate-400">PHP {phpVersion}</span>
                        </div>
                        <span className="text-xs text-slate-400">© {new Date().getFullYear()}</span>
                    </footer>
                </main>
            </div>
        </>
    );
}
