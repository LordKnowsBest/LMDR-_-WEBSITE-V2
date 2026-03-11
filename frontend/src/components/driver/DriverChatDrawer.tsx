'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
    id: string;
    from: 'driver' | 'recruiter' | 'ai';
    text: string;
    time: string;
}

export interface DriverChatDrawerProps {
    open: boolean;
    onClose: () => void;
    /** When 'ai', shows the AI assistant thread. When 'messages', shows recruiter threads. */
    mode?: 'messages' | 'ai';
    /** Messages from the AI thread (managed by parent) */
    aiMessages?: ChatMessage[];
    /** Called when driver types in the AI thread */
    onAiSend?: (text: string) => void;
}

/* ── Mock recruiter thread data ── */
const MOCK_THREADS = [
    {
        id: 't1',
        recruiterName: 'Sarah Chen',
        company: 'Swift Transportation',
        initials: 'SC',
        online: true,
        messages: [
            { id: 'm1', from: 'recruiter' as const, text: 'Hi Marcus! I saw your match score of 94% with us. Are you available for a quick call?', time: '2:30 PM' },
            { id: 'm2', from: 'driver' as const, text: 'Hey Sarah! Yes, I am interested. What routes do you have available?', time: '2:32 PM' },
            { id: 'm3', from: 'recruiter' as const, text: 'Great! We have dedicated OTR lanes running Phoenix to LA and back. Home every weekend. Starting at $0.65/mi.', time: '2:35 PM' },
            { id: 'm4', from: 'recruiter' as const, text: 'Want me to schedule a phone interview for Thursday at 3 PM?', time: '2:36 PM' },
            { id: 'm5', from: 'driver' as const, text: 'That works for me. Looking forward to it!', time: '2:40 PM' },
        ],
    },
    {
        id: 't2',
        recruiterName: 'Mike Rodriguez',
        company: 'Werner Enterprises',
        initials: 'MR',
        online: false,
        messages: [
            { id: 'm1', from: 'recruiter' as const, text: "Welcome to Werner! We've reviewed your application and would like to move forward.", time: '11:15 AM' },
            { id: 'm2', from: 'driver' as const, text: 'Thank you! What does the next step look like?', time: '11:45 AM' },
        ],
    },
];

