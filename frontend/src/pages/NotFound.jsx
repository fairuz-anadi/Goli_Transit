import { Link } from 'react-router-dom';

const SUGGESTIONS = [
    { to: '/plan', label: 'Plan a Trip', detail: 'Get a multi-modal route' },
    { to: '/nearby', label: 'Nearby', detail: 'Stops closest to you' },
    { to: '/coverage', label: 'Coverage', detail: 'Everywhere we route' },
];

export default function NotFound() {
    return (
        <div className="mx-auto flex max-w-3xl flex-col items-center px-5 py-20 text-center sm:px-8">
            <div className="mono bg-gradient-to-br from-cyan-500 to-emerald-500 bg-clip-text text-7xl font-black tracking-tight text-transparent sm:text-8xl">
                404
            </div>

            <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Page not found</h1>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
                That route isn't on the map. It may have moved, or the link may be out of date.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                    to="/"
                    className="rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 transition hover:-translate-y-0.5"
                >
                    Back to home
                </Link>
                <Link
                    to="/plan"
                    className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
                >
                    Plan a trip
                </Link>
            </div>

            <div className="mt-12 grid w-full gap-3 sm:grid-cols-3">
                {SUGGESTIONS.map((item) => (
                    <Link
                        key={item.to}
                        to={item.to}
                        className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300/60 hover:shadow-md"
                    >
                        <p className="text-sm font-bold text-slate-900">{item.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
