'use client';

import { useState } from 'react';
import { Card, Badge } from '@/components/ui';

/* ── Mock Data ── */
interface Message {
    id: string;
    from: string;
    company: string;
    avatar: string;
    preview: string;
    time: string;
    unread: boolean;
    online: boolean;
}

interface ChatMessage {
    id: string;
    sender: 'driver' | 'recruiter';
    text: string;
    time: string;
}

const mockConversations: Message[] = [
    {
        id: '1',
        from: 'Sarah Chen',
        company: 'Swift Transportation',
        avatar: 'SC',
        preview: 'We\'d love to schedule an interview for the OTR position...',
        time: '2m ago',
        unread: true,
        online: true,
    },
    {
        id: '2',
        from: 'Mike Rodriguez',
        company: 'Werner Enterprises',
        avatar: 'MR',
        preview: 'Your application has been reviewed. Can you share your MVR?',
        time: '1h ago',
        unread: true,
        online: false,
    },
    {
        id: '3',
        from: 'Jessica Park',
        company: 'Schneider National',
        avatar: 'JP',
        preview: 'Thanks for your interest! Here are the details about the regional routes...',
        time: '3h ago',
        unread: false,
        online: true,
    },
    {
        id: '4',
        from: 'David Kim',
        company: 'J.B. Hunt',
        avatar: 'DK',
        preview: 'Great news! Your background check cleared. Next steps...',
        time: 'Yesterday',
        unread: false,
        online: false,
    },
    {
        id: '5',
        from: 'LMDR Support',
        company: 'LMDR Platform',
        avatar: 'LM',
        preview: 'Your profile completeness is at 72%. Complete it to get more matches!',
        time: '2d ago',
        unread: false,
        online: true,
    },
];

const mockChatMessages: Record<string, ChatMessage[]> = {
    '1': [
        { id: 'c1', sender: 'recruiter', text: 'Hi Marcus! We reviewed your profile and your experience looks great.', time: '10:30 AM' },
        { id: 'c2', sender: 'recruiter', text: 'We have an OTR Dry Van position open in Phoenix, AZ. Pay is $0.62/mile with benefits.', time: '10:31 AM' },
        { id: 'c3', sender: 'driver', text: 'Thanks Sarah! That sounds interesting. What\'s the home time like?', time: '10:45 AM' },
        { id: 'c4', sender: 'recruiter', text: 'Home every other weekend. We also have regional options if that\'s more your style.', time: '10:47 AM' },
        { id: 'c5', sender: 'recruiter', text: 'We\'d love to schedule an interview for the OTR position. Are you free this Thursday?', time: '10:48 AM' },
    ],
    '2': [
        { id: 'c6', sender: 'recruiter', text: 'Hello Marcus, thanks for applying to Werner Enterprises.', time: 'Yesterday' },
        { id: 'c7', sender: 'recruiter', text: 'Your application has been reviewed. Can you share your MVR?', time: 'Yesterday' },
    ],
    '3': [
        { id: 'c8', sender: 'recruiter', text: 'Hi! Thanks for your interest in Schneider National.', time: '2 days ago' },
        { id: 'c9', sender: 'driver', text: 'Hi Jessica! I\'m interested in the regional routes.', time: '2 days ago' },
        { id: 'c10', sender: 'recruiter', text: 'Thanks for your interest! Here are the details about the regional routes — we cover the Midwest corridor with home weekly guarantee.', time: '3h ago' },
    ],
};

