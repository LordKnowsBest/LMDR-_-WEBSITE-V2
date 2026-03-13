'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui';
import { useApi } from '@/lib/hooks';
import {
    getForums, getAnnouncements, getSurveys,
    createThread, markAnnouncementRead, submitSurveyResponse, getSurvey,
} from '../../actions/community';

const DEMO_DRIVER_ID = 'demo-driver-001';

/* ── Mock Fallback Data ── */
const mockForums = [
    { id: 1, title: 'Best carriers for home-weekly OTR?', replies: 23, views: 412, tag: 'OTR', hot: true, time: '2h ago', author: 'trucking_james' },
    { id: 2, title: 'FMCSA compliance tips for new CDL holders', replies: 11, views: 189, tag: 'Compliance', hot: false, time: '5h ago', author: 'road_wisdom' },
    { id: 3, title: 'Werner vs Schneider — pay comparison 2026', replies: 47, views: 891, tag: 'Pay', hot: true, time: '1d ago', author: 'paycheck_pro' },
    { id: 4, title: 'HOS tips for new drivers', replies: 8, views: 134, tag: 'Tips', hot: false, time: '2d ago', author: 'veteran_cdl' },
];

const mockAnnouncements = [
    { id: 1, carrier: 'Swift Transportation', message: 'New regional routes opening in Dallas, TX — $0.68/mile guaranteed.', time: '1h ago', read: false, logo: 'ST' },
    { id: 2, carrier: 'LMDR Platform', message: 'Your match score increased to 87 — 3 new carriers viewed your profile this week.', time: '3h ago', read: false, logo: 'LM' },
    { id: 3, carrier: 'Werner Enterprises', message: 'Sign-on bonus extended through end of March 2026 — $5,000.', time: '1d ago', read: true, logo: 'WE' },
    { id: 4, carrier: 'Schneider National', message: 'New pet-friendly policy — all regional drivers may bring one pet.', time: '2d ago', read: true, logo: 'SN' },
];

const mockSurveys = [
    { id: 1, title: 'How are we doing?', desc: 'Rate your LMDR experience this week', questions: 5, xp: 50, completed: false },
    { id: 2, title: 'Pay Satisfaction Survey', desc: 'Help us improve carrier pay matching', questions: 8, xp: 75, completed: false },
    { id: 3, title: 'Feature Feedback', desc: 'New AI matching features — share your thoughts', questions: 4, xp: 40, completed: true },
];

const TABS = ['Forums', 'Announcements', 'Surveys'];

