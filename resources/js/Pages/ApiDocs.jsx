import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import Panel from '@/Components/Ui/Panel';
import Pill from '@/Components/Ui/Pill';
import CodeBlock from '@/Components/Ui/CodeBlock';
import request from '@/lib/api';

const ENDPOINTS = [
    {
        id: 'health',
        method: 'GET',
        path: '/health',
        tone: 'emerald',
        summary: 'Uptime and deployment check.',
        body: null,
        response: { status: 'ok' },
    },
    {
        id: 'route',
        method: 'POST',
        path: '/api/route',
        tone: 'cyan',
        summary: 'Computes the best currently available route across the allowed travel modes.',
        body: {
            session_id: 'demo-farmgate-gulshan',
            start: 'farmgate',
            destination: 'gulshan_2',
            allowed_modes: ['car', 'rickshaw', 'walk'],
        },
        response: {
            data: {
                session_id: 'demo-farmgate-gulshan',
                start: 'farmgate',
                destination: 'gulshan_2',
                selected_modes: ['car'],
                path: ['farmgate', 'karwan_bazar', 'tejgaon', 'banani', 'gulshan_1', 'gulshan_2'],
                segments: [
                    {
                        edge_id: 'edge_farmgate_karwan_bazar',
                        from: 'farmgate',
                        to: 'karwan_bazar',
                        cost: 4,
                        mode: 'car',
                        switch_penalty: 0,
                        type: 'travel',
                    },
                ],
                total_cost: 20,
                switches: 0,
                computation_time_ms: 4,
                session_saved: true,
            },
        },
        notes: [
            'Mode switching is only allowed at the transfer nodes configured in config/golitransit.php.',
            'Passing a session_id saves the route so a later anomaly can reroute it automatically.',
        ],
    },
    {
        id: 'anomaly',
        method: 'POST',
        path: '/api/anomaly',
        tone: 'rose',
        summary: 'Inflates edge weights and reroutes any saved session that used those edges.',
        body: {
            edge_ids: ['edge_karwan_bazar_tejgaon', 'edge_tejgaon_banani'],
            multiplier: 10,
        },
        response: {
            message: 'Anomaly applied successfully.',
            reroute_summary: {
                affected_edge_ids: ['edge_karwan_bazar_tejgaon', 'edge_tejgaon_banani'],
                sessions_rerouted: 1,
            },
            meta: { updated_edges: 2 },
        },
        notes: [
            'Supply bounding_box with min_lat / max_lat / min_lng / max_lng to disrupt a whole area instead of named edges.',
        ],
    },
    {
        id: 'snapshot',
        method: 'GET',
        path: '/api/graph/snapshot',
        tone: 'violet',
        summary: 'Returns the graph exactly as the routing engine sees it, including anomaly-inflated weights.',
        body: null,
        response: {
            data: {
                nodes: [{ id: 'farmgate', name: 'Farmgate', lat: 23.758, lng: 90.3892, type: 'hub' }],
                edges: [
                    {
                        id: 'edge_karwan_bazar_tejgaon',
                        from: 'karwan_bazar',
                        to: 'tejgaon',
                        base_weight: 4,
                        current_weight: 4,
                        distance_km: 1.5,
                        car_allowed: true,
                        rickshaw_allowed: true,
                        walk_allowed: true,
                        is_goli: false,
                        is_overpass: false,
                    },
                ],
            },
            meta: { source: 'graph_manager', node_count: 30, edge_count: 64 },
        },
    },
];

const METHOD_TONES = {
    GET: 'bg-emerald-100 text-emerald-700',
    POST: 'bg-cyan-100 text-cyan-700',
};

function Endpoint({ endpoint }) {
    const [live, setLive] = useState(null);
    const [running, setRunning] = useState(false);

    async function tryIt() {
        setRunning(true);
        try {
            const result = await request(endpoint.path, {
                method: endpoint.method,
                body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
            });
            setLive({ ok: true, result });
        } catch (failure) {
            setLive({ ok: false, result: failure.payload ?? { error: failure.message } });
        } finally {
            setRunning(false);
        }
    }

    return (
        <Panel bodyClassName="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`mono rounded-md px-2 py-1 text-[0.6rem] font-bold ${METHOD_TONES[endpoint.method]}`}>
                            {endpoint.method}
                        </span>
                        <code className="mono text-sm font-semibold text-slate-900">{endpoint.path}</code>
                    </div>
                    <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-500">{endpoint.summary}</p>
                </div>
                <button
                    type="button"
                    onClick={tryIt}
                    disabled={running}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                >
                    {running ? 'Sending…' : 'Try it'}
                </button>
            </div>

            {endpoint.notes && (
                <ul className="mt-4 space-y-1.5">
                    {endpoint.notes.map((note) => (
                        <li key={note} className="flex gap-2 text-xs leading-6 text-slate-500">
                            <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-slate-300" />
                            {note}
                        </li>
                    ))}
                </ul>
            )}

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {endpoint.body && <CodeBlock label="Request body" value={endpoint.body} maxHeight={240} />}
                <CodeBlock
                    label="Example response"
                    value={endpoint.response}
                    maxHeight={240}
                    collapsible={!endpoint.body}
                />
            </div>

            {live && (
                <div className="mt-3">
                    <div className="mb-2">
                        <Pill tone={live.ok ? 'emerald' : 'rose'} dot>
                            {live.ok ? 'Live call succeeded' : 'Live call failed'}
                        </Pill>
                    </div>
                    <CodeBlock label="Live response" value={live.result} maxHeight={260} collapsible />
                </div>
            )}
        </Panel>
    );
}

export default function ApiDocs() {
    return (
        <AppLayout
            title="API Reference"
            eyebrow="Developer reference"
            heading="API Reference"
            description="The four endpoints that power GoliTransit, documented with live examples you can run from this page."
        >
            <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
                <Panel
                    eyebrow="Conventions"
                    title="Before you start"
                    className="mb-6"
                >
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                            <p className="text-xs font-bold text-slate-900">Content type</p>
                            <p className="mt-1 text-xs leading-6 text-slate-500">
                                Send <code className="mono text-slate-700">application/json</code> and set{' '}
                                <code className="mono text-slate-700">Accept: application/json</code>.
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-900">Travel modes</p>
                            <p className="mt-1 text-xs leading-6 text-slate-500">
                                <code className="mono text-slate-700">car</code>,{' '}
                                <code className="mono text-slate-700">rickshaw</code>, and{' '}
                                <code className="mono text-slate-700">walk</code>. Goli edges reject cars; overpasses are walk-only.
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-900">Errors</p>
                            <p className="mt-1 text-xs leading-6 text-slate-500">
                                Validation failures return <code className="mono text-slate-700">400</code> with a{' '}
                                <code className="mono text-slate-700">details</code> object; unexpected failures return{' '}
                                <code className="mono text-slate-700">500</code>.
                            </p>
                        </div>
                    </div>
                </Panel>

                <div className="grid gap-4">
                    {ENDPOINTS.map((endpoint) => (
                        <Endpoint key={endpoint.id} endpoint={endpoint} />
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
