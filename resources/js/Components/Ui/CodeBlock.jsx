import { useState } from 'react';

/**
 * Renders API payloads inside the app instead of sending people to a raw JSON
 * endpoint. Collapsible, because some snapshots are thousands of lines.
 */
export default function CodeBlock({ label, value, maxHeight = 320, collapsible = false }) {
    const [open, setOpen] = useState(!collapsible);
    const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);

    const [copied, setCopied] = useState(false);

    async function copy() {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        } catch (error) {
            setCopied(false);
        }
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-2.5">
                <span className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</span>
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={copy}
                        className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[0.6rem] font-semibold text-slate-500 transition hover:bg-slate-50"
                    >
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                    {collapsible && (
                        <button
                            type="button"
                            onClick={() => setOpen((value) => !value)}
                            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[0.6rem] font-semibold text-slate-500 transition hover:bg-slate-50"
                        >
                            {open ? 'Hide' : 'Show'}
                        </button>
                    )}
                </div>
            </div>
            {open && (
                <pre
                    className="mono overflow-auto px-4 py-3 text-[0.7rem] leading-6 text-slate-700"
                    style={{ maxHeight }}
                >
                    {text}
                </pre>
            )}
        </div>
    );
}
