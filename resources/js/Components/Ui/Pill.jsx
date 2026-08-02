const TONES = {
    slate: 'border-slate-200 bg-slate-50 text-slate-600',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
};

const DOTS = {
    slate: 'bg-slate-400',
    cyan: 'bg-cyan-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    violet: 'bg-violet-500',
};

export default function Pill({ tone = 'slate', dot = false, pulse = false, className = '', children }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-wide ${TONES[tone] ?? TONES.slate} ${className}`}
        >
            {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOTS[tone] ?? DOTS.slate} ${pulse ? 'animate-pulse' : ''}`} />}
            {children}
        </span>
    );
}
