'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';

const policies = [
    { id: 1, title: 'FMCSA Hours of Service', carrier: 'Federal', updated: 'Jan 2026', status: 'signed' },
    { id: 2, title: 'Drug and Alcohol Clearinghouse Consent', carrier: 'LMDR Platform', updated: 'Feb 2026', status: 'signed' },
    { id: 3, title: 'Swift Regional Safety Protocol', carrier: 'Swift Transportation', updated: 'Mar 1, 2026', status: 'pending' },
    { id: 4, title: 'Equipment Inspection Requirements', carrier: 'Swift Transportation', updated: 'Mar 1, 2026', status: 'pending' },
];

const audits = [
    { id: 1, type: 'Medical Certificate Verification', status: 'verified', date: 'Jan 15, 2026' },
    { id: 2, type: 'CDL-A License Status', status: 'verified', date: 'Jan 15, 2026' },
    { id: 3, type: 'MVR Check', status: 'pending', date: 'Initiated Mar 8, 2026' },
];

export default function CompliancePage() {
    const [activeTab, setActiveTab] = useState('Policies');

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-xl font-extrabold" style={{ color: 'var(--neu-text)' }}>Compliance</h1>
                <p className="text-[12px]" style={{ color: 'var(--neu-text-muted)' }}>Policies · E-Signatures · Audits</p>
            </div>

            <div className="flex gap-2">
                {['Policies', 'Audits'].map((t) => (
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
                    </button>
                ))}
            </div>

            {activeTab === 'Policies' && (
                <div className="space-y-3">
                    <Card elevation="md" className="!p-4" style={{ borderLeft: '3px solid #f59e0b' }}>
                        <div className="flex gap-3">
                            <span className="material-symbols-outlined text-[20px] text-orange-500 shrink-0">warning</span>
                            <div>
                                <p className="text-[12px] font-bold" style={{ color: 'var(--neu-text)' }}>2 Action Items Required</p>
                                <p className="text-[10px] mt-0.5 mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                                    You have pending policies from Swift Transportation to review and sign before your application can proceed.
                                </p>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold" style={{ background: 'var(--neu-accent)', color: '#fff' }}>
                                        Review All
                                    </button>
                                    <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold" style={{ background: 'var(--neu-bg-soft)', color: 'var(--neu-text)' }}>
                                        Ask AI to Summarize
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <p className="text-[11px] font-bold uppercase tracking-wider mt-4 mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                        Carrier & Platform Agreements
                    </p>

                    <div className="space-y-2.5">
                        {policies.map((p) => (
                            <Card key={p.id} elevation={p.status === 'pending' ? 'md' : 'sm'} className="!p-3.5" style={{ opacity: p.status === 'signed' ? 0.6 : 1 }}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0 mr-2">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--neu-bg-soft)', color: 'var(--neu-text-muted)' }}>
                                                {p.carrier}
                                            </span>
                                            <span className="text-[9px]" style={{ color: 'var(--neu-text-muted)' }}>Updated {p.updated}</span>
                                        </div>
                                        <p className="text-[12px] font-semibold" style={{ color: 'var(--neu-text)' }}>{p.title}</p>
                                    </div>
                                    {p.status === 'pending' ? (
                                        <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0" style={{ background: 'var(--neu-accent)', color: '#fff' }}>
                                            Sign
                                        </button>
                                    ) : (
                                        <span className="text-[10px] font-bold text-green-500 shrink-0 flex items-center gap-0.5">
                                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                            Signed
                                        </span>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'Audits' && (
                <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                        Compliance & Background Checks
                    </p>
                    {audits.map((a) => (
                        <Card key={a.id} elevation="sm" className="!p-3.5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                                    style={{ background: a.status === 'verified' ? 'rgba(16, 185, 129, 0.1)' : 'var(--neu-bg-soft)' }}>
                                    <span className="material-symbols-outlined text-[16px]"
                                        style={{ color: a.status === 'verified' ? '#10b981' : 'var(--neu-text-muted)' }}>
                                        {a.status === 'verified' ? 'verified' : 'pending_actions'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-semibold" style={{ color: 'var(--neu-text)' }}>{a.type}</p>
                                    <p className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>{a.date}</p>
                                </div>
                                <span className="text-[10px] font-bold uppercase" style={{ color: a.status === 'verified' ? '#10b981' : '#f59e0b' }}>
                                    {a.status}
                                </span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
