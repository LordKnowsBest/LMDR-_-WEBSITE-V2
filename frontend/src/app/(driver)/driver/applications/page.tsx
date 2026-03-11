'use client';

import { useState } from 'react';
import { Card, Badge, ProgressBar } from '@/components/ui';
import { useApi } from '@/lib/hooks';
import { getApplications, withdrawApplication } from '../../actions/cockpit';

const DEMO_DRIVER_ID = 'demo-driver-001';

/* ── Types ── */
interface Application {
    id: string;
    carrier: string;
    position: string;
    location: string;
    payRange: string;
    appliedDate: string;
    lastUpdate: string;
    status: 'Under Review' | 'Interview' | 'Offered' | 'Declined' | 'Withdrawn';
    matchScore: number;
    nextStep?: string;
    recruiterName?: string;
    interviewDate?: string;
}

type TabFilter = 'all' | 'active' | 'offers' | 'closed';

/* ── Mock Data ── */
const mockApplications: Application[] = [
    {
        id: 'a1', carrier: 'Swift Transportation', position: 'OTR Dry Van Driver',
        location: 'Phoenix, AZ', payRange: '$0.62 - $0.68/mi', appliedDate: 'Mar 2, 2026',
        lastUpdate: '2h ago', status: 'Interview', matchScore: 94,
        nextStep: 'Phone interview scheduled for Thursday 3:00 PM',
        recruiterName: 'Sarah Chen', interviewDate: 'Mar 13, 2026 · 3:00 PM',
    },
    {
        id: 'a2', carrier: 'Werner Enterprises', position: 'Regional Reefer Driver',
        location: 'Omaha, NE', payRange: '$0.58 - $0.64/mi', appliedDate: 'Feb 28, 2026',
        lastUpdate: '1d ago', status: 'Under Review', matchScore: 89,
        nextStep: 'Awaiting recruiter review — avg 2-3 business days',
        recruiterName: 'Mike Rodriguez',
    },
    {
        id: 'a3', carrier: 'Schneider National', position: 'Intermodal Driver',
        location: 'Green Bay, WI', payRange: '$0.60 - $0.66/mi', appliedDate: 'Feb 20, 2026',
        lastUpdate: '3h ago', status: 'Offered', matchScore: 85,
        nextStep: 'Offer expires in 5 days — review the package',
        recruiterName: 'Jessica Park',
    },
    {
        id: 'a4', carrier: 'J.B. Hunt Transport', position: 'Dedicated Contract Driver',
        location: 'Lowell, AR', payRange: '$0.56 - $0.62/mi', appliedDate: 'Feb 15, 2026',
        lastUpdate: '5d ago', status: 'Declined', matchScore: 82,
    },
    {
        id: 'a5', carrier: 'Old Dominion Freight', position: 'LTL Regional Driver',
        location: 'Thomasville, NC', payRange: '$0.54 - $0.60/mi', appliedDate: 'Feb 10, 2026',
        lastUpdate: '1w ago', status: 'Withdrawn', matchScore: 78,
    },
];

const statusConfig: Record<Application['status'], { icon: string; color: string; variant: 'info' | 'warning' | 'success' | 'error' }> = {
    'Under Review': { icon: 'hourglass_top', color: 'var(--neu-warning, #f59e0b)', variant: 'warning' },
    'Interview': { icon: 'event', color: 'var(--neu-info, #3b82f6)', variant: 'info' },
    'Offered': { icon: 'celebration', color: 'var(--neu-success, #16a34a)', variant: 'success' },
    'Declined': { icon: 'block', color: 'var(--neu-danger, #ef4444)', variant: 'error' },
    'Withdrawn': { icon: 'undo', color: 'var(--neu-text-muted)', variant: 'error' },
};

