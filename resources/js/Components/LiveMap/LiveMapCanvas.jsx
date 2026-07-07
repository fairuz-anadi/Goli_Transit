import { useEffect, useRef, useState } from 'react';
import { initLiveMap } from '@/lib/liveMap';

export default function LiveMapCanvas({ graph, route }) {
    const containerRef = useRef(null);
    const liveMapRef = useRef(null);
    const [mapReady, setMapReady] = useState(false);

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

    return <div ref={containerRef} className="h-[620px] w-full overflow-hidden rounded-[28px]" />;
}
