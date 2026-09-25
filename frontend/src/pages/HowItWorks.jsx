import { Link } from 'react-router-dom';
import PageHeader from '@app/components/PageHeader';

const PROBLEMS = [
    {
        title: 'Cars cannot use every street',
        body: 'Large parts of Dhaka are golis — alleys too narrow for a car but perfectly fine on a rickshaw or on foot. Most planners route as though every road takes a car.',
    },
    {
        title: 'Overpasses are walk-only',
        body: 'A footbridge can be the fastest way across a road, but it only exists if your planner understands walk-only transfers.',
    },
    {
        title: 'The best trip mixes modes',
        body: 'A real journey often starts by car on a main road, cuts through a goli by rickshaw, and finishes on foot. Switching has a real cost, and it should be priced.',
    },
    {
        title: 'Jams should change your route',
        body: 'When a corridor seizes up, the network should degrade there and send you a different way — not keep insisting on the road that is now blocked.',
    },
];

const STEPS = [
    {
        n: '01',
        title: 'The city becomes a graph',
        body: 'Every junction is a node and every street segment is an edge. Each edge records how long it normally takes, how long it is taking right now, and which modes are allowed on it.',
    },
    {
        n: '02',
        title: 'Every mode is searched together',
        body: 'Rather than planning a car route and a walking route separately, one search runs across all three modes at once, so a mixed journey can win if it genuinely is faster.',
    },
    {
        n: '03',
        title: 'Switching costs something',
        body: 'Hopping between modes adds a penalty, and can only happen at designated transfer points. That stops the planner suggesting six vehicle changes to save a minute.',
    },
    {
        n: '04',
        title: 'Disruptions reshape the map',
        body: 'When congestion is reported, the affected edges get more expensive. Any trip already routed through them is recalculated automatically.',
    },
];

const MODES = [
    { name: 'Car', chip: 'bg-cyan-100 text-cyan-700', rule: 'Main roads and long stretches. Blocked on goli edges.' },
    { name: 'Rickshaw', chip: 'bg-emerald-100 text-emerald-700', rule: 'Almost everywhere, including the alleys cars cannot enter.' },
    { name: 'Walk', chip: 'bg-amber-100 text-amber-700', rule: 'Everywhere, and the only way across an overpass.' },
];

export default function HowItWorks() {
    return (
        <>
            <PageHeader
                eyebrow="Under the hood"
                heading="How GoliTransit finds your route"
                description="A plain-language walkthrough of what happens between tapping 'plan' and getting directions."
            />

            <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
                <section>
                    <h2 className="text-lg font-bold tracking-tight text-slate-900">Why ordinary route planners struggle here</h2>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        {PROBLEMS.map((problem) => (
                            <div key={problem.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-900">{problem.title}</h3>
                                <p className="mt-2 text-xs leading-6 text-slate-500">{problem.body}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mt-12">
                    <h2 className="text-lg font-bold tracking-tight text-slate-900">What happens when you plan a trip</h2>
                    <div className="mt-5 space-y-3">
                        {STEPS.map((step) => (
                            <div key={step.n} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <span className="mono flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-50 to-emerald-50 text-xs font-bold text-teal-700">
                                    {step.n}
                                </span>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                                    <p className="mt-1.5 text-xs leading-6 text-slate-500">{step.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mt-12">
                    <h2 className="text-lg font-bold tracking-tight text-slate-900">The rules each mode follows</h2>
                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                        {MODES.map((mode) => (
                            <div key={mode.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <span className={`inline-flex rounded-full px-3 py-1 text-[0.62rem] font-bold uppercase tracking-wide ${mode.chip}`}>
                                    {mode.name}
                                </span>
                                <p className="mt-3 text-xs leading-6 text-slate-500">{mode.rule}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mt-12 rounded-[28px] bg-gradient-to-br from-slate-900 to-teal-950 px-8 py-10 text-center">
                    <h2 className="text-xl font-bold tracking-tight text-white">See it for yourself</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
                        Plan a trip across the city and watch the modes change along the way.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <Link to="/plan" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5">
                            Plan a route
                        </Link>
                        <Link to="/faq" className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                            Read the FAQ
                        </Link>
                    </div>
                </section>
            </div>
        </>
    );
}
