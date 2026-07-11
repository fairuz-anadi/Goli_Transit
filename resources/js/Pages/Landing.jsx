import React, { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import LiveMapCanvas from '@/Components/LiveMap/LiveMapCanvas';

function LiveCounter({ end, duration = 1400, suffix = '' }) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!end) { setCount(0); return; }
        let start = 0;
        const step = Math.max(1, Math.floor(end / (duration / 30)));
        const timer = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(start);
        }, 30);
        return () => clearInterval(timer);
    }, [end, duration]);
    return <>{count}{suffix}</>;
}

const NAV_LINKS = [
    { href: '#live-map', label: 'Live Map' },
    { href: '#how-it-works', label: 'How it Works' },
    { href: '#features', label: 'Features' },
];

const STEPS = [
    {
        title: 'Set your start & destination',
        body: 'Search any hub, goli, or drop a pin — or start from your live location.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />,
    },
    {
        title: 'Compare every mode',
        body: 'Weigh car, rickshaw, and walking paths side by side on cost, time, and switches.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M6 4v16m0 0l-3-3m3 3l3-3M18 4v16m0 0l-3-3m3 3l3-3" />,
    },
    {
        title: 'Follow live guidance',
        body: 'The graph reroutes automatically the moment traffic or a disruption hits your path.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />,
    },
];

const MODES = [
    {
        name: 'Car',
        color: 'cyan',
        desc: 'Fastest for longer hauls across main arteries and connectors.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 0h-12" />,
    },
    {
        name: 'Rickshaw',
        color: 'emerald',
        desc: 'The natural way through narrow golis cars can\'t reach.',
        icon: <><circle cx="6" cy="17" r="3" /><circle cx="18" cy="17" r="3" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 17h6M12 17l2.5-7.5h2.5M9 9.5h3l-1 4" /></>,
    },
    {
        name: 'Walk',
        color: 'amber',
        desc: 'Often the quickest link for the last few hundred meters.',
        icon: <><circle cx="12" cy="5.5" r="1.75" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5v5.5m0 0l-3 6m3-6l3 6m-3-6l-2.25-3m2.25 3l2.25-3" /></>,
    },
];

const FEATURES = [
    {
        href: '/planner',
        title: 'Route Planner',
        desc: 'Live multi-modal routing across the full graph, rendered on an interactive street map.',
        cta: 'Launch',
        accent: 'cyan',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />,
    },
    {
        href: '/control-room',
        title: 'Control Room',
        desc: 'Simulate disruptions, adjust road pressure, and manage the transit graph live.',
        cta: 'Manage',
        accent: 'amber',
        icon: <><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>,
    },
    {
        href: '/dashboard',
        title: 'Analytics',
        desc: 'View graph health, station metrics, connection count, and system overview.',
        cta: 'View',
        accent: 'violet',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    },
];

const ACCENTS = {
    cyan: { chip: 'from-cyan-50 to-cyan-100 text-cyan-600', border: 'hover:border-cyan-300/50', text: 'text-cyan-600 group-hover:text-cyan-700', dot: 'bg-cyan-500' },
    emerald: { chip: 'from-emerald-50 to-emerald-100 text-emerald-600', border: 'hover:border-emerald-300/50', text: 'text-emerald-600 group-hover:text-emerald-700', dot: 'bg-emerald-500' },
    amber: { chip: 'from-amber-50 to-amber-100 text-amber-600', border: 'hover:border-amber-300/50', text: 'text-amber-600 group-hover:text-amber-700', dot: 'bg-amber-500' },
    violet: { chip: 'from-violet-50 to-violet-100 text-violet-600', border: 'hover:border-violet-300/50', text: 'text-violet-600 group-hover:text-violet-700', dot: 'bg-violet-500' },
};

