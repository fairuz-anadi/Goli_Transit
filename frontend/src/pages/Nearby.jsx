import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import LiveMapCanvas from '@shared/Components/LiveMap/LiveMapCanvas';
import PageHeader from '@app/components/PageHeader';
import BackendDown from '@app/components/BackendDown';
import useGraph from '@app/hooks/useGraph';

/** Great-circle distance in km — good enough for "what's near me" ranking. */
function haversineKm(a, b) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return 2 * R * Math.asin(Math.sqrt(h));
}

/** Rough walking time at ~4.5 km/h. */
function walkMinutes(km) {
    return Math.max(1, Math.round((km / 4.5) * 60));
}

const TYPE_STYLES = {
    hub: 'bg-cyan-100 text-cyan-700',
    overpass: 'bg-amber-100 text-amber-700',
    goli: 'bg-emerald-100 text-emerald-700',
};

export default function Nearby() {
    const { graph, state, error, reload } = useGraph();
    const [position, setPosition] = useState(null);
    const [locationState, setLocationState] = useState('idle');
    const [locationError, setLocationError] = useState(null);

    function locate() {
        if (!('geolocation' in navigator)) {
            setLocationState('unsupported');
            setLocationError('This browser does not support location services.');
            return;
        }

        setLocationState('locating');
        navigator.geolocation.getCurrentPosition(
            (fix) => {
                setPosition({ lat: fix.coords.latitude, lng: fix.coords.longitude, accuracy: fix.coords.accuracy });
                setLocationState('ready');
                setLocationError(null);
            },
            (failure) => {
                setLocationState('error');
                setLocationError(
                    failure.code === failure.PERMISSION_DENIED
                        ? 'Location permission was denied. Enable it in your browser settings to see what is near you.'
                        : 'Your location is currently unavailable.',
                );
            },
            { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 },
        );
    }

    useEffect(() => {
        locate();
    }, []);

    const nearest = useMemo(() => {
        if (!position || !graph.nodes.length) return [];
        return graph.nodes
            .map((node) => ({ ...node, km: haversineKm(position, { lat: Number(node.lat), lng: Number(node.lng) }) }))
            .sort((a, b) => a.km - b.km)
            .slice(0, 12);
    }, [position, graph.nodes]);

    if (state === 'error') {
        return (
            <>
                <PageHeader eyebrow="Around you" heading="What's nearby" />
                <div className="px-5 py-12 sm:px-8">
                    <BackendDown error={error} onRetry={reload} />
                </div>
            </>
        );
    }

    return (
        <>
            <PageHeader
                eyebrow="Around you"
                heading="What's nearby"
                description="Your closest hubs, golis, and overpasses — ranked by how far you'd have to walk to reach them."
                actions={
                    <button
                        type="button"
                        onClick={locate}
                        disabled={locationState === 'locating'}
                        className="rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-60"
                    >
                        {locationState === 'locating' ? 'Locating…' : 'Update my location'}
                    </button>
                }
            />

            <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
                {locationError && (
                    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                        <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <strong className="block text-sm font-semibold text-amber-800">Can't pinpoint you</strong>
                            <p className="mt-0.5 text-xs leading-5 text-amber-700/90">{locationError}</p>
                        </div>
                    </div>
                )}

                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-slate-900">Closest stops</h2>
                            {position && (
                                <span className="mono text-[0.6rem] text-slate-400">
                                    ±{Math.round(position.accuracy)}m
                                </span>
                            )}
                        </div>

                        {!position && locationState === 'locating' && (
                            <p className="py-10 text-center text-sm text-slate-400">Finding your location…</p>
                        )}

                        {!position && locationState !== 'locating' && (
                            <p className="py-10 text-center text-sm text-slate-400">
                                Allow location access to see the stops closest to you.
                            </p>
                        )}

                        {position && (
                            <div className="mt-4 space-y-2">
                                {nearest.map((node, index) => (
                                    <div
                                        key={node.id}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-3 transition hover:border-slate-200 hover:bg-white"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="mono text-[0.6rem] font-bold text-slate-300">
                                                    {String(index + 1).padStart(2, '0')}
                                                </span>
                                                <span className="truncate text-sm font-semibold text-slate-800">{node.name}</span>
                                                <span className={`rounded-full px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider ${TYPE_STYLES[node.type] ?? 'bg-slate-100 text-slate-500'}`}>
                                                    {node.type}
                                                </span>
                                            </div>
                                            <div className="mt-0.5 text-[0.68rem] text-slate-400">
                                                {node.km < 1 ? `${Math.round(node.km * 1000)} m` : `${node.km.toFixed(1)} km`} away ·
                                                about {walkMinutes(node.km)} min walk
                                            </div>
                                        </div>
                                        <Link
                                            to={`/plan?from=${node.id}&to=gulshan_2`}
                                            className="flex-shrink-0 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-[0.62rem] font-semibold text-teal-700 transition hover:bg-teal-100"
                                        >
                                            Start here
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
                        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400" />
                        <div className="h-[520px] sm:h-[620px]">
                            <LiveMapCanvas graph={graph} route={null} className="h-full rounded-none" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
