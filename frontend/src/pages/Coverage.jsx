import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import LiveMapCanvas from '@shared/Components/LiveMap/LiveMapCanvas';
import PageHeader from '@app/components/PageHeader';
import BackendDown from '@app/components/BackendDown';
import useGraph from '@app/hooks/useGraph';

const TYPE_STYLES = {
    hub: 'bg-cyan-100 text-cyan-700',
    overpass: 'bg-amber-100 text-amber-700',
    goli: 'bg-emerald-100 text-emerald-700',
};

export default function Coverage() {
    const { graph, meta, state, error, reload } = useGraph();
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return graph.nodes;
        return graph.nodes.filter(
            (node) => node.name?.toLowerCase().includes(q) || node.id?.toLowerCase().includes(q),
        );
    }, [graph.nodes, query]);

    const areas = useMemo(() => {
        const counts = {};
        graph.nodes.forEach((node) => {
            counts[node.type] = (counts[node.type] ?? 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [graph.nodes]);

    if (state === 'error') {
        return (
            <>
                <PageHeader eyebrow="Where we run" heading="Coverage" />
                <div className="px-5 py-12 sm:px-8">
                    <BackendDown error={error} onRetry={reload} />
                </div>
            </>
        );
    }

    return (
        <>
            <PageHeader
                eyebrow="Where we run"
                heading="Coverage"
                description="Every stop GoliTransit can route you between, across central and northern Dhaka. Search for a place to check whether it's on the network."
            />

            <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[
                        { label: 'Stops covered', value: meta.node_count ?? '—', color: 'text-cyan-600' },
                        { label: 'Connections', value: meta.edge_count ?? '—', color: 'text-emerald-600' },
                        { label: 'Goli routes', value: meta.goli_edge_count ?? '—', color: 'text-amber-600' },
                        { label: 'Overpasses', value: meta.overpass_node_count ?? '—', color: 'text-violet-600' },
                    ].map((stat) => (
                        <div key={stat.label} className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3.5">
                            <div className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-slate-400">{stat.label}</div>
                            <div className={`mono mt-1.5 text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
                    <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400" />
                    <div className="h-[440px] sm:h-[540px]">
                        <LiveMapCanvas graph={graph} route={null} trackUserLocation={false} className="h-full rounded-none" />
                    </div>
                </div>

                <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-base font-bold text-slate-900">
                            All stops <span className="font-normal text-slate-400">({filtered.length})</span>
                        </h2>
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search for a place…"
                            className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                        />
                    </div>

                    <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((node) => (
                            <Link
                                key={node.id}
                                to={`/plan?from=${node.id}&to=gulshan_2`}
                                className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-2.5 transition hover:border-teal-200 hover:bg-white"
                            >
                                <span className="truncate text-sm font-medium text-slate-700">{node.name}</span>
                                <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider ${TYPE_STYLES[node.type] ?? 'bg-slate-100 text-slate-500'}`}>
                                    {node.type}
                                </span>
                            </Link>
                        ))}
                        {!filtered.length && (
                            <p className="col-span-full py-8 text-center text-sm text-slate-400">
                                Nothing matches "{query}" — that area isn't on the network yet.
                            </p>
                        )}
                    </div>

                    {areas.length > 0 && (
                        <div className="mt-6 border-t border-slate-100 pt-5">
                            <p className="mb-3 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-slate-400">Network makeup</p>
                            <div className="flex flex-wrap gap-2">
                                {areas.map(([type, count]) => (
                                    <span key={type} className={`rounded-full px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-wide ${TYPE_STYLES[type] ?? 'bg-slate-100 text-slate-500'}`}>
                                        {type} · {count}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
