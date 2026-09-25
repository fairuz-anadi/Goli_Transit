import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LiveMapCanvas from '@shared/Components/LiveMap/LiveMapCanvas';
import useGraph from '@app/hooks/useGraph';

function Counter({ end, duration = 1200 }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!end) {
            setCount(0);
            return undefined;
        }
        let current = 0;
        const step = Math.max(1, Math.floor(end / (duration / 30)));
        const timer = setInterval(() => {
            current += step;
            if (current >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(current);
            }
        }, 30);
        return () => clearInterval(timer);
    }, [end, duration]);

    return <>{count}</>;
}

const STEPS = [
    {
        title: 'Tell us where you are going',
        body: 'Pick any hub or goli, or start from your live location.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />,
    },
    {
        title: 'We compare every mode',
        body: 'Car, rickshaw, and walking are weighed together — including the cost of switching.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M6 4v16m0 0l-3-3m3 3l3-3M18 4v16m0 0l-3-3m3 3l3-3" />,
    },
    {
        title: 'Follow it step by step',
        body: 'Clear directions, and the route re-plans the moment a jam hits your path.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />,
    },
];

const MODES = [
    { name: 'Car', chip: 'from-cyan-50 to-cyan-100 text-cyan-600', desc: 'Fastest across main arteries and long hauls.' },
    { name: 'Rickshaw', chip: 'from-emerald-50 to-emerald-100 text-emerald-600', desc: 'The natural way through narrow golis cars cannot reach.' },
    { name: 'Walk', chip: 'from-amber-50 to-amber-100 text-amber-600', desc: 'Often the quickest link for the last few hundred metres.' },
];

const DESTINATIONS = [
    { from: 'farmgate', to: 'gulshan_2', label: 'Farmgate → Gulshan 2' },
    { from: 'motijheel', to: 'banani', label: 'Motijheel → Banani' },
    { from: 'mirpur_10', to: 'shahbagh', label: 'Mirpur 10 → Shahbagh' },
    { from: 'old_dhaka', to: 'uttara_sector_3', label: 'Old Dhaka → Uttara' },
];

