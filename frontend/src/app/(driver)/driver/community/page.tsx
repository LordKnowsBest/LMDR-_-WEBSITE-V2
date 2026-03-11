'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';

const forums = [
    { id: 1, title: 'Best carriers for home-weekly OTR?', replies: 23, views: 412, tag: 'OTR', hot: true, time: '2h ago', author: 'trucking_james' },
    { id: 2, title: 'FMCSA compliance tips for new CDL holders', replies: 11, views: 189, tag: 'Compliance', hot: false, time: '5h ago', author: 'road_wisdom' },
    { id: 3, title: 'Werner vs Schneider — pay comparison 2026', replies: 47, views: 891, tag: 'Pay', hot: true, time: '1d ago', author: 'paycheck_pro' },
    { id: 4, title: 'HOS tips for new drivers', replies: 8, views: 134, tag: 'Tips', hot: false, time: '2d ago', author: 'veteran_cdl' },
];

const announcements = [
    { id: 1, carrier: 'Swift Transportation', message: 'New regional routes opening in Dallas, TX — $0.68/mile guaranteed.', time: '1h ago', read: false, logo: 'ST' },
    { id: 2, carrier: 'LMDR Platform', message: 'Your match score increased to 87 — 3 new carriers viewed your profile this week.', time: '3h ago', read: false, logo: 'LM' },
    { id: 3, carrier: 'Werner Enterprises', message: 'Sign-on bonus extended through end of March 2026 — $5,000.', time: '1d ago', read: true, logo: 'WE' },
    { id: 4, carrier: 'Schneider National', message: 'New pet-friendly policy — all regional drivers may bring one pet.', time: '2d ago', read: true, logo: 'SN' },
];

const surveys = [
    { id: 1, title: 'How are we doing?', desc: 'Rate your LMDR experience this week', questions: 5, xp: 50, completed: false },
    { id: 2, title: 'Pay Satisfaction Survey', desc: 'Help us improve carrier pay matching', questions: 8, xp: 75, completed: false },
    { id: 3, title: 'Feature Feedback', desc: 'New AI matching features — share your thoughts', questions: 4, xp: 40, completed: true },
];

const TABS = ['Forums', 'Announcements', 'Surveys'];

export default function CommunityPage() {
    const [tab, setTab] = useState('Forums');
    const [expandedForum, setExpandedForum] = useState<number | null>(null);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-xl font-extrabold" style={{ color: 'var(--neu-text)' }}>Community</h1>
                <p className="text-[12px]" style={{ color: 'var(--neu-text-muted)' }}>Forums · Announcements · Surveys</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {TABS.map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className="flex-1 py-2 rounded-xl text-[11px] font-bold transition-all duration-200"
                        style={
                            tab === t
                                ? { background: 'var(--neu-accent)', color: '#fff' }
                                : { background: 'var(--neu-bg-soft)', color: 'var(--neu-text-muted)' }
                        }
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Forums */}
            {tab === 'Forums' && (
                <div className="space-y-2.5">
                    <button
                        className="w-full py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5"
                        style={{ background: 'linear-gradient(135deg, var(--neu-accent), var(--neu-accent-deep))', color: '#fff' }}
                    >
                        <span className="material-symbols-outlined text-[15px]">edit</span>
                        New Post
                    </button>

                    {forums.map((f) => (
                        <Card key={f.id} elevation="sm" className="!p-3.5">
                            <div className="flex items-start gap-2 mb-2">
                                {f.hot && (
                                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500 text-white shrink-0 mt-0.5">HOT</span>
                                )}
                                <p className="text-[12px] font-semibold flex-1" style={{ color: 'var(--neu-text)' }}>{f.title}</p>
                            </div>
                            <div className="flex items-center gap-3 text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>
                                <span
                                    className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                                    style={{ background: 'var(--neu-bg-soft)', color: 'var(--neu-accent)' }}
                                >
                                    {f.tag}
                                </span>
                                <span className="flex items-center gap-0.5">
                                    <span className="material-symbols-outlined text-[12px]">chat_bubble</span>
                                    {f.replies}
                                </span>
                                <span className="flex items-center gap-0.5">
                                    <span className="material-symbols-outlined text-[12px]">visibility</span>
                                    {f.views}
                                </span>
                                <span className="ml-auto">{f.time}</span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Announcements */}
            {tab === 'Announcements' && (
                <div className="space-y-2.5">
                    {announcements.map((ann) => (
                        <Card
                            key={ann.id}
                            elevation={ann.read ? 'sm' : 'md'}
                            className="!p-3.5"
                            style={!ann.read ? { borderLeft: '3px solid var(--neu-accent)' } : undefined}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                    style={{
                                        background: ann.logo === 'LM'
                                            ? 'linear-gradient(135deg, var(--neu-accent), var(--neu-accent-deep))'
                                            : 'var(--neu-bg-deep)',
                                    }}
                                >
                                    <span className="text-[10px] font-bold" style={{ color: ann.logo === 'LM' ? '#fff' : 'var(--neu-text)' }}>
                                        {ann.logo}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between mb-0.5">
                                        <p className="text-[11px] font-bold" style={{ color: 'var(--neu-text)' }}>{ann.carrier}</p>
                                        <span className="text-[9px]" style={{ color: ann.read ? 'var(--neu-text-muted)' : 'var(--neu-accent)' }}>{ann.time}</span>
                                    </div>
                                    <p className="text-[11px] leading-relaxed" style={{ color: ann.read ? 'var(--neu-text-muted)' : 'var(--neu-text)' }}>
                                        {ann.message}
                                    </p>
                                </div>
                                {!ann.read && (
                                    <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: 'var(--neu-accent)' }} />
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Surveys */}
            {tab === 'Surveys' && (
                <div className="space-y-3">
                    {surveys.map((s) => (
                        <Card key={s.id} elevation={s.completed ? 'sm' : 'md'} className="!p-4" style={{ opacity: s.completed ? 0.6 : 1 }}>
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0 mr-2">
                                    <p className="text-[13px] font-bold" style={{ color: 'var(--neu-text)' }}>{s.title}</p>
                                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>{s.desc}</p>
                                </div>
                                <span className="text-[11px] font-black shrink-0" style={{ color: 'var(--neu-accent)' }}>+{s.xp} XP</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>{s.questions} questions</span>
                                <button
                                    className="px-3.5 py-1.5 rounded-lg text-[10px] font-bold"
                                    style={
                                        s.completed
                                            ? { background: 'var(--neu-bg-soft)', color: 'var(--neu-text-muted)' }
                                            : { background: 'linear-gradient(135deg, var(--neu-accent), var(--neu-accent-deep))', color: '#fff' }
                                    }
                                >
                                    {s.completed ? '✓ Completed' : 'Take Survey'}
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
