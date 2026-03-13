'use client';

import { Card } from '@/components/ui';

export default function AiApplicationsTracker() {
    const activeApps = [
        {
            id: 101,
            carrier: "Apex Transportation",
            date: "Today",
            status: "Under Review",
            statusColor: "text-amber-500",
            statusBg: "bg-amber-100"
        },
        {
            id: 102,
            carrier: "Velocity Freight",
            date: "Yesterday",
            status: "Interview Requested",
            statusColor: "text-emerald-600",
            statusBg: "bg-emerald-100"
        }
    ];

    const pastApps = [
        {
            id: 103,
            carrier: "Swift Logistics",
            date: "Oct 12, 2025",
            status: "Declined",
            statusColor: "text-slate-500",
            statusBg: "bg-slate-200"
        }
    ];

    const renderAppCard = (app: any) => (
        <Card key={app.id} elevation="sm" className="!p-4 flex items-center justify-between mb-3 last:mb-0 transition-all neu-hover cursor-pointer border border-[var(--neu-border)]">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#0f172a', color: '#fbbf24' }}>
                    <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                </div>
                <div>
                    <h4 className="text-[13px] font-black" style={{ color: '#0f172a' }}>{app.carrier}</h4>
                    <p className="text-[10px] font-bold" style={{ color: '#475569' }}>Applied {app.date}</p>
                </div>
            </div>
            <div className="flex flex-col items-end gap-1">
                <span className={`px-2 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${app.statusColor} ${app.statusBg}`}>
                    {app.status}
                </span>
                <span className="text-[10px] font-bold text-[#2563eb] hover:underline flex items-center gap-0.5">
                    View Details <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                </span>
            </div>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-[18px] font-black" style={{ color: '#0f172a' }}>My Applications</h2>
                    <p className="text-[12px] font-medium" style={{ color: '#475569' }}>Track your active job requests and history.</p>
                </div>
            </div>

            <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#475569' }}>Active Review</h3>
                {activeApps.map(renderAppCard)}
            </div>

            <div className="opacity-70">
                <h3 className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#475569' }}>Past History</h3>
                {pastApps.map(renderAppCard)}
            </div>
        </div>
    );
}
