import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { initLiveMap } from '@/lib/liveMap';

function locationErrorStatus(error) {
    if (error.code === error.PERMISSION_DENIED) return 'denied';
    if (error.code === error.POSITION_UNAVAILABLE) return 'unavailable';
    if (error.code === error.TIMEOUT) return 'timeout';
    return 'error';
}

const LiveMapCanvas = forwardRef(function LiveMapCanvas({ graph, route, onLocationFix, onLocationStatusChange }, ref) {
    const containerRef = useRef(null);
    const liveMapRef = useRef(null);
    const [mapReady, setMapReady] = useState(false);
    const [locationNotice, setLocationNotice] = useState(null);

    useImperativeHandle(ref, () => ({
        requestFreshFix: () => liveMapRef.current?.requestFreshFix(),
        getLastFix: () => liveMapRef.current?.getLastFix() ?? null,
    }));

    useEffect(() => {
        let cancelled = false;

        initLiveMap(containerRef.current)
            .then((liveMap) => {
                if (cancelled) return;
                liveMapRef.current = liveMap;
                setMapReady(true);
            })
            .catch((error) => {
                // eslint-disable-next-line no-console
                console.warn('Live map failed to initialize', error);
            });

        return () => {
            cancelled = true;
        };
        // Map is only initialized once; graph/route are rendered by the effect below,
        // keyed off mapReady so it always uses the *current* graph/route, not a stale
        // snapshot from whenever this mount effect happened to resolve.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!mapReady) return;
        liveMapRef.current?.renderGraph(graph.nodes, graph.edges);
        liveMapRef.current?.renderRoute(route?.path, route?.segments);
    }, [mapReady, graph, route]);

    useEffect(() => {
        if (!mapReady) return;

        const liveMap = liveMapRef.current;

        liveMap?.startTrackingUserLocation({
            onFix: (fix) => onLocationFix?.(fix),
            onSupportError: () => {
                setLocationNotice('Live location isn’t supported by this browser.');
                onLocationStatusChange?.('unsupported');
            },
            onError: (error) => {
                const status = locationErrorStatus(error);
                if (status === 'denied') {
                    setLocationNotice('Location permission denied — enable it in your browser settings to see your position on the map.');
                } else if (status === 'unavailable') {
                    setLocationNotice('Your location is currently unavailable.');
                } else if (status === 'timeout') {
                    setLocationNotice('Timed out trying to determine your location.');
                } else {
                    setLocationNotice('Unable to determine your location.');
                }
                onLocationStatusChange?.(status);
            },
        });

        return () => {
            liveMap?.stopTrackingUserLocation();
        };
        // Tracking is (re)started once per map-ready transition; onLocationFix/
        // onLocationStatusChange are inline callbacks from the parent and are
        // intentionally excluded so passing new function identities doesn't
        // restart the geolocation watch.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapReady]);

    return (
        <div className="relative h-[620px] w-full overflow-hidden rounded-[28px]">
            <div ref={containerRef} className="h-full w-full" />
            {locationNotice && (
                <div className="glass-panel pointer-events-none absolute bottom-4 left-1/2 z-[1000] -translate-x-1/2 rounded-full px-4 py-2 text-xs font-medium text-slate-100 shadow-lg">
                    {locationNotice}
                </div>
            )}
        </div>
    );
});

export default LiveMapCanvas;
