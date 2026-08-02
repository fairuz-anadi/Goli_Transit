import { useEffect, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export const NAV_ITEMS = [
    { href: '/', label: 'Home' },
    { href: '/planner', label: 'Planner' },
    { href: '/control-room', label: 'Control Room' },
    { href: '/network', label: 'Network' },
    { href: '/status', label: 'Status' },
    { href: '/api-docs', label: 'API' },
    { href: '/about', label: 'About' },
];

function isActive(currentUrl, href) {
    const path = currentUrl.split('?')[0];
    return href === '/' ? path === '/' : path.startsWith(href);
}

/**
 * Shared shell for every non-landing page: ambient background, sticky nav with
 * the current page highlighted, an optional page header, and a footer. Keeping
 * this in one place is what stops the app from feeling like a set of separate
 * backend-rendered documents.
 */
export default function AppLayout({ title, eyebrow, heading, description, actions, children }) {
    const { url } = usePage();
    const [menuOpen, setMenuOpen] = useState(false);
    const [clock, setClock] = useState(null);

    useEffect(() => {
        setClock(new Date());
        const timer = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        setMenuOpen(false);
    }, [url]);

    return (
        <>
            {title && <Head title={title} />}

            <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-white text-slate-900">
                {/* Ambient background, matched to the landing page */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-cyan-100/60 to-transparent blur-3xl" />
                    <div className="absolute top-[620px] -left-40 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-emerald-100/40 to-transparent blur-3xl" />
                </div>
                <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(0,0,0,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.5)_1px,transparent_1px)] [background-size:56px_56px]" />

                {/* ── Navbar ── */}
                <nav className="sticky top-0 z-40 border-b border-slate-100/80 bg-white/75 backdrop-blur-xl">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
                        <Link href="/" className="group flex flex-shrink-0 items-center gap-3">
                            <div className="relative rounded-xl bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50 p-1.5 shadow-sm ring-1 ring-teal-200/70">
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
                            {NAV_ITEMS.map((item) => {
                                const active = isActive(url, item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                                            active
                                                ? 'bg-slate-900 text-white shadow-sm'
                                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="mono mr-1 hidden items-center gap-1.5 text-xs text-slate-400 xl:flex">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                {clock ? clock.toLocaleTimeString('en-US', { hour12: false }) : '--:--:--'} BST
                            </div>
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
                                {NAV_ITEMS.map((item) => {
                                    const active = isActive(url, item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                                                active ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </nav>

                {/* ── Page header ── */}
                {(heading || eyebrow) && (
                    <header className="relative z-10 border-b border-slate-100 bg-gradient-to-b from-slate-50/60 to-white">
                        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:px-8 sm:py-10 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl animate-fade-in-up">
                                {eyebrow && (
                                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3.5 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-cyan-700">
                                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                                        {eyebrow}
                                    </div>
                                )}
                                {heading && (
                                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{heading}</h1>
                                )}
                                {description && (
                                    <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">{description}</p>
                                )}
                            </div>
                            {actions && <div className="flex flex-wrap items-center gap-2.5 animate-fade-in-up delay-100">{actions}</div>}
                        </div>
                    </header>
                )}

                <main className="relative z-10 flex-1">{children}</main>

                {/* ── Footer ── */}
                <footer className="relative z-10 border-t border-slate-100 bg-white/60 backdrop-blur-sm">
                    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-9 sm:px-8 sm:flex-row sm:items-start sm:justify-between">
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
                                <p className="mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-slate-400">Product</p>
                                <div className="flex flex-col gap-1.5">
                                    <Link href="/planner" className="text-xs text-slate-500 transition hover:text-slate-900">Route Planner</Link>
                                    <Link href="/control-room" className="text-xs text-slate-500 transition hover:text-slate-900">Control Room</Link>
                                    <Link href="/network" className="text-xs text-slate-500 transition hover:text-slate-900">Network Explorer</Link>
                                </div>
                            </div>
                            <div>
                                <p className="mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-slate-400">System</p>
                                <div className="flex flex-col gap-1.5">
                                    <Link href="/status" className="text-xs text-slate-500 transition hover:text-slate-900">System Status</Link>
                                    <Link href="/api-docs" className="text-xs text-slate-500 transition hover:text-slate-900">API Reference</Link>
                                    <Link href="/about" className="text-xs text-slate-500 transition hover:text-slate-900">About</Link>
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
        </>
    );
}
