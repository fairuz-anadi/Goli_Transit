import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@app/components/PageHeader';
import useGraph from '@app/hooks/useGraph';
import { clearTrips, readTrips } from '@app/lib/recentTrips';

function timeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export default function Trips() {
    const { graph } = useGraph();
    const [trips, setTrips] = useState([]);

    useEffect(() => {
        setTrips(readTrips());
    }, []);

    const nodeName = (id) => graph.nodes.find((node) => node.id === id)?.name ?? id;

    return (
        <>
            <PageHeader
                eyebrow="Your history"
                heading="Recent trips"
                description="The journeys you've planned on this device. Nothing is sent anywhere — it's stored locally in your browser."
                actions={
                    trips.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setTrips(clearTrips())}
                            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                        >
                            Clear history
                        </button>
                    )
                }
            />

            <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
                {trips.length === 0 ? (
                    <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50/40 px-6 py-16 text-center">
                        <p className="text-sm font-semibold text-slate-500">No trips yet</p>
                        <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-slate-400">
                            Plan a journey and it'll show up here so you can repeat it in one tap.
                        </p>
                        <Link
                            to="/plan"
                            className="mt-6 inline-flex rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-3 text-xs font-semibold text-white shadow-sm transition hover:shadow-md"
                        >
                            Plan your first trip
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {trips.map((trip) => (
                            <Link
                                key={`${trip.start}-${trip.destination}-${trip.savedAt}`}
                                to={`/plan?from=${trip.start}&to=${trip.destination}`}
                                className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300/60 hover:shadow-md"
                            >
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800">
                                        <span>{nodeName(trip.start)}</span>
                                        <span className="text-teal-400">→</span>
                                        <span>{nodeName(trip.destination)}</span>
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[0.68rem] text-slate-400">
                                        <span>{timeAgo(trip.savedAt)}</span>
                                        {trip.totalCost != null && (
                                            <>
                                                <span className="text-slate-300">·</span>
                                                <span className="mono">cost {trip.totalCost}</span>
                                            </>
                                        )}
                                        {trip.modes?.length > 0 && (
                                            <>
                                                <span className="text-slate-300">·</span>
                                                <span className="capitalize">{trip.modes.join(', ')}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <span className="flex-shrink-0 text-xs font-semibold text-teal-600">
                                    Plan again
                                    <svg className="ml-1 inline h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
