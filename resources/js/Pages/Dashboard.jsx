import { useEffect, useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Panel from '@/Components/Ui/Panel';
import Pill from '@/Components/Ui/Pill';
import StatTile from '@/Components/Ui/StatTile';
import { fetchSnapshot } from '@/lib/api';

const SHORTCUTS = [
    {
        href: '/planner',
        title: 'Route Planner',
        detail: 'Plan a live multi-modal trip on the interactive map.',
        accent: 'cyan',
    },
    {
        href: '/control-room',
        title: 'Control Room',
        detail: 'Simulate disruptions and watch the graph reroute.',
        accent: 'amber',
    },
    {
        href: '/network',
        title: 'Network Explorer',
        detail: 'Search every node and edge in the routing graph.',
        accent: 'violet',
    },
    {
        href: '/status',
        title: 'System Status',
        detail: 'Live health and latency for all four endpoints.',
        accent: 'emerald',
    },
];

const ACCENT_RING = {
    cyan: 'hover:border-cyan-300/60',
    amber: 'hover:border-amber-300/60',
    violet: 'hover:border-violet-300/60',
    emerald: 'hover:border-emerald-300/60',
};

export default function Dashboard() {
    const [graph, setGraph] = useState({ nodes: [], edges: [] });
    const [meta, setMeta] = useState({});
    const [state, setState] = useState('loading');

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const snapshot = await fetchSnapshot();
                if (cancelled) return;
                setGraph({ nodes: snapshot.data?.nodes ?? [], edges: snapshot.data?.edges ?? [] });
                setMeta(snapshot.meta ?? {});
                setState('ready');
            } catch (error) {
                if (!cancelled) setState('error');
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const insights = useMemo(() => {
        const edges = graph.edges;
        if (!edges.length) return null;

        const congested = edges.filter((edge) => edge.current_weight > edge.base_weight);
        const totalDistance = edges.reduce((sum, edge) => sum + (Number(edge.distance_km) || 0), 0);
        const carBlocked = edges.filter((edge) => !edge.car_allowed).length;

        return {
            congested: congested.length,
            worst: congested.sort((a, b) => b.current_weight / b.base_weight - a.current_weight / a.base_weight)[0] ?? null,
            avgDistance: (totalDistance / edges.length).toFixed(2),
            carBlocked,
            carBlockedPct: Math.round((carBlocked / edges.length) * 100),
        };
    }, [graph.edges]);

    const nodeTypes = useMemo(() => {
        const counts = {};
        graph.nodes.forEach((node) => {
            counts[node.type] = (counts[node.type] ?? 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [graph.nodes]);

    return (
        <AppLayout
            title="Dashboard"
            eyebrow="Operations overview"
            heading="Transit operations dashboard"
            description="A read-only summary of the live graph: how big it is, how much of it is under congestion pressure, and where to go next."
            actions={
                <Pill tone={state === 'ready' ? 'emerald' : state === 'error' ? 'rose' : 'slate'} dot pulse={state === 'loading'}>
                    {state === 'ready' ? 'Graph connected' : state === 'error' ? 'Graph unavailable' : 'Connecting…'}
                </Pill>
            }
        >
            <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatTile label="Stations" value={meta.node_count ?? '—'} detail="Hubs, golis, overpasses" accent="cyan" />
                    <StatTile label="Connections" value={meta.edge_count ?? '—'} detail="Directional weighted edges" accent="emerald" />
                    <StatTile label="Goli edges" value={meta.goli_edge_count ?? '—'} detail="Closed to cars" accent="amber" />
                    <StatTile label="Overpasses" value={meta.overpass_node_count ?? '—'} detail="Walk-only transfers" accent="violet" />
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
                    <Panel eyebrow="Live analysis" title="Network pressure">
                        {insights ? (
                            <>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    <StatTile
                                        label="Congested edges"
                                        value={insights.congested}
                                        detail="Above base weight"
                                        accent={insights.congested ? 'rose' : 'emerald'}
                                    />
                                    <StatTile label="Avg segment" value={`${insights.avgDistance} km`} detail="Mean edge distance" accent="cyan" />
                                    <StatTile
                                        label="Car-blocked"
                                        value={`${insights.carBlockedPct}%`}
                                        detail={`${insights.carBlocked} edges reject cars`}
                                        accent="amber"
                                    />
                                </div>

                                {insights.worst ? (
                                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3.5">
                                        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-rose-500">
                                            Worst congestion
                                        </p>
                                        <p className="mono mt-1.5 text-xs text-rose-800">{insights.worst.id}</p>
                                        <p className="mt-1 text-xs leading-6 text-rose-700/90">
                                            Weight inflated from {insights.worst.base_weight} to {insights.worst.current_weight} —
                                            roughly {(insights.worst.current_weight / insights.worst.base_weight).toFixed(1)}× its
                                            normal cost.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3.5">
                                        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-emerald-600">
                                            All clear
                                        </p>
                                        <p className="mt-1.5 text-xs leading-6 text-emerald-700/90">
                                            No edge is currently above its base weight. Trigger an anomaly from the{' '}
                                            <Link href="/control-room" className="font-semibold underline">Control Room</Link> to see
                                            rerouting in action.
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="py-8 text-center text-sm text-slate-400">
                                {state === 'error' ? 'Could not reach the graph snapshot endpoint.' : 'Loading graph analysis…'}
                            </p>
                        )}
                    </Panel>

                    <Panel eyebrow="Composition" title="Node types">
                        {nodeTypes.length ? (
                            <div className="space-y-3">
                                {nodeTypes.map(([type, count]) => {
                                    const pct = Math.round((count / graph.nodes.length) * 100);
                                    return (
                                        <div key={type}>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-semibold capitalize text-slate-700">{type}</span>
                                                <span className="mono text-slate-400">
                                                    {count} · {pct}%
                                                </span>
                                            </div>
                                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="py-8 text-center text-sm text-slate-400">
                                {state === 'error' ? 'Unavailable.' : 'Loading…'}
                            </p>
                        )}
                    </Panel>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {SHORTCUTS.map((shortcut) => (
                        <Link
                            key={shortcut.href}
                            href={shortcut.href}
                            className={`group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${ACCENT_RING[shortcut.accent]}`}
                        >
                            <h3 className="text-sm font-bold text-slate-900">{shortcut.title}</h3>
                            <p className="mt-1.5 text-xs leading-6 text-slate-500">{shortcut.detail}</p>
                            <span className="mt-3 inline-flex items-center text-xs font-semibold text-cyan-600">
                                Open
                                <svg className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
