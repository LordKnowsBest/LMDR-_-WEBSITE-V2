'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import { useApi } from '@/lib/hooks';
import { getProgression, getAchievements, getChallenges, getLeaderboard } from '../../actions/gamification';

const DEMO_DRIVER_ID = 'demo-driver-001';

const gamification = {
    level: 3, title: 'Mile Maker', xp: 310, xpNext: 600,
    streak: 5, streakMultiplier: '1.2x', rank: 'Specialist',
};

const achievements = [
    { id: 1, icon: 'emoji_events', label: 'First Application', desc: 'Submitted your first job application', earned: true, xp: 100 },
    { id: 2, icon: 'star', label: 'Profile Pro', desc: 'Reached 80% profile completion', earned: true, xp: 150 },
    { id: 3, icon: 'local_fire_department', label: '5-Day Streak', desc: 'Logged in 5 days in a row', earned: true, xp: 200 },
    { id: 4, icon: 'check_circle', label: 'Match Accepted', desc: 'Accept your first carrier match', earned: false, xp: 250 },
    { id: 5, icon: 'workspace_premium', label: 'CDL Verified', desc: 'Upload and verify your CDL', earned: false, xp: 300 },
    { id: 6, icon: 'groups', label: 'Referral Star', desc: 'Refer another driver who joins', earned: false, xp: 500 },
];

const challenges = [
    { id: 1, label: 'Apply to 2 jobs today', type: 'Daily', progress: 1, total: 2, xp: 75, expires: '14h' },
    { id: 2, label: 'Complete your profile section', type: 'Weekly', progress: 3, total: 5, xp: 200, expires: '4d' },
    { id: 3, label: 'Send 3 messages to recruiters', type: 'Weekly', progress: 0, total: 3, xp: 150, expires: '4d' },
];

const leaderboard = [
    { rank: 1, name: 'James W.', xp: 1840, badge: '🏆' },
    { rank: 2, name: 'Maria C.', xp: 1620, badge: '🥈' },
    { rank: 3, name: 'You', xp: 310, badge: '🥉', isYou: true },
    { rank: 4, name: 'Devon T.', xp: 290, badge: '' },
    { rank: 5, name: 'Sandra K.', xp: 265, badge: '' },
];

const TABS = ['Overview', 'Achievements', 'Challenges', 'Leaderboard'];