export default function Landing() {
    const [time, setTime] = useState(new Date());
    const [graph, setGraph] = useState({ nodes: [], edges: [] });
    const [meta, setMeta] = useState({});
    const [graphState, setGraphState] = useState('loading');

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const response = await fetch('/api/graph/snapshot', { headers: { Accept: 'application/json' } });
                const snapshot = await response.json();
                if (cancelled) return;
                setGraph({ nodes: snapshot.data?.nodes ?? [], edges: snapshot.data?.edges ?? [] });
                setMeta(snapshot.meta ?? {});
                setGraphState('ready');
            } catch (error) {
                if (!cancelled) setGraphState('error');
            }
        })();

        return () => { cancelled = true; };
    }, []);

    const stats = [
        { label: 'Stations', value: meta.node_count ?? 0, color: 'text-cyan-600' },
        { label: 'Connections', value: meta.edge_count ?? 0, color: 'text-emerald-600' },
        { label: 'Goli Edges', value: meta.goli_edge_count ?? 0, color: 'text-amber-600' },
        { label: 'Overpasses', value: meta.overpass_node_count ?? 0, color: 'text-violet-600' },
    ];

    return (
        <>
            <Head title="GoliTransit — Dhaka's Hyperlocal Route Planner">
                <meta name="description" content="Navigate Dhaka's alleyways with precision. Real-time multi-modal route planning for cars, rickshaws, and walking paths, backed by a live street-level graph." />
            </Head>
            <div className="relative min-h-screen flex flex-col overflow-x-hidden bg-white text-slate-900">
                {/* Background decorations */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-40 -right-40 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-cyan-300/50 via-teal-200/40 to-transparent blur-3xl" />
                    <div className="absolute top-[680px] -left-48 h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-emerald-300/40 via-cyan-200/30 to-transparent blur-3xl" />
                    <div className="absolute top-[1350px] left-1/2 -translate-x-1/2 h-[320px] w-[680px] rounded-full bg-gradient-to-r from-amber-200/30 via-emerald-200/30 to-cyan-200/30 blur-3xl" />
                    <div className="absolute top-[200px] left-1/3 h-[280px] w-[280px] rounded-full bg-gradient-to-br from-fuchsia-200/20 to-transparent blur-3xl" />
                </div>
                <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(0,0,0,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.5)_1px,transparent_1px)] [background-size:56px_56px]" />

                {/* ── Navbar ── */}
                <nav className="sticky top-0 z-30 border-b border-slate-100/80 bg-white/70 backdrop-blur-xl animate-fade-in">
                    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                        <div className="flex items-center gap-3">
                            <div className="relative rounded-xl bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50 p-1.5 shadow-sm ring-1 ring-teal-200/70">
                                <ApplicationLogo className="h-8 w-8" />
                            </div>
                            <div>
                                <span className="text-sm font-black tracking-tight text-slate-900">
                                    Goli<span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">Transit</span>
                                </span>
                                <span className="ml-2 text-[0.6rem] uppercase tracking-[0.2em] text-slate-400 hidden sm:inline">Dhaka Transit</span>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center gap-6">
                            {NAV_LINKS.map((link) => (
                                <a key={link.href} href={link.href} className="text-xs font-semibold text-slate-500 transition hover:text-slate-900">
                                    {link.label}
                                </a>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="hidden lg:flex items-center gap-1.5 mr-3 text-xs text-slate-400 mono">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {time.toLocaleTimeString('en-US', { hour12: false })} BST
                            </div>
                            <Link
                                href="/planner"
                                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 hover:shadow-md"
                            >
                                Open Planner →
                            </Link>
                        </div>
                    </div>
                </nav>

                <main className="relative z-10 flex-1">
                    {/* ── Hero Section ── */}
                    <section className="flex flex-col items-center px-6 pt-16 pb-8 text-center">
                        <div className="max-w-3xl mx-auto">
                            <div className="mb-8 animate-fade-in-up">
                                <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-gradient-to-r from-cyan-50 via-teal-50 to-emerald-50 px-4 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-teal-700 shadow-sm shadow-teal-200/50">
                                    <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 animate-pulse" />
                                    Live in Dhaka · Real street-level graph
                                </div>
                            </div>

                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 animate-fade-in-up delay-100">
                                Goli<span className="bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">Transit</span>
                            </h1>

                            <p className="mt-5 max-w-lg mx-auto text-base md:text-lg text-slate-500 leading-relaxed animate-fade-in-up delay-200">
                                Navigate Dhaka's alleyways with precision. Real-time multi-modal route planning for cars, rickshaws, and walking paths.
                            </p>

                            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up delay-300">
                                <Link
                                    href="/planner"
                                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-500/40"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                    Plan a Route
                                </Link>
                                <Link
                                    href="/control-room"
                                    className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-7 py-3.5 text-sm font-semibold text-amber-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-amber-200/50"
                                >
                                    Control Room
                                </Link>
                            </div>

                            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 animate-fade-in-up delay-400">
                                {['Real OpenStreetMap streets', 'Multi-modal by design', 'Live anomaly rerouting'].map((item) => (
                                    <div key={item} className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                        <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ── Live Map Preview ── */}
                    <section id="live-map" className="mx-auto max-w-5xl px-6 py-10 scroll-mt-20 animate-fade-in-up delay-300">
                        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
                            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400" />
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-6 py-5 sm:px-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 text-cyan-600 shadow-sm">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-[0.62rem] uppercase tracking-[0.26em] text-slate-500 font-semibold">Live map</p>
                                        <h3 className="text-base font-bold tracking-tight text-slate-900">Interactive Dhaka Network</h3>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="hidden items-center gap-3 rounded-full border border-slate-200 bg-white px-3.5 py-2 md:flex">
                                        <span className="inline-flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-wide text-slate-500">
                                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#17384e' }} /> Hub
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-wide text-slate-500">
                                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#1599d0' }} /> Goli
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-wide text-slate-500">
                                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#d89d23' }} /> Overpass
                                        </span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 ${graphState === 'ready' ? 'border-emerald-200 bg-emerald-50' : graphState === 'error' ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}>
                                        <span className={`h-2 w-2 rounded-full ${graphState === 'ready' ? 'bg-emerald-500 animate-pulse' : graphState === 'error' ? 'bg-rose-500' : 'bg-slate-400 animate-pulse'}`} />
                                        <span className={`text-[0.62rem] uppercase tracking-wider font-semibold ${graphState === 'ready' ? 'text-emerald-700' : graphState === 'error' ? 'text-rose-700' : 'text-slate-500'}`}>
                                            {graphState === 'ready' ? 'Connected' : graphState === 'error' ? 'Offline' : 'Connecting…'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative h-[420px] sm:h-[480px]">
                                <LiveMapCanvas
                                    graph={graph}
                                    route={null}
                                    trackUserLocation={false}
                                    mapOptions={{ scrollWheelZoom: false }}
                                    className="h-full rounded-none"
                                />
                            </div>
                        </div>

                        {/* Stats Strip */}
                        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {stats.map((stat) => (
                                <div key={stat.label} className="rounded-xl border border-slate-100 bg-white/80 backdrop-blur-sm p-4 text-center shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300">
                                    <div className={`text-2xl font-bold tracking-tight ${stat.color}`}>
                                        <LiveCounter end={stat.value} />
                                    </div>
                                    <div className="mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-slate-400 font-semibold">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── How it Works ── */}
                    <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-14 scroll-mt-20">
                        <div className="text-center max-w-xl mx-auto mb-10 animate-fade-in-up">
                            <span className="text-[0.65rem] uppercase font-bold tracking-[0.26em] text-cyan-600">How it works</span>
                            <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Three steps to your fastest path</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {STEPS.map((step, i) => (
                                <div key={step.title} className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-fade-in-up" style={{ animationDelay: `${i * 100 + 100}ms` }}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 text-cyan-600">
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">{step.icon}</svg>
                                        </div>
                                        <span className="mono text-xs font-bold text-slate-300">0{i + 1}</span>
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 mb-1.5">{step.title}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">{step.body}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── Mode Comparison ── */}
                    <section className="mx-auto max-w-5xl px-6 py-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {MODES.map((mode, i) => {
                                const accent = ACCENTS[mode.color];
                                return (
                                    <div key={mode.name} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-fade-in-up" style={{ animationDelay: `${i * 100 + 100}ms` }}>
                                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent.chip}`}>
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">{mode.icon}</svg>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900">{mode.name}</h4>
                                            <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{mode.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* ── Feature Cards ── */}
                    <section id="features" className="mx-auto max-w-5xl px-6 py-14 scroll-mt-20">
                        <div className="text-center max-w-xl mx-auto mb-10 animate-fade-in-up">
                            <span className="text-[0.65rem] uppercase font-bold tracking-[0.26em] text-cyan-600">Explore</span>
                            <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Everything you need to move smarter</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {FEATURES.map((feature, i) => {
                                const accent = ACCENTS[feature.accent];
                                return (
                                    <Link
                                        key={feature.title}
                                        href={feature.href}
                                        className={`group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg ${accent.border} transition-all duration-300 hover:-translate-y-1 text-left animate-fade-in-up`}
                                        style={{ animationDelay: `${i * 100 + 100}ms` }}
                                    >
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accent.chip} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">{feature.icon}</svg>
                                        </div>
                                        <h3 className="text-base font-bold text-slate-900 mb-1">{feature.title}</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
                                        <div className={`mt-4 flex items-center text-xs font-semibold ${accent.text}`}>
                                            <span>{feature.cta}</span>
                                            <svg className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>

                    {/* ── CTA Band ── */}
                    <section className="mx-auto max-w-5xl px-6 pb-16">
                        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 px-8 py-12 text-center shadow-xl sm:px-14">
                            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
                            <div className="relative">
                                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Ready to find your fastest path through Dhaka?</h2>
                                <p className="mt-3 max-w-md mx-auto text-sm text-slate-300">Open the planner and get a live, multi-modal route in seconds.</p>
                                <div className="mt-7">
                                    <Link
                                        href="/planner"
                                        className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                                    >
                                        Plan a Route
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                {/* ── Footer ── */}
                <footer className="relative z-10 border-t border-slate-100 bg-white/50 backdrop-blur-sm">
                    <div className="mx-auto max-w-6xl flex flex-col gap-6 px-6 py-10 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <ApplicationLogo className="h-6 w-6" />
                                <span className="text-sm font-bold text-slate-900">
                                    Goli<span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">Transit</span>
                                </span>
                            </div>
                            <p className="mt-2 max-w-xs text-xs text-slate-400 leading-relaxed">Hyperlocal, multi-modal route planning built for Dhaka's streets and golis.</p>
                        </div>
                        <div className="flex flex-wrap gap-x-10 gap-y-4">
                            <div>
                                <p className="text-[0.6rem] uppercase tracking-[0.2em] text-slate-400 font-semibold mb-2">Product</p>
                                <div className="flex flex-col gap-1.5">
                                    <Link href="/planner" className="text-xs text-slate-500 hover:text-slate-900 transition">Route Planner</Link>
                                    <Link href="/control-room" className="text-xs text-slate-500 hover:text-slate-900 transition">Control Room</Link>
                                    <Link href="/dashboard" className="text-xs text-slate-500 hover:text-slate-900 transition">Analytics</Link>
                                </div>
                            </div>
                            <div>
                                <p className="text-[0.6rem] uppercase tracking-[0.2em] text-slate-400 font-semibold mb-2">Built with</p>
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-xs text-slate-500">Laravel &amp; Inertia</span>
                                    <span className="text-xs text-slate-500">Leaflet &amp; OpenStreetMap</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-slate-100 px-6 py-4">
                        <div className="mx-auto max-w-6xl text-center text-xs text-slate-400">
                            © {new Date().getFullYear()} GoliTransit · Built for Dhaka's streets
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
