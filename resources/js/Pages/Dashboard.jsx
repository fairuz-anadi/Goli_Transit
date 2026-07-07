import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link } from '@inertiajs/react';

function Card({ title, value, detail }) {
    return (
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_90px_rgba(2,6,23,0.35)] backdrop-blur-xl">
            <div className="text-[0.7rem] uppercase tracking-[0.3em] text-slate-400">{title}</div>
            <div className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</div>
            <p className="mt-3 text-sm leading-7 text-slate-300">{detail}</p>
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
        <div className="relative min-h-screen overflow-hidden bg-[#050816] text-slate-100">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(251,146,60,0.1),_transparent_26%)]" />
            <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:72px_72px]" />

            <nav className="relative z-10 border-b border-white/10 bg-slate-950/65 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
                    <Link href="/" className="flex items-center gap-3">
                        <ApplicationLogo className="h-9 w-9 text-cyan-200" />
                        <div className="hidden sm:block">
                            <div className="text-sm font-semibold tracking-tight text-white">GoliTransit</div>
                            <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                                Transit control deck
                            </div>
                        </div>
                    </Link>
                </div>
            </nav>

            <header className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <p className="text-[0.7rem] uppercase tracking-[0.32em] text-cyan-200/70">Welcome back</p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                        Transit operations dashboard
                    </h2>
                </div>
            </header>

            <Head title="Dashboard" />

            <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="rounded-[34px] border border-white/10 bg-white/5 p-6 shadow-[0_30px_120px_rgba(2,6,23,0.4)] backdrop-blur-xl sm:p-8">
                    <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-cyan-100">
                        Project cockpit
                    </div>
                    <h3 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-white">
                        Your backend is ready. Now the front end feels like a product.
                    </h3>
                    <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
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
