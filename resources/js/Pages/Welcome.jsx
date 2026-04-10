import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link } from '@inertiajs/react';

function titleCase(value) {
    return value
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildLayout(nodes, edges) {
    if (!nodes.length) {
        return { nodes: [], edges: [] };
    }

    const lats = nodes.map((node) => node.lat);
    const lngs = nodes.map((node) => node.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const spanLat = maxLat - minLat || 1;
    const spanLng = maxLng - minLng || 1;

    const positionedNodes = nodes.map((node) => ({
        ...node,
        x: 90 + ((node.lng - minLng) / spanLng) * 820,
        y: 80 + (1 - (node.lat - minLat) / spanLat) * 420,
    }));

    const positionById = Object.fromEntries(positionedNodes.map((node) => [node.id, node]));

    const positionedEdges = edges
        .filter((edge) => positionById[edge.from] && positionById[edge.to])
        .map((edge) => ({
            ...edge,
            fromPoint: positionById[edge.from],
            toPoint: positionById[edge.to],
        }));

    return { nodes: positionedNodes, edges: positionedEdges };
}

function StatCard({ label, value, detail }) {
    return (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
            <div className="text-[0.68rem] uppercase tracking-[0.28em] text-slate-400">{label}</div>
            <div className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</div>
            <div className="mt-2 text-sm leading-6 text-slate-300">{detail}</div>
        </div>
    );
}

function FeatureCard({ eyebrow, title, description }) {
    return (
        <article className="group rounded-[28px] border border-white/10 bg-slate-950/60 p-6 shadow-[0_24px_90px_rgba(2,6,23,0.4)] transition-transform duration-300 hover:-translate-y-1">
            <div className="text-[0.7rem] uppercase tracking-[0.3em] text-cyan-200/70">{eyebrow}</div>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">{title}</h3>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-300">{description}</p>
        </article>
    );
}

function RouteChip({ label, active = false }) {
    return (
        <div
            className={[
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition',
                active
                    ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-100 shadow-[0_10px_30px_rgba(34,211,238,0.15)]'
                    : 'border-white/10 bg-white/5 text-slate-200',
            ].join(' ')}
        >
            <span className={active ? 'h-2.5 w-2.5 rounded-full bg-cyan-300' : 'h-2.5 w-2.5 rounded-full bg-slate-500'} />
            {label}
        </div>
    );
}

function MiniMap({ graph, route }) {
    const layout = buildLayout(graph.nodes ?? [], graph.edges ?? []);
    const routePath = route?.path ?? [];
    const routeSegments = new Set();

    for (let index = 0; index < routePath.length - 1; index += 1) {
        routeSegments.add(`${routePath[index]}:${routePath[index + 1]}`);
        routeSegments.add(`${routePath[index + 1]}:${routePath[index]}`);
    }

    return (
        <svg viewBox="0 0 1000 560" className="h-[420px] w-full rounded-[28px] bg-slate-950/60">
            <defs>
                <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#fb923c" />
                </linearGradient>
                <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                </radialGradient>
            </defs>

            <rect width="1000" height="560" fill="url(#nodeGlow)" opacity="0.25" />
            <g opacity="0.22">
                {layout.edges.map((edge) => {
                    const highlighted = routeSegments.has(`${edge.from}:${edge.to}`);
                    return (
                        <line
                            key={edge.id}
                            x1={edge.fromPoint.x}
                            y1={edge.fromPoint.y}
                            x2={edge.toPoint.x}
                            y2={edge.toPoint.y}
                            stroke={highlighted ? 'url(#routeGlow)' : '#64748b'}
                            strokeWidth={highlighted ? 4 : 1.8}
                            strokeLinecap="round"
                        />
                    );
                })}
            </g>

            {layout.edges.map((edge) => {
                const highlighted = routeSegments.has(`${edge.from}:${edge.to}`);
                if (!highlighted) {
                    return null;
                }

                return (
                    <line
                        key={`${edge.id}-highlight`}
                        x1={edge.fromPoint.x}
                        y1={edge.fromPoint.y}
                        x2={edge.toPoint.x}
                        y2={edge.toPoint.y}
                        stroke="url(#routeGlow)"
                        strokeWidth={5.5}
                        strokeLinecap="round"
                        filter="drop-shadow(0 0 10px rgba(34, 211, 238, 0.7))"
                    />
                );
            })}

            {layout.nodes.map((node) => {
                const active = routePath.includes(node.id);
                return (
                    <g key={node.id} transform={`translate(${node.x} ${node.y})`}>
                        <circle r="18" fill={active ? '#0f172a' : '#020617'} stroke={active ? '#22d3ee' : '#475569'} strokeWidth="2" />
                        <circle r="10" fill={active ? '#22d3ee' : '#94a3b8'} />
                        <circle r="30" fill="url(#nodeGlow)" opacity={active ? 0.65 : 0.15} />
                        <text
                            x={node.x > 720 ? -16 : 16}
                            y={-20}
                            textAnchor={node.x > 720 ? 'end' : 'start'}
                            fill="#e2e8f0"
                            fontSize="19"
                            fontWeight="600"
                        >
                            {node.name}
                        </text>
                        <text
                            x={node.x > 720 ? -16 : 16}
                            y={2}
                            textAnchor={node.x > 720 ? 'end' : 'start'}
                            fill="#94a3b8"
                            fontSize="12"
                            letterSpacing="0.12em"
                        >
                            {node.id.replace(/_/g, ' ')}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

export default function Welcome({ auth, graph, sampleRoute, routeLabels, laravelVersion, phpVersion, sampleRouteError }) {
    const demoRoute = sampleRoute ?? {
        path: [],
        total_cost: 0,
        selected_modes: [],
        mode_switches: 0,
    };

    const selectedModes = demoRoute.selected_modes?.length ? demoRoute.selected_modes : ['car'];
    const totalStops = demoRoute.path?.length ?? 0;
    const labels = routeLabels?.length
        ? routeLabels
        : (demoRoute.path?.map((nodeId) => titleCase(nodeId)) ?? []);
    const graphStats = [
        {
            label: 'Stations',
            value: graph?.nodeCount ?? 0,
            detail: 'Mapped across the transit graph',
        },
        {
            label: 'Connections',
            value: graph?.edgeCount ?? 0,
            detail: 'Weighted links between hubs',
        },
        {
            label: 'Goli edges',
            value: graph?.goliEdgeCount ?? 0,
            detail: 'Highlighted corridor segments',
        },
        {
            label: 'Overpasses',
            value: graph?.overpassNodeCount ?? 0,
            detail: 'Transfer-ready nodes in the map',
        },
    ];

    const featureCards = [
        {
            eyebrow: 'Fast routing',
            title: 'See a route in motion',
            description:
                'The homepage exposes the backend graph visually, so the route planner feels alive instead of buried behind forms.',
        },
        {
            eyebrow: 'Mode aware',
            title: 'Car, rickshaw, and walk',
            description:
                'The sample route shows how the system chooses travel modes and where it can switch between them.',
        },
        {
            eyebrow: 'Built for demos',
            title: 'Presentation-ready from the start',
            description:
                'The layout is dramatic on a projector, responsive on mobile, and still grounded in the actual Laravel data.',
        },
    ];

    return (
        <>
            <Head title="GoliTransit" />
            <div className="relative min-h-screen overflow-hidden bg-[#050816] text-slate-100">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(251,146,60,0.16),_transparent_28%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.14),_transparent_26%)]" />
                <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:72px_72px]" />
                <div className="absolute left-[-120px] top-24 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
                <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />

                <header className="relative z-10 mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between lg:p-5">
                        <div className="flex items-center gap-4">
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 shadow-[0_12px_30px_rgba(2,6,23,0.3)]">
                                <ApplicationLogo className="h-10 w-10 text-cyan-200" />
                            </div>
                            <div>
                                <p className="text-[0.7rem] uppercase tracking-[0.38em] text-cyan-200/70">
                                    GoliTransit
                                </p>
                                <h1 className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-2xl">
                                    Dhaka routing, but cinematic.
                                </h1>
                                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
                                    A polished front end for transit planning, route previews, and graph-aware demos.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-semibold text-cyan-50 transition hover:-translate-y-0.5 hover:bg-cyan-300/15"
                                >
                                    Open dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="inline-flex items-center rounded-full bg-gradient-to-r from-cyan-400 to-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
                                    >
                                        Create account
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
                    <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_30px_120px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8 lg:p-10">
                            <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-cyan-100">
                                Transit intelligence dashboard
                            </div>

                            <h2 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                                A front end that makes route planning feel premium.
                            </h2>

                            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                                This homepage is wired to your Laravel graph. It surfaces the current network,
                                shows a sample route, and gives the project a bold visual identity for demos,
                                judges, and day-to-day work.
                            </p>

                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link
                                        href={auth.user ? route('dashboard') : route('login')}
                                    className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-100"
                                >
                                    {auth.user ? 'Open app' : 'Start here'}
                                </Link>
                                <a
                                    href="#route-preview"
                                    className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                                >
                                    Inspect the route
                                </a>
                            </div>

                            <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                {graphStats.map((item) => (
                                    <StatCard
                                        key={item.label}
                                        label={item.label}
                                        value={item.value}
                                        detail={item.detail}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-6">
                            <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-4 shadow-[0_24px_100px_rgba(2,6,23,0.5)] backdrop-blur-xl sm:p-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[0.7rem] uppercase tracking-[0.32em] text-slate-400">
                                            Sample route
                                        </p>
                                        <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">
                                            Farmgate to Gulshan 2
                                        </h3>
                                    </div>
                                    <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">
                                        Live data
                                    </div>
                                </div>

                                <div className="mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-slate-950">
                                    <MiniMap graph={graph ?? { nodes: [], edges: [] }} route={demoRoute} />
                                </div>
                            </div>

                            <div
                                id="route-preview"
                                className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_100px_rgba(2,6,23,0.35)] backdrop-blur-xl"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[0.7rem] uppercase tracking-[0.32em] text-slate-400">
                                            Route summary
                                        </p>
                                        <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">
                                            What the backend chose
                                        </h3>
                                    </div>
                                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                                        {selectedModes.join(' / ')}
                                    </div>
                                </div>

                            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                <StatCard
                                    label="Total cost"
                                    value={demoRoute.total_cost ?? 0}
                                    detail="Weighted by the route engine"
                                />
                                <StatCard
                                    label="Mode switches"
                                    value={demoRoute.mode_switches ?? 0}
                                    detail="Only allowed at transfer nodes"
                                />
                                <StatCard
                                    label="Path length"
                                    value={totalStops}
                                    detail="Stops in the sample route"
                                />
                            </div>

                                <div className="mt-6">
                                    <div className="text-[0.7rem] uppercase tracking-[0.32em] text-slate-400">
                                        Route path
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {labels.length ? (
                                            labels.map((label, index) => (
                                                <RouteChip key={`${label}-${index}`} label={label} active={index === 0 || index === labels.length - 1} />
                                            ))
                                        ) : (
                                            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400">
                                                No route calculated yet.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {sampleRouteError ? (
                                    <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
                                        {sampleRouteError}
                                    </div>
                                ) : (
                                    <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm leading-7 text-slate-300">
                                        This route is fetched from the backend and rendered as a visual story, not a
                                        static mock. That makes the landing page feel alive even before users log in.
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="mt-6 grid gap-6 lg:grid-cols-3">
                        {featureCards.map((card) => (
                            <FeatureCard
                                key={card.title}
                                eyebrow={card.eyebrow}
                                title={card.title}
                                description={card.description}
                            />
                        ))}
                    </section>

                    <section className="mt-6 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
                        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_30px_110px_rgba(2,6,23,0.38)] backdrop-blur-xl sm:p-8">
                            <p className="text-[0.7rem] uppercase tracking-[0.32em] text-slate-400">
                                Data storytelling
                            </p>
                            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                                Built to show the system, not just describe it.
                            </h3>
                            <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-300 sm:text-base">
                                The landing page is designed to make your backend legible: the graph counts are
                                visible up front, the route preview stays prominent, and the login path is always one
                                click away.
                            </p>

                            <div className="mt-8 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                                    <div className="text-[0.68rem] uppercase tracking-[0.26em] text-slate-400">
                                        Backend version
                                    </div>
                                    <div className="mt-2 text-lg font-semibold text-white">
                                        Laravel {laravelVersion}
                                    </div>
                                </div>
                                <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                                    <div className="text-[0.68rem] uppercase tracking-[0.26em] text-slate-400">
                                        Runtime
                                    </div>
                                    <div className="mt-2 text-lg font-semibold text-white">PHP {phpVersion}</div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_30px_110px_rgba(2,6,23,0.38)] backdrop-blur-xl sm:p-8">
                            <p className="text-[0.7rem] uppercase tracking-[0.32em] text-slate-400">
                                Quick path
                            </p>
                            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                                Let people move from the landing page to the product fast.
                            </h3>
                            <ul className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
                                <li className="flex gap-3">
                                    <span className="mt-2 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                                    Start with the visual route preview and graph counts.
                                </li>
                                <li className="flex gap-3">
                                    <span className="mt-2 h-2.5 w-2.5 rounded-full bg-amber-300" />
                                    Sign in to reach the dashboard and authenticated workflow.
                                </li>
                                <li className="flex gap-3">
                                    <span className="mt-2 h-2.5 w-2.5 rounded-full bg-emerald-300" />
                                    Keep the UI responsive so it works on a phone during a demo.
                                </li>
                            </ul>
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
