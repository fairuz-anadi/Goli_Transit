import { Link } from 'react-router-dom';
import PageHeader from '@app/components/PageHeader';

const STACK = [
    { label: 'React 18', chip: 'bg-cyan-100 text-cyan-700' },
    { label: 'React Router', chip: 'bg-violet-100 text-violet-700' },
    { label: 'Vite', chip: 'bg-amber-100 text-amber-700' },
    { label: 'Tailwind CSS', chip: 'bg-emerald-100 text-emerald-700' },
    { label: 'Leaflet + OpenStreetMap', chip: 'bg-slate-100 text-slate-600' },
    { label: 'Laravel API', chip: 'bg-rose-100 text-rose-700' },
];

export default function About() {
    return (
        <>
            <PageHeader
                eyebrow="About"
                heading="Built for the way Dhaka actually moves"
                description="GoliTransit is a multi-modal routing system for dense, constraint-heavy traffic — a city road graph, a routing engine that prices mode switches, and rerouting when disruptions hit."
            />

            <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
                <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-base font-bold text-slate-900">The idea</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                        Most route planners assume one vehicle for the whole journey and treat every street as equally
                        usable. In Dhaka neither assumption holds. Cars cannot fit down a goli, an overpass can only be
                        crossed on foot, and the quickest way across the city is frequently a combination of all three
                        modes. GoliTransit models those constraints directly, then plans across them in a single search.
                    </p>
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                        It also treats congestion as something that changes the map rather than a footnote. When a
                        corridor slows down, the cost of travelling along it rises and journeys already routed through
                        it are recalculated.
                    </p>
                </section>

                <section className="mt-6 grid gap-6 sm:grid-cols-2">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-base font-bold text-slate-900">How it's put together</h2>
                        <p className="mt-3 text-xs leading-6 text-slate-500">
                            This site is a standalone React application. It holds no routing logic of its own — every
                            journey, every stop, and every live weight comes from the GoliTransit routing service over
                            its JSON API. The two run independently, which means the public site and the operations
                            console can be developed, deployed, and scaled separately.
                        </p>
                    </div>
                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-base font-bold text-slate-900">Built with</h2>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {STACK.map((item) => (
                                <span key={item.label} className={`rounded-full px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-wide ${item.chip}`}>
                                    {item.label}
                                </span>
                            ))}
                        </div>
                        <p className="mt-4 text-xs leading-6 text-slate-500">
                            The map draws real OpenStreetMap streets, so routes follow actual road geometry rather than
                            straight lines between points.
                        </p>
                    </div>
                </section>

                <section className="mt-6 rounded-[28px] bg-gradient-to-br from-slate-900 to-teal-950 px-8 py-10 text-center">
                    <h2 className="text-xl font-bold tracking-tight text-white">Try it on a real trip</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
                        Pick two places you actually travel between and see what it suggests.
                    </p>
                    <Link
                        to="/plan"
                        className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5"
                    >
                        Plan a route
                    </Link>
                </section>
            </div>
        </>
    );
}