export default function Home() {
    const { graph, meta, state } = useGraph();

    const stats = [
        { label: 'Stations', value: meta.node_count ?? 0, color: 'text-cyan-600' },
        { label: 'Connections', value: meta.edge_count ?? 0, color: 'text-emerald-600' },
        { label: 'Goli Edges', value: meta.goli_edge_count ?? 0, color: 'text-amber-600' },
        { label: 'Overpasses', value: meta.overpass_node_count ?? 0, color: 'text-violet-600' },
    ];

    return (
        <>
            {/* ── Hero ── */}
            <section className="flex flex-col items-center px-6 pt-16 pb-8 text-center">
                <div className="mx-auto max-w-3xl">
                    <div className="mb-8 animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-gradient-to-r from-cyan-50 via-teal-50 to-emerald-50 px-4 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-teal-700 shadow-sm shadow-teal-200/50">
                            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 animate-pulse" />
                            Live in Dhaka · Real street-level graph
                        </div>
                    </div>

                    <h1 className="animate-fade-in-up delay-100 text-5xl font-black tracking-tight text-slate-900 md:text-6xl lg:text-7xl">
                        Goli<span className="bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">Transit</span>
                    </h1>

                    <p className="animate-fade-in-up delay-200 mx-auto mt-5 max-w-lg text-base leading-relaxed text-slate-500 md:text-lg">
                        Navigate Dhaka's alleyways with precision. Real-time multi-modal route planning for cars,
                        rickshaws, and walking paths.
                    </p>

                    <div className="animate-fade-in-up delay-300 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Link
                            to="/plan"
                            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 transition hover:-translate-y-0.5 hover:shadow-xl"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                            Plan a Route
                        </Link>
                        <Link
                            to="/nearby"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
                        >
                            What's near me?
                        </Link>
                    </div>

                    <div className="animate-fade-in-up delay-400 mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                        {['Real OpenStreetMap streets', 'Multi-modal by design', 'Live anomaly rerouting'].map((item) => (
                            <div key={item} className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Popular trips ── */}
            <section className="mx-auto max-w-4xl px-6 pb-4">
                <p className="text-center text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Popular right now
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    {DESTINATIONS.map((trip) => (
                        <Link
                            key={trip.label}
                            to={`/plan?from=${trip.from}&to=${trip.to}`}
                            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700"
                        >
                            {trip.label}
                        </Link>
                    ))}
                </div>
            </section>

            {/* ── Live map ── */}
            <section className="mx-auto max-w-5xl px-6 py-10">
                <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
                    <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400" />
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-6 py-5 sm:px-8">
                        <div>
                            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.26em] text-slate-500">Live map</p>
                            <h2 className="text-base font-bold tracking-tight text-slate-900">Interactive Dhaka Network</h2>
                        </div>
                        <div
                            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 ${
                                state === 'ready'
                                    ? 'border-emerald-200 bg-emerald-50'
                                    : state === 'error'
                                      ? 'border-rose-200 bg-rose-50'
                                      : 'border-slate-200 bg-slate-50'
                            }`}
                        >
                            <span
                                className={`h-2 w-2 rounded-full ${
                                    state === 'ready' ? 'bg-emerald-500 animate-pulse' : state === 'error' ? 'bg-rose-500' : 'bg-slate-400 animate-pulse'
                                }`}
                            />
                            <span className="text-[0.62rem] font-semibold uppercase tracking-wider text-slate-600">
                                {state === 'ready' ? 'Connected' : state === 'error' ? 'Offline' : 'Connecting…'}
                            </span>
                        </div>
                    </div>
                    <div className="relative h-[420px] sm:h-[480px]">
                        <LiveMapCanvas graph={graph} route={null} trackUserLocation={false} mapOptions={{ scrollWheelZoom: false }} className="h-full rounded-none" />
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className="rounded-xl border border-slate-100 bg-white/80 p-4 text-center shadow-sm transition hover:border-slate-200 hover:shadow-md">
                            <div className={`text-2xl font-bold tracking-tight ${stat.color}`}>
                                <Counter end={stat.value} />
                            </div>
                            <div className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── How it works ── */}
            <section className="mx-auto max-w-5xl px-6 py-14">
                <div className="mx-auto mb-10 max-w-xl text-center">
                    <span className="text-[0.65rem] font-bold uppercase tracking-[0.26em] text-teal-600">How it works</span>
                    <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Three steps to your fastest path</h2>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {STEPS.map((step, index) => (
                        <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 text-cyan-600">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">{step.icon}</svg>
                                </div>
                                <span className="mono text-xs font-bold text-slate-300">0{index + 1}</span>
                            </div>
                            <h3 className="mb-1.5 text-base font-bold text-slate-900">{step.title}</h3>
                            <p className="text-sm leading-relaxed text-slate-500">{step.body}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-6 text-center">
                    <Link to="/how-it-works" className="text-xs font-semibold text-teal-600 hover:underline">
                        Read the full explanation →
                    </Link>
                </div>
            </section>

            {/* ── Modes ── */}
            <section className="mx-auto max-w-5xl px-6 pb-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {MODES.map((mode) => (
                        <div key={mode.name} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${mode.chip} text-sm font-bold`}>
                                {mode.name[0]}
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">{mode.name}</h3>
                                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{mode.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="mx-auto max-w-5xl px-6 pb-16 pt-8">
                <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 px-8 py-12 text-center shadow-xl sm:px-14">
                    <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl" />
                    <div className="relative">
                        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Ready to find your fastest path through Dhaka?</h2>
                        <p className="mx-auto mt-3 max-w-md text-sm text-slate-300">Get a live, multi-modal route in seconds.</p>
                        <Link
                            to="/plan"
                            className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5"
                        >
                            Plan a Route
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