export function DriverChatDrawer({ open, onClose, mode = 'messages', aiMessages = [], onAiSend }: DriverChatDrawerProps) {
    const [activeThread, setActiveThread] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [voiceActive, setVoiceActive] = useState(false);
    const [voicePhase, setVoicePhase] = useState<'idle' | 'listening' | 'processing'>('idle');
    const [voiceTranscript, setVoiceTranscript] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const currentThread = MOCK_THREADS.find((t) => t.id === activeThread);
    const isAiMode = mode === 'ai';

    /* Auto-scroll AI messages */
    useEffect(() => {
        if (isAiMode && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [aiMessages, isAiMode]);

    /* Reset thread selection when mode changes */
    useEffect(() => {
        if (isAiMode) setActiveThread(null);
    }, [isAiMode]);

    const handleBack = () => {
        if (activeThread) {
            setActiveThread(null);
        } else {
            onClose();
        }
    };

    const handleSend = () => {
        if (!inputValue.trim()) return;
        if (isAiMode && onAiSend) {
            onAiSend(inputValue.trim());
        }
        setInputValue('');
    };

    /* ── Voice simulation ── */
    const startVoice = () => {
        setVoiceActive(true);
        setVoicePhase('listening');
        setVoiceTranscript('');

        // Simulate transcript appearing after 2s
        setTimeout(() => {
            setVoiceTranscript('Show me jobs near Dallas...');
            setVoicePhase('processing');

            // Simulate final send
            setTimeout(() => {
                if (onAiSend) onAiSend('Show me jobs near Dallas');
                setVoiceActive(false);
                setVoicePhase('idle');
                setVoiceTranscript('');
            }, 1500);
        }, 3000);
    };

    const stopVoice = () => {
        setVoiceActive(false);
        setVoicePhase('idle');
        setVoiceTranscript('');
    };

    /* Determine header text */
    const headerTitle = isAiMode
        ? 'AI Assistant'
        : currentThread
            ? currentThread.recruiterName
            : 'Messages';

    const headerSubtitle = isAiMode
        ? 'Powered by LMDR Intelligence'
        : currentThread
            ? currentThread.company
            : `${MOCK_THREADS.length} conversations`;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-50 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
                onClick={onClose}
            />

            {/* Drawer Panel — slides from RIGHT */}
            <div
                className={`fixed top-0 right-0 bottom-0 z-50 w-[320px] flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'
                    }`}
                style={{
                    background: 'var(--neu-bg)',
                    borderLeft: '1px solid var(--neu-border)',
                    boxShadow: open ? '-8px 0 32px rgba(0,0,0,0.2)' : 'none',
                }}
            >
                {/* ── Header ── */}
                <div
                    className="px-4 pt-4 pb-3 flex items-center gap-3"
                    style={{ borderBottom: '1px solid var(--neu-border)' }}
                >
                    <button
                        onClick={handleBack}
                        className="neu-x w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-transform shrink-0"
                    >
                        <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-text-muted)' }}>
                            {activeThread || isAiMode ? 'close' : 'close'}
                        </span>
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-[14px] font-extrabold truncate" style={{ color: 'var(--neu-text)' }}>
                                {headerTitle}
                            </p>
                            {isAiMode && (
                                <span
                                    className="w-2 h-2 rounded-full animate-pulse"
                                    style={{ background: 'var(--neu-success, #16a34a)' }}
                                />
                            )}
                        </div>
                        <p className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>
                            {headerSubtitle}
                        </p>
                    </div>
                    {isAiMode && (
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)' }}
                        >
                            <span className="material-symbols-outlined text-white text-[16px]">auto_awesome</span>
                        </div>
                    )}
                    {currentThread && !isAiMode && (
                        <div
                            className={`w-2 h-2 rounded-full shrink-0 ${currentThread.online ? 'bg-green-500' : 'bg-gray-400'}`}
                        />
                    )}
                </div>

                {/* ══════════════════════════════════
             AI ASSISTANT MODE
             ══════════════════════════════════ */}
                {isAiMode ? (
                    <>
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                            {aiMessages.length === 0 ? (
                                /* Empty state */
                                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                                        style={{ background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)' }}
                                    >
                                        <span className="material-symbols-outlined text-white text-[28px]">auto_awesome</span>
                                    </div>
                                    <p className="text-[14px] font-bold" style={{ color: 'var(--neu-text)' }}>LMDR AI Assistant</p>
                                    <p className="text-[11px] mt-1 max-w-[200px]" style={{ color: 'var(--neu-text-muted)' }}>
                                        Ask me about jobs, matches, or help with your applications.
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
                                        {['Find my top matches', 'Upload my CDL', 'Check application status'].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => onAiSend?.(s)}
                                                className="neu-x rounded-full px-3 py-1.5 text-[10px] font-semibold active:scale-95 transition-transform"
                                                style={{ color: 'var(--neu-text-muted)' }}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                aiMessages.map((msg) => {
                                    const isDriver = msg.from === 'driver';
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex ${isDriver ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {/* AI Avatar */}
                                            {!isDriver && (
                                                <div
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mr-2 mt-1"
                                                    style={{ background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)' }}
                                                >
                                                    <span className="material-symbols-outlined text-white text-[12px]">auto_awesome</span>
                                                </div>
                                            )}
                                            <div
                                                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${isDriver ? '' : 'neu-x'}`}
                                                style={
                                                    isDriver
                                                        ? {
                                                            background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)',
                                                            borderBottomRightRadius: '6px',
                                                        }
                                                        : { borderBottomLeftRadius: '6px' }
                                                }
                                            >
                                                <p
                                                    className="text-[11px] leading-relaxed"
                                                    style={{ color: isDriver ? '#fff' : 'var(--neu-text)' }}
                                                >
                                                    {msg.text}
                                                </p>
                                                <p
                                                    className="text-[8px] mt-1 text-right"
                                                    style={{ color: isDriver ? 'rgba(255,255,255,0.6)' : 'var(--neu-text-muted)' }}
                                                >
                                                    {msg.time}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* ── Voice Listening State ── */}
                        {voiceActive && (
                            <div
                                className="px-4 py-3 flex flex-col items-center gap-2 animate-fade-up"
                                style={{ borderTop: '1px solid var(--neu-border)' }}
                            >
                                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>
                                    {voicePhase === 'listening' ? 'Listening...' : 'Processing...'}
                                </p>

                                {/* Mini Voice Orb */}
                                <div className="relative">
                                    {/* Pulse rings */}
                                    {voicePhase === 'listening' && (
                                        <>
                                            <div
                                                className="absolute rounded-full"
                                                style={{
                                                    width: 72, height: 72, left: -12, top: -12,
                                                    background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
                                                    animation: 'orbPulseOuter 2s ease-in-out infinite',
                                                }}
                                            />
                                            <div
                                                className="absolute rounded-full"
                                                style={{
                                                    width: 60, height: 60, left: -6, top: -6,
                                                    background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%)',
                                                    animation: 'orbPulseInner 1.5s ease-in-out infinite',
                                                }}
                                            />
                                        </>
                                    )}
                                    {/* Processing spinner */}
                                    {voicePhase === 'processing' && (
                                        <div
                                            className="absolute rounded-full"
                                            style={{
                                                width: 56, height: 56, left: -4, top: -4,
                                                border: '2px solid transparent',
                                                borderTopColor: 'rgba(37,99,235,0.8)',
                                                borderRightColor: 'rgba(37,99,235,0.4)',
                                                animation: 'spin 1s linear infinite',
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
                                                            animation: 'waveBar 0.8s ease-in-out infinite',
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
                                                        style={{ animation: `dotBounce 1s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </button>
                                </div>

                                {/* Transcript preview */}
                                {voiceTranscript && (
                                    <p className="text-[11px] italic text-center max-w-[220px] animate-fade-up" style={{ color: 'var(--neu-text-muted)' }}>
                                        &ldquo;{voiceTranscript}&rdquo;
                                    </p>
                                )}

                                <button
                                    onClick={stopVoice}
                                    className="text-[9px] font-semibold flex items-center gap-1 mt-1"
                                    style={{ color: 'var(--neu-text-muted)' }}
                                >
                                    <span className="material-symbols-outlined text-[10px]">close</span>
                                    Tap to cancel
                                </button>

                                <style>{`
                                    @keyframes orbPulseOuter {
                                        0%,100%{transform:scale(1);opacity:.4}
                                        50%{transform:scale(1.3);opacity:.1}
                                    }
                                    @keyframes orbPulseInner {
                                        0%,100%{transform:scale(1);opacity:.6}
                                        50%{transform:scale(1.15);opacity:.2}
                                    }
                                    @keyframes waveBar {
                                        0%,100%{transform:scaleY(.3)}
                                        50%{transform:scaleY(1)}
                                    }
                                    @keyframes dotBounce {
                                        0%,100%{transform:translateY(0);opacity:.4}
                                        50%{transform:translateY(-4px);opacity:1}
                                    }
                                    @keyframes spin {
                                        from{transform:rotate(0deg)}
                                        to{transform:rotate(360deg)}
                                    }
                                `}</style>
                            </div>
                        )}

                        {/* ── AI Text Input + Voice Toggle ── */}
                        {!voiceActive && (
                            <div
                                className="p-3 flex items-center gap-2"
                                style={{ borderTop: '1px solid var(--neu-border)' }}
                            >
                                {/* Voice Mic Toggle */}
                                <button
                                    onClick={startVoice}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                                    style={{
                                        background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)',
                                        boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
                                    }}
                                >
                                    <span className="material-symbols-outlined text-white text-[16px]">mic</span>
                                </button>

                                {/* Text Input */}
                                <div className="flex-1 neu-ins rounded-full px-4 py-2.5 flex items-center">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Ask the AI..."
                                        className="w-full bg-transparent text-[12px] outline-none"
                                        style={{ color: 'var(--neu-text)', fontFamily: "'Inter', sans-serif" }}
                                    />
                                </div>

                                {/* Send */}
                                <button
                                    onClick={handleSend}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                                    style={{
                                        background: inputValue.trim()
                                            ? 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)'
                                            : 'var(--neu-border)',
                                    }}
                                >
                                    <span className="material-symbols-outlined text-[16px] text-white">send</span>
                                </button>
                            </div>
                        )}
                    </>
                ) : !activeThread ? (
                    /* ══════════════════════════════════
                         RECRUITER THREAD LIST
                         ══════════════════════════════════ */
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {MOCK_THREADS.map((thread) => {
                            const lastMsg = thread.messages[thread.messages.length - 1];
                            return (
                                <button
                                    key={thread.id}
                                    onClick={() => setActiveThread(thread.id)}
                                    className="w-full text-left neu-x rounded-xl p-3 flex items-center gap-3 active:scale-[0.98] transition-transform"
                                >
                                    <div className="relative shrink-0">
                                        <div className="neu-ins w-11 h-11 rounded-xl flex items-center justify-center">
                                            <span className="text-[12px] font-bold" style={{ color: 'var(--neu-accent)' }}>{thread.initials}</span>
                                        </div>
                                        {thread.online && (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2" style={{ borderColor: 'var(--neu-bg)' }} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[12px] font-bold truncate" style={{ color: 'var(--neu-text)' }}>{thread.recruiterName}</p>
                                            <span className="text-[9px] shrink-0" style={{ color: 'var(--neu-text-muted)' }}>{lastMsg.time}</span>
                                        </div>
                                        <p className="text-[10px] truncate" style={{ color: 'var(--neu-text-muted)' }}>{thread.company}</p>
                                        <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--neu-text-muted)' }}>
                                            {lastMsg.from === 'driver' ? 'You: ' : ''}{lastMsg.text}
                                        </p>
                                    </div>
                                    <span className="material-symbols-outlined text-[14px] shrink-0" style={{ color: 'var(--neu-text-muted)' }}>chevron_right</span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    /* ══════════════════════════════════
                         RECRUITER CHAT THREAD
                         ══════════════════════════════════ */
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {currentThread?.messages.map((msg) => {
                                const isDriver = msg.from === 'driver';
                                return (
                                    <div key={msg.id} className={`flex ${isDriver ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${isDriver ? '' : 'neu-x'}`}
                                            style={
                                                isDriver
                                                    ? { background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)', borderBottomRightRadius: '6px' }
                                                    : { borderBottomLeftRadius: '6px' }
                                            }
                                        >
                                            <p className="text-[11px] leading-relaxed" style={{ color: isDriver ? '#fff' : 'var(--neu-text)' }}>{msg.text}</p>
                                            <p className="text-[8px] mt-1 text-right" style={{ color: isDriver ? 'rgba(255,255,255,0.6)' : 'var(--neu-text-muted)' }}>{msg.time}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Recruiter Chat Input */}
                        <div className="p-3 flex items-center gap-2" style={{ borderTop: '1px solid var(--neu-border)' }}>
                            <button className="neu-x w-9 h-9 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                                <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-text-muted)' }}>add</span>
                            </button>
                            <div className="flex-1 neu-ins rounded-full px-4 py-2.5 flex items-center">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Type a message..."
                                    className="w-full bg-transparent text-[12px] outline-none"
                                    style={{ color: 'var(--neu-text)', fontFamily: "'Inter', sans-serif" }}
                                />
                            </div>
                            <button
                                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                                style={{
                                    background: inputValue.trim()
                                        ? 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)'
                                        : 'var(--neu-border)',
                                }}
                            >
                                <span className="material-symbols-outlined text-[16px] text-white">send</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
