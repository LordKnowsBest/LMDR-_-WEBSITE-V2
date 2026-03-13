'use client';

import { useState, useCallback } from 'react';
import { Card, ProgressBar } from '@/components/ui';
import { useApi } from '@/lib/hooks';
import { getRiskScore, getPerformance, getRiskHistory, getCarrierComparison } from '../../actions/retention';
import { submitFeedback } from '../../actions/lifecycle';

const DEMO_DRIVER_ID = 'demo-driver-001';

/* ── Mock Fallback Data ── */
const mockRiskData = { riskScore: 8, riskLevel: 'low', satisfactionIndex: 92, carrierName: 'Swift Transportation' };
const mockBestPractices = [
    { id: 1, title: 'Communicating Home Time Needs', reads: 1420, category: 'Communication', time: '4 min read' },
    { id: 2, title: 'Understanding Your Pay Structure', reads: 890, category: 'Compensation', time: '6 min read' },
    { id: 3, title: 'Building a Relationship with Dispatch', reads: 2100, category: 'Operations', time: '5 min read' },
];
const mockRiskHistory = [
    { month: 'Apr', score: 12 }, { month: 'May', score: 10 }, { month: 'Jun', score: 14 },
    { month: 'Jul', score: 11 }, { month: 'Aug', score: 9 }, { month: 'Sep', score: 8 },
    { month: 'Oct', score: 7 }, { month: 'Nov', score: 10 }, { month: 'Dec', score: 9 },
    { month: 'Jan', score: 8 }, { month: 'Feb', score: 7 }, { month: 'Mar', score: 8 },
];
const mockComparison = {
    carrierMetrics: { pay_per_mile: 0.62, home_time_pct: 78, safety_score: 88, driver_satisfaction: 85 },
    industryAverage: { pay_per_mile: 0.55, home_time_pct: 65, safety_score: 82, driver_satisfaction: 72 },
};

