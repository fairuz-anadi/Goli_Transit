import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LiveMapCanvas from '@shared/Components/LiveMap/LiveMapCanvas';
import RoutePlannerForm, { USER_LOCATION_START } from '@shared/Components/LiveMap/RoutePlannerForm';
import JourneySteps from '@shared/Components/LiveMap/JourneySteps';
import RouteInsights from '@shared/Components/LiveMap/RouteInsights';
import { preferenceGuide } from '@shared/lib/routeNarration';
import PageHeader from '@app/components/PageHeader';
import BackendDown from '@app/components/BackendDown';
import useGraph from '@app/hooks/useGraph';
import { computeRoute } from '@app/api/client';
import { saveTrip } from '@app/lib/recentTrips';

const DEFAULT_START = 'farmgate';
const DEFAULT_DESTINATION = 'gulshan_2';
const STALE_FIX_MS = 30_000;

function Tile({ label, value }) {
    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-3">
            <div className="text-[0.6rem] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
            <div className="mono mt-1 text-xl font-bold text-slate-900">{value}</div>
        </div>
    );
}

export default function Plan() {
    const { graph, state, error, reload } = useGraph();
    const [searchParams, setSearchParams] = useSearchParams();

    const [start, setStart] = useState(searchParams.get('from') ?? DEFAULT_START);
    const [destination, setDestination] = useState(searchParams.get('to') ?? DEFAULT_DESTINATION);
    const [sessionId, setSessionId] = useState('traveler-trip');
    const [allowedModes, setAllowedModes] = useState(['car', 'rickshaw', 'walk']);
    const [preference, setPreference] = useState('fastest');

    const [route, setRoute] = useState(null);
    const [previousRoute, setPreviousRoute] = useState(null);
    const [plannerState, setPlannerState] = useState('Ready');
    const [userLocation, setUserLocation] = useState(null);
    const mapRef = useRef(null);

    // Only auto-plan once, when the graph first arrives.
    const autoPlanned = useRef(false);

    const displayGraph = useMemo(() => {
        const startNode = route?.resolved_start_node;
        if (!startNode) return graph;
        return {
            nodes: [...graph.nodes, startNode],
            edges: [...graph.edges, ...(route?.resolved_start_edges ?? [])],
        };
    }, [graph, route]);

    async function runRoute(payload) {
        setPlannerState('Computing route…');
        try {
            const result = await computeRoute(payload);
            setPreviousRoute(route);
            setRoute(result.data);
            setPlannerState('Trip loaded');

            if (payload.start !== USER_LOCATION_START) {
                saveTrip({
                    start: payload.start,
                    destination: payload.destination,
                    modes: payload.allowed_modes,
                    totalCost: result.data?.total_cost ?? null,
                });
            }
        } catch (failure) {
            setPlannerState(failure.message.includes('reach the GoliTransit backend') ? 'Backend unavailable' : 'Route unavailable');
        }
    }

    useEffect(() => {
        if (state !== 'ready' || autoPlanned.current || !graph.nodes.length) return;
        autoPlanned.current = true;

        const resolvedStart = graph.nodes.find((n) => n.id === start)?.id ?? graph.nodes[0].id;
        const resolvedDestination =
            graph.nodes.find((n) => n.id === destination)?.id ?? graph.nodes[graph.nodes.length - 1].id;

        setStart(resolvedStart);
        setDestination(resolvedDestination);
        runRoute({
            session_id: sessionId,
            start: resolvedStart,
            destination: resolvedDestination,
            allowed_modes: allowedModes,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state, graph.nodes]);

    // Keep the URL shareable.
    useEffect(() => {
        if (start === USER_LOCATION_START) return;
        setSearchParams({ from: start, to: destination }, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [start, destination]);

    async function handleSubmit() {
        if (!allowedModes.length) {
            setPlannerState('Select at least one travel mode');
            return;
        }

        if (start === USER_LOCATION_START) {
            if (!userLocation) {
                setPlannerState('Waiting for a location fix…');
                return;
            }

            let fix = userLocation;
            if (Date.now() - fix.timestamp > STALE_FIX_MS) {
                setPlannerState('Refreshing your location…');
                try {
                    fix = await mapRef.current?.requestFreshFix();
                    setUserLocation(fix);
                } catch (failure) {
                    setPlannerState('Could not refresh your location');
                    return;
                }
            }

            runRoute({
                session_id: sessionId || undefined,
                start: USER_LOCATION_START,
                start_lat: fix.lat,
                start_lng: fix.lng,
                destination,
                allowed_modes: allowedModes,
            });
            return;
        }

        runRoute({ session_id: sessionId || undefined, start, destination, allowed_modes: allowedModes });
    }

    function handleReset() {
        setStart(DEFAULT_START);
        setDestination(DEFAULT_DESTINATION);
        setAllowedModes(['car', 'rickshaw', 'walk']);
        runRoute({
            session_id: sessionId,
            start: DEFAULT_START,
            destination: DEFAULT_DESTINATION,
            allowed_modes: ['car', 'rickshaw', 'walk'],
        });
    }

    function swap() {
        setStart(destination);
        setDestination(start);
    }

    if (state === 'error') {
        return (
            <>
                <PageHeader eyebrow="Plan a trip" heading="Plan your journey" />
                <div className="px-5 py-12 sm:px-8">
                    <BackendDown error={error} onRetry={reload} />
                </div>
            </>
        );
    }

    return (
        <>
            <PageHeader
                eyebrow="Plan a trip"
                heading="Plan your journey"
                description="Pick where you are and where you're going. We'll compare car, rickshaw, and walking across the whole network — including the alleys."
                actions={
                    <button
                        type="button"
                        onClick={swap}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                    >
                        ⇅ Swap start and destination
                    </button>
                }
            />

            <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
                    <div>
                        <RoutePlannerForm
                            nodes={graph.nodes}
                            start={start}
                            destination={destination}
                            sessionId={sessionId}
                            allowedModes={allowedModes}
                            preference={preference}
                            preferenceHint={preferenceGuide(preference)}
                            plannerState={plannerState}
                            userLocationReady={Boolean(userLocation)}
                            onStartChange={setStart}
                            onDestinationChange={setDestination}
                            onSessionIdChange={setSessionId}
                            onModeToggle={(mode) =>
                                setAllowedModes((prev) =>
                                    prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode],
                                )
                            }
                            onPreferenceChange={setPreference}
                            onSubmit={handleSubmit}
                            onReset={handleReset}
                        />
                    </div>

                    <div className="grid gap-6">
                        {route ? (
                            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="mb-5 flex items-center gap-2.5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-emerald-600">Route found</p>
                                        <p className="text-sm font-bold text-slate-900">Trip summary</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <Tile label="Total cost" value={route.total_cost?.toFixed?.(1) ?? route.total_cost ?? '—'} />
                                    <Tile label="Switches" value={route.switches ?? 0} />
                                    <Tile label="Stops" value={route.path?.length ?? '—'} />
                                    <Tile label="Segments" value={route.segments?.length ?? '—'} />
                                </div>
                            </div>
                        ) : (
                            <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-[28px] border border-dashed border-slate-200 bg-slate-50/40 p-6 text-center">
                                <p className="text-sm font-semibold text-slate-500">Your trip summary will appear here</p>
                                <p className="max-w-xs text-xs leading-5 text-slate-400">
                                    Choose a start and destination, then plan the route.
                                </p>
                            </div>
                        )}

                        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
                            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400" />
                            <div className="h-[460px] sm:h-[560px]">
                                <LiveMapCanvas
                                    ref={mapRef}
                                    graph={displayGraph}
                                    route={route}
                                    onLocationFix={setUserLocation}
                                    className="h-full rounded-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <section className="mt-6">
                    <RouteInsights route={route} previousRoute={previousRoute} preference={preference} nodes={displayGraph.nodes} />
                </section>

                <section className="mt-6">
                    <JourneySteps route={route} nodes={displayGraph.nodes} />
                </section>
            </div>
        </>
    );
}