export default function CommunityPage() {
    const [tab, setTab] = useState('Forums');
    const [expandedForum, setExpandedForum] = useState<number | null>(null);

    /* ── New Post form state ── */
    const [showNewPost, setShowNewPost] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [postSubmitting, setPostSubmitting] = useState(false);

    /* ── Survey state ── */
    const [activeSurveyId, setActiveSurveyId] = useState<string | null>(null);
    const [surveyAnswers, setSurveyAnswers] = useState<Record<number, number>>({});
    const [surveySubmitting, setSurveySubmitting] = useState(false);
    const [surveyDetail, setSurveyDetail] = useState<Record<string, unknown> | null>(null);

    /* ── Announcement read-tracking ── */
    const [markedRead, setMarkedRead] = useState<Set<string | number>>(new Set());

    const { data: forumsData } = useApi<Record<string, unknown>[]>(
        () => getForums().then(d => ({ data: d as unknown as Record<string, unknown>[] })),
        []
    );
    const { data: announcementsData } = useApi<Record<string, unknown>[]>(
        () => getAnnouncements().then(d => ({ data: d as unknown as Record<string, unknown>[] })),
        []
    );
    const { data: surveysData } = useApi<Record<string, unknown>[]>(
        () => getSurveys().then(d => ({ data: d as unknown as Record<string, unknown>[] })),
        []
    );

    const forums = (forumsData as typeof mockForums) ?? mockForums;
    const announcements = (announcementsData as typeof mockAnnouncements) ?? mockAnnouncements;
    const surveys = (surveysData as typeof mockSurveys) ?? mockSurveys;

    /* ── New Post handler ── */
    const handleCreateThread = useCallback(async () => {
        if (!newPostTitle.trim() || !newPostContent.trim()) return;
        setPostSubmitting(true);
        try {
            const categoryId = forums[0]?.id?.toString() ?? 'general';
            await createThread(categoryId, {
                title: newPostTitle.trim(),
                content: newPostContent.trim(),
                authorId: DEMO_DRIVER_ID,
            });
            setNewPostTitle('');
            setNewPostContent('');
            setShowNewPost(false);
        } catch (err) {
            console.error('Failed to create thread:', err);
        } finally {
            setPostSubmitting(false);
        }
    }, [newPostTitle, newPostContent, forums]);

    /* ── Mark announcement read on expand ── */
    const handleAnnouncementExpand = useCallback(async (ann: typeof mockAnnouncements[0]) => {
        if (ann.read || markedRead.has(ann.id)) return;
        setMarkedRead(prev => new Set(prev).add(ann.id));
        try {
            await markAnnouncementRead(String(ann.id), DEMO_DRIVER_ID);
        } catch (err) {
            console.error('Failed to mark announcement read:', err);
        }
    }, [markedRead]);

    /* ── Survey handlers ── */
    const handleOpenSurvey = useCallback(async (surveyId: string | number) => {
        const id = String(surveyId);
        setActiveSurveyId(id);
        setSurveyAnswers({});
        setSurveyDetail(null);
        try {
            const detail = await getSurvey(id);
            setSurveyDetail(detail as Record<string, unknown>);
        } catch {
            // Fallback — use basic survey info from list
        }
    }, []);

    const handleSubmitSurvey = useCallback(async () => {
        if (!activeSurveyId) return;
        setSurveySubmitting(true);
        try {
            await submitSurveyResponse(activeSurveyId, {
                driverId: DEMO_DRIVER_ID,
                answers: surveyAnswers,
            });
            setActiveSurveyId(null);
            setSurveyAnswers({});
        } catch (err) {
            console.error('Failed to submit survey:', err);
        } finally {
            setSurveySubmitting(false);
        }
    }, [activeSurveyId, surveyAnswers]);

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
                        onClick={() => setShowNewPost(v => !v)}
                        className="w-full py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5"
                        style={{ background: 'linear-gradient(135deg, var(--neu-accent), var(--neu-accent-deep))', color: '#fff' }}
                    >
                        <span className="material-symbols-outlined text-[15px]">{showNewPost ? 'close' : 'edit'}</span>
                        {showNewPost ? 'Cancel' : 'New Post'}
                    </button>

                    {/* New Post Form */}
                    {showNewPost && (
                        <Card elevation="md" className="!p-4 space-y-3">
                            <input
                                type="text"
                                placeholder="Post title..."
                                value={newPostTitle}
                                onChange={(e) => setNewPostTitle(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg text-[12px] neu-in outline-none"
                                style={{ background: 'var(--neu-bg-soft)', color: 'var(--neu-text)' }}
                            />
                            <textarea
                                placeholder="What's on your mind?"
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 rounded-lg text-[12px] neu-in outline-none resize-none"
                                style={{ background: 'var(--neu-bg-soft)', color: 'var(--neu-text)' }}
                            />
                            <button
                                onClick={handleCreateThread}
                                disabled={postSubmitting || !newPostTitle.trim()}
                                className="w-full py-2 rounded-lg text-[11px] font-bold disabled:opacity-50"
                                style={{ background: 'var(--neu-accent)', color: '#fff' }}
                            >
                                {postSubmitting ? 'Posting...' : 'Submit Post'}
                            </button>
                        </Card>
                    )}

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
                    {announcements.map((ann) => {
                        const isRead = ann.read || markedRead.has(ann.id);
                        return (
                            <Card
                                key={ann.id}
                                elevation={isRead ? 'sm' : 'md'}
                                className="!p-3.5 cursor-pointer"
                                style={!isRead ? { borderLeft: '3px solid var(--neu-accent)' } : undefined}
                                onClick={() => handleAnnouncementExpand(ann)}
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
                                            <span className="text-[9px]" style={{ color: isRead ? 'var(--neu-text-muted)' : 'var(--neu-accent)' }}>{ann.time}</span>
                                        </div>
                                        <p className="text-[11px] leading-relaxed" style={{ color: isRead ? 'var(--neu-text-muted)' : 'var(--neu-text)' }}>
                                            {ann.message}
                                        </p>
                                    </div>
                                    {!isRead && (
                                        <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: 'var(--neu-accent)' }} />
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Surveys */}
            {tab === 'Surveys' && (
                <div className="space-y-3">
                    {/* Active survey modal */}
                    {activeSurveyId && (
                        <Card elevation="lg" className="!p-4 space-y-3" style={{ borderLeft: '3px solid var(--neu-accent)' }}>
                            <div className="flex justify-between items-start">
                                <p className="text-[13px] font-bold" style={{ color: 'var(--neu-text)' }}>
                                    {surveys.find(s => String(s.id) === activeSurveyId)?.title ?? 'Survey'}
                                </p>
                                <button onClick={() => setActiveSurveyId(null)} className="text-[12px]" style={{ color: 'var(--neu-text-muted)' }}>
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                            </div>
                            <p className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>
                                Rate each question from 1 (poor) to 5 (excellent)
                            </p>
                            {Array.from({ length: surveys.find(s => String(s.id) === activeSurveyId)?.questions ?? 3 }, (_, i) => (
                                <div key={i} className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-medium" style={{ color: 'var(--neu-text)' }}>Question {i + 1}</span>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(v => (
                                            <button
                                                key={v}
                                                onClick={() => setSurveyAnswers(prev => ({ ...prev, [i]: v }))}
                                                className="w-7 h-7 rounded-lg text-[10px] font-bold transition-all"
                                                style={
                                                    surveyAnswers[i] === v
                                                        ? { background: 'var(--neu-accent)', color: '#fff' }
                                                        : { background: 'var(--neu-bg-soft)', color: 'var(--neu-text-muted)' }
                                                }
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={handleSubmitSurvey}
                                disabled={surveySubmitting}
                                className="w-full py-2 rounded-lg text-[11px] font-bold disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, var(--neu-accent), var(--neu-accent-deep))', color: '#fff' }}
                            >
                                {surveySubmitting ? 'Submitting...' : 'Submit Survey'}
                            </button>
                        </Card>
                    )}

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
                                    onClick={() => !s.completed && handleOpenSurvey(s.id)}
                                    disabled={s.completed}
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
