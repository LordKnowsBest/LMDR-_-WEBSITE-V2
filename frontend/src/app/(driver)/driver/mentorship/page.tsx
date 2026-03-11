'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import { useApi } from '@/lib/hooks';
import { getMentors } from '../../actions/wellness';

const DEMO_DRIVER_ID = 'demo-driver-001';

const mockMentors = [
    { id: 1, name: 'David Miller', class: 'CDL-A', exp: '15 Yrs', rating: 4.9, active: true },
    { id: 2, name: 'Sarah Jenkins', class: 'CDL-A', exp: '8 Yrs', rating: 4.8, active: true },
    { id: 3, name: 'Michael Chang', class: 'CDL-B', exp: '5 Yrs', rating: 4.7, active: false },
];

const sessions = [
    { id: 1, mentor: 'David Miller', topic: 'OTR Route Planning & Safety', date: 'Tomorrow, 2:00 PM', status: 'upcoming' },
    { id: 2, mentor: 'Sarah Jenkins', topic: 'HOS Compliance Review', date: 'Jan 10, 2026', status: 'completed' },
];

export default function MentorshipPage() {
    const [tab, setTab] = useState('My Mentors');

    const { data: mentorsData } = useApi<Record<string, unknown>>(
        () => getMentors().then(d => ({ data: d as unknown as Record<string, unknown> })),
        [DEMO_DRIVER_ID]
    );

    const mentors = mentorsData && Array.isArray(mentorsData)
        ? (mentorsData as Array<Record<string, unknown>>).map((m, i) => ({
            id: i + 1,
            name: (m.name as string) || (m.full_name as string) || 'Unknown',
            class: (m.cdl_class as string) || (m.class as string) || 'CDL-A',
            exp: (m.experience as string) || (m.years_experience ? `${m.years_experience} Yrs` : '5 Yrs'),
            rating: (m.rating as number) || 4.5,
            active: m.active !== false,
        }))
        : mockMentors;

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-xl font-extrabold" style={{ color: 'var(--neu-text)' }}>Mentorship</h1>
                <p className="text-[12px]" style={{ color: 'var(--neu-text-muted)' }}>Find a Mentor · Scheduled Sessions</p>
            </div>

            <div className="flex gap-2">
                {['My Mentors', 'Browse Program'].map((t) => (
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

            {tab === 'My Mentors' && (
                <div className="space-y-4">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                            Upcoming Sessions
                        </p>
                        <div className="space-y-2.5">
                            {sessions.filter(s => s.status === 'upcoming').map(s => (
                                <Card key={s.id} elevation="md" className="!p-4" style={{ borderLeft: '3px solid var(--neu-accent)' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center neu-x shrink-0">
                                            <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>calendar_month</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[12px] font-bold" style={{ color: 'var(--neu-text)' }}>{s.topic}</p>
                                            <p className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>with {s.mentor}</p>
                                            <span className="text-[10px] font-bold" style={{ color: 'var(--neu-accent)' }}>{s.date}</span>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                            Past Sessions
                        </p>
                        <div className="space-y-2.5">
                            {sessions.filter(s => s.status === 'completed').map(s => (
                                <Card key={s.id} elevation="sm" className="!p-3.5">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-[12px] font-semibold" style={{ color: 'var(--neu-text)' }}>{s.topic}</p>
                                        <span className="text-[9px]" style={{ color: 'var(--neu-text-muted)' }}>{s.date}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>
                                        <span>with {s.mentor}</span>
                                        <span className="px-1.5 py-0.5 rounded text-[8px] bg-green-500/10 text-green-500 font-bold">✓ Completed</span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {tab === 'Browse Program' && (
                <div className="space-y-3">
                    <Card elevation="md" className="!p-4 bg-[var(--neu-bg-soft)]">
                        <h3 className="text-[14px] font-bold mb-1" style={{ color: 'var(--neu-text)' }}>Become a Mentor</h3>
                        <p className="text-[11px] mb-3" style={{ color: 'var(--neu-text-muted)' }}>
                            Share your experience and earn up to <span className="font-bold text-[var(--neu-accent)]">1,500 XP</span> per month by guiding new drivers.
                        </p>
                        <button className="w-full py-2 rounded-lg text-[11px] font-bold" style={{ background: 'var(--neu-accent)', color: '#fff' }}>
                            Apply to Mentor
                        </button>
                    </Card>

                    <p className="text-[11px] font-bold uppercase tracking-wider mt-4 mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                        Available Mentors
                    </p>
                    <div className="space-y-3">
                        {mentors.map(m => (
                            <Card key={m.id} elevation="sm" className="!p-3.5 flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full neu-x flex items-center justify-center">
                                        <span className="text-[14px] font-black text-[var(--neu-text-muted)]">
                                            {m.name.split(' ').map(n => n[0]).join('')}
                                        </span>
                                    </div>
                                    {m.active && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[var(--neu-bg)] rounded-full"></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className="text-[13px] font-bold" style={{ color: 'var(--neu-text)' }}>{m.name}</p>
                                        <div className="flex items-center text-[10px]">
                                            <span className="text-yellow-400">★</span>
                                            <span className="font-bold ml-0.5" style={{ color: 'var(--neu-text)' }}>{m.rating}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 text-[10px] my-1" style={{ color: 'var(--neu-text-muted)' }}>
                                        <span className="px-1.5 py-0.5 rounded-sm bg-[var(--neu-bg-soft)] font-bold">{m.class}</span>
                                        <span className="px-1.5 py-0.5 rounded-sm bg-[var(--neu-bg-soft)]">{m.exp}</span>
                                    </div>
                                </div>
                                <button className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                                    style={{ background: 'var(--neu-bg-soft)' }}>
                                    <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--neu-accent)' }}>arrow_forward</span>
                                </button>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
