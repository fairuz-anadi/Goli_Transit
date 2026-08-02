export default function Panel({ eyebrow, title, description, actions, className = '', bodyClassName = 'p-6 sm:p-7', children }) {
    const hasHeader = eyebrow || title || description || actions;

    return (
        <section className={`overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm ${className}`}>
            {hasHeader && (
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/70 to-white px-6 py-5 sm:px-7">
                    <div>
                        {eyebrow && (
                            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.26em] text-cyan-600">{eyebrow}</p>
                        )}
                        {title && <h2 className="mt-1.5 text-base font-bold tracking-tight text-slate-900">{title}</h2>}
                        {description && <p className="mt-1.5 max-w-2xl text-xs leading-6 text-slate-500">{description}</p>}
                    </div>
                    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
                </div>
            )}
            <div className={bodyClassName}>{children}</div>
        </section>
    );
}
