import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Panel from '@/Components/Ui/Panel';
import Pill from '@/Components/Ui/Pill';

const CONSOLES = [
    {
        href: '/control-room',
        title: 'Control Room',
        detail: 'Compute routes, inject congestion anomalies, and watch the graph respond.',
        accent: 'amber',
    },
    {
        href: '/network',
        title: 'Network Explorer',
        detail: 'Inspect every node and edge, including live weights and mode permissions.',
        accent: 'cyan',
    },
    {
        href: '/dashboard',
        title: 'Dashboard',
        detail: 'Graph composition and congestion pressure at a glance.',
        accent: 'violet',
    },
    {
        href: '/status',
        title: 'System Status',
        detail: 'Live health and latency for every endpoint this service exposes.',
        accent: 'emerald',
    },
    {
        href: '/api-docs',
        title: 'API Reference',
        detail: 'The endpoints the public site consumes, with runnable examples.',
        accent: 'rose',
    },
];

const ENDPOINTS = [
    { method: 'GET', path: '/health' },
    { method: 'GET', path: '/api/graph/snapshot' },
    { method: 'POST', path: '/api/route' },
    { method: 'POST', path: '/api/anomaly' },
    { method: 'POST', path: '/api/graph/reset' },
];

const ACCENT_RING = {
    cyan: 'hover:border-cyan-300/60',
    amber: 'hover:border-amber-300/60',
    violet: 'hover:border-violet-300/60',
    emerald: 'hover:border-emerald-300/60',
    rose: 'hover:border-rose-300/60',
};

export default function BackendIndex({ laravelVersion, phpVersion }) {
    return (
        <AppLayout
            title="Backend Service"
            eyebrow="Backend service"
            heading="GoliTransit routing service"
            description="This is the API and operations surface. The traveller-facing site is a separate React application that consumes these endpoints — it is not served from here."
            actions={<Pill tone="emerald" dot>Operational</Pill>}
        >
            <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
                <Panel
                    eyebrow="Heads up"
                    title="Looking for the public site?"
                    description="The traveller experience — trip planning, nearby stops, coverage, FAQ — runs as its own application on its own port."
                    className="mb-6"
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3.5">
                            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-slate-400">Public site (dev)</p>
                            <p className="mono mt-1.5 text-sm font-semibold text-slate-800">http://localhost:5173</p>
                            <p className="mt-1.5 text-xs leading-6 text-slate-500">
                                Start it with <code className="mono text-slate-700">npm run dev</code> from the project root.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3.5">
                            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-slate-400">This service (dev)</p>
                            <p className="mono mt-1.5 text-sm font-semibold text-slate-800">http://127.0.0.1:8000</p>
                            <p className="mt-1.5 text-xs leading-6 text-slate-500">
                                Started with <code className="mono text-slate-700">php artisan serve</code>.
                            </p>
                        </div>
                    </div>
                </Panel>

                <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Operator consoles</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {CONSOLES.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${ACCENT_RING[item.accent]}`}
                        >
                            <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                            <p className="mt-1.5 text-xs leading-6 text-slate-500">{item.detail}</p>
                            <span className="mt-3 inline-flex items-center text-xs font-semibold text-cyan-600">
                                Open
                                <svg className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </span>
                        </Link>
                    ))}
                </div>

                <Panel className="mt-6" eyebrow="Contract" title="Endpoints served by this service">
                    <div className="grid gap-2 sm:grid-cols-2">
                        {ENDPOINTS.map((endpoint) => (
                            <div key={endpoint.path} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-2.5">
                                <span className={`mono rounded-md px-2 py-1 text-[0.6rem] font-bold ${endpoint.method === 'GET' ? 'bg-emerald-100 text-emerald-700' : 'bg-cyan-100 text-cyan-700'}`}>
                                    {endpoint.method}
                                </span>
                                <code className="mono text-xs text-slate-700">{endpoint.path}</code>
                            </div>
                        ))}
                    </div>
                    <p className="mt-4 text-xs leading-6 text-slate-500">
                        CORS is open on these routes so the public site can call them from a different origin.
                    </p>
                </Panel>

                <p className="mt-8 text-center text-xs text-slate-400">
                    Laravel {laravelVersion} · PHP {phpVersion}
                </p>
            </div>
        </AppLayout>
    );
}
