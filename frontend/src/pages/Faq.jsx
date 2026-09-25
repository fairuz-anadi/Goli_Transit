import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@app/components/PageHeader';

const FAQS = [
    {
        q: 'Which areas of Dhaka are covered?',
        a: 'The network spans central and northern Dhaka — from Sadarghat and Old Dhaka in the south up through Motijheel, Farmgate, Dhanmondi, Mohakhali, Gulshan and Banani, out to Badda and Kuril, and north to Uttara and Mirpur. The Coverage page lists every stop and lets you search for a specific place.',
    },
    {
        q: 'Why does my route switch between car, rickshaw and walking?',
        a: 'Because that is often genuinely the fastest way. Cars cannot enter narrow golis and overpasses are walk-only, so a mixed journey frequently beats sticking to one mode. Switching is penalised, so it only happens when it actually saves you time.',
    },
    {
        q: 'Can I plan a trip using only one mode?',
        a: 'Yes. On the planner, turn off any modes you do not want and the route will be computed using only what is left. If no route exists under those restrictions, you will be told rather than given a wrong answer.',
    },
    {
        q: 'Does it know about traffic right now?',
        a: 'The network carries a live cost per street segment, and reported congestion inflates the affected segments so routes plan around them. It is a live signal on a modelled graph rather than a full commercial traffic feed.',
    },
    {
        q: 'Can it start from where I am standing?',
        a: 'Yes — allow location access and choose your live location as the starting point on the planner, or open the Nearby page to see the stops closest to you first.',
    },
    {
        q: 'What does the "cost" number mean?',
        a: 'It is the planner\'s internal measure of how expensive a journey is, combining travel time along each segment with any penalty for changing modes. Lower is better. It is useful for comparing two routes rather than as a figure in minutes or taka.',
    },
    {
        q: 'Are my trips stored anywhere?',
        a: 'No. Recent trips are kept in your own browser\'s local storage and never sent to a server. Clearing them on the Recent Trips page removes them for good.',
    },
    {
        q: 'Is there an API?',
        a: 'Yes. The routing engine is a separate service with a small JSON API for computing routes, reporting disruptions, and reading the network graph. It is documented on the backend service alongside the operations console.',
    },
];

function Item({ faq, open, onToggle }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50/70"
            >
                <span className="text-sm font-semibold text-slate-900">{faq.q}</span>
                <svg
                    className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && (
                <div className="border-t border-slate-100 px-5 py-4">
                    <p className="text-xs leading-6 text-slate-500">{faq.a}</p>
                </div>
            )}
        </div>
    );
}

export default function Faq() {
    const [openIndex, setOpenIndex] = useState(0);

    return (
        <>
            <PageHeader
                eyebrow="Questions"
                heading="Frequently asked questions"
                description="The things people ask most about how GoliTransit routes you through Dhaka."
            />

            <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
                <div className="grid gap-3">
                    {FAQS.map((faq, index) => (
                        <Item
                            key={faq.q}
                            faq={faq}
                            open={openIndex === index}
                            onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
                        />
                    ))}
                </div>

                <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/60 px-6 py-6 text-center">
                    <p className="text-sm font-semibold text-slate-700">Still stuck?</p>
                    <p className="mx-auto mt-1.5 max-w-sm text-xs leading-6 text-slate-500">
                        The how-it-works page explains the routing model in more depth.
                    </p>
                    <Link
                        to="/how-it-works"
                        className="mt-4 inline-flex rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        How it works →
                    </Link>
                </div>
            </div>
        </>
    );
}
