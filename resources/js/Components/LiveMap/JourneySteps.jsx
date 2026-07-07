import { prettyPlace, segmentDistance, segmentHeadline, segmentVehicleLabel } from '@/lib/routeNarration';

function modeClass(mode) {
    if (mode === 'car') return 'bg-cyan-300/10 text-cyan-100 border-cyan-300/20';
    if (mode === 'rickshaw') return 'bg-emerald-300/10 text-emerald-100 border-emerald-300/20';
    if (mode === 'walk') return 'bg-amber-300/10 text-amber-100 border-amber-300/20';
    return 'bg-rose-300/10 text-rose-100 border-rose-300/20';
}

export default function JourneySteps({ route, nodes }) {
    const segments = Array.isArray(route?.segments) ? route.segments : [];

    return (
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_100px_rgba(2,6,23,0.35)] backdrop-blur-xl">
            <p className="text-[0.7rem] uppercase tracking-[0.32em] text-slate-400">Step-by-step journey</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">What vehicle to take and when to switch</h3>

            <div className="mt-5 grid gap-3">
                {segments.length ? (
                    segments.map((segment, index) => {
                        const switched = segment.switch_penalty > 0;
                        const distance = segmentDistance(segment);

                        return (
                            <div key={`${segment.edge_id || index}`} className="grid grid-cols-[auto_1fr] gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                                <div className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-sm font-bold text-white">
                                    {index + 1}
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${modeClass(segment.mode)}`}>
                                            {segmentVehicleLabel(segment.mode)}
                                        </span>
                                        {switched && (
                                            <span className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-rose-100">
                                                switch
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-2 font-semibold text-white">{segmentHeadline(segment, nodes)}</p>
                                    <p className="mt-1 text-sm text-slate-400">
                                        {switched
                                            ? `Switch vehicles at ${prettyPlace(segment.from, nodes)} before continuing.`
                                            : 'Continue on the same mode.'}{' '}
                                        Segment cost: {segment.cost}
                                        {distance ? ` - ${distance.toFixed(1)} km` : ''}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-400">
                        No route steps yet. Run the planner to generate instructions.
                    </div>
                )}
            </div>
        </div>
    );
}