export default function ApplicationsPage() {
    const [activeTab, setActiveTab] = useState<TabFilter>('all');
    const [expandedApp, setExpandedApp] = useState<string | null>(null);

    /* ── API Data ── */
    const { data: apiData, loading, error, refresh } = useApi<{ items: unknown[]; totalCount: number }>(
        () => getApplications(DEMO_DRIVER_ID, 20, 0).then(d => ({ data: d })),
        [DEMO_DRIVER_ID]
    );

    /* ── Map API items to Application interface (snake_case → camelCase), fallback to mock ── */
    const applications: Application[] = apiData?.items
        ? (apiData.items as Record<string, unknown>[]).map((item, i) => ({
            id: (item.id as string) || (item._id as string) || `api-${i}`,
            carrier: (item.carrier_name as string) || (item.carrier as string) || 'Unknown',
            position: (item.position as string) || (item.job_title as string) || 'Driver',
            location: (item.location as string) || '',
            payRange: (item.pay_range as string) || '',
            appliedDate: (item.applied_date as string) || (item.created_at as string) || '',
            lastUpdate: (item.last_update as string) || (item.updated_at as string) || '',
            status: (item.status as Application['status']) || 'Under Review',
            matchScore: Number(item.match_score ?? item.matchScore ?? 0),
            nextStep: (item.next_step as string) || (item.nextStep as string) || undefined,
            recruiterName: (item.recruiter_name as string) || (item.recruiterName as string) || undefined,
            interviewDate: (item.interview_date as string) || (item.interviewDate as string) || undefined,
        }))
        : mockApplications;

    /* ── Filter logic ── */
    const filtered = applications.filter((app) => {
        if (activeTab === 'all') return true;
        if (activeTab === 'active') return ['Under Review', 'Interview'].includes(app.status);
        if (activeTab === 'offers') return app.status === 'Offered';
        return ['Declined', 'Withdrawn'].includes(app.status);
    });

    const activeCount = applications.filter((a) => ['Under Review', 'Interview'].includes(a.status)).length;
    const offerCount = applications.filter((a) => a.status === 'Offered').length;

    const tabs: { id: TabFilter; label: string; count?: number }[] = [
        { id: 'all', label: 'All', count: applications.length },
        { id: 'active', label: 'Active', count: activeCount },
        { id: 'offers', label: 'Offers', count: offerCount },
        { id: 'closed', label: 'Closed' },
    ];

    return (
        <div className="space-y-5">
            {/* ── Header ── */}
            <div className="animate-fade-up">
                <h1 className="text-xl font-extrabold" style={{ color: 'var(--neu-text)' }}>
                    My Applications
                </h1>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>
                    Track your status with carriers
                </p>
            </div>

            {/* ── KPI Summary Row ── */}
            <div className="flex gap-3 animate-fade-up">
                {[
                    { label: 'Active', value: activeCount, icon: 'pending_actions' },
                    { label: 'Offers', value: offerCount, icon: 'handshake' },
                    { label: 'Total', value: applications.length, icon: 'description' },
                ].map((kpi) => (
                    <Card key={kpi.label} elevation="sm" className="flex-1 !p-3 text-center">
                        <div className="neu-x w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5">
                            <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-accent)' }}>
                                {kpi.icon}
                            </span>
                        </div>
                        <p className="text-[18px] font-black" style={{ color: 'var(--neu-text)' }}>{kpi.value}</p>
                        <p className="text-[10px] font-semibold" style={{ color: 'var(--neu-text-muted)' }}>{kpi.label}</p>
                    </Card>
                ))}
            </div>

            {/* ── Tab Filter ── */}
            <div className="flex gap-2 animate-fade-up">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all ${activeTab === tab.id ? '' : 'neu-x'
                            }`}
                        style={
                            activeTab === tab.id
                                ? { background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)', color: '#fff' }
                                : { color: 'var(--neu-text-muted)' }
                        }
                    >
                        {tab.label}
                        {tab.count !== undefined && (
                            <span
                                className={`text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center ${activeTab === tab.id ? 'bg-white/20' : ''
                                    }`}
                                style={activeTab !== tab.id ? { background: 'var(--neu-border)' } : undefined}
                            >
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Application Cards ── */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <Card elevation="sm" className="text-center py-8">
                        <span className="material-symbols-outlined text-[32px] mb-2" style={{ color: 'var(--neu-text-muted)' }}>inbox</span>
                        <p className="text-[13px] font-bold" style={{ color: 'var(--neu-text)' }}>No applications here</p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>Try a different filter</p>
                    </Card>
                ) : (
                    filtered.map((app, i) => {
                        const cfg = statusConfig[app.status];
                        const isExpanded = expandedApp === app.id;

                        return (
                            <button
                                key={app.id}
                                onClick={() => setExpandedApp(isExpanded ? null : app.id)}
                                className="w-full text-left animate-fade-up"
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                <Card elevation={isExpanded ? 'md' : 'sm'} className="!p-3.5">
                                    {/* ── Top Row ── */}
                                    <div className="flex items-start gap-3">
                                        {/* Status Icon Orb */}
                                        <div className="neu-ins w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-[20px]" style={{ color: cfg.color }}>
                                                {cfg.icon}
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-[13px] font-bold truncate" style={{ color: 'var(--neu-text)' }}>
                                                    {app.carrier}
                                                </h3>
                                                <Badge variant={cfg.variant} dot>{app.status}</Badge>
                                            </div>
                                            <p className="text-[11px] mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>
                                                {app.position}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>
                                                    <span className="material-symbols-outlined text-[11px]">schedule</span>
                                                    {app.lastUpdate}
                                                </span>
                                                <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>
                                                    <span className="material-symbols-outlined text-[11px]">location_on</span>
                                                    {app.location}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Expand */}
                                        <span
                                            className="material-symbols-outlined text-[16px] mt-1 transition-transform"
                                            style={{
                                                color: 'var(--neu-text-muted)',
                                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                            }}
                                        >
                                            expand_more
                                        </span>
                                    </div>

                                    {/* ── Expanded Details ── */}
                                    {isExpanded && (
                                        <div className="mt-3 pt-3 border-t space-y-3" style={{ borderColor: 'var(--neu-border)' }}>
                                            {/* Match Score */}
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-semibold" style={{ color: 'var(--neu-text-muted)' }}>Match Score</span>
                                                <span className="text-[11px] font-black" style={{ color: 'var(--neu-accent)' }}>{app.matchScore}%</span>
                                            </div>
                                            <ProgressBar value={app.matchScore} color="blue" />

                                            {/* Detail Grid */}
                                            <div className="grid grid-cols-2 gap-2.5">
                                                <div className="neu-x rounded-lg p-2.5">
                                                    <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--neu-text-muted)' }}>Pay Range</p>
                                                    <p className="text-[12px] font-bold mt-0.5" style={{ color: 'var(--neu-text)' }}>{app.payRange}</p>
                                                </div>
                                                <div className="neu-x rounded-lg p-2.5">
                                                    <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--neu-text-muted)' }}>Applied</p>
                                                    <p className="text-[12px] font-bold mt-0.5" style={{ color: 'var(--neu-text)' }}>{app.appliedDate}</p>
                                                </div>
                                            </div>

                                            {/* Recruiter */}
                                            {app.recruiterName && (
                                                <div className="neu-x rounded-lg p-2.5 flex items-center gap-2.5">
                                                    <div
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                                        style={{ background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)' }}
                                                    >
                                                        <span className="text-white text-[10px] font-bold">
                                                            {app.recruiterName.split(' ').map(n => n[0]).join('')}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold" style={{ color: 'var(--neu-text)' }}>{app.recruiterName}</p>
                                                        <p className="text-[9px]" style={{ color: 'var(--neu-text-muted)' }}>Recruiter</p>
                                                    </div>
                                                    <button
                                                        className="ml-auto neu-x w-8 h-8 rounded-lg flex items-center justify-center"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-accent)' }}>chat</span>
                                                    </button>
                                                </div>
                                            )}

                                            {/* Next Step Alert */}
                                            {app.nextStep && (
                                                <div
                                                    className="rounded-lg p-2.5 flex items-start gap-2"
                                                    style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}
                                                >
                                                    <span className="material-symbols-outlined text-[14px] mt-0.5" style={{ color: cfg.color }}>
                                                        info
                                                    </span>
                                                    <p className="text-[11px] font-medium flex-1" style={{ color: 'var(--neu-text)' }}>
                                                        {app.nextStep}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Interview Date */}
                                            {app.interviewDate && (
                                                <div className="neu-x rounded-lg p-2.5 flex items-center gap-2.5">
                                                    <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-accent)' }}>event</span>
                                                    <div>
                                                        <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--neu-text-muted)' }}>Interview</p>
                                                        <p className="text-[12px] font-bold" style={{ color: 'var(--neu-text)' }}>{app.interviewDate}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                {app.status === 'Offered' && (
                                                    <button
                                                        className="flex-1 py-2.5 rounded-xl text-[12px] font-bold text-white flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
                                                        style={{ background: 'linear-gradient(135deg, var(--neu-success, #16a34a) 0%, #15803d 100%)' }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                                        Accept Offer
                                                    </button>
                                                )}
                                                <button
                                                    className="flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform neu-x"
                                                    style={{ color: 'var(--neu-text)' }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--neu-accent)' }}>chat</span>
                                                    Message
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
