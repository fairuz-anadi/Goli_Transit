import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function Guest({ children }) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-[#050816] text-slate-100">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(251,146,60,0.12),_transparent_28%)]" />
            <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:72px_72px]" />

            <div className="relative mx-auto grid min-h-screen max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
                <section className="flex flex-col justify-between rounded-[34px] border border-white/10 bg-white/5 p-8 shadow-[0_30px_120px_rgba(2,6,23,0.4)] backdrop-blur-xl lg:p-10">
                    <div className="flex items-center gap-4">
                        <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                            <Link href="/">
                                <ApplicationLogo className="h-10 w-10 text-cyan-200" />
                            </Link>
                        </div>
                        <div>
                            <p className="text-[0.7rem] uppercase tracking-[0.34em] text-cyan-200/70">GoliTransit</p>
                            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
                                A better way to move across Dhaka
                            </h1>
                        </div>
                    </div>

                    <div className="max-w-2xl">
                        <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-cyan-100">
                            Multimodal route intelligence
                        </div>
                        <h2 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                            Sign in to the transit control deck.
                        </h2>
                        <p className="mt-4 max-w-xl text-base leading-8 text-slate-300">
                            Your backend already knows the graph. This layout gives it a polished shell so the
                            project feels intentional from the very first screen.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {[
                            ['Fast route', 'Plan a route in seconds.'],
                            ['Live graph', 'See the network before login.'],
                            ['Judge-ready', 'Styled for demos and reviews.'],
                        ].map(([title, text]) => (
                            <div key={title} className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                                <div className="text-sm font-semibold text-white">{title}</div>
                                <div className="mt-2 text-sm leading-6 text-slate-300">{text}</div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="flex items-center justify-center">
                    <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_30px_120px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8">
                        {children}
                    </div>
                </section>
            </div>
        </div>
    );
}