export default function RetentionPage() {
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(4);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    const { data: riskData } = useApi<Record<string, unknown>>(
        () => getRiskScore(DEMO_DRIVER_ID).then(d => ({ data: d as unknown as Record<string, unknown> })),
        [DEMO_DRIVER_ID]
    );
    const { data: performanceData } = useApi<Record<string, unknown>>(
        () => getPerformance(DEMO_DRIVER_ID).then(d => ({ data: d as unknown as Record<string, unknown> })),
        [DEMO_DRIVER_ID]
    );
    const { data: riskHistoryData } = useApi<Record<string, unknown>[]>(
        () => getRiskHistory(DEMO_DRIVER_ID, 12).then(d => ({ data: d as unknown as Record<string, unknown>[] })),
        [DEMO_DRIVER_ID]
    );
    const { data: comparisonData } = useApi<Record<string, unknown>>(
        () => getCarrierComparison(DEMO_DRIVER_ID).then(d => ({ data: d as unknown as Record<string, unknown> })),
        [DEMO_DRIVER_ID]
    );

    const satisfactionIndex = riskData
        ? 100 - Number(riskData.riskScore ?? 8)
        : mockRiskData.satisfactionIndex;
    const carrierName = (performanceData?.carrier_name as string) ?? mockRiskData.carrierName;
    const riskLevel = (riskData?.riskLevel as string) ?? mockRiskData.riskLevel;
    const carrierDot = (performanceData?.carrier_dot as string) ?? '';

    const riskHistory = riskHistoryData && Array.isArray(riskHistoryData) && riskHistoryData.length > 0
        ? (riskHistoryData as Array<Record<string, unknown>>).map((h, i) => ({
            month: (h.month as string) || (h.period as string) || `M${i + 1}`,
            score: Number(h.score ?? h.risk_score ?? 0),
        }))
        : mockRiskHistory;

    const comparison = comparisonData && (comparisonData as Record<string, unknown>).carrierMetrics
        ? (comparisonData as typeof mockComparison)
        : mockComparison;

    /* ── Performance-derived coaching tips ── */
    const coachingTips = performanceData
        ? [
            ...(Number(performanceData.on_time_pct ?? 100) < 90
                ? [{ id: 1, title: 'Improving On-Time Delivery Rate', reads: 1800, category: 'Performance', time: '4 min read' }]
                : [{ id: 1, title: 'Maintaining Your Strong On-Time Record', reads: 1200, category: 'Performance', time: '3 min read' }]),
            ...(Number(performanceData.safety_score ?? 100) < 85
                ? [{ id: 2, title: 'Safety Score Improvement Strategies', reads: 2400, category: 'Safety', time: '5 min read' }]
                : [{ id: 2, title: 'Advanced Safety Best Practices', reads: 1600, category: 'Safety', time: '5 min read' }]),
            { id: 3, title: 'Building a Relationship with Dispatch', reads: 2100, category: 'Operations', time: '5 min read' },
        ]
        : mockBestPractices;

    /* ── Career review handler ── */
    const handleReviewSubmit = useCallback(async () => {
        setReviewSubmitting(true);
        try {
            await submitFeedback(DEMO_DRIVER_ID, {
                carrierDot: carrierDot || 'unknown',
                rating: reviewRating,
                comment: reviewComment.trim() || undefined,
                wouldRecommend: reviewRating >= 4,
            });
            setShowReviewForm(false);
            setReviewComment('');
            setReviewRating(4);
        } catch (err) {
            console.error('Failed to submit career review:', err);
        } finally {
            setReviewSubmitting(false);
        }
    }, [reviewRating, reviewComment, carrierDot]);

    const maxHistoryScore = Math.max(...riskHistory.map(h => h.score), 20);

    const comparisonMetrics = [
        { label: 'Pay/Mile', carrier: `$${comparison.carrierMetrics.pay_per_mile}`, industry: `$${comparison.industryAverage.pay_per_mile}`, better: comparison.carrierMetrics.pay_per_mile >= comparison.industryAverage.pay_per_mile },
        { label: 'Home Time', carrier: `${comparison.carrierMetrics.home_time_pct}%`, industry: `${comparison.industryAverage.home_time_pct}%`, better: comparison.carrierMetrics.home_time_pct >= comparison.industryAverage.home_time_pct },
        { label: 'Safety Score', carrier: `${comparison.carrierMetrics.safety_score}`, industry: `${comparison.industryAverage.safety_score}`, better: comparison.carrierMetrics.safety_score >= comparison.industryAverage.safety_score },
        { label: 'Satisfaction', carrier: `${comparison.carrierMetrics.driver_satisfaction}%`, industry: `${comparison.industryAverage.driver_satisfaction}%`, better: comparison.carrierMetrics.driver_satisfaction >= comparison.industryAverage.driver_satisfaction },
    ];

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-xl font-extrabold" style={{ color: 'var(--neu-text)' }}>Retention Center</h1>
                <p className="text-[12px]" style={{ color: 'var(--neu-text-muted)' }}>Career Coaching · Best Practices</p>
            </div>

            <Card elevation="lg" className="!p-4 sm:!p-5" style={{ background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)' }}>
                <div className="flex items-start justify-between mb-3 text-white">
                    <div>
                        <h2 className="text-[15px] font-black tracking-tight leading-tight">Career Health Check</h2>
                        <p className="text-[11px] font-bold opacity-80 mt-0.5">Your relationship with {carrierName} is {riskLevel === 'low' ? 'strong' : riskLevel === 'medium' ? 'moderate' : 'needs attention'}.</p>
                    </div>
                    <span className="material-symbols-outlined text-[28px] opacity-90">health_and_safety</span>
                </div>

                <div className="bg-white/10 rounded-xl p-3 mb-3">
                    <div className="flex justify-between items-center text-white mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Satisfaction Index</span>
                        <span className="text-[12px] font-black">{satisfactionIndex}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-black/20 overflow-hidden">
                        <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${satisfactionIndex}%` }}></div>
                    </div>
                </div>

                <button
                    onClick={() => setShowReviewForm(v => !v)}
                    className="w-full py-2.5 rounded-xl bg-white text-[12px] font-bold active:scale-[0.98] transition-transform"
                    style={{ color: 'var(--neu-accent)' }}
                >
                    {showReviewForm ? 'Cancel' : 'Request Career Review'}
                </button>
            </Card>

            {/* Career Review Form */}
            {showReviewForm && (
                <Card elevation="md" className="!p-4 space-y-3" style={{ borderLeft: '3px solid var(--neu-accent)' }}>
                    <p className="text-[12px] font-bold" style={{ color: 'var(--neu-text)' }}>Career Review Request</p>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold" style={{ color: 'var(--neu-text)' }}>Rating:</span>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(v => (
                                <button
                                    key={v}
                                    onClick={() => setReviewRating(v)}
                                    className="text-[16px]"
                                >
                                    {v <= reviewRating ? '★' : '☆'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <textarea
                        placeholder="Tell us about your career goals and concerns..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg text-[12px] neu-in outline-none resize-none"
                        style={{ background: 'var(--neu-bg-soft)', color: 'var(--neu-text)' }}
                    />
                    <button
                        onClick={handleReviewSubmit}
                        disabled={reviewSubmitting}
                        className="w-full py-2 rounded-lg text-[11px] font-bold disabled:opacity-50"
                        style={{ background: 'var(--neu-accent)', color: '#fff' }}
                    >
                        {reviewSubmitting ? 'Submitting...' : 'Submit Review Request'}
                    </button>
                </Card>
            )}

            {/* Risk History — 12-month trend */}
            <div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                    12-Month Risk Trend
                </p>
                <Card elevation="sm" className="!p-4">
                    <div className="flex items-end gap-1 h-20">
                        {riskHistory.map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div
                                    className="w-full rounded-t-sm transition-all duration-300"
                                    style={{
                                        height: `${Math.max((h.score / maxHistoryScore) * 100, 8)}%`,
                                        background: h.score > 15
                                            ? '#ef4444'
                                            : h.score > 10
                                                ? '#f59e0b'
                                                : 'var(--neu-accent)',
                                        minHeight: '4px',
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-1.5">
                        {riskHistory.map((h, i) => (
                            <span key={i} className="text-[7px] flex-1 text-center" style={{ color: 'var(--neu-text-muted)' }}>
                                {h.month}
                            </span>
                        ))}
                    </div>
                    <p className="text-[9px] text-center mt-2" style={{ color: 'var(--neu-text-muted)' }}>
                        Lower scores = lower risk. Current: {riskHistory[riskHistory.length - 1]?.score ?? 'N/A'}
                    </p>
                </Card>
            </div>

            {/* Carrier Comparison */}
            <div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                    Carrier vs Industry Average
                </p>
                <Card elevation="sm" className="!p-4">
                    <div className="space-y-3">
                        {comparisonMetrics.map((m) => (
                            <div key={m.label} className="flex items-center justify-between">
                                <span className="text-[11px] font-medium" style={{ color: 'var(--neu-text)' }}>{m.label}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-[11px] font-bold" style={{ color: m.better ? 'var(--neu-accent)' : '#ef4444' }}>
                                        {m.carrier}
                                    </span>
                                    <span className="text-[9px]" style={{ color: 'var(--neu-text-muted)' }}>vs</span>
                                    <span className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>{m.industry}</span>
                                    <span className="material-symbols-outlined text-[14px]"
                                        style={{ color: m.better ? '#22c55e' : '#ef4444' }}>
                                        {m.better ? 'trending_up' : 'trending_down'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Coaching Tips (performance-derived) */}
            <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>
                        Retention Best Practices
                    </p>
                    <span className="text-[10px] font-bold" style={{ color: 'var(--neu-accent)' }}>View All</span>
                </div>

                <div className="space-y-3">
                    {coachingTips.map((bp) => (
                        <Card key={bp.id} elevation="sm" className="!p-3.5 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center neu-x shrink-0">
                                <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>auto_stories</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-semibold mb-1 truncate" style={{ color: 'var(--neu-text)' }}>{bp.title}</p>
                                <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>
                                    <span className="px-1.5 py-0.5 rounded-sm bg-[var(--neu-bg-soft)] font-bold">{bp.category}</span>
                                    <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]">visibility</span> {bp.reads}</span>
                                    <span>{bp.time}</span>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--neu-text-muted)' }}>arrow_forward</span>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
