import { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import LiveMapCanvas from '@/Components/LiveMap/LiveMapCanvas';
import Panel from '@/Components/Ui/Panel';
import Pill from '@/Components/Ui/Pill';
import StatTile from '@/Components/Ui/StatTile';
import { fetchSnapshot } from '@/lib/api';

const EDGE_FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'goli', label: 'Goli' },
    { id: 'overpass', label: 'Overpass' },
    { id: 'congested', label: 'Congested' },
    { id: 'car', label: 'Car-friendly' },
];

function matchesEdgeFilter(edge, filter) {
    if (filter === 'goli') return Boolean(edge.is_goli);
    if (filter === 'overpass') return Boolean(edge.is_overpass);
    if (filter === 'congested') return edge.current_weight > edge.base_weight;
    if (filter === 'car') return Boolean(edge.car_allowed);
    return true;
}

function ModeDots({ edge }) {
    const modes = [
        { on: edge.car_allowed, label: 'Car', className: 'bg-cyan-500' },
        { on: edge.rickshaw_allowed, label: 'Rickshaw', className: 'bg-emerald-500' },
        { on: edge.walk_allowed, label: 'Walk', className: 'bg-amber-500' },
    ];

    return (
        <span className="inline-flex items-center gap-1">
            {modes.map((mode) => (
                <span
                    key={mode.label}
                    title={`${mode.label}: ${mode.on ? 'allowed' : 'blocked'}`}
                    className={`h-2 w-2 rounded-full ${mode.on ? mode.className : 'bg-slate-200'}`}
                />
            ))}
        </span>
    );
}

