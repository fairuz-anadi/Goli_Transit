/*
 * Plain-language route narration helpers, ported from public/index.html's
 * inline script so the React journey/insight components can reuse them.
 */
const PLACE_ALIASES = {
    farmgate_overpass: 'Farmgate Overpass',
    gulshan_1: 'Gulshan 1',
    gulshan_2: 'Gulshan 2',
    dhanmondi_27: 'Dhanmondi 27',
    green_road: 'Green Road',
    karwan_bazar: 'Karwan Bazar',
    tejgaon: 'Tejgaon',
    banani: 'Banani',
    shamoli: 'Shamoli',
    panthapath: 'Panthapath',
};

export function prettyPlace(id, nodes = []) {
    if (!id) return '';
    if (PLACE_ALIASES[id]) return PLACE_ALIASES[id];
    const node = nodes.find((item) => item.id === id);
    if (node?.name) return node.name;
    return String(id)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function segmentDistance(segment) {
    const value = segment?.distance_km;
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function segmentVehicleLabel(mode) {
    if (mode === 'car') return 'Car';
    if (mode === 'rickshaw') return 'Rickshaw';
    return 'Walk';
}

export function segmentHeadline(segment, nodes) {
    const fromName = prettyPlace(segment.from, nodes);
    const toName = prettyPlace(segment.to, nodes);
    const distance = segmentDistance(segment);
    const longHop = distance >= 1.2;

    if (segment.mode === 'car') return `Take a car from ${fromName} to ${toName}.`;
    if (segment.mode === 'rickshaw') return `Ride a rickshaw from ${fromName} to ${toName}.`;
    if (segment.mode === 'walk') {
        return longHop
            ? `Use a short walking connector from ${fromName} to ${toName}.`
            : `Walk from ${fromName} to ${toName}.`;
    }
    return `Move from ${fromName} to ${toName}.`;
}

export function segmentReason(segment, route, edges = []) {
    const edge = edges.find((item) => item.id === segment.edge_id);
    const distance = segmentDistance(segment) || edge?.distance_km || 0;
    const longHop = distance >= 1.2;

    if (segment.mode === 'car') {
        return longHop
            ? 'This longer main-road stretch is best handled by car right now.'
            : 'This keeps the journey fast on a clear road section.';
    }
    if (segment.mode === 'rickshaw') {
        return longHop
            ? 'A rickshaw keeps the longer local corridor practical without unnecessary switching.'
            : 'This segment fits a tighter city corridor better than a larger vehicle.';
    }
    if (segment.mode === 'walk' && edge?.is_overpass) {
        return 'Walking is required here because this link behaves like an overpass or final-access connection.';
    }
    if (segment.mode === 'walk' && longHop && (edge?.car_allowed || edge?.rickshaw_allowed)) {
        return 'This is just a short walking connector inside a larger vehicle-based trip.';
    }
    if (segment.mode === 'walk') {
        return 'This part is short and simple to cover on foot, which keeps the route flexible.';
    }
    if (segment.switch_penalty > 0) {
        return 'The planner accepts a switch here because it improves the overall route under current conditions.';
    }
    if ((route?.switches || 0) === 0) {
        return 'This keeps the journey direct on a strong main-road section.';
    }
    return 'This segment is the fastest stable option before the next decision point.';
}

export function routeMood(route) {
    const switches = route?.switches || 0;
    const modes = Array.isArray(route?.selected_modes) ? route.selected_modes.length : 0;

    if (switches === 0 && modes <= 1) {
        return { title: 'Direct and simple', note: 'You can stay on one mode the whole way based on current conditions.' };
    }
    if (switches <= 1) {
        return { title: 'One smooth transfer', note: 'The route stays efficient with just a single planned change of vehicle.' };
    }
    return { title: 'Adaptive city journey', note: 'This path uses multiple stages to stay practical under current road conditions.' };
}

export function preferenceGuide(preference) {
    if (preference === 'least_switching') return 'Least switching highlights routes that feel smoother and easier to follow.';
    if (preference === 'walking_friendly') return 'Walking friendly helps you notice where the route relies on overpasses or short access stretches.';
    if (preference === 'low_complexity') return 'Low complexity favors easy-to-understand journeys with fewer decision points.';
    return 'Fastest mode keeps the route focused on speed under current graph conditions.';
}
