import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

const MESSAGES = {
    404: {
        title: 'Page not found',
        body: 'That route isn\'t on the map. It may have moved, or the link may be out of date.',
    },
    403: {
        title: 'Not allowed',
        body: 'You don\'t have access to this page.',
    },
    419: {
        title: 'Page expired',
        body: 'Your session timed out. Reload and try again.',
    },
    429: {
        title: 'Too many requests',
        body: 'Give it a moment before trying again.',
    },
    500: {
        title: 'Something broke on our side',
        body: 'The server hit an unexpected error. The team has it in the logs.',
    },
    503: {
        title: 'Down for maintenance',
        body: 'GoliTransit is briefly offline while we ship an update.',
    },
};

const SUGGESTIONS = [
    { href: '/planner', label: 'Route Planner', detail: 'Plan a multi-modal trip' },
    { href: '/network', label: 'Network Explorer', detail: 'Browse nodes and edges' },
    { href: '/status', label: 'System Status', detail: 'Check what is running' },
];

export default function Error({ status }) {
    const code = MESSAGES[status] ? status : 500;
    const { title, body } = MESSAGES[code];

    return (
        <AppLayout title={`${code} — ${title}`}>
            <div className="mx-auto flex max-w-3xl flex-col items-center px-5 py-20 text-center sm:px-8">
                <div className="mono text-7xl font-black tracking-tight text-transparent sm:text-8xl [background:linear-gradient(135deg,#0891b2,#10b981)] bg-clip-text">
                    {code}
                </div>

                <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
                <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">{body}</p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <Link
                        href="/"
                        className="rounded-full bg-gradient-to-r from-cyan-600 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 transition hover:-translate-y-0.5 hover:shadow-xl"
                    >
                        Back to home
                    </Link>
                    <Link
                        href="/planner"
                        className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
                    >
                        Open the planner
                    </Link>
                </div>

                <div className="mt-12 grid w-full gap-3 sm:grid-cols-3">
                    {SUGGESTIONS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300/50 hover:shadow-md"
                        >
                            <p className="text-sm font-bold text-slate-900">{item.label}</p>
                            <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
                            <span className="mt-3 inline-flex items-center text-xs font-semibold text-cyan-600">
                                Go
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
