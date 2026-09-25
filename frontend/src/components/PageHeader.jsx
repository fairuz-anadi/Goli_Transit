export default function PageHeader({ eyebrow, heading, description, actions }) {
    return (
        <header className="border-b border-slate-100 bg-gradient-to-b from-slate-50/60 to-white">
            <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:px-8 sm:py-10 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl animate-fade-in-up">
                    {eyebrow && (
                        <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-gradient-to-r from-cyan-50 via-teal-50 to-emerald-50 px-3.5 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-teal-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 animate-pulse" />
                            {eyebrow}
                        </div>
                    )}
                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{heading}</h1>
                    {description && <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">{description}</p>}
                </div>
                {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
            </div>
        </header>
    );
}
