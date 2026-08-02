const JSON_HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' };

/**
 * Small wrapper around fetch for the GoliTransit JSON API.
 *
 * Every frontend page goes through this so a failing endpoint surfaces as a
 * thrown Error with a readable message instead of a raw JSON blob or an
 * unhandled rejection.
 */
async function request(path, options = {}) {
    const response = await fetch(path, {
        ...options,
        headers: { ...JSON_HEADERS, ...(options.headers ?? {}) },
    });

    const text = await response.text();
    let payload = null;

    if (text) {
        try {
            payload = JSON.parse(text);
        } catch (error) {
            throw new Error(`${path} returned a non-JSON response (${response.status}).`);
        }
    }

    if (!response.ok) {
        const message = payload?.message || payload?.error || `Request failed (${response.status})`;
        const failure = new Error(message);
        failure.status = response.status;
        failure.payload = payload;
        throw failure;
    }

    return payload;
}

export function fetchSnapshot() {
    return request('/api/graph/snapshot');
}

export function fetchHealth() {
    return request('/health');
}

export function computeRoute(payload) {
    return request('/api/route', { method: 'POST', body: JSON.stringify(payload) });
}

export function triggerAnomaly(payload) {
    return request('/api/anomaly', { method: 'POST', body: JSON.stringify(payload) });
}

/** Clears every anomaly-inflated weight so the graph is back to base state. */
export function resetGraph() {
    return request('/api/graph/reset', { method: 'POST' });
}

/** Measures how long a request takes so the Status page can report latency. */
export async function timed(fn) {
    const started = performance.now();
    try {
        const data = await fn();
        return { ok: true, data, ms: Math.round(performance.now() - started) };
    } catch (error) {
        return { ok: false, error: error.message, ms: Math.round(performance.now() - started) };
    }
}

export default request;
