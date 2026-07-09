import React from 'react';
import { Head, Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function Landing() {
    return (
        <>
            <Head title="GoliTransit - Dhaka's Hyperlocal Route Planner" />
            <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-[#050816] text-slate-100 font-sans">
                {/* Decorative Gradients & Grid */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.22),_transparent_50%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.15),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(251,146,60,0.12),_transparent_40%)] pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:60px_60px] pointer-events-none" />
                
                {/* Top Subtle Header */}
                <header className="relative z-10 mx-auto w-full max-w-7xl px-6 py-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur-md">
                            <ApplicationLogo className="h-7 w-7 text-cyan-200" />
                        </div>
                        <span className="text-xs uppercase font-bold tracking-[0.3em] text-cyan-200/80">GoliTransit</span>
                    </div>
                    <div className="flex gap-4">
                        <Link
                            href="/control-room"
                            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors duration-200 border border-white/10 bg-white/5 px-4 py-2 rounded-full backdrop-blur-md hover:bg-white/10"
                        >
                            Control Room
                        </Link>
                    </div>
                </header>

                {/* Hero / Main Area */}
                <main className="relative z-10 flex-grow flex flex-col justify-center items-center px-4 py-16 text-center max-w-4xl mx-auto">
                    {/* Glowing Logo Container */}
                    <div className="relative group mb-8">
                        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-400 to-amber-300 opacity-30 blur-2xl group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse" />
                        <div className="relative rounded-3xl border border-white/10 bg-slate-950/40 p-6 shadow-2xl backdrop-blur-2xl transition duration-500 hover:border-cyan-500/30">
                            <ApplicationLogo className="h-20 w-20 text-cyan-300" />
                        </div>
                    </div>

                    {/* App Title with nice gradients */}
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">
                        <span className="bg-gradient-to-r from-cyan-200 via-white to-cyan-300 bg-clip-text text-transparent">Goli</span>
                        <span className="bg-gradient-to-r from-cyan-300 via-white to-amber-200 bg-clip-text text-transparent">Transit</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="max-w-2xl text-lg md:text-xl text-slate-300 font-light leading-relaxed mb-10">
                        Dhaka's intelligent hyperlocal route planner. Navigate the city's complex corridors, adapt to live disruptions, and optimize your journey across multiple modes of transport.
                    </p>

                    {/* CTA Button */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link
                            href="/planner"
                            className="group relative inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 px-8 py-4 text-base font-bold text-slate-950 transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:scale-105 active:scale-95"
                        >
                            <span>Launch Route Planner</span>
                            <svg className="ml-2 h-5 w-5 transform transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Link>
                    </div>

                    {/* Quick Features Highlight */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-3xl w-full text-left">
                        <div className="rounded-2xl border border-white/5 bg-white/5 p-5 backdrop-blur-sm">
                            <div className="text-cyan-300 text-lg mb-2 font-semibold">Hyperlocal Focus</div>
                            <div className="text-sm text-slate-400 font-light">Navigates Dhaka's specialized lanes, alleys (golis), and major corridors seamlessly.</div>
                        </div>
                        <div className="rounded-2xl border border-white/5 bg-white/5 p-5 backdrop-blur-sm">
                            <div className="text-cyan-300 text-lg mb-2 font-semibold">Multi-Mode Routing</div>
                            <div className="text-sm text-slate-400 font-light">Mixes cars, rickshaws, and walking paths dynamically based on your preferences.</div>
                        </div>
                        <div className="rounded-2xl border border-white/5 bg-white/5 p-5 backdrop-blur-sm">
                            <div className="text-cyan-300 text-lg mb-2 font-semibold">Disruption Simulation</div>
                            <div className="text-sm text-slate-400 font-light">Simulates real-world traffic events and instantly reroutes to avoid congested streets.</div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="relative z-10 w-full text-center py-6 text-xs text-slate-500 border-t border-white/5 backdrop-blur-sm">
                    <p>© {new Date().getFullYear()} GoliTransit. Designed for Dhaka's transit network.</p>
                </footer>
            </div>
        </>
    );
}
