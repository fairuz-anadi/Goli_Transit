import { useCallback, useEffect, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import Panel from '@/Components/Ui/Panel';
import Pill from '@/Components/Ui/Pill';
import StatTile from '@/Components/Ui/StatTile';
import CodeBlock from '@/Components/Ui/CodeBlock';
import { computeRoute, fetchHealth, fetchSnapshot, timed } from '@/lib/api';

const CHECKS = [
    {
        id: 'health',
        method: 'GET',
        path: '/health',
        title: 'Health probe',
        description: 'Fast uptime check used by the deployment platform.',
        run: () => fetchHealth(),
    },
    {
        id: 'snapshot',
        method: 'GET',
        path: '/api/graph/snapshot',
        title: 'Graph snapshot',
        description: 'Returns every node and edge with live weights.',
        run: () => fetchSnapshot(),
    },
    {
        id: 'route',
        method: 'POST',
        path: '/api/route',
        title: 'Routing engine',
        description: 'Computes a Farmgate → Gulshan 2 route across all modes.',
        run: () =>
            computeRoute({
                session_id: 'status-page-probe',
                start: 'farmgate',
                destination: 'gulshan_2',
                allowed_modes: ['car', 'rickshaw', 'walk'],
            }),
    },
];

function latencyTone(ms) {
    if (ms < 400) return 'emerald';
    if (ms < 1200) return 'amber';
    return 'rose';
}

export default function Status() {
    const [results, setResults] = useState({});
    const [running, setRunning] = useState(false);
    const [lastRun, setLastRun] = useState(null);

    const runAll = useCallback(async () => {
        setRunning(true);
        const next = {};

        for (const check of CHECKS) {
            // Sequential on purpose: the numbers double as a rough latency
            // reading, and parallel requests would distort them.
            // eslint-disable-next-line no-await-in-loop
            next[check.id] = await timed(check.run);
            setResults({ ...next });
        }

        setLastRun(new Date());
        setRunning(false);
    }, []);

    useEffect(() => {
        runAll();
    }, [runAll]);

    const completed = CHECKS.filter((check) => results[check.id]);
    const passing = completed.filter((check) => results[check.id].ok).length;
    const allGood = completed.length === CHECKS.length && passing === CHECKS.length;
    const averageLatency = completed.length
        ? Math.round(completed.reduce((total, check) => total + results[check.id].ms, 0) / completed.length)
        : 0;

    const snapshotMeta = results.snapshot?.ok ? results.snapshot.data?.meta : null;

    return (
        <AppLayout
            title="System Status"
            eyebrow="Live diagnostics"
            heading="System Status"
            description="Every backend endpoint, checked from your browser right now. This replaces opening the raw JSON routes by hand."
            actions={
                <>
                    <Pill tone={allGood ? 'emerald' : completed.length === CHECKS.length ? 'rose' : 'slate'} dot pulse={running}>
                        {running
                            ? 'Running checks…'
                            : allGood
                              ? 'All systems operational'
                              : `${passing}/${CHECKS.length} passing`}
                    </Pill>
                    <button
                        type="button"
                        onClick={runAll}
                        disabled={running}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                    >
                        Re-run checks
                    </button>
                </>
            }
        >
            <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatTile
                        label="Endpoints passing"
                        value={`${passing}/${CHECKS.length}`}
                        accent={allGood ? 'emerald' : 'rose'}
                    />
                    <StatTile label="Avg latency" value={averageLatency ? `${averageLatency} ms` : '—'} accent="cyan" />
                    <StatTile label="Graph nodes" value={snapshotMeta?.node_count ?? '—'} accent="violet" />
                    <StatTile label="Graph edges" value={snapshotMeta?.edge_count ?? '—'} accent="amber" />
                </div>

                <div className="mt-6 grid gap-4">
                    {CHECKS.map((check) => {
                        const result = results[check.id];
                        const tone = !result ? 'slate' : result.ok ? 'emerald' : 'rose';

                        return (
                            <Panel key={check.id} bodyClassName="p-5 sm:p-6">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="flex items-start gap-3.5">
                                        <span
                                            className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                                                !result
                                                    ? 'bg-slate-100 text-slate-400'
                                                    : result.ok
                                                      ? 'bg-emerald-50 text-emerald-600'
                                                      : 'bg-rose-50 text-rose-600'
                                            }`}
                                        >
                                            {!result ? (
                                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" d="M12 3a9 9 0 019 9" />
                                                </svg>
                                            ) : result.ok ? (
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                        </span>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-sm font-bold text-slate-900">{check.title}</h3>
                                                <span className="mono rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.6rem] font-semibold text-slate-500">
                                                    {check.method} {check.path}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs leading-6 text-slate-500">{check.description}</p>
                                            {result && !result.ok && (
                                                <p className="mt-1.5 text-xs font-medium text-rose-600">{result.error}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {result && <Pill tone={latencyTone(result.ms)}>{result.ms} ms</Pill>}
                                        <Pill tone={tone} dot>
                                            {!result ? 'Checking' : result.ok ? 'Operational' : 'Failing'}
                                        </Pill>
                                    </div>
                                </div>

                                {result?.ok && (
                                    <div className="mt-4">
                                        <CodeBlock
                                            label="Response"
                                            collapsible
                                            maxHeight={220}
                                            value={
                                                check.id === 'snapshot'
                                                    ? { meta: result.data?.meta, data: '…nodes and edges omitted, see Network Explorer' }
                                                    : result.data
                                            }
                                        />
                                    </div>
                                )}
                            </Panel>
                        );
                    })}
                </div>

                <p className="mt-6 text-center text-xs text-slate-400">
                    {lastRun ? `Last checked ${lastRun.toLocaleTimeString()}` : 'Running initial checks…'}
                </p>
            </div>
        </AppLayout>
    );
}
