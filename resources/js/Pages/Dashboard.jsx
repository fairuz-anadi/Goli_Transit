import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

function Card({ title, value, detail }) {
    return (
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_90px_rgba(2,6,23,0.35)] backdrop-blur-xl">
            <div className="text-[0.7rem] uppercase tracking-[0.3em] text-slate-400">{title}</div>
            <div className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</div>
            <p className="mt-3 text-sm leading-7 text-slate-300">{detail}</p>
        </div>
    );
}

export default function Dashboard({ auth }) {
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
        {
            title: 'Account',
            value: auth.user.name,
            detail: auth.user.email,
        },
    ];

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[0.7rem] uppercase tracking-[0.32em] text-cyan-200/70">
                            Welcome back
                        </p>
                        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                            Transit operations dashboard
                        </h2>
                    </div>
                    <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">
                        Authenticated
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-[34px] border border-white/10 bg-white/5 p-6 shadow-[0_30px_120px_rgba(2,6,23,0.4)] backdrop-blur-xl sm:p-8">
                        <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-cyan-100">
                            Project cockpit
                        </div>
                        <h3 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-white">
                            Your backend is ready. Now the front end feels like a product.
                        </h3>
                        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                            This dashboard keeps the same visual language as the landing page so the app feels
                            cohesive from sign-in to route execution.
                        </p>

                        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {cards.map((card) => (
                                <Card
                                    key={card.title}
                                    title={card.title}
                                    value={card.value}
                                    detail={card.detail}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-6">
                        <div className="rounded-[34px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_30px_120px_rgba(2,6,23,0.45)] backdrop-blur-xl">
                            <p className="text-[0.7rem] uppercase tracking-[0.32em] text-slate-400">Next step</p>
                            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                                Hook this page into live route actions.
                            </h3>
                            <p className="mt-4 text-sm leading-7 text-slate-300">
                                You can now extend this shell with API buttons, graphs, session history, or anomaly
                                controls without redesigning the layout.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                                    Route API
                                </div>
                                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                                    Graph snapshot
                                </div>
                                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                                    Anomaly replay
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[34px] border border-white/10 bg-white/5 p-6 shadow-[0_30px_120px_rgba(2,6,23,0.35)] backdrop-blur-xl">
                            <p className="text-[0.7rem] uppercase tracking-[0.32em] text-slate-400">Status</p>
                            <div className="mt-4 rounded-[28px] border border-white/10 bg-slate-950/80 p-5">
                                <div className="text-lg font-semibold text-white">Signed in as</div>
                                <div className="mt-2 text-sm leading-7 text-slate-300">
                                    {auth.user.name}
                                    <br />
                                    {auth.user.email}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
