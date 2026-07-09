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
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_30px_120px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-[0.7rem] uppercase tracking-[0.32em] text-slate-400">Trip input</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">Find my best journey</h3>
                </div>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">
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
                <label className="grid gap-2 text-sm font-semibold text-slate-200">
                    Start
                    <select
                        value={start}
                        onChange={(event) => onStartChange(event.target.value)}
                        className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
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

                <label className="grid gap-2 text-sm font-semibold text-slate-200">
                    Destination
                    <select
                        value={destination}
                        onChange={(event) => onDestinationChange(event.target.value)}
                        className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
                    >
                        {nodes.map((node) => (
                            <option key={node.id} value={node.id}>
                                {node.name}
                            </option>
                        ))}
                    </select>
                </label>

                <fieldset className="grid gap-3">
                    <legend className="text-sm font-semibold text-slate-200">Allowed modes</legend>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {MODES.map((mode) => (
                            <label
                                key={mode.value}
                                className="flex min-h-[4.5rem] items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200"
                            >
                                <input
                                    type="checkbox"
                                    checked={allowedModes.includes(mode.value)}
                                    onChange={() => onModeToggle(mode.value)}
                                    className="h-4 w-4 shrink-0 accent-cyan-400"
                                />
                                <span>
                                    <strong className="block text-white">{mode.label}</strong>
                                    <span className="text-xs text-slate-400">{mode.hint}</span>
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
                                'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition',
                                preference === item.value
                                    ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-100'
                                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10',
                            ].join(' ')}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
                <p className="text-sm leading-6 text-slate-400">{preferenceHint}</p>

                <label className="grid gap-2 text-sm font-semibold text-slate-200">
                    Trip reference
                    <input
                        value={sessionId}
                        onChange={(event) => onSessionIdChange(event.target.value)}
                        autoComplete="off"
                        className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
                    />
                </label>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="submit"
                        className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-100"
                    >
                        Plan trip
                    </button>
                    <button
                        type="button"
                        onClick={onReset}
                        className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                    >
                        Use demo route
                    </button>
                </div>
            </form>
        </div>
    );
}
