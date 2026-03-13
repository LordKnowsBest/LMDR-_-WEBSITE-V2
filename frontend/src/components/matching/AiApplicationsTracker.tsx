'use client';

import { Card } from '@/components/ui';

interface Application {
    _id: string;
    status: string;
    driver_id: string;
    carrier_dot?: string;
    match_score?: number;
    carrier_name?: string;
    created_at?: string;
}

interface AiApplicationsTrackerProps {
    applications?: Application[];
    loading?: boolean;
    onRefresh?: () => void;
}

// Mock fallback when no real data is available
const FALLBACK_ACTIVE = [
    { _id: 'mock-1', carrier_name: 'Apex Transportation', created_at: 'Today', status: 'applied', driver_id: '', match_score: 98 },
    { _id: 'mock-2', carrier_name: 'Velocity Freight', created_at: 'Yesterday', status: 'interview', driver_id: '', match_score: 91 },
];
const FALLBACK_PAST = [
    { _id: 'mock-3', carrier_name: 'Swift Logistics', created_at: 'Oct 12, 2025', status: 'declined', driver_id: '', match_score: 85 },
];

function formatDate(dateStr?: string): string {
    if (!dateStr) return 'Unknown';
    try {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

function statusDisplay(status: string): { label: string; colorClass: string; bgClass: string } {
    switch (status?.toLowerCase()) {
        case 'applied':
        case 'under review':
            return { label: 'Under Review', colorClass: 'text-amber-500', bgClass: 'bg-amber-100' };
        case 'interview':
        case 'interview_requested':
            return { label: 'Interview Requested', colorClass: 'text-emerald-600', bgClass: 'bg-emerald-100' };
        case 'accepted':
        case 'hired':
            return { label: 'Accepted', colorClass: 'text-green-600', bgClass: 'bg-green-100' };
        case 'declined':
        case 'rejected':
            return { label: 'Declined', colorClass: 'text-slate-500', bgClass: 'bg-slate-200' };
        case 'withdrawn':
            return { label: 'Withdrawn', colorClass: 'text-slate-400', bgClass: 'bg-slate-100' };
        default:
            return { label: status || 'Pending', colorClass: 'text-blue-500', bgClass: 'bg-blue-100' };
    }
}

export default function AiApplicationsTracker({ applications, loading, onRefresh }: AiApplicationsTrackerProps) {
    const hasRealData = applications && applications.length > 0;

    // Split into active vs past
    const activeStatuses = ['applied', 'under review', 'interview', 'interview_requested', 'accepted'];
    const allApps = hasRealData ? applications : [...FALLBACK_ACTIVE, ...FALLBACK_PAST];
    const activeApps = allApps.filter(a => activeStatuses.includes(a.status?.toLowerCase()));
    const pastApps = allApps.filter(a => !activeStatuses.includes(a.status?.toLowerCase()));

    const renderAppCard = (app: Application) => {
        const { label, colorClass, bgClass } = statusDisplay(app.status);
        return (
            <Card key={app._id} elevation="sm" className="!p-4 flex items-center justify-between mb-3 last:mb-0 transition-all neu-hover cursor-pointer border border-[var(--neu-border)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#0f172a', color: '#fbbf24' }}>
                        <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                    </div>
                    <div>
                        <h4 className="text-[13px] font-black" style={{ color: '#0f172a' }}>{app.carrier_name ?? 'Unknown Carrier'}</h4>
                        <p className="text-[10px] font-bold" style={{ color: '#475569' }}>Applied {formatDate(app.created_at)}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${colorClass} ${bgClass}`}>
                        {label}
                    </span>
                    <span className="text-[10px] font-bold text-[#2563eb] hover:underline flex items-center gap-0.5">
                        View Details <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                    </span>
                </div>
            </Card>
        );
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <h2 className="text-[18px] font-black" style={{ color: '#0f172a' }}>My Applications</h2>
                <Card elevation="flat" className="!p-8 flex flex-col items-center justify-center space-y-2 text-center">
                    <div className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: '#2563eb transparent transparent transparent' }}></div>
                    <p className="text-[12px] font-medium" style={{ color: '#475569' }}>Loading applications...</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-[18px] font-black" style={{ color: '#0f172a' }}>My Applications</h2>
                    <p className="text-[12px] font-medium" style={{ color: '#475569' }}>
                        {hasRealData
                            ? `${allApps.length} total application${allApps.length !== 1 ? 's' : ''}`
                            : 'Track your active job requests and history.'}
                    </p>
                </div>
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all neu-hover flex items-center gap-1"
                        style={{ background: 'var(--neu-bg-soft)', color: '#475569', border: '1px solid var(--neu-border)' }}
                    >
                        <span className="material-symbols-outlined text-[12px]">refresh</span>
                        Refresh
                    </button>
                )}
            </div>

            {activeApps.length > 0 && (
                <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#475569' }}>Active Review</h3>
                    {activeApps.map(renderAppCard)}
                </div>
            )}

            {pastApps.length > 0 && (
                <div className="opacity-70">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#475569' }}>Past History</h3>
                    {pastApps.map(renderAppCard)}
                </div>
            )}

            {allApps.length === 0 && (
                <Card elevation="flat" className="!p-8 text-center">
                    <span className="material-symbols-outlined text-[32px] mb-2 block" style={{ color: '#cbd5e1' }}>inbox</span>
                    <p className="text-[13px] font-bold" style={{ color: '#0f172a' }}>No applications yet</p>
                    <p className="text-[11px] font-medium" style={{ color: '#475569' }}>Find your first carrier match and apply!</p>
                </Card>
            )}
        </div>
    );
}
