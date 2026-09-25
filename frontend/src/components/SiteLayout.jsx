import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import ApplicationLogo from '@shared/Components/ApplicationLogo';

const NAV_ITEMS = [
    { to: '/', label: 'Home', end: true },
    { to: '/plan', label: 'Plan a Trip' },
    { to: '/nearby', label: 'Nearby' },
    { to: '/coverage', label: 'Coverage' },
    { to: '/how-it-works', label: 'How it Works' },
    { to: '/faq', label: 'FAQ' },
];

function navClass({ isActive }) {
    return `rounded-full px-3.5 py-2 text-xs font-semibold transition ${
        isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`;
}

export default function SiteLayout() {
    const [menuOpen, setMenuOpen] = useState(false);
    const { pathname } = useLocation();

    useEffect(() => {
        setMenuOpen(false);
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-white text-slate-900">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-40 -right-40 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-cyan-300/40 via-teal-200/30 to-transparent blur-3xl" />
                <div className="absolute top-[680px] -left-48 h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-emerald-300/30 via-cyan-200/25 to-transparent blur-3xl" />
            </div>
            <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(0,0,0,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.5)_1px,transparent_1px)] [background-size:56px_56px]" />

            {/* ── Navbar ── */}
            <nav className="sticky top-0 z-40 border-b border-slate-100/80 bg-white/75 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
                    <Link to="/" className="flex flex-shrink-0 items-center gap-3">
                        <div className="rounded-xl bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50 p-1.5 shadow-sm ring-1 ring-teal-200/70">
                            <ApplicationLogo className="h-8 w-8" />
                        </div>
                        <div>
                            <div className="text-sm font-black tracking-tight text-slate-900">
                                Goli<span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">Transit</span>
                            </div>
                            <div className="hidden text-[0.6rem] uppercase tracking-[0.22em] text-slate-400 sm:block">Dhaka Transit</div>
                        </div>
                    </Link>

                    <div className="hidden items-center gap-1 lg:flex">
                        {NAV_ITEMS.map((item) => (
                            <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                                {item.label}
                            </NavLink>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            to="/plan"
                            className="hidden rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:shadow-md sm:inline-flex"
                        >
                            Plan a Route →
                        </Link>
                        <button
                            type="button"
                            onClick={() => setMenuOpen((open) => !open)}
                            aria-label="Toggle navigation"
                            aria-expanded={menuOpen}
                            className="rounded-full border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:bg-slate-50 lg:hidden"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                {menuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {menuOpen && (
                    <div className="border-t border-slate-100 bg-white/95 px-5 py-3 backdrop-blur-xl lg:hidden">
                        <div className="grid grid-cols-2 gap-2">
                            {NAV_ITEMS.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        `rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                                            isActive ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        }`
                                    }
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                )}
            </nav>

            <main className="relative z-10 flex-1">
                <Outlet />
            </main>

            {/* ── Footer ── */}
            <footer className="relative z-10 border-t border-slate-100 bg-white/60 backdrop-blur-sm">
                <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-9 sm:flex-row sm:items-start sm:justify-between sm:px-8">
                    <div>
                        <div className="flex items-center gap-2">
                            <ApplicationLogo className="h-6 w-6" />
                            <span className="text-sm font-bold text-slate-900">
                                Goli<span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">Transit</span>
                            </span>
                        </div>
                        <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-400">
                            Hyperlocal, multi-modal route planning built for Dhaka's streets and golis.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-x-10 gap-y-4">
                        <div>
                            <p className="mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-slate-400">Travel</p>
                            <div className="flex flex-col gap-1.5">
                                <Link to="/plan" className="text-xs text-slate-500 transition hover:text-slate-900">Plan a Trip</Link>
                                <Link to="/nearby" className="text-xs text-slate-500 transition hover:text-slate-900">Nearby</Link>
                                <Link to="/trips" className="text-xs text-slate-500 transition hover:text-slate-900">Recent Trips</Link>
                            </div>
                        </div>
                        <div>
                            <p className="mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-slate-400">Learn</p>
                            <div className="flex flex-col gap-1.5">
                                <Link to="/how-it-works" className="text-xs text-slate-500 transition hover:text-slate-900">How it Works</Link>
                                <Link to="/coverage" className="text-xs text-slate-500 transition hover:text-slate-900">Coverage</Link>
                                <Link to="/faq" className="text-xs text-slate-500 transition hover:text-slate-900">FAQ</Link>
                                <Link to="/about" className="text-xs text-slate-500 transition hover:text-slate-900">About</Link>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="border-t border-slate-100 px-5 py-4 sm:px-8">
                    <div className="mx-auto max-w-7xl text-center text-xs text-slate-400">
                        © {new Date().getFullYear()} GoliTransit · Built for Dhaka's streets
                    </div>
                </div>
            </footer>
        </div>
    );
}
