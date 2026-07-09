import React from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link } from '@inertiajs/react';

function Card({ title, value, detail }) {
    return (
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <div className="text-[0.7rem] uppercase tracking-[0.3em] text-slate-500 font-semibold">{title}</div>
            <div className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{value}</div>
            <p className="mt-3 text-sm leading-7 text-slate-600">{detail}</p>
        </div>
    );
}

const cards = [
    {
        title: 'Trip planning',
        value: 'Live',
        detail: 'Use the route API to compute the best path across the graph.',
    },
    {
        title: 'Graph status',
        value: 'Healthy',
        detail: 'The topology is ready for route previews, reroutes, and demos.',
    },
];

export default function Dashboard() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-white text-slate-900 font-sans">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.06),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(251,146,60,0.04),_transparent_26%)] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.02] [background-image:linear-gradient(rgba(0,0,0,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.6)_1px,transparent_1px)] [background-size:72px_72px] pointer-events-none" />

            <nav className="relative z-10 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
                    <Link href="/" className="flex items-center gap-3">
                        <ApplicationLogo className="h-9 w-9 text-cyan-600" />
                        <div>
                            <div className="text-sm font-bold tracking-tight text-slate-900">GoliTransit</div>
                            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                                Transit control deck
                            </div>
                        </div>
                    </Link>
                </div>
            </nav>

            <header className="relative z-10 border-b border-slate-200 bg-slate-50/50 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <p className="text-[0.7rem] uppercase tracking-[0.32em] text-cyan-600 font-semibold">Welcome back</p>
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                        Transit operations dashboard
                    </h2>
                </div>
            </header>

            <Head title="Dashboard" />

            <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-cyan-800">
                        Project cockpit
                    </div>
                    <h3 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-900">
                        Your backend is ready. Now the front end feels like a product.
                    </h3>
                    <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                        This dashboard keeps the same visual language as the landing page so the app feels cohesive
                        end to end.
                    </p>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {cards.map((card) => (
                            <Card key={card.title} title={card.title} value={card.value} detail={card.detail} />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
