import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Panel from '@/Components/Ui/Panel';
import Pill from '@/Components/Ui/Pill';

const PROBLEMS = [
    'Cars cannot enter many of Dhaka\'s narrow golis, but every mainstream planner routes as if they can.',
    'Overpasses are walk-only transfers that a single-mode planner has no way to represent.',
    'The genuinely fastest trip often mixes car, rickshaw, and walking — with a real cost to switching.',
    'A sudden jam should degrade part of the network and reroute anyone already travelling through it.',
];

const LAYERS = [
    {
        name: 'Graph layer',
        detail: 'MapData and GraphManager hold the nodes, edges, and both base and current weights.',
        accent: 'violet',
    },
    {
        name: 'Routing layer',
        detail: 'DijkstraRoutingService walks the graph with mode-switch penalties; SessionManager remembers active trips.',
        accent: 'cyan',
    },
    {
        name: 'API layer',
        detail: 'Four JSON endpoints expose routing, anomalies, the graph snapshot, and a health probe.',
        accent: 'emerald',
    },
    {
        name: 'Frontend layer',
        detail: 'React and Inertia pages render the planner, control room, network explorer, and status board.',
        accent: 'amber',
    },
];

const RULES = [
    { title: 'Goli edges', detail: 'Block cars, still allow rickshaw and walking.' },
    { title: 'Overpasses', detail: 'Modelled as walk-only transfer paths.' },
    { title: 'Directionality', detail: 'Most roads are one-way through explicit forward and reverse edges.' },
    { title: 'Anomalies', detail: 'Target explicit edge IDs or a geographic bounding box.' },
];

const STACK = [
    { label: 'Laravel 10', tone: 'rose' },
    { label: 'Inertia.js', tone: 'violet' },
    { label: 'React 18', tone: 'cyan' },
    { label: 'Vite', tone: 'amber' },
    { label: 'Tailwind CSS', tone: 'emerald' },
    { label: 'Leaflet + OpenStreetMap', tone: 'slate' },
];

export default function About() {
    return (
        <AppLayout
            title="About"
            eyebrow="Project overview"
            heading="Built for the way Dhaka actually moves"
            description="GoliTransit is a multi-modal routing system for dense, constraint-heavy traffic: a simulated city road graph, a routing engine that prices mode switches, and anomaly-triggered rerouting."
            actions={
                <Link
                    href="/planner"
                    className="rounded-full bg-gradient-to-r from-cyan-600 to-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:shadow-md"
                >
                    Open the planner →
                </Link>
            }
        >
            <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
                <div className="grid gap-6 lg:grid-cols-2">
                    <Panel eyebrow="The problem" title="What standard route planners miss">
                        <ul className="space-y-3">
                            {PROBLEMS.map((problem) => (
                                <li key={problem} className="flex gap-3 text-sm leading-6 text-slate-600">
                                    <svg className="mt-1 h-4 w-4 flex-shrink-0 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                    {problem}
                                </li>
                            ))}
                        </ul>
                    </Panel>

                    <Panel eyebrow="Transport rules" title="How the graph encodes the city">
                        <div className="grid gap-3 sm:grid-cols-2">
                            {RULES.map((rule) => (
                                <div key={rule.title} className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3.5">
                                    <p className="text-xs font-bold text-slate-900">{rule.title}</p>
                                    <p className="mt-1 text-xs leading-6 text-slate-500">{rule.detail}</p>
                                </div>
                            ))}
                        </div>
                    </Panel>
                </div>

                <Panel className="mt-6" eyebrow="Architecture" title="Four layers, one request path">
                    <div className="grid gap-3 lg:grid-cols-4">
                        {LAYERS.map((layer, index) => (
                            <div key={layer.name} className="relative rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                                <div className="flex items-center justify-between">
                                    <Pill tone={layer.accent}>{layer.name}</Pill>
                                    <span className="mono text-xs font-bold text-slate-300">0{index + 1}</span>
                                </div>
                                <p className="mt-3 text-xs leading-6 text-slate-500">{layer.detail}</p>
                            </div>
                        ))}
                    </div>
                </Panel>

                <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
                    <Panel eyebrow="Demo flow" title="Seeing rerouting actually work">
                        <ol className="space-y-3">
                            {[
                                <>Open the <Link href="/network" className="font-semibold text-cyan-700 hover:underline">Network Explorer</Link> and note the node and edge counts.</>,
                                <>In the <Link href="/control-room" className="font-semibold text-cyan-700 hover:underline">Control Room</Link>, run a route from Farmgate to Gulshan 2.</>,
                                <>Trigger the corridor anomaly preset on <code className="mono text-xs text-slate-700">edge_karwan_bazar_tejgaon</code> and <code className="mono text-xs text-slate-700">edge_tejgaon_banani</code>.</>,
                                <>Watch the weights climb and the recomputed route take a different path.</>,
                                <>Confirm every endpoint is still healthy on the <Link href="/status" className="font-semibold text-cyan-700 hover:underline">Status</Link> page.</>,
                            ].map((step, index) => (
                                <li key={index} className="flex gap-3 text-sm leading-6 text-slate-600">
                                    <span className="mono mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-[0.6rem] font-bold text-white">
                                        {index + 1}
                                    </span>
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ol>
                    </Panel>

                    <Panel eyebrow="Built with" title="Stack">
                        <div className="flex flex-wrap gap-2">
                            {STACK.map((item) => (
                                <Pill key={item.label} tone={item.tone}>
                                    {item.label}
                                </Pill>
                            ))}
                        </div>
                        <p className="mt-4 text-xs leading-6 text-slate-500">
                            The map renders real OpenStreetMap streets through Leaflet, so routes follow actual road geometry rather
                            than straight lines between points.
                        </p>
                    </Panel>
                </div>
            </div>
        </AppLayout>
    );
}
