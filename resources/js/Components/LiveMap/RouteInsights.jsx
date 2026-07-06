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
        ? route.path.map((stop) => prettyPlace(stop, nodes)).join(' -> ')
        : '';
    const switchSegments = segments.filter((segment) => segment.switch_penalty > 0);
    const confidence = Math.max(55, Math.min(96, 92 - (route?.switches || 0) * 10));
    const mood = route ? routeMood(route) : null;

    const oldPath = Array.isArray(previousRoute?.path) ? previousRoute.path.map((stop) => prettyPlace(stop, nodes)).join(' -> ') : null;
    const newPath = pathNames || 'No current route';
    const costDelta = previousRoute && route ? (route.total_cost ?? 0) - (previousRoute.total_cost ?? 0) : null;

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_100px_rgba(2,6,23,0.35)] backdrop-blur-xl">
                <p className="text-[0.7rem] uppercase tracking-[0.32em] text-slate-400">Why this route</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">Route explanation</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                    {route?.justification?.summary ?? 'Waiting for the live route result.'}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                        <div className="text-[0.65rem] uppercase tracking-[0.24em] text-slate-400">Best choice right now</div>
                        <strong className="mt-2 block text-white">{route ? bestChoiceTitle(route, preference) : 'Analyzing current path...'}</strong>
                        <p className="mt-2 text-xs leading-5 text-slate-400">
                            {pathNames
                                ? `This path follows ${pathNames}, chosen by the shortest available graph cost across your allowed travel modes.`
                                : 'We will explain why this route is recommended once the trip is loaded.'}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                        <div className="text-[0.65rem] uppercase tracking-[0.24em] text-slate-400">Switch guidance</div>
                        {switchSegments.length ? (
                            <>
                                <strong className="mt-2 block text-white">Switch at {prettyPlace(switchSegments[0].from, nodes)}</strong>
                                <p className="mt-2 text-xs leading-5 text-slate-400">
                                    Your first vehicle change happens at {prettyPlace(switchSegments[0].from, nodes)}. After that, continue by {switchSegments[0].mode}.
                                </p>
                            </>
                        ) : (
                            <>
                                <strong className="mt-2 block text-white">No switch needed</strong>
                                <p className="mt-2 text-xs leading-5 text-slate-400">
                                    This route can be completed without changing to another vehicle type.
                                </p>
                            </>
                        )}
                    </div>
                </div>

                <div className="mt-5 flex items-center gap-4 rounded-2xl border border-cyan-300/10 bg-cyan-300/5 p-4">
                    <div className="flex-1">
                        <div className="text-[0.65rem] uppercase tracking-[0.24em] text-slate-400">Route confidence</div>
                        <div className="mt-2 text-sm text-slate-300">
                            {route ? `${confidence}% confidence based on current conditions and the number of transfers required.` : 'Waiting for the live result.'}
                        </div>
                    </div>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300" style={{ width: `${route ? confidence : 0}%` }} />
                    </div>
                </div>

                {mood && (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                        <strong className="block text-white">{mood.title}</strong>
                        <span className="mt-2 block text-sm leading-6 text-slate-400">{mood.note}</span>
                    </div>
                )}
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_100px_rgba(2,6,23,0.35)] backdrop-blur-xl">
                <p className="text-[0.7rem] uppercase tracking-[0.32em] text-slate-400">What changed?</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">Compare this route with the previous one</h3>

                <div className="mt-5 grid gap-3">
                    {oldPath ? (
                        <>
                            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                                <strong className="block text-white">{oldPath !== newPath ? 'Route changed' : 'Route stayed similar'}</strong>
                                <p className="mt-2 text-xs leading-5 text-slate-400">Previous: {oldPath}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                                <strong className="block text-white">Current path</strong>
                                <p className="mt-2 text-xs leading-5 text-slate-400">{newPath}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                                <strong className="block text-white">Impact summary</strong>
                                <p className="mt-2 text-xs leading-5 text-slate-400">
                                    Cost changed by {costDelta >= 0 ? '+' : ''}
                                    {costDelta}. Switches moved from {previousRoute.switches ?? 0} to {route.switches ?? 0}.
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-400">
                            When the route changes after a new plan or disruption, this panel will explain the difference.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
