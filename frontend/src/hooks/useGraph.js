import { useCallback, useEffect, useState } from 'react';
import { fetchSnapshot } from '@app/api/client';

/**
 * Loads the routing graph from the backend. Several pages need it, and each
 * mounts independently, so every page owns its own request rather than relying
 * on a global store.
 */
export default function useGraph() {
    const [graph, setGraph] = useState({ nodes: [], edges: [] });
    const [meta, setMeta] = useState({});
    const [state, setState] = useState('loading');
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setState('loading');
        try {
            const snapshot = await fetchSnapshot();
            setGraph({ nodes: snapshot.data?.nodes ?? [], edges: snapshot.data?.edges ?? [] });
            setMeta(snapshot.meta ?? {});
            setState('ready');
            setError(null);
        } catch (failure) {
            setState('error');
            setError(failure.message);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return { graph, meta, state, error, reload: load };
}
