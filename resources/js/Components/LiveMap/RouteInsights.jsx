import React from 'react';
import { prettyPlace, routeMood } from '@/lib/routeNarration';

function bestChoiceTitle(route, preference) {
    if (preference === 'least_switching') return 'Best current option: smoothest route';
    if (preference === 'walking_friendly') return 'Best current option: walking-aware journey';
    if (preference === 'low_complexity') return 'Best current option: low-complexity path';
    if (route?.selected_modes?.length === 1) return `Best current option: ${route.selected_modes[0]}`;
    return 'Best current option: mixed journey';
}

export default function RouteInsights({ route, previousRoute, preference, nodes }) {
    const segments = Array.isArray(route?.segments) ? route.segments : [];
    const pathNames = Array.isArray(route?.path) && route.path.length
        ? route.path.map((stop) => prettyPlace(stop, nodes)).join(' → ')
        : '';
    const switchSegments = segments.filter((segment) => segment.switch_penalty > 0);
    const confidence = Math.max(55, Math.min(96, 92 - (route?.switches || 0) * 10));
    const mood = route ? routeMood(route) : null;

    const oldPath = Array.isArray(previousRoute?.path) ? previousRoute.path.map((stop) => prettyPlace(stop, nodes)).join(' → ') : null;
    const newPath = pathNames || 'No current route';
    const costDelta = previousRoute && route ? (route.total_cost ?? 0) - (previousRoute.total_cost ?? 0) : null;

    return (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                </div>
                <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.28em] text-slate-500 font-semibold">Route intelligence</p>
                    <h3 className="text-lg font-bold tracking-tight text-slate-900">Why this route & what changed</h3>
                </div>
            </div>

            {/* Top Row: Summary + Confidence bar */}
            <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
                <div>
                    <p className="text-sm leading-7 text-slate-600">
                        {route?.justification?.summary ?? 'Waiting for the live route result.'}
                    </p>
                </div>
                <div className="flex items-center gap-3 min-w-[220px]">
                    <span className="text-xs font-semibold text-cyan-700 whitespace-nowrap">{route ? `${confidence}%` : '—'}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500" style={{ width: `${route ? confidence : 0}%` }} />
                    </div>
                    <span className="text-[0.6rem] uppercase tracking-wider text-slate-400 whitespace-nowrap">Confidence</span>
                </div>
            </div>

            {/* Info Cards Row */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Best Choice */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="text-[0.6rem] uppercase tracking-[0.22em] text-cyan-600 font-semibold">Best choice</div>
                    <strong className="mt-2 block text-sm text-slate-900">{route ? bestChoiceTitle(route, preference) : 'Analyzing...'}</strong>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500">
                        {pathNames
                            ? `Path: ${pathNames}`
                            : 'Run the planner to see the recommended path.'}
                    </p>
                </div>

                {/* Switch Guidance */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="text-[0.6rem] uppercase tracking-[0.22em] text-emerald-600 font-semibold">Switch guidance</div>
                    {switchSegments.length ? (
                        <>
                            <strong className="mt-2 block text-sm text-slate-900">Switch at {prettyPlace(switchSegments[0].from, nodes)}</strong>
                            <p className="mt-1.5 text-xs leading-5 text-slate-500">
                                Continue by {switchSegments[0].mode} after switching.
                            </p>
                        </>
                    ) : (
                        <>
                            <strong className="mt-2 block text-sm text-slate-900">No switch needed</strong>
                            <p className="mt-1.5 text-xs leading-5 text-slate-500">Complete journey with one vehicle type.</p>
                        </>
                    )}
                </div>

                {/* Route Change */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="text-[0.6rem] uppercase tracking-[0.22em] text-amber-600 font-semibold">Route comparison</div>
                    {oldPath ? (
                        <>
                            <strong className="mt-2 block text-sm text-slate-900">{oldPath !== newPath ? 'Route changed' : 'Route similar'}</strong>
                            <p className="mt-1.5 text-xs leading-5 text-slate-500">
                                Cost delta: {costDelta >= 0 ? '+' : ''}{costDelta}. Switches: {previousRoute.switches ?? 0} → {route.switches ?? 0}.
                            </p>
                        </>
                    ) : (
                        <>
                            <strong className="mt-2 block text-sm text-slate-900">No comparison yet</strong>
                            <p className="mt-1.5 text-xs leading-5 text-slate-500">Differences show after a re-plan or disruption.</p>
                        </>
                    )}
                </div>

                {/* Mood / Overall */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="text-[0.6rem] uppercase tracking-[0.22em] text-violet-600 font-semibold">Trip mood</div>
                    {mood ? (
                        <>
                            <strong className="mt-2 block text-sm text-slate-900">{mood.title}</strong>
                            <p className="mt-1.5 text-xs leading-5 text-slate-500">{mood.note}</p>
                        </>
                    ) : (
                        <>
                            <strong className="mt-2 block text-sm text-slate-900">Awaiting route</strong>
                            <p className="mt-1.5 text-xs leading-5 text-slate-500">Trip mood will appear once a route is loaded.</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