export default function Network() {
    const [graph, setGraph] = useState({ nodes: [], edges: [] });
    const [meta, setMeta] = useState({});
    const [state, setState] = useState('loading');
    const [error, setError] = useState(null);

    const [nodeQuery, setNodeQuery] = useState('');
    const [edgeQuery, setEdgeQuery] = useState('');
    const [edgeFilter, setEdgeFilter] = useState('all');
    const [selectedNode, setSelectedNode] = useState(null);

    async function load() {
        setState('loading');
        try {
            const snapshot = await fetchSnapshot();
            setGraph({ nodes: snapshot.data?.nodes ?? [], edges: snapshot.data?.edges ?? [] });
            setMeta(snapshot.meta ?? {});
            setState('ready');
            setError(null);
        } catch (failure) {
            setState('error');
            setError(failure.message);
        }
    }

    useEffect(() => {
        load();
    }, []);

    const filteredNodes = useMemo(() => {
        const query = nodeQuery.trim().toLowerCase();
        if (!query) return graph.nodes;
        return graph.nodes.filter(
            (node) =>
                node.name?.toLowerCase().includes(query) ||
                node.id?.toLowerCase().includes(query) ||
                node.type?.toLowerCase().includes(query),
        );
    }, [graph.nodes, nodeQuery]);

    const filteredEdges = useMemo(() => {
        const query = edgeQuery.trim().toLowerCase();
        return graph.edges.filter((edge) => {
            if (!matchesEdgeFilter(edge, edgeFilter)) return false;
            if (selectedNode && edge.from !== selectedNode && edge.to !== selectedNode) return false;
            if (!query) return true;
            return (
                edge.id?.toLowerCase().includes(query) ||
                edge.from?.toLowerCase().includes(query) ||
                edge.to?.toLowerCase().includes(query)
            );
        });
    }, [graph.edges, edgeQuery, edgeFilter, selectedNode]);

    const congestedCount = useMemo(
        () => graph.edges.filter((edge) => edge.current_weight > edge.base_weight).length,
        [graph.edges],
    );

    const nodeName = (id) => graph.nodes.find((node) => node.id === id)?.name ?? id;

    const inputClass =
        'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100';

    return (
        <AppLayout
            title="Network Explorer"
            eyebrow="Graph data"
            heading="Network Explorer"
            description="Browse every node and edge in the live routing graph — searchable and filterable, so you never have to read the raw snapshot endpoint."
            actions={
                <>
                    <Pill tone={state === 'ready' ? 'emerald' : state === 'error' ? 'rose' : 'slate'} dot pulse={state === 'loading'}>
                        {state === 'ready' ? 'Live snapshot' : state === 'error' ? 'Unavailable' : 'Loading…'}
                    </Pill>
                    <button
                        type="button"
                        onClick={load}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                    >
                        Refresh
                    </button>
                </>
            }
        >
            <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
                {error && (
                    <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                        Could not load the graph snapshot: {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                    <StatTile label="Nodes" value={meta.node_count ?? '—'} accent="cyan" />
                    <StatTile label="Edges" value={meta.edge_count ?? '—'} accent="emerald" />
                    <StatTile label="Goli edges" value={meta.goli_edge_count ?? '—'} accent="amber" />
                    <StatTile label="Overpasses" value={meta.overpass_node_count ?? '—'} accent="violet" />
                    <StatTile label="Congested" value={congestedCount} accent={congestedCount ? 'rose' : 'slate'} detail="Above base weight" />
                </div>

                <Panel
                    className="mt-6"
                    eyebrow="Live map"
                    title="Network overview"
                    bodyClassName=""
                >
                    <div className="h-[440px] sm:h-[520px]">
                        <LiveMapCanvas graph={graph} route={null} trackUserLocation={false} className="h-full rounded-none" />
                    </div>
                </Panel>

                <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
                    {/* ── Nodes ── */}
                    <Panel
                        eyebrow="Stations"
                        title={`Nodes (${filteredNodes.length})`}
                        description="Select a node to filter the connections beside it."
                    >
                        <input
                            className={inputClass}
                            placeholder="Search by name, id, or type…"
                            value={nodeQuery}
                            onChange={(event) => setNodeQuery(event.target.value)}
                        />

                        {selectedNode && (
                            <button
                                type="button"
                                onClick={() => setSelectedNode(null)}
                                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-[0.62rem] font-semibold text-cyan-700 transition hover:bg-cyan-100"
                            >
                                Filtering by {nodeName(selectedNode)} · clear ✕
                            </button>
                        )}

                        <div className="mt-4 max-h-[520px] space-y-1.5 overflow-y-auto pr-1">
                            {filteredNodes.map((node) => {
                                const active = selectedNode === node.id;
                                return (
                                    <button
                                        key={node.id}
                                        type="button"
                                        onClick={() => setSelectedNode(active ? null : node.id)}
                                        className={`w-full rounded-xl border px-3.5 py-2.5 text-left transition ${
                                            active
                                                ? 'border-cyan-300 bg-cyan-50'
                                                : 'border-slate-100 bg-slate-50/60 hover:border-slate-200 hover:bg-white'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-semibold text-slate-800">{node.name}</span>
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider ${
                                                    node.type === 'overpass'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : node.type === 'hub'
                                                          ? 'bg-cyan-100 text-cyan-700'
                                                          : 'bg-slate-100 text-slate-500'
                                                }`}
                                            >
                                                {node.type}
                                            </span>
                                        </div>
                                        <div className="mono mt-1 text-[0.62rem] text-slate-400">
                                            {node.id} · {Number(node.lat).toFixed(4)}, {Number(node.lng).toFixed(4)}
                                        </div>
                                    </button>
                                );
                            })}
                            {!filteredNodes.length && (
                                <p className="py-6 text-center text-xs text-slate-400">
                                    {state === 'loading' ? 'Loading nodes…' : 'No nodes match that search.'}
                                </p>
                            )}
                        </div>
                    </Panel>

                    {/* ── Edges ── */}
                    <Panel
                        eyebrow="Connections"
                        title={`Edges (${filteredEdges.length})`}
                        description="Coloured dots show which modes an edge permits: car, rickshaw, walk."
                    >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <input
                                className={inputClass}
                                placeholder="Search by edge id or endpoint…"
                                value={edgeQuery}
                                onChange={(event) => setEdgeQuery(event.target.value)}
                            />
                            <div className="flex flex-wrap gap-1.5">
                                {EDGE_FILTERS.map((filter) => (
                                    <button
                                        key={filter.id}
                                        type="button"
                                        onClick={() => setEdgeFilter(filter.id)}
                                        className={`rounded-full border px-3 py-1.5 text-[0.62rem] font-semibold transition ${
                                            edgeFilter === filter.id
                                                ? 'border-slate-900 bg-slate-900 text-white'
                                                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 max-h-[560px] overflow-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="sticky top-0 bg-white">
                                    <tr className="border-b border-slate-100 text-[0.55rem] uppercase tracking-[0.16em] text-slate-400">
                                        <th className="py-2 pr-3 font-semibold">Edge</th>
                                        <th className="py-2 pr-3 font-semibold">From → To</th>
                                        <th className="py-2 pr-3 font-semibold">Weight</th>
                                        <th className="py-2 pr-3 font-semibold">Dist</th>
                                        <th className="py-2 pr-3 font-semibold">Modes</th>
                                        <th className="py-2 font-semibold">Kind</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEdges.map((edge) => {
                                        const congested = edge.current_weight > edge.base_weight;
                                        return (
                                            <tr key={edge.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                                                <td className="mono py-2 pr-3 text-[0.65rem] text-slate-600">{edge.id}</td>
                                                <td className="py-2 pr-3 text-slate-700">
                                                    {nodeName(edge.from)} <span className="text-slate-300">→</span> {nodeName(edge.to)}
                                                </td>
                                                <td className={`mono py-2 pr-3 font-semibold ${congested ? 'text-rose-600' : 'text-slate-700'}`}>
                                                    {edge.current_weight}
                                                    {congested && <span className="ml-1 font-normal text-slate-400">/ {edge.base_weight}</span>}
                                                </td>
                                                <td className="mono py-2 pr-3 text-slate-500">{edge.distance_km} km</td>
                                                <td className="py-2 pr-3">
                                                    <ModeDots edge={edge} />
                                                </td>
                                                <td className="py-2">
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider ${
                                                            edge.is_goli
                                                                ? 'bg-cyan-100 text-cyan-700'
                                                                : edge.is_overpass
                                                                  ? 'bg-amber-100 text-amber-700'
                                                                  : 'bg-slate-100 text-slate-500'
                                                        }`}
                                                    >
                                                        {edge.is_goli ? 'goli' : edge.is_overpass ? 'overpass' : 'road'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {!filteredEdges.length && (
                                        <tr>
                                            <td colSpan={6} className="py-6 text-center text-slate-400">
                                                {state === 'loading' ? 'Loading edges…' : 'No edges match those filters.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Panel>
                </div>
            </div>
        </AppLayout>
    );
}