export default function GamificationPage() {
    const [tab, setTab] = useState('Overview');

    /* ── API Data ── */
    const { data: progressionData } = useApi<Record<string, unknown>>(
        () => getProgression(DEMO_DRIVER_ID).then(d => ({ data: d as unknown as Record<string, unknown> })),
        [DEMO_DRIVER_ID]
    );
    const { data: achievementsData } = useApi<unknown[]>(
        () => getAchievements(DEMO_DRIVER_ID).then(d => ({ data: d })),
        [DEMO_DRIVER_ID]
    );
    const { data: challengesData } = useApi<unknown[]>(
        () => getChallenges(DEMO_DRIVER_ID).then(d => ({ data: d })),
        [DEMO_DRIVER_ID]
    );
    const { data: leaderboardData } = useApi<unknown[]>(
        () => getLeaderboard(10).then(d => ({ data: d })),
        []
    );

    /* ── Derive display values with mock fallbacks ── */
    const displayGamification = progressionData
        ? {
            level: Number(progressionData.level ?? gamification.level),
            title: (progressionData.levelName as string) || (progressionData.level_name as string) || gamification.title,
            xp: Number(progressionData.xp ?? gamification.xp),
            xpNext: Number(progressionData.xp_next ?? progressionData.xpNext ?? gamification.xpNext),
            streak: Number(progressionData.streakDays ?? progressionData.streak_days ?? gamification.streak),
            streakMultiplier: `${Number(progressionData.multiplier ?? 1)}x`,
            rank: (progressionData.rank as string) || gamification.rank,
        }
        : gamification;

    const displayAchievements = achievementsData
        ? (achievementsData as Record<string, unknown>[]).map((a, i) => ({
            id: Number(a.id ?? i + 1),
            icon: (a.icon as string) || 'emoji_events',
            label: (a.label as string) || (a.name as string) || (a.title as string) || 'Achievement',
            desc: (a.desc as string) || (a.description as string) || '',
            earned: Boolean(a.earned ?? a.is_earned ?? a.unlocked ?? false),
            xp: Number(a.xp ?? a.xp_reward ?? 0),
        }))
        : achievements;

    const displayChallenges = challengesData
        ? (challengesData as Record<string, unknown>[]).map((c, i) => ({
            id: Number(c.id ?? i + 1),
            label: (c.label as string) || (c.name as string) || (c.title as string) || 'Challenge',
            type: (c.type as string) || (c.challenge_type as string) || 'Daily',
            progress: Number(c.progress ?? c.current_progress ?? 0),
            total: Number(c.total ?? c.target ?? 1),
            xp: Number(c.xp ?? c.xp_reward ?? 0),
            expires: (c.expires as string) || (c.expires_in as string) || '',
        }))
        : challenges;

    const displayLeaderboard = leaderboardData
        ? (leaderboardData as Record<string, unknown>[]).map((e, i) => ({
            rank: Number(e.rank ?? i + 1),
            name: (e.name as string) || (e.driver_name as string) || 'Anonymous',
            xp: Number(e.xp ?? e.total_xp ?? 0),
            badge: (e.badge as string) || (i === 0 ? '\u{1F3C6}' : i === 1 ? '\u{1F948}' : i === 2 ? '\u{1F949}' : ''),
            isYou: Boolean(e.is_you ?? e.isYou ?? false),
        }))
        : leaderboard;

    const xpPct = Math.round((displayGamification.xp / displayGamification.xpNext) * 100);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div>
                <h1 className="text-xl font-extrabold" style={{ color: 'var(--neu-text)' }}>Gamification</h1>
                <p className="text-[12px]" style={{ color: 'var(--neu-text-muted)' }}>XP Hub · Badges · Challenges</p>
            </div>

            {/* Level Card */}
            <Card elevation="lg" className="animate-fade-up !p-5">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>
                            Level {displayGamification.level}
                        </p>
                        <p className="text-2xl font-black" style={{ color: 'var(--neu-accent)' }}>{displayGamification.title}</p>
                    </div>
                    <div className="text-right">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)' }}
                        >
                            <div className="text-center">
                                <p className="text-white text-[20px] font-black leading-none">{displayGamification.level}</p>
                                <p className="text-white text-[7px] font-bold opacity-80">LEVEL</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* XP Bar */}
                <div className="mb-3">
                    <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--neu-text-muted)' }}>
                        <span>{displayGamification.xp} XP</span>
                        <span>{displayGamification.xpNext} XP to Lv {displayGamification.level + 1}</span>
                    </div>
                    <div className="neu-in rounded-full h-3 overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                                width: `${xpPct}%`,
                                background: 'linear-gradient(90deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)',
                            }}
                        />
                    </div>
                    <p className="text-[10px] mt-1 text-right" style={{ color: 'var(--neu-accent)' }}>{xpPct}%</p>
                </div>

                {/* Streak + Multiplier */}
                <div className="flex gap-3">
                    <div className="neu-x rounded-xl px-3 py-2 flex items-center gap-2 flex-1">
                        <span className="material-symbols-outlined text-[18px] text-orange-400">local_fire_department</span>
                        <div>
                            <p className="text-[16px] font-black leading-none" style={{ color: 'var(--neu-text)' }}>{displayGamification.streak}</p>
                            <p className="text-[9px]" style={{ color: 'var(--neu-text-muted)' }}>Day Streak</p>
                        </div>
                    </div>
                    <div className="neu-x rounded-xl px-3 py-2 flex items-center gap-2 flex-1">
                        <span className="material-symbols-outlined text-[18px] text-yellow-400">bolt</span>
                        <div>
                            <p className="text-[16px] font-black leading-none" style={{ color: 'var(--neu-text)' }}>{displayGamification.streakMultiplier}</p>
                            <p className="text-[9px]" style={{ color: 'var(--neu-text-muted)' }}>XP Multiplier</p>
                        </div>
                    </div>
                    <div className="neu-x rounded-xl px-3 py-2 flex items-center gap-2 flex-1">
                        <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>military_tech</span>
                        <div>
                            <p className="text-[13px] font-black leading-none" style={{ color: 'var(--neu-text)' }}>{displayGamification.rank}</p>
                            <p className="text-[9px]" style={{ color: 'var(--neu-text-muted)' }}>Rank</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Tabs */}
            <div className="overflow-x-auto -mx-4 px-4 no-scrollbar">
                <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
                    {TABS.map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className="px-4 py-2 rounded-full text-[11px] font-bold transition-all duration-200"
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
            </div>

            {/* Overview */}
            {tab === 'Overview' && (
                <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>Recent Activity</p>
                    {[
                        { icon: 'send', label: 'Applied to Swift Transportation', xp: '+75 XP', time: '2h ago', color: 'var(--neu-accent)' },
                        { icon: 'local_fire_department', label: '5-Day Streak Bonus', xp: '+50 XP', time: 'Today', color: '#f97316' },
                        { icon: 'person', label: 'Profile updated', xp: '+25 XP', time: 'Yesterday', color: '#10b981' },
                        { icon: 'visibility', label: 'Swift Transportation viewed your profile', xp: '+10 XP', time: '2d ago', color: '#a78bfa' },
                    ].map((ev, i) => (
                        <Card key={i} elevation="sm" className="!p-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center neu-x shrink-0">
                                    <span className="material-symbols-outlined text-[16px]" style={{ color: ev.color }}>{ev.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--neu-text)' }}>{ev.label}</p>
                                    <p className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>{ev.time}</p>
                                </div>
                                <span className="text-[11px] font-black" style={{ color: 'var(--neu-accent)' }}>{ev.xp}</span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Achievements */}
            {tab === 'Achievements' && (
                <div className="grid grid-cols-2 gap-3">
                    {displayAchievements.map((ach) => (
                        <Card key={ach.id} elevation={ach.earned ? 'md' : 'sm'} className="!p-3.5" style={{ opacity: ach.earned ? 1 : 0.5 }}>
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                                style={{
                                    background: ach.earned
                                        ? 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)'
                                        : 'var(--neu-bg-soft)',
                                }}
                            >
                                <span className="material-symbols-outlined text-[18px]" style={{ color: ach.earned ? '#fff' : 'var(--neu-text-muted)' }}>
                                    {ach.icon}
                                </span>
                            </div>
                            <p className="text-[11px] font-bold" style={{ color: 'var(--neu-text)' }}>{ach.label}</p>
                            <p className="text-[9px] mt-0.5 mb-1.5" style={{ color: 'var(--neu-text-muted)' }}>{ach.desc}</p>
                            <span className="text-[9px] font-black" style={{ color: ach.earned ? 'var(--neu-accent)' : 'var(--neu-text-muted)' }}>
                                {ach.earned ? `+${ach.xp} XP earned` : `+${ach.xp} XP`}
                            </span>
                        </Card>
                    ))}
                </div>
            )}

            {/* Challenges */}
            {tab === 'Challenges' && (
                <div className="space-y-3">
                    {displayChallenges.map((ch) => {
                        const pct = Math.round((ch.progress / ch.total) * 100);
                        return (
                            <Card key={ch.id} elevation="md" className="!p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 min-w-0 mr-2">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span
                                                className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                                                style={{ background: 'var(--neu-accent)', color: '#fff' }}
                                            >
                                                {ch.type}
                                            </span>
                                            <span className="text-[9px]" style={{ color: 'var(--neu-text-muted)' }}>Expires in {ch.expires}</span>
                                        </div>
                                        <p className="text-[12px] font-semibold" style={{ color: 'var(--neu-text)' }}>{ch.label}</p>
                                    </div>
                                    <span className="text-[11px] font-black shrink-0" style={{ color: 'var(--neu-accent)' }}>+{ch.xp} XP</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="neu-in rounded-full h-2 flex-1 overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${pct}%`,
                                                background: 'linear-gradient(90deg, var(--neu-accent), var(--neu-accent-deep))',
                                            }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold shrink-0" style={{ color: 'var(--neu-text-muted)' }}>
                                        {ch.progress}/{ch.total}
                                    </span>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Leaderboard */}
            {tab === 'Leaderboard' && (
                <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>Weekly Rankings</p>
                    {displayLeaderboard.map((entry) => (
                        <Card
                            key={entry.rank}
                            elevation={entry.isYou ? 'lg' : 'sm'}
                            className="!p-3"
                            style={entry.isYou ? { borderLeft: '3px solid var(--neu-accent)' } : undefined}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-[16px] w-6 text-center">{entry.badge || `#${entry.rank}`}</span>
                                <p
                                    className={`flex-1 text-[13px] ${entry.isYou ? 'font-black' : 'font-semibold'}`}
                                    style={{ color: entry.isYou ? 'var(--neu-accent)' : 'var(--neu-text)' }}
                                >
                                    {entry.name}
                                </p>
                                <span className="text-[11px] font-bold" style={{ color: 'var(--neu-text-muted)' }}>{entry.xp.toLocaleString()} XP</span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
