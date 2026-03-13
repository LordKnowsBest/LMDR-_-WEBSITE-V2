'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import { useApi } from '@/lib/hooks';
import { getDocumentStatus, updateDocument } from '../../actions/documents';
import { getCurrentScores, getRank, getScoreHistory } from '../../actions/scorecard';

const DEMO_DRIVER_ID = 'demo-driver-001';

/* ── Mock Fallback Data ── */
const mockDocuments = {
    complete: ['CDL-A License', 'Drug Test'],
    missing: ['Equipment Inspection Cert'],
    expired: ['Medical Certificate'],
    pendingReview: ['MVR Check'],
};

const mockScores = {
    safety: 92,
    compliance: 88,
    reliability: 95,
    overall: 91,
};

const mockRank = { rank: 12, totalDrivers: 156, percentile: 92 };

interface ScoreHistoryEntry {
    date: string;
    safety: number;
    compliance: number;
    reliability: number;
    overall: number;
}

const mockHistory: ScoreHistoryEntry[] = [
    { date: '2026-03-01', safety: 92, compliance: 88, reliability: 95, overall: 91 },
    { date: '2026-02-01', safety: 90, compliance: 85, reliability: 94, overall: 89 },
    { date: '2026-01-01', safety: 88, compliance: 82, reliability: 93, overall: 87 },
    { date: '2025-12-01', safety: 85, compliance: 80, reliability: 90, overall: 85 },
];

/* ── Status helpers ── */
function docStatusIcon(category: string): { icon: string; color: string; label: string } {
    switch (category) {
        case 'complete': return { icon: 'check_circle', color: '#10b981', label: 'Complete' };
        case 'expired': return { icon: 'cancel', color: '#ef4444', label: 'Expired' };
        case 'pendingReview': return { icon: 'schedule', color: '#3b82f6', label: 'Pending Review' };
        case 'missing': default: return { icon: 'warning', color: '#f59e0b', label: 'Missing' };
    }
}

function formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch { return dateStr; }
}

function trendArrow(current: number, previous: number | undefined): string {
    if (previous === undefined) return '';
    if (current > previous) return '↑';
    if (current < previous) return '↓';
    return '→';
}

function trendColor(current: number, previous: number | undefined): string {
    if (previous === undefined) return 'var(--neu-text-muted)';
    if (current > previous) return '#10b981';
    if (current < previous) return '#ef4444';
    return 'var(--neu-text-muted)';
}

