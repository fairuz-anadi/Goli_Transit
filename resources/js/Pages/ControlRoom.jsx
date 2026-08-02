import { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import LiveMapCanvas from '@/Components/LiveMap/LiveMapCanvas';
import Panel from '@/Components/Ui/Panel';
import Pill from '@/Components/Ui/Pill';
import StatTile from '@/Components/Ui/StatTile';
import CodeBlock from '@/Components/Ui/CodeBlock';
import { computeRoute, fetchHealth, fetchSnapshot, resetGraph, triggerAnomaly } from '@/lib/api';

const MODES = ['car', 'rickshaw', 'walk'];
const DEFAULT_START = 'farmgate';
const DEFAULT_DESTINATION = 'gulshan_2';
const PRESET_EDGES = 'edge_karwan_bazar_tejgaon,edge_tejgaon_banani';
const DEFAULT_BOUNDING_BOX = `{
  "min_lat": 23.75,
  "max_lat": 23.79,
  "min_lng": 90.39,
  "max_lng": 90.42
}`;

function Field({ label, hint, children }) {
    return (
        <label className="block">
            <span className="text-xs font-semibold text-slate-700">{label}</span>
            {hint && <span className="mt-0.5 block text-[0.68rem] leading-5 text-slate-400">{hint}</span>}
            <div className="mt-2">{children}</div>
        </label>
    );
}

const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100';

export default function ControlRoom() {
    const [graph, setGraph] = useState({ nodes: [], edges: [] });
    const [meta, setMeta] = useState({});

    const [start, setStart] = useState(DEFAULT_START);
    const [destination, setDestination] = useState(DEFAULT_DESTINATION);
    const [sessionId, setSessionId] = useState('control-room-session');
    const [allowedModes, setAllowedModes] = useState(MODES);

    const [edgeIds, setEdgeIds] = useState(PRESET_EDGES);
    const [multiplier, setMultiplier] = useState(10);
    const [boundingBox, setBoundingBox] = useState(DEFAULT_BOUNDING_BOX);
    const [useBoundingBox, setUseBoundingBox] = useState(false);

    const [route, setRoute] = useState(null);
    const [routeJson, setRouteJson] = useState(null);
    const [anomalyJson, setAnomalyJson] = useState(null);
    const [anomalyEdgeIds, setAnomalyEdgeIds] = useState([]);

    const [health, setHealth] = useState('checking');
    const [snapshotState, setSnapshotState] = useState('loading');
    const [routeState, setRouteState] = useState('idle');
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState(null);

    async function loadSnapshot() {
        try {
            const snapshot = await fetchSnapshot();
            setGraph({ nodes: snapshot.data?.nodes ?? [], edges: snapshot.data?.edges ?? [] });
            setMeta(snapshot.meta ?? {});
            setSnapshotState('ready');
            return snapshot;
        } catch (failure) {
            setSnapshotState('error');
            setError(failure.message);
            return null;
        }
    }

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                await fetchHealth();
                if (!cancelled) setHealth('ok');
            } catch (failure) {
                if (!cancelled) setHealth('down');
            }

            const snapshot = await loadSnapshot();
            if (cancelled || !snapshot) return;

            const nodes = snapshot.data?.nodes ?? [];
            const resolvedStart = nodes.find((node) => node.id === DEFAULT_START)?.id ?? nodes[0]?.id;
            const resolvedDestination =
                nodes.find((node) => node.id === DEFAULT_DESTINATION)?.id ?? nodes[nodes.length - 1]?.id;

            if (resolvedStart) setStart(resolvedStart);
            if (resolvedDestination) setDestination(resolvedDestination);
        })();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function runRoute() {
        if (!allowedModes.length) {
            setError('Select at least one travel mode.');
            return;
        }

        setBusy('route');
        setError(null);

        try {
            const result = await computeRoute({
                session_id: sessionId || undefined,
                start,
                destination,
                allowed_modes: allowedModes,
            });
            setRoute(result.data);
            setRouteJson(result);
            setRouteState('ready');
        } catch (failure) {
            setRouteState('error');
            setError(failure.message);
            setRouteJson(failure.payload ?? { error: failure.message });
        } finally {
            setBusy(null);
        }
    }

    async function runAnomaly() {
        setBusy('anomaly');
        setError(null);

        const payload = {
            edge_ids: edgeIds.split(',').map((item) => item.trim()).filter(Boolean),
            multiplier: Number(multiplier),
        };

        if (useBoundingBox) {
            try {
                payload.bounding_box = JSON.parse(boundingBox);
            } catch (parseError) {
                setError('Bounding box JSON is invalid.');
                setBusy(null);
                return;
            }
        }

        try {
            const result = await triggerAnomaly(payload);
            setAnomalyJson(result);
            setAnomalyEdgeIds(result.reroute_summary?.affected_edge_ids ?? []);
            await loadSnapshot();
            await runRoute();
        } catch (failure) {
            setError(failure.message);
            setAnomalyJson(failure.payload ?? { error: failure.message });
        } finally {
            setBusy(null);
        }
    }

    async function clearAnomalies() {
        setBusy('reset');
        setError(null);

        try {
            await resetGraph();
            setAnomalyJson(null);
            setAnomalyEdgeIds([]);
            await loadSnapshot();
            await runRoute();
        } catch (failure) {
            setError(failure.message);
        } finally {
            setBusy(null);
        }
    }

    function toggleMode(mode) {
        setAllowedModes((previous) =>
            previous.includes(mode) ? previous.filter((item) => item !== mode) : [...previous, mode],
        );
    }

    const routeEdgeIds = useMemo(
        () => new Set((route?.segments ?? []).map((segment) => segment.edge_id).filter(Boolean)),
        [route],
    );

    const highlightedEdges = useMemo(
        () => graph.edges.filter((edge) => anomalyEdgeIds.includes(edge.id) || routeEdgeIds.has(edge.id)).slice(0, 12),
        [graph.edges, anomalyEdgeIds, routeEdgeIds],
    );

    const nodeName = (id) => graph.nodes.find((node) => node.id === id)?.name ?? id;

    return (
        <AppLayout
            title="Control Room"
            eyebrow="Operations console"
            heading="Control Room"
            description="Compute routes, inject congestion anomalies, and watch the graph respond — all without leaving the app or reading raw JSON endpoints."
            actions={
                <>
                    <Pill tone={health === 'ok' ? 'emerald' : health === 'down' ? 'rose' : 'slate'} dot pulse={health === 'checking'}>
                        {health === 'ok' ? 'Backend healthy' : health === 'down' ? 'Backend unreachable' : 'Checking…'}
                    </Pill>
                    <Pill tone={snapshotState === 'ready' ? 'cyan' : snapshotState === 'error' ? 'rose' : 'slate'} dot>
                        {snapshotState === 'ready' ? 'Snapshot loaded' : snapshotState === 'error' ? 'Snapshot failed' : 'Loading…'}
                    </Pill>
                    <Pill tone={routeState === 'ready' ? 'emerald' : routeState === 'error' ? 'rose' : 'slate'} dot>
                        {routeState === 'ready' ? 'Route live' : routeState === 'error' ? 'Route failed' : 'Route pending'}
                    </Pill>
                </>
            }
        >
            <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
                {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
                        <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <strong className="block text-sm font-semibold text-rose-800">Something went wrong</strong>
                            <p className="mt-0.5 text-xs leading-5 text-rose-700/90">{error}</p>
                        </div>
                    </div>
                )}

                {/* ── Live graph stats ── */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatTile label="Nodes" value={meta.node_count ?? '—'} detail="Hubs and transfer points" accent="cyan" />
                    <StatTile label="Edges" value={meta.edge_count ?? '—'} detail="Directional road segments" accent="emerald" />
                    <StatTile label="Goli edges" value={meta.goli_edge_count ?? '—'} detail="Corridors cars cannot use" accent="amber" />
                    <StatTile label="Overpasses" value={meta.overpass_node_count ?? '—'} detail="Walk-only transfer nodes" accent="violet" />
                </div>

                <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
                    {/* ── Left column: controls ── */}
                    <div className="grid gap-6">
                        <Panel eyebrow="Route planner" title="Compute a live route" description="Sessions are saved so a later anomaly can reroute them.">
                            <div className="grid gap-4">
                                <Field label="Start">
                                    <select className={inputClass} value={start} onChange={(event) => setStart(event.target.value)}>
                                        {graph.nodes.map((node) => (
                                            <option key={node.id} value={node.id}>
                                                {node.name} ({node.id})
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Destination">
                                    <select className={inputClass} value={destination} onChange={(event) => setDestination(event.target.value)}>
                                        {graph.nodes.map((node) => (
                                            <option key={node.id} value={node.id}>
                                                {node.name} ({node.id})
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Session ID" hint="Reused by the anomaly simulator to reroute this trip.">
                                    <input className={inputClass} value={sessionId} onChange={(event) => setSessionId(event.target.value)} autoComplete="off" />
                                </Field>

                                <Field label="Allowed modes">
                                    <div className="flex flex-wrap gap-2">
                                        {MODES.map((mode) => {
                                            const active = allowedModes.includes(mode);
                                            return (
                                                <button
                                                    key={mode}
                                                    type="button"
                                                    onClick={() => toggleMode(mode)}
                                                    aria-pressed={active}
                                                    className={`rounded-full border px-4 py-2 text-xs font-semibold capitalize transition ${
                                                        active
                                                            ? 'border-cyan-300 bg-cyan-50 text-cyan-700 shadow-sm'
                                                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {mode}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </Field>

                                <div className="flex flex-wrap gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={runRoute}
                                        disabled={busy !== null}
                                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {busy === 'route' ? 'Computing…' : 'Run route'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStart(DEFAULT_START);
                                            setDestination(DEFAULT_DESTINATION);
                                            setSessionId('judge-demo-route');
                                        }}
                                        className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                                    >
                                        Load Farmgate demo
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <StatTile label="Path cost" value={route?.total_cost ?? '—'} />
                                    <StatTile label="Switches" value={route?.switches ?? '—'} />
                                    <StatTile
                                        label="Modes used"
                                        value={route?.selected_modes?.length ? route.selected_modes.join(', ') : '—'}
                                        className="[&_.mono]:text-sm"
                                    />
                                    <StatTile
                                        label="Compute time"
                                        value={route?.computation_time_ms != null ? `${route.computation_time_ms} ms` : '—'}
                                        className="[&_.mono]:text-sm"
                                    />
                                </div>

                                {route?.path?.length > 0 && (
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                                        <div className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-slate-400">Path</div>
                                        <p className="mono mt-1 text-xs leading-6 text-slate-700">
                                            {route.path.map((id, index) => (
                                                <span key={`${id}-${index}`}>
                                                    {index > 0 && <span className="mx-1 text-cyan-400">→</span>}
                                                    {nodeName(id)}
                                                </span>
                                            ))}
                                        </p>
                                    </div>
                                )}

                                {routeJson && <CodeBlock label="Route response" value={routeJson} collapsible maxHeight={260} />}
                            </div>
                        </Panel>

                        <Panel
                            eyebrow="Anomaly simulator"
                            title="Trigger congestion pressure"
                            description="Inflate specific edges, or switch on the bounding box to disrupt a whole area."
                        >
                            <div className="grid gap-4">
                                <Field label="Edge IDs" hint="Comma separated.">
                                    <input className={inputClass} value={edgeIds} onChange={(event) => setEdgeIds(event.target.value)} />
                                </Field>

                                <Field label="Multiplier">
                                    <input
                                        className={inputClass}
                                        type="number"
                                        min="1"
                                        value={multiplier}
                                        onChange={(event) => setMultiplier(event.target.value)}
                                    />
                                </Field>

                                <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5">
                                    <input
                                        type="checkbox"
                                        checked={useBoundingBox}
                                        onChange={(event) => setUseBoundingBox(event.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                                    />
                                    <span className="text-xs font-semibold text-slate-700">Also apply a bounding box</span>
                                </label>

                                {useBoundingBox && (
                                    <Field label="Bounding box JSON">
                                        <textarea
                                            className={`${inputClass} mono min-h-[120px] text-xs`}
                                            value={boundingBox}
                                            onChange={(event) => setBoundingBox(event.target.value)}
                                        />
                                    </Field>
                                )}

                                <div className="flex flex-wrap gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={runAnomaly}
                                        disabled={busy !== null}
                                        className="rounded-full bg-gradient-to-r from-rose-600 to-rose-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {busy === 'anomaly' ? 'Applying…' : 'Trigger anomaly'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEdgeIds(PRESET_EDGES);
                                            setMultiplier(10);
                                        }}
                                        className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                                    >
                                        Use corridor preset
                                    </button>
                                    <button
                                        type="button"
                                        onClick={loadSnapshot}
                                        className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                                    >
                                        Refresh snapshot
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearAnomalies}
                                        disabled={busy !== null}
                                        className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {busy === 'reset' ? 'Clearing…' : 'Clear anomalies'}
                                    </button>
                                </div>

                                {anomalyJson && (
                                    <>
                                        <div className="flex flex-wrap gap-2">
                                            {anomalyJson.meta?.updated_edges != null && (
                                                <Pill tone="rose">Updated edges: {anomalyJson.meta.updated_edges}</Pill>
                                            )}
                                            {anomalyJson.reroute_summary?.sessions_rerouted != null && (
                                                <Pill tone="amber">Sessions rerouted: {anomalyJson.reroute_summary.sessions_rerouted}</Pill>
                                            )}
                                        </div>
                                        <CodeBlock label="Anomaly response" value={anomalyJson} collapsible maxHeight={260} />
                                    </>
                                )}
                            </div>
                        </Panel>
                    </div>

                    {/* ── Right column: map + tables ── */}
                    <div className="grid gap-6">
                        <Panel
                            eyebrow="Visual graph"
                            title="Live network map"
                            description="Grey lines are standard roads, teal marks goli-friendly corridors, and the highlighted line is the active route."
                            bodyClassName=""
                        >
                            <div className="h-[520px] sm:h-[620px]">
                                <LiveMapCanvas graph={graph} route={route} trackUserLocation={false} className="h-full rounded-none" />
                            </div>
                        </Panel>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <Panel eyebrow="Graph" title="Sample nodes">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[0.58rem] uppercase tracking-[0.16em] text-slate-400">
                                                <th className="pb-2 font-semibold">Name</th>
                                                <th className="pb-2 font-semibold">Type</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {graph.nodes.slice(0, 10).map((node) => (
                                                <tr key={node.id} className="border-b border-slate-50">
                                                    <td className="py-2 text-slate-700">{node.name}</td>
                                                    <td className="py-2 text-slate-500 capitalize">{node.type}</td>
                                                </tr>
                                            ))}
                                            {!graph.nodes.length && (
                                                <tr>
                                                    <td colSpan={2} className="py-3 text-slate-400">No network data yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Panel>

                            <Panel eyebrow="Graph" title="Highlighted edges" description="Edges on the active route or hit by an anomaly.">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[0.58rem] uppercase tracking-[0.16em] text-slate-400">
                                                <th className="pb-2 font-semibold">ID</th>
                                                <th className="pb-2 font-semibold">Weight</th>
                                                <th className="pb-2 font-semibold">Type</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {highlightedEdges.map((edge) => (
                                                <tr key={edge.id} className="border-b border-slate-50">
                                                    <td className="mono py-2 text-[0.68rem] text-slate-700">{edge.id}</td>
                                                    <td className="mono py-2 text-slate-700">
                                                        {edge.current_weight}
                                                        {edge.current_weight !== edge.base_weight && (
                                                            <span className="ml-1 text-rose-500">(base {edge.base_weight})</span>
                                                        )}
                                                    </td>
                                                    <td className="py-2 text-slate-500">
                                                        {edge.is_goli ? 'goli' : edge.is_overpass ? 'overpass' : 'road'}
                                                    </td>
                                                </tr>
                                            ))}
                                            {!highlightedEdges.length && (
                                                <tr>
                                                    <td colSpan={3} className="py-3 text-slate-400">No highlighted edges yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Panel>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
