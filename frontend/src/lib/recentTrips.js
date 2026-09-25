const STORAGE_KEY = 'golitransit:recent-trips';
const MAX_TRIPS = 8;

/**
 * Recent trips live in localStorage rather than on the backend: the API has no
 * user accounts, and a traveller still expects their last few journeys to be
 * one tap away.
 */
export function readTrips() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

export function saveTrip(trip) {
    try {
        const existing = readTrips().filter((item) => !(item.start === trip.start && item.destination === trip.destination));
        const next = [{ ...trip, savedAt: Date.now() }, ...existing].slice(0, MAX_TRIPS);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
    } catch (error) {
        return readTrips();
    }
}

export function clearTrips() {
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        /* storage unavailable - nothing to clear */
    }
    return [];
}
