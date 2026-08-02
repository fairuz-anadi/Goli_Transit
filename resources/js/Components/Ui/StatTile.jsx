const ACCENTS = {
    cyan: 'text-cyan-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    violet: 'text-violet-600',
    rose: 'text-rose-600',
    slate: 'text-slate-900',
};

export default function StatTile({ label, value, detail, accent = 'slate', className = '' }) {
    return (
        <div className={`rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3.5 transition hover:border-slate-200 hover:bg-white hover:shadow-sm ${className}`}>
            <div className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</div>
            <div className={`mono mt-1.5 text-2xl font-bold tracking-tight ${ACCENTS[accent] ?? ACCENTS.slate}`}>{value}</div>
            {detail && <div className="mt-1 text-xs leading-5 text-slate-500">{detail}</div>}
        </div>
    );
}