export default function MessagesPage() {
    const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [voiceActive, setVoiceActive] = useState(false);
    const [voicePhase, setVoicePhase] = useState<'listening' | 'processing'>('listening');
    const [voiceTranscript, setVoiceTranscript] = useState('');

    const activeConvo = mockConversations.find((c) => c.id === selectedConvo);
    const chatMessages = selectedConvo ? mockChatMessages[selectedConvo] || [] : [];
    const unreadCount = mockConversations.filter((c) => c.unread).length;

    /* ── Send handler ── */
    const handleSend = () => {
        if (!inputValue.trim()) return;
        // In production this would call messagingService
        setInputValue('');
    };

    /* ── Voice handlers ── */
    const startVoice = () => {
        setVoiceActive(true);
        setVoicePhase('listening');
        setVoiceTranscript('');

        setTimeout(() => {
            setVoiceTranscript("Yes, I'm interested in the position...");
            setVoicePhase('processing');

            setTimeout(() => {
                setInputValue("Yes, I'm interested in the position");
                setVoiceActive(false);
                setVoiceTranscript('');
            }, 1500);
        }, 3000);
    };

    const stopVoice = () => {
        setVoiceActive(false);
        setVoiceTranscript('');
    };

    /* ── Chat View ── */
    if (selectedConvo && activeConvo) {
        return (
            <div className="flex flex-col -my-5 -mx-4" style={{ height: 'calc(100vh - 120px)' }}>
                {/* Chat Header */}
                <div
                    className="flex items-center gap-3 px-4 py-3 shrink-0 neu-s"
                    style={{ borderBottom: '1px solid var(--neu-border)' }}
                >
                    <button
                        onClick={() => setSelectedConvo(null)}
                        className="neu-x w-8 h-8 rounded-lg flex items-center justify-center active:scale-95 transition-transform"
                    >
                        <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-text-muted)' }}>
                            arrow_back
                        </span>
                    </button>

                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 relative"
                        style={{ background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)' }}
                    >
                        <span className="text-white text-[11px] font-bold">{activeConvo.avatar}</span>
                        {activeConvo.online && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2" style={{ borderColor: 'var(--neu-bg)' }} />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold truncate" style={{ color: 'var(--neu-text)' }}>
                            {activeConvo.from}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>
                            {activeConvo.company} {activeConvo.online && '· Online'}
                        </p>
                    </div>

                    <button className="neu-x w-8 h-8 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-text-muted)' }}>
                            more_vert
                        </span>
                    </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar">
                    {chatMessages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'driver' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${msg.sender === 'driver'
                                    ? 'rounded-br-sm'
                                    : 'rounded-bl-sm neu-x'
                                    }`}
                                style={
                                    msg.sender === 'driver'
                                        ? {
                                            background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)',
                                        }
                                        : undefined
                                }
                            >
                                <p
                                    className="text-[13px] leading-relaxed"
                                    style={{
                                        color: msg.sender === 'driver' ? '#ffffff' : 'var(--neu-text)',
                                    }}
                                >
                                    {msg.text}
                                </p>
                                <p
                                    className="text-[9px] mt-1 text-right"
                                    style={{
                                        color: msg.sender === 'driver' ? 'rgba(255,255,255,0.6)' : 'var(--neu-text-muted)',
                                    }}
                                >
                                    {msg.time}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chat Input */}
                <div
                    className="shrink-0 px-4 py-3"
                    style={{ background: 'var(--neu-bg)', borderTop: '1px solid var(--neu-border)' }}
                >
                    {/* Voice Listening State */}
                    {voiceActive ? (
                        <div className="flex flex-col items-center gap-2 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>
                                {voicePhase === 'listening' ? 'Listening...' : 'Processing...'}
                            </p>

                            {/* Mini Voice Orb */}
                            <div className="relative">
                                {voicePhase === 'listening' && (
                                    <>
                                        <div
                                            className="absolute rounded-full"
                                            style={{
                                                width: 64, height: 64, left: -8, top: -8,
                                                background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
                                                animation: 'msgOrbPulse 2s ease-in-out infinite',
                                            }}
                                        />
                                        <div
                                            className="absolute rounded-full"
                                            style={{
                                                width: 56, height: 56, left: -4, top: -4,
                                                background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%)',
                                                animation: 'msgOrbPulse 1.5s ease-in-out infinite',
                                            }}
                                        />
                                    </>
                                )}
                                {voicePhase === 'processing' && (
                                    <div
                                        className="absolute rounded-full"
                                        style={{
                                            width: 52, height: 52, left: -2, top: -2,
                                            border: '2px solid transparent',
                                            borderTopColor: 'rgba(37,99,235,0.8)',
                                            borderRightColor: 'rgba(37,99,235,0.4)',
                                            animation: 'msgSpin 1s linear infinite',
                                        }}
                                    />
                                )}
                                <button
                                    onClick={stopVoice}
                                    className="relative w-12 h-12 rounded-full flex items-center justify-center"
                                    style={{
                                        background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)',
                                        boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
                                    }}
                                >
                                    {voicePhase === 'listening' ? (
                                        <div className="flex gap-[2px] items-center h-4">
                                            {[0, 1, 2, 3, 4].map((i) => (
                                                <div
                                                    key={i}
                                                    className="w-[2px] rounded-full bg-white"
                                                    style={{
                                                        animation: 'msgWave 0.8s ease-in-out infinite',
                                                        animationDelay: `${i * 0.12}s`,
                                                        height: '100%',
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex gap-1 items-center">
                                            {[0, 1, 2].map((i) => (
                                                <div
                                                    key={i}
                                                    className="w-1.5 h-1.5 rounded-full bg-white"
                                                    style={{ animation: 'msgDot 1s ease-in-out infinite', animationDelay: `${i * 0.2}s` }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </button>
                            </div>

                            {voiceTranscript && (
                                <p className="text-[11px] italic text-center max-w-[220px]" style={{ color: 'var(--neu-text-muted)' }}>
                                    &ldquo;{voiceTranscript}&rdquo;
                                </p>
                            )}

                            <button
                                onClick={stopVoice}
                                className="text-[9px] font-semibold flex items-center gap-1"
                                style={{ color: 'var(--neu-text-muted)' }}
                            >
                                <span className="material-symbols-outlined text-[10px]">close</span>
                                Tap to cancel
                            </button>

                            <style>{`
                                @keyframes msgOrbPulse {
                                    0%,100%{transform:scale(1);opacity:.4}
                                    50%{transform:scale(1.25);opacity:.1}
                                }
                                @keyframes msgWave {
                                    0%,100%{transform:scaleY(.3)}
                                    50%{transform:scaleY(1)}
                                }
                                @keyframes msgDot {
                                    0%,100%{transform:translateY(0);opacity:.4}
                                    50%{transform:translateY(-4px);opacity:1}
                                }
                                @keyframes msgSpin {
                                    from{transform:rotate(0deg)}
                                    to{transform:rotate(360deg)}
                                }
                            `}</style>
                        </div>
                    ) : (
                        <>
                            {/* Quick Replies */}
                            <div className="flex gap-2 mb-2.5 overflow-x-auto no-scrollbar">
                                {['Yes, I\'m interested', 'Can you share more details?', 'What\'s the pay?'].map((reply) => (
                                    <button
                                        key={reply}
                                        onClick={() => setInputValue(reply)}
                                        className="neu-x rounded-full px-3 py-1.5 text-[10px] font-semibold whitespace-nowrap shrink-0 active:scale-95 transition-transform"
                                        style={{ color: 'var(--neu-accent)' }}
                                    >
                                        {reply}
                                    </button>
                                ))}
                            </div>

                            {/* Input Row */}
                            <div className="neu-in rounded-xl p-1 flex items-center gap-1.5">
                                <button className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ color: 'var(--neu-text-muted)' }}>
                                    <span className="material-symbols-outlined text-[18px]">attach_file</span>
                                </button>
                                <button
                                    onClick={startVoice}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                                    style={{
                                        background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)',
                                    }}
                                >
                                    <span className="material-symbols-outlined text-white text-[16px]">mic</span>
                                </button>
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-transparent border-none outline-none text-[13px] font-medium px-1"
                                    style={{ color: 'var(--neu-text)' }}
                                />
                                <button
                                    onClick={handleSend}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform active:scale-90"
                                    style={{
                                        background: inputValue.trim()
                                            ? 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)'
                                            : 'var(--neu-bg-soft)',
                                    }}
                                >
                                    <span
                                        className="material-symbols-outlined text-[16px]"
                                        style={{ color: inputValue.trim() ? '#fff' : 'var(--neu-text-muted)' }}
                                    >
                                        send
                                    </span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    /* ── Conversation List View ── */
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-extrabold" style={{ color: 'var(--neu-text)' }}>
                        Messages
                    </h1>
                    <p className="text-[12px]" style={{ color: 'var(--neu-text-muted)' }}>
                        {unreadCount} unread conversation{unreadCount !== 1 ? 's' : ''}
                    </p>
                </div>
                <button className="neu-x w-9 h-9 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>
                        edit_square
                    </span>
                </button>
            </div>

            {/* Search */}
            <div className="neu-in rounded-xl p-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] ml-2" style={{ color: 'var(--neu-text-muted)' }}>
                    search
                </span>
                <input
                    type="text"
                    placeholder="Search messages..."
                    className="flex-1 bg-transparent border-none outline-none text-[13px] font-medium py-1.5"
                    style={{ color: 'var(--neu-text)' }}
                />
            </div>

            {/* Filter Chips */}
            <div className="flex gap-2">
                {['All', 'Unread', 'Carriers', 'LMDR'].map((filter, i) => (
                    <button
                        key={filter}
                        className={`rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-all ${i === 0 ? '' : 'neu-x'
                            }`}
                        style={
                            i === 0
                                ? {
                                    background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)',
                                    color: '#fff',
                                }
                                : { color: 'var(--neu-text-muted)' }
                        }
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* Conversation Cards */}
            <div className="space-y-2.5">
                {mockConversations.map((convo) => (
                    <button
                        key={convo.id}
                        onClick={() => setSelectedConvo(convo.id)}
                        className="w-full text-left animate-fade-up"
                    >
                        <Card
                            elevation={convo.unread ? 'md' : 'sm'}
                            className={`!p-3.5 ${convo.unread ? '!border-l-2' : ''
                                }`}
                            style={convo.unread ? { borderLeftColor: 'var(--neu-accent)' } : undefined}
                        >
                            <div className="flex items-start gap-3">
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <div
                                        className="w-11 h-11 rounded-xl flex items-center justify-center"
                                        style={{
                                            background: convo.avatar === 'LM'
                                                ? 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)'
                                                : 'var(--neu-bg-deep)',
                                        }}
                                    >
                                        <span
                                            className="text-[12px] font-bold"
                                            style={{ color: convo.avatar === 'LM' ? '#fff' : 'var(--neu-text)' }}
                                        >
                                            {convo.avatar}
                                        </span>
                                    </div>
                                    {convo.online && (
                                        <span
                                            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2"
                                            style={{ borderColor: 'var(--neu-bg)' }}
                                        />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <p
                                            className={`text-[13px] truncate ${convo.unread ? 'font-bold' : 'font-semibold'}`}
                                            style={{ color: 'var(--neu-text)' }}
                                        >
                                            {convo.from}
                                        </p>
                                        <span
                                            className="text-[10px] shrink-0 ml-2"
                                            style={{ color: convo.unread ? 'var(--neu-accent)' : 'var(--neu-text-muted)' }}
                                        >
                                            {convo.time}
                                        </span>
                                    </div>
                                    <p className="text-[10px] mb-1" style={{ color: 'var(--neu-text-muted)' }}>
                                        {convo.company}
                                    </p>
                                    <p
                                        className={`text-[12px] truncate ${convo.unread ? 'font-medium' : ''}`}
                                        style={{ color: convo.unread ? 'var(--neu-text)' : 'var(--neu-text-muted)' }}
                                    >
                                        {convo.preview}
                                    </p>
                                </div>

                                {/* Unread Dot */}
                                {convo.unread && (
                                    <div
                                        className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                                        style={{ background: 'var(--neu-accent)' }}
                                    />
                                )}
                            </div>
                        </Card>
                    </button>
                ))}
            </div>
        </div>
    );
}
