import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

function LiveCounter({ end, duration = 2000, suffix = '' }) {
    const [count, setCount] = useState(0);
    useEffect(() => {
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

export default function Landing() {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    return (
        <>
            <Head title="GoliTransit — Dhaka's Hyperlocal Route Planner" />
            <div className="relative min-h-screen flex flex-col overflow-hidden bg-white text-slate-900">
                {/* Background decorations */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-cyan-100/60 to-transparent blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-blue-100/40 to-transparent blur-3xl" />
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-gradient-to-r from-emerald-50/30 to-cyan-50/30 blur-3xl" />
                </div>
                <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(0,0,0,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.5)_1px,transparent_1px)] [background-size:56px_56px]" />

                {/* ── Navbar ── */}
                <nav className="relative z-20 border-b border-slate-100/80 bg-white/70 backdrop-blur-xl animate-fade-in">
                    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                                <ApplicationLogo className="h-7 w-7 text-cyan-600" />
                            </div>
                            <div>
                                <span className="text-sm font-bold tracking-tight text-slate-900">GoliTransit</span>
                                <span className="ml-2 text-[0.6rem] uppercase tracking-[0.2em] text-slate-400 hidden sm:inline">Dhaka Transit</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="hidden sm:flex items-center gap-1.5 mr-3 text-xs text-slate-400 mono">
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

                {/* ── Hero Section ── */}
                <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-6 py-16 text-center">
                    <div className="max-w-3xl mx-auto">
                        {/* Floating Logo */}
                        <div className="mb-8 animate-fade-in-up">
                            <div className="inline-flex rounded-3xl border border-slate-200 bg-white p-6 shadow-lg animate-float">
                                <ApplicationLogo className="h-14 w-14 text-cyan-600" />
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 animate-fade-in-up delay-100">
                            Goli<span className="bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">Transit</span>
                        </h1>

                        {/* Tagline */}
                        <p className="mt-5 max-w-lg mx-auto text-base md:text-lg text-slate-500 leading-relaxed animate-fade-in-up delay-200">
                            Navigate Dhaka's alleyways with precision. Real-time multi-modal route planning for cars, rickshaws, and walking paths.
                        </p>

                        {/* CTA Buttons */}
                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up delay-300">
                            <Link
                                href="/planner"
                                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-700 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-600/25"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                Plan a Route
                            </Link>
                            <Link
                                href="/control-room"
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
                            >
                                Control Room
                            </Link>
                        </div>
                    </div>

                    {/* ── Network Graph Preview ── */}
                    <div className="w-full max-w-2xl mt-14 animate-fade-in-up delay-400">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[0.65rem] uppercase font-bold tracking-wider text-slate-400">Live Network Graph</span>
                                </div>
                                <div className="flex items-center gap-3 text-[0.6rem] text-slate-400 mono">
                                    <span>7 nodes</span>
                                    <span>·</span>
                                    <span>12 edges</span>
                                    <span>·</span>
                                    <span>3 modes</span>
                                </div>
                            </div>

                            <svg viewBox="0 0 520 160" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                                {/* Background glow spots */}
                                <circle cx="80" cy="70" r="40" fill="rgba(6,182,212,0.04)" />
                                <circle cx="260" cy="70" r="40" fill="rgba(16,185,129,0.04)" />
                                <circle cx="440" cy="70" r="40" fill="rgba(16,185,129,0.04)" />

                                {/* Edge shadows */}
                                <path d="M 80 70 Q 170 20 260 70" fill="none" stroke="#f1f5f9" strokeWidth="8" strokeLinecap="round" />
                                <path d="M 260 70 L 440 70" fill="none" stroke="#f1f5f9" strokeWidth="8" strokeLinecap="round" />
                                <path d="M 260 70 L 360 130" fill="none" stroke="#f1f5f9" strokeWidth="8" strokeLinecap="round" />
                                <path d="M 80 70 Q 80 130 170 130" fill="none" stroke="#f1f5f9" strokeWidth="8" strokeLinecap="round" />

                                {/* Car Route (Cyan dashed) */}
                                <path d="M 80 70 Q 170 20 260 70" fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 4" className="animate-dash-flow" />

                                {/* Rickshaw Route (Emerald solid) */}
                                <path d="M 260 70 L 440 70" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />

                                {/* Walk Route (Amber dotted) */}
                                <path d="M 260 70 L 360 130" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 5" />

                                {/* Alternative path */}
                                <path d="M 80 70 Q 80 130 170 130" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" opacity="0.5" />

                                {/* Nodes with glow rings */}
                                <circle cx="80" cy="70" r="10" fill="#ffffff" stroke="#0ea5e9" strokeWidth="3" />
                                <circle cx="80" cy="70" r="14" fill="none" stroke="#0ea5e9" strokeWidth="1" opacity="0.2" />

                                <circle cx="260" cy="70" r="10" fill="#ffffff" stroke="#10b981" strokeWidth="3" />
                                <circle cx="260" cy="70" r="14" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.2" />

                                <circle cx="440" cy="70" r="10" fill="#ffffff" stroke="#10b981" strokeWidth="3" />
                                <circle cx="440" cy="70" r="14" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.2" />

                                <circle cx="360" cy="130" r="10" fill="#ffffff" stroke="#f59e0b" strokeWidth="3" />
                                <circle cx="360" cy="130" r="14" fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.2" />

                                <circle cx="170" cy="130" r="8" fill="#ffffff" stroke="#a78bfa" strokeWidth="2.5" />

                                {/* Labels */}
                                <text x="80" y="95" fontSize="10" fontWeight="700" fill="#334155" textAnchor="middle">Farmgate</text>
                                <text x="260" y="95" fontSize="10" fontWeight="700" fill="#334155" textAnchor="middle">Tejgaon</text>
                                <text x="440" y="95" fontSize="10" fontWeight="700" fill="#334155" textAnchor="middle">Gulshan 2</text>
                                <text x="360" y="150" fontSize="10" fontWeight="700" fill="#334155" textAnchor="middle">Mohakhali</text>
                                <text x="170" y="150" fontSize="9" fontWeight="600" fill="#94a3b8" textAnchor="middle">Karwan Bazar</text>

                                {/* Legend */}
                                <g transform="translate(30, 12)">
                                    <line x1="0" y1="0" x2="16" y2="0" stroke="#0ea5e9" strokeWidth="2.5" strokeDasharray="4 2" />
                                    <text x="22" y="3.5" fontSize="9" fill="#64748b" fontWeight="600">Car</text>

                                    <line x1="60" y1="0" x2="76" y2="0" stroke="#10b981" strokeWidth="2.5" />
                                    <text x="82" y="3.5" fontSize="9" fill="#64748b" fontWeight="600">Rickshaw</text>

                                    <line x1="145" y1="0" x2="161" y2="0" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="2 4" />
                                    <text x="167" y="3.5" fontSize="9" fill="#64748b" fontWeight="600">Walk</text>

                                    <line x1="210" y1="0" x2="226" y2="0" stroke="#a78bfa" strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />
                                    <text x="232" y="3.5" fontSize="9" fill="#94a3b8" fontWeight="600">Alt</text>
                                </g>
                            </svg>
                        </div>
                    </div>

                    {/* ── Live Stats Strip ── */}
                    <div className="w-full max-w-2xl mt-8 animate-fade-in-up delay-500">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { label: 'Stations', value: 7, color: 'text-cyan-600' },
                                { label: 'Edges', value: 12, color: 'text-emerald-600' },
                                { label: 'Modes', value: 3, color: 'text-amber-600' },
                                { label: 'Uptime', value: 99, color: 'text-violet-600', suffix: '%' },
                            ].map((stat) => (
                                <div key={stat.label} className="rounded-xl border border-slate-100 bg-white/80 backdrop-blur-sm p-4 text-center shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300">
                                    <div className={`text-2xl font-bold tracking-tight ${stat.color}`}>
                                        <LiveCounter end={stat.value} suffix={stat.suffix || ''} />
                                    </div>
                                    <div className="mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-slate-400 font-semibold">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Feature Cards ── */}
                    <div className="w-full max-w-3xl mt-12 animate-fade-in-up delay-600">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Link
                                href="/planner"
                                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-cyan-300/50 transition-all duration-300 hover:-translate-y-1 text-left"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 text-cyan-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-1">Route Planner</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">Live multi-modal routing across Dhaka's graph network with interactive map.</p>
                                <div className="mt-4 flex items-center text-xs font-semibold text-cyan-600 group-hover:text-cyan-700">
                                    <span>Launch</span>
                                    <svg className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </Link>

                            <Link
                                href="/control-room"
                                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-amber-300/50 transition-all duration-300 hover:-translate-y-1 text-left"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-1">Control Room</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">Simulate disruptions, adjust road pressure, and manage the transit graph live.</p>
                                <div className="mt-4 flex items-center text-xs font-semibold text-amber-600 group-hover:text-amber-700">
                                    <span>Manage</span>
                                    <svg className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </Link>

                            <Link
                                href="/dashboard"
                                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-violet-300/50 transition-all duration-300 hover:-translate-y-1 text-left"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 to-violet-100 text-violet-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-1">Analytics</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">View graph health, station metrics, connection count, and system overview.</p>
                                <div className="mt-4 flex items-center text-xs font-semibold text-violet-600 group-hover:text-violet-700">
                                    <span>View</span>
                                    <svg className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </Link>
                        </div>
                    </div>
                </main>

                {/* ── Footer ── */}
                <footer className="relative z-10 border-t border-slate-100 bg-white/50 backdrop-blur-sm">
                    <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-5">
                        <div className="flex items-center gap-2">
                            <ApplicationLogo className="h-4 w-4 text-slate-400" />
                            <span className="text-xs text-slate-400 font-medium">GoliTransit</span>
                        </div>
                        <span className="text-xs text-slate-400">© {new Date().getFullYear()} · Built for Dhaka's streets</span>
                    </div>
                </footer>
            </div>
        </>
    );
}
