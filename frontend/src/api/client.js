/**
 * Talks to the GoliTransit backend, which runs as a separate service on its own
 * port. Nothing here assumes the API shares an origin with this site, so the
 * base URL is configurable via VITE_API_BASE_URL.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000').replace(/\/+$/, '');

const JSON_HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' };

async function request(path, options = {}) {
    let response;

    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers: { ...JSON_HEADERS, ...(options.headers ?? {}) },
        });
    } catch (networkError) {
        throw new Error(
            `Could not reach the GoliTransit backend at ${API_BASE_URL}. Is it running?`,
        );
    }

    const text = await response.text();
    let payload = null;

    if (text) {
        try {
            payload = JSON.parse(text);
        } catch (parseError) {
            throw new Error(`${path} returned a non-JSON response (${response.status}).`);
        }
    }

    if (!response.ok) {
        const failure = new Error(payload?.message || payload?.error || `Request failed (${response.status})`);
        failure.status = response.status;
        failure.payload = payload;
        throw failure;
    }

    return payload;
}

export const fetchSnapshot = () => request('/api/graph/snapshot');
export const fetchHealth = () => request('/health');
export const computeRoute = (payload) => request('/api/route', { method: 'POST', body: JSON.stringify(payload) });

export default request;
