import { useEffect, useState } from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link } from '@inertiajs/react';
import LiveMapCanvas from '@/Components/LiveMap/LiveMapCanvas';
import RoutePlannerForm from '@/Components/LiveMap/RoutePlannerForm';
import JourneySteps from '@/Components/LiveMap/JourneySteps';
import RouteInsights from '@/Components/LiveMap/RouteInsights';
import { preferenceGuide } from '@/lib/routeNarration';

function StatCard({ label, value, detail }) {
    return (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
            <div className="text-[0.68rem] uppercase tracking-[0.28em] text-slate-400">{label}</div>
            <div className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</div>
            <div className="mt-2 text-sm leading-6 text-slate-300">{detail}</div>
        </div>
    );
}

function FeatureCard({ eyebrow, title, description }) {
    return (
        <article className="group rounded-[28px] border border-white/10 bg-slate-950/60 p-6 shadow-[0_24px_90px_rgba(2,6,23,0.4)] transition-transform duration-300 hover:-translate-y-1">
            <div className="text-[0.7rem] uppercase tracking-[0.3em] text-cyan-200/70">{eyebrow}</div>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">{title}</h3>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-300">{description}</p>
        </article>
    );
}

const DEFAULT_START = 'farmgate';
const DEFAULT_DESTINATION = 'gulshan_2';
const ANOMALY_EDGE_IDS = ['edge_karwan_bazar_tejgaon', 'edge_tejgaon_banani'];

const featureCards = [
    {
        eyebrow: 'Fast routing',
        title: 'See a route in motion',
        description: 'The homepage exposes the backend graph visually, so the route planner feels alive instead of buried behind forms.',
    },
    {
        eyebrow: 'Mode aware',
        title: 'Car, rickshaw, and walk',
        description: 'The planner shows how the system chooses travel modes and where it can switch between them.',
    },
    {
        eyebrow: 'Live traffic',
        title: 'Real streets, real congestion',
        description: 'The map underneath the graph is a real TomTom map with a live traffic flow layer, not a static diagram.',
    },
];

export default function Welcome({ auth, laravelVersion, phpVersion }) {
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
        // Runs once on mount to load the live graph and a default route.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleModeToggle(mode) {
        setAllowedModes((previous) => (previous.includes(mode) ? previous.filter((item) => item !== mode) : [...previous, mode]));
    }

    function handlePreferenceChange(value) {
        setPreference(value);
    }

    function handleSubmit() {
        if (!allowedModes.length) {
            setPlannerState('Select at least one travel mode');
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
        { label: 'Stations', value: meta.node_count ?? '-', detail: 'Mapped across the transit graph' },
        { label: 'Connections', value: meta.edge_count ?? '-', detail: 'Weighted links between hubs' },
        { label: 'Goli edges', value: meta.goli_edge_count ?? '-', detail: 'Highlighted corridor segments' },
        { label: 'Overpasses', value: meta.overpass_node_count ?? '-', detail: 'Transfer-ready nodes in the map' },
    ];

    return (
        <>
            <Head title="GoliTransit" />
            <div className="relative min-h-screen overflow-hidden bg-[#050816] text-slate-100">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(251,146,60,0.16),_transparent_28%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.14),_transparent_26%)]" />
                <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:72px_72px]" />
                <div className="absolute left-[-120px] top-24 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
                <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />

                <header className="relative z-10 mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between lg:p-5">
                        <div className="flex items-center gap-4">
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 shadow-[0_12px_30px_rgba(2,6,23,0.3)]">
                                <ApplicationLogo className="h-10 w-10 text-cyan-200" />
                            </div>
                            <div>
                                <p className="text-[0.7rem] uppercase tracking-[0.38em] text-cyan-200/70">GoliTransit</p>
                                <h1 className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-2xl">
                                    Dhaka routing, but cinematic.
                                </h1>
                                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
                                    A polished front end for transit planning, live traffic, and graph-aware demos.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href="/control-room"
                                className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                            >
                                Control room
                            </Link>
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-semibold text-cyan-50 transition hover:-translate-y-0.5 hover:bg-cyan-300/15"
                                >
                                    Open dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="inline-flex items-center rounded-full bg-gradient-to-r from-cyan-400 to-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
                                    >
                                        Create account
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
                    <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_30px_120px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8 lg:p-10">
                        <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-cyan-100">
                            Transit intelligence dashboard
                        </div>
                        <h2 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                            Know what to ride next to reach your destination.
                        </h2>
                        <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                            This homepage is wired to your Laravel graph in real time: live traffic, live route planning,
                            and live anomaly rerouting on a real TomTom map.
                        </p>

                        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {graphStats.map((item) => (
                                <StatCard key={item.label} label={item.label} value={item.value} detail={item.detail} />
                            ))}
                        </div>
                    </section>

                    <section className="mt-6 grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
                        <RoutePlannerForm
                            nodes={graph.nodes}
                            start={start}
                            destination={destination}
                            sessionId={sessionId}
                            allowedModes={allowedModes}
                            preference={preference}
                            preferenceHint={preferenceGuide(preference)}
                            plannerState={plannerState}
                            onStartChange={setStart}
                            onDestinationChange={setDestination}
                            onSessionIdChange={setSessionId}
                            onModeToggle={handleModeToggle}
                            onPreferenceChange={handlePreferenceChange}
                            onSubmit={handleSubmit}
                            onReset={handleReset}
                        />

                        <div className="rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_30px_120px_rgba(2,6,23,0.45)] backdrop-blur-xl">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-[0.7rem] uppercase tracking-[0.32em] text-slate-400">Network proof</p>
                                    <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">
                                        Real streets, live traffic, and your current route
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSimulateDisruption}
                                    className="inline-flex items-center rounded-full border border-rose-300/20 bg-rose-300/10 px-5 py-2.5 text-sm font-semibold text-rose-100 transition hover:-translate-y-0.5 hover:bg-rose-300/15"
                                >
                                    Simulate disruption
                                </button>
                            </div>

                            <div className="mt-5 overflow-hidden rounded-[28px] border border-white/10">
                                <LiveMapCanvas graph={graph} route={currentRoute} />
                            </div>

                            <div className="mt-4 rounded-2xl border border-amber-300/10 bg-amber-300/5 p-4">
                                <strong className="block text-sm text-white">{mapAlert.title}</strong>
                                <p className="mt-1 text-sm leading-6 text-slate-400">{mapAlert.body}</p>
                            </div>
                        </div>
                    </section>

                    <section className="mt-6">
                        <JourneySteps route={currentRoute} nodes={graph.nodes} />
                    </section>

                    <section className="mt-6">
                        <RouteInsights route={currentRoute} previousRoute={previousRoute} preference={preference} nodes={graph.nodes} />
                    </section>

                    <section className="mt-6 grid gap-6 lg:grid-cols-3">
                        {featureCards.map((card) => (
                            <FeatureCard key={card.title} eyebrow={card.eyebrow} title={card.title} description={card.description} />
                        ))}
                    </section>

                    <section className="mt-6 grid gap-6 lg:grid-cols-2">
                        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                            <div className="text-[0.68rem] uppercase tracking-[0.26em] text-slate-400">Backend version</div>
                            <div className="mt-2 text-lg font-semibold text-white">Laravel {laravelVersion}</div>
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                            <div className="text-[0.68rem] uppercase tracking-[0.26em] text-slate-400">Runtime</div>
                            <div className="mt-2 text-lg font-semibold text-white">PHP {phpVersion}</div>
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
