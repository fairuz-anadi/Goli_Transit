import React from 'react';

const MODES = [
    { value: 'car', label: 'Car', hint: 'Best for major roads' },
    { value: 'rickshaw', label: 'Rickshaw', hint: 'Useful for tighter corridors' },
    { value: 'walk', label: 'Walk', hint: 'Needed for overpasses and final access' },
];

const PREFERENCES = [
    { value: 'fastest', label: 'Fastest' },
    { value: 'least_switching', label: 'Least switching' },
    { value: 'walking_friendly', label: 'Walking friendly' },
    { value: 'low_complexity', label: 'Low complexity' },
];

export const USER_LOCATION_START = '__user_location__';

export default function RoutePlannerForm({
    nodes,
    start,
    destination,
    sessionId,
    allowedModes,
    preference,
    preferenceHint,
    plannerState,
    userLocationReady,
    onStartChange,
    onDestinationChange,
    onSessionIdChange,
    onModeToggle,
    onPreferenceChange,
    onSubmit,
    onReset,
}) {
    return (
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-[0.7rem] uppercase tracking-[0.32em] text-slate-500 font-semibold">Trip input</p>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Find my best journey</h3>
                </div>
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-800">
                    {plannerState}
                </span>
            </div>

            <form
                className="mt-6 grid gap-5"
                onSubmit={(event) => {
                    event.preventDefault();
                    onSubmit();
                }}
            >
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Start
                    <select
                        value={start}
                        onChange={(event) => onStartChange(event.target.value)}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-500/50"
                    >
                        <option
                            value={USER_LOCATION_START}
                            disabled={!userLocationReady}
                            title={userLocationReady ? undefined : 'Enable location to use this'}
                        >
                            {userLocationReady ? '📍 Your Location' : '📍 Your Location (unavailable)'}
                        </option>
                        {nodes.map((node) => (
                            <option key={node.id} value={node.id}>
                                {node.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Destination
                    <select
                        value={destination}
                        onChange={(event) => onDestinationChange(event.target.value)}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-500/50"
                    >
                        {nodes.map((node) => (
                            <option key={node.id} value={node.id}>
                                {node.name}
                            </option>
                        ))}
                    </select>
                </label>

                <fieldset className="grid gap-3">
                    <legend className="text-sm font-semibold text-slate-700">Allowed modes</legend>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {MODES.map((mode) => (
                            <label
                                key={mode.value}
                                className="flex min-h-[4.5rem] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm hover:border-cyan-500/30 transition duration-200 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={allowedModes.includes(mode.value)}
                                    onChange={() => onModeToggle(mode.value)}
                                    className="h-4 w-4 shrink-0 accent-cyan-600"
                                />
                                <span>
                                    <strong className="block text-slate-900">{mode.label}</strong>
                                    <span className="text-xs text-slate-500">{mode.hint}</span>
                                </span>
                            </label>
                        ))}
                    </div>
                </fieldset>

                <div className="flex flex-wrap gap-2">
                    {PREFERENCES.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => onPreferenceChange(item.value)}
                            className={[
                                'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition shadow-sm',
                                preference === item.value
                                    ? 'border-cyan-200 bg-cyan-50 text-cyan-800'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                            ].join(' ')}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
                <p className="text-sm leading-6 text-slate-500">{preferenceHint}</p>

                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Trip reference
                    <input
                        value={sessionId}
                        onChange={(event) => onSessionIdChange(event.target.value)}
                        autoComplete="off"
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-500/50"
                    />
                </label>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="submit"
                        className="inline-flex items-center rounded-full bg-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-cyan-700"
                    >
                        Plan trip
                    </button>
                    <button
                        type="button"
                        onClick={onReset}
                        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
                    >
                        Use demo route
                    </button>
                </div>
            </form>
        </div>
    );
}
