import React from 'react';
import { prettyPlace, segmentDistance, segmentHeadline, segmentVehicleLabel } from '@/lib/routeNarration';

function modeColor(mode) {
    if (mode === 'car') return { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500' };
    if (mode === 'rickshaw') return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    if (mode === 'walk') return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
    return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' };
}

export default function JourneySteps({ route, nodes }) {
    const segments = Array.isArray(route?.segments) ? route.segments : [];

    return (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </div>
                <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.28em] text-slate-500 font-semibold">Step-by-step journey</p>
                    <h3 className="text-lg font-bold tracking-tight text-slate-900">Turn-by-turn directions</h3>
                </div>
            </div>

            {segments.length ? (
                <div className="relative">
                    {/* Vertical timeline line */}
                    <div className="absolute left-[18px] top-2 bottom-2 w-px bg-slate-200" />

                    <div className="grid gap-3">
                        {segments.map((segment, index) => {
                            const switched = segment.switch_penalty > 0;
                            const distance = segmentDistance(segment);
                            const colors = modeColor(segment.mode);

                            return (
                                <div key={`${segment.edge_id || index}`} className="relative grid grid-cols-[36px_1fr] gap-4 items-start">
                                    {/* Timeline dot */}
                                    <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-white shadow-sm">
                                        <span className={`h-3.5 w-3.5 rounded-full ${colors.dot}`} />
                                    </div>

                                    {/* Step content */}
                                    <div className={`rounded-2xl border ${colors.border} ${colors.bg} px-4 py-3`}>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`rounded-full border ${colors.border} px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${colors.text}`}>
                                                {segmentVehicleLabel(segment.mode)}
                                            </span>
                                            {switched && (
                                                <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-rose-600">
                                                    switch
                                                </span>
                                            )}
                                            <span className="ml-auto text-[0.65rem] text-slate-400 tabular-nums">
                                                Cost {segment.cost}{distance ? ` · ${distance.toFixed(1)} km` : ''}
                                            </span>
                                        </div>
                                        <p className="mt-1.5 text-sm font-semibold text-slate-800">{segmentHeadline(segment, nodes)}</p>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {switched
                                                ? `Switch vehicles at ${prettyPlace(segment.from, nodes)} before continuing.`
                                                : 'Continue on the same mode.'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 text-center">
                    <p className="text-sm text-slate-500">No route steps yet. Run the planner to generate turn-by-turn directions.</p>
                </div>
            )}
        </div>
    );
}