export default function CompliancePage() {
    const [activeTab, setActiveTab] = useState('Documents');
    const [acknowledging, setAcknowledging] = useState<string | null>(null);

    /* ── API calls ── */
    const { data: docStatusData, refresh: refreshDocs } = useApi<{ complete: string[]; missing: string[]; expired: string[]; pendingReview: string[] }>(
        () => getDocumentStatus(DEMO_DRIVER_ID).then(d => ({ data: d })),
        [DEMO_DRIVER_ID]
    );
    const { data: scoresData } = useApi<Record<string, number>>(
        () => getCurrentScores(DEMO_DRIVER_ID).then(d => ({ data: d as unknown as Record<string, number> })),
        [DEMO_DRIVER_ID]
    );
    const { data: rankData } = useApi<{ rank: number; totalDrivers: number; percentile: number }>(
        () => getRank(DEMO_DRIVER_ID).then(d => ({ data: d })),
        [DEMO_DRIVER_ID]
    );
    const { data: historyData } = useApi<ScoreHistoryEntry[]>(
        () => getScoreHistory(DEMO_DRIVER_ID, 'monthly', 12).then(d => ({ data: (d ?? []) as unknown as ScoreHistoryEntry[] })),
        [DEMO_DRIVER_ID]
    );

    /* ── Derived data with fallbacks ── */
    const docs = docStatusData ?? mockDocuments;
    const scores: Record<string, number> = scoresData ?? mockScores;
    const rank = rankData ?? mockRank;
    const history = (historyData && historyData.length > 0) ? historyData : mockHistory;

    const actionCount = (docs.missing?.length ?? 0) + (docs.expired?.length ?? 0) + (docs.pendingReview?.length ?? 0);

    /* ── Document rows ── */
    type DocRow = { name: string; category: string };
    const allDocs: DocRow[] = [
        ...(docs.complete ?? []).map(name => ({ name, category: 'complete' })),
        ...(docs.pendingReview ?? []).map(name => ({ name, category: 'pendingReview' })),
        ...(docs.missing ?? []).map(name => ({ name, category: 'missing' })),
        ...(docs.expired ?? []).map(name => ({ name, category: 'expired' })),
    ];

    /* ── Acknowledge handler ── */
    async function handleAcknowledge(docName: string) {
        setAcknowledging(docName);
        try {
            await updateDocument(DEMO_DRIVER_ID, docName, { status: 'acknowledged' });
            refreshDocs();
        } catch {
            // Silently fail — UI will keep showing the item
        } finally {
            setAcknowledging(null);
        }
    }

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-xl font-extrabold" style={{ color: 'var(--neu-text)' }}>Compliance</h1>
                <p className="text-[12px]" style={{ color: 'var(--neu-text-muted)' }}>Scores · Documents · History</p>
            </div>

            {/* ── Compliance Score Card ── */}
            <Card elevation="md" className="!p-4">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>
                        Compliance Score
                    </p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                        Rank #{rank.rank} of {rank.totalDrivers} ({rank.percentile}th %)
                    </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { label: 'Overall', key: 'overall' },
                        { label: 'Safety', key: 'safety' },
                        { label: 'Compliance', key: 'compliance' },
                        { label: 'Reliability', key: 'reliability' },
                    ].map((s) => {
                        const val = scores[s.key] ?? 0;
                        const scoreColor = val >= 90 ? '#10b981' : val >= 75 ? '#f59e0b' : '#ef4444';
                        return (
                            <div key={s.key} className="text-center">
                                <p className="text-[20px] font-extrabold" style={{ color: scoreColor }}>{val}</p>
                                <p className="text-[9px] font-semibold" style={{ color: 'var(--neu-text-muted)' }}>{s.label}</p>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* ── Tabs ── */}
            <div className="flex gap-2">
                {['Documents', 'History'].map((t) => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className="flex-1 py-2 rounded-xl text-[11px] font-bold transition-all duration-200"
                        style={
                            activeTab === t
                                ? { background: 'var(--neu-accent)', color: '#fff' }
                                : { background: 'var(--neu-bg-soft)', color: 'var(--neu-text-muted)' }
                        }
                    >
                        {t}
                        {t === 'Documents' && actionCount > 0 && (
                            <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-bold"
                                style={{ background: '#ef4444', color: '#fff' }}>
                                {actionCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Documents Tab ── */}
            {activeTab === 'Documents' && (
                <div className="space-y-3">
                    {actionCount > 0 && (
                        <Card elevation="md" className="!p-4" style={{ borderLeft: '3px solid #f59e0b' }}>
                            <div className="flex gap-3">
                                <span className="material-symbols-outlined text-[20px] text-orange-500 shrink-0">warning</span>
                                <div>
                                    <p className="text-[12px] font-bold" style={{ color: 'var(--neu-text)' }}>{actionCount} Action Item{actionCount !== 1 ? 's' : ''} Required</p>
                                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>
                                        {docs.expired?.length ? `${docs.expired.length} expired, ` : ''}
                                        {docs.missing?.length ? `${docs.missing.length} missing, ` : ''}
                                        {docs.pendingReview?.length ? `${docs.pendingReview.length} pending review` : ''}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}

                    <p className="text-[11px] font-bold uppercase tracking-wider mt-4 mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                        Document Status
                    </p>

                    <div className="space-y-2.5">
                        {allDocs.map((doc) => {
                            const info = docStatusIcon(doc.category);
                            const isPending = doc.category === 'pendingReview';
                            const isActionable = doc.category === 'missing' || doc.category === 'expired';
                            return (
                                <Card key={doc.name} elevation={isActionable || isPending ? 'md' : 'sm'} className="!p-3.5"
                                    style={{ opacity: doc.category === 'complete' ? 0.7 : 1 }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                                            style={{ background: `${info.color}15` }}>
                                            <span className="material-symbols-outlined text-[16px]"
                                                style={{ color: info.color }}>
                                                {info.icon}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[12px] font-semibold" style={{ color: 'var(--neu-text)' }}>{doc.name}</p>
                                            <p className="text-[10px]" style={{ color: info.color }}>{info.label}</p>
                                        </div>
                                        {isPending && (
                                            <button
                                                onClick={() => handleAcknowledge(doc.name)}
                                                disabled={acknowledging === doc.name}
                                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0 disabled:opacity-50"
                                                style={{ background: 'var(--neu-accent)', color: '#fff' }}
                                            >
                                                {acknowledging === doc.name ? '...' : 'Acknowledge'}
                                            </button>
                                        )}
                                        {doc.category === 'complete' && (
                                            <span className="text-[10px] font-bold text-green-500 shrink-0 flex items-center gap-0.5">
                                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                                Done
                                            </span>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                        {allDocs.length === 0 && (
                            <p className="text-[11px] text-center py-4" style={{ color: 'var(--neu-text-muted)' }}>No documents found.</p>
                        )}
                    </div>
                </div>
            )}

            {/* ── History Tab ── */}
            {activeTab === 'History' && (
                <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                        Score History
                    </p>
                    {history.map((entry, idx) => {
                        const prev = history[idx + 1];
                        return (
                            <Card key={entry.date} elevation="sm" className="!p-3.5">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[12px] font-semibold" style={{ color: 'var(--neu-text)' }}>{formatDate(entry.date)}</p>
                                    <span className="text-[18px] font-extrabold" style={{ color: entry.overall >= 90 ? '#10b981' : entry.overall >= 75 ? '#f59e0b' : '#ef4444' }}>
                                        {entry.overall}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { label: 'Safety', key: 'safety' as const },
                                        { label: 'Compliance', key: 'compliance' as const },
                                        { label: 'Reliability', key: 'reliability' as const },
                                    ].map((s) => (
                                        <div key={s.key} className="text-center">
                                            <span className="text-[13px] font-bold" style={{ color: 'var(--neu-text)' }}>
                                                {entry[s.key]}
                                            </span>
                                            <span className="text-[10px] ml-0.5" style={{ color: trendColor(entry[s.key], prev?.[s.key]) }}>
                                                {trendArrow(entry[s.key], prev?.[s.key])}
                                            </span>
                                            <p className="text-[9px]" style={{ color: 'var(--neu-text-muted)' }}>{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        );
                    })}
                    {history.length === 0 && (
                        <p className="text-[11px] text-center py-4" style={{ color: 'var(--neu-text-muted)' }}>No history available.</p>
                    )}
                </div>
            )}
        </div>
    );
}
