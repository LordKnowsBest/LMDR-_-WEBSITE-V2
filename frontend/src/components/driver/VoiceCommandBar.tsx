'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type VoiceState = 'idle' | 'listening' | 'processing';

interface VoiceCommandBarProps {
    onCommand?: (text: string) => void;
}

const NBA_CHIPS = [
    { label: 'Find me a job', icon: 'work' },
    { label: 'Check my matches', icon: 'auto_awesome' },
    { label: 'Upload my CDL', icon: 'upload_file' },
];

/* ── Web Speech API type shim ── */
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

export function VoiceCommandBar({ onCommand }: VoiceCommandBarProps) {
    const [voiceState, setVoiceState] = useState<VoiceState>('idle');
    const [inputValue, setInputValue] = useState('');
    const [transcript, setTranscript] = useState('');
    const [expanded, setExpanded] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(true);
    const recognitionRef = useRef<unknown>(null);

    /* ── Check browser speech support on mount ── */
    useEffect(() => {
        const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition
            || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setSpeechSupported(false);
        }
    }, []);

    /* ── Start real speech recognition ── */
    const startListening = useCallback(() => {
        const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition
            || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setSpeechSupported(false);
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recognition = new (SpeechRecognition as any)();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;

        setVoiceState('listening');
        setTranscript('');
        setExpanded(true);

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interim = '';
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    final += result[0].transcript;
                } else {
                    interim += result[0].transcript;
                }
            }
            setTranscript(final || interim);

            if (final) {
                setVoiceState('processing');
                setTimeout(() => {
                    if (onCommand) onCommand(final.trim());
                    setVoiceState('idle');
                    setExpanded(false);
                    setTranscript('');
                }, 500);
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.warn('Speech recognition error:', event.error);
            if (event.error !== 'aborted') {
                setVoiceState('idle');
                setExpanded(false);
                setTranscript('');
            }
        };

        recognition.onend = () => {
            // If we're still listening (no final result), stop gracefully
            if (voiceState === 'listening') {
                setVoiceState('idle');
                setExpanded(false);
            }
        };

        recognition.start();
    }, [onCommand, voiceState]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (recognitionRef.current as any).stop();
        }
        setVoiceState('idle');
        setExpanded(false);
        setTranscript('');
    }, []);

    const handleSend = useCallback(() => {
        if (!inputValue.trim()) return;
        if (onCommand) onCommand(inputValue.trim());
        setInputValue('');
    }, [inputValue, onCommand]);

    /* ── Voice Orb Overlay (Full-screen modal) ── */
    if (expanded) {
        return (
            <>
                {/* Backdrop */}
                <div
                    className="fixed inset-0 z-40 animate-fade-in"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                    onClick={stopListening}
                />

                {/* Voice Orb Container */}
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
                    {/* Status Text */}
                    <div className="mb-8 text-center pointer-events-none">
                        <p className="text-white/90 text-[14px] font-bold mb-1">
                            {voiceState === 'listening' ? 'Listening...' : 'Processing...'}
                        </p>
                        {transcript && (
                            <p className="text-white/60 text-[13px] font-medium animate-fade-up max-w-[260px]">
                                &ldquo;{transcript}&rdquo;
                            </p>
                        )}
                    </div>

                    {/* The Orb */}
                    <div className="relative pointer-events-auto">
                        {/* Outer ring pulses */}
                        {voiceState === 'listening' && (
                            <>
                                <div
                                    className="absolute inset-0 rounded-full"
                                    style={{
                                        width: 160,
                                        height: 160,
                                        left: -40,
                                        top: -40,
                                        background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
                                        animation: 'orbPulseOuter 2s ease-in-out infinite',
                                    }}
                                />
                                <div
                                    className="absolute inset-0 rounded-full"
                                    style={{
                                        width: 120,
                                        height: 120,
                                        left: -20,
                                        top: -20,
                                        background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%)',
                                        animation: 'orbPulseInner 1.5s ease-in-out infinite',
                                    }}
                                />
                            </>
                        )}

                        {/* Processing spinner ring */}
                        {voiceState === 'processing' && (
                            <div
                                className="absolute rounded-full"
                                style={{
                                    width: 100,
                                    height: 100,
                                    left: -10,
                                    top: -10,
                                    border: '3px solid transparent',
                                    borderTopColor: 'rgba(37,99,235,0.8)',
                                    borderRightColor: 'rgba(37,99,235,0.4)',
                                    animation: 'spin 1s linear infinite',
                                }}
                            />
                        )}

                        {/* Main Orb Button */}
                        <button
                            onClick={voiceState === 'listening' ? stopListening : startListening}
                            className="relative w-20 h-20 rounded-full flex items-center justify-center transition-transform active:scale-90"
                            style={{
                                background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)',
                                boxShadow: '0 8px 32px rgba(37,99,235,0.5), 0 0 60px rgba(37,99,235,0.2)',
                            }}
                        >
                            {voiceState === 'listening' ? (
                                /* ── Waveform Bars ── */
                                <div className="flex gap-[3px] items-center h-7">
                                    {[0, 1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className="w-[3px] rounded-full bg-white"
                                            style={{
                                                animation: `waveBar 0.8s ease-in-out infinite`,
                                                animationDelay: `${i * 0.12}s`,
                                                height: '100%',
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : voiceState === 'processing' ? (
                                /* ── Processing dots ── */
                                <div className="flex gap-1.5 items-center">
                                    {[0, 1, 2].map((i) => (
                                        <div
                                            key={i}
                                            className="w-2 h-2 rounded-full bg-white"
                                            style={{
                                                animation: `dotBounce 1s ease-in-out infinite`,
                                                animationDelay: `${i * 0.2}s`,
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <span className="material-symbols-outlined text-white text-[32px]">mic</span>
                            )}
                        </button>
                    </div>

                    {/* Cancel hint */}
                    <button
                        onClick={stopListening}
                        className="mt-10 pointer-events-auto text-white/50 text-[12px] font-medium flex items-center gap-1.5 hover:text-white/80 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                        Tap anywhere to cancel
                    </button>
                </div>

                {/* Keyframe styles injected inline */}
                <style>{`
          @keyframes orbPulseOuter {
            0%, 100% { transform: scale(1); opacity: 0.4; }
            50% { transform: scale(1.3); opacity: 0.1; }
          }
          @keyframes orbPulseInner {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.15); opacity: 0.2; }
          }
          @keyframes waveBar {
            0%, 100% { transform: scaleY(0.3); }
            50% { transform: scaleY(1); }
          }
          @keyframes dotBounce {
            0%, 100% { transform: translateY(0); opacity: 0.4; }
            50% { transform: translateY(-6px); opacity: 1; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
            </>
        );
    }

    /* ── Collapsed Command Bar (always visible above tab bar) ── */
    return (
        <div
            className="fixed left-4 right-4 z-20 animate-fade-up"
            style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
        >
            <div
                className="rounded-2xl overflow-hidden"
                style={{
                    background: 'var(--neu-cmd-bg)',
                    border: '1px solid var(--neu-cmd-border)',
                    boxShadow: `
                        3px 3px 6px var(--neu-shadow-d),
                        -3px -3px 6px var(--neu-shadow-l),
                        0 0 20px var(--neu-cmd-glow),
                        inset 0 1px 0 var(--neu-cmd-border)
                    `,
                }}
            >
                {/* Accent stripe along the top */}
                <div
                    className="h-[2px]"
                    style={{
                        background: `linear-gradient(90deg, transparent 0%, var(--neu-accent) 30%, var(--neu-accent-deep) 70%, transparent 100%)`,
                        opacity: 0.45,
                    }}
                />

                {/* Top Row — Input + Voice Orb */}
                <div className="flex items-center gap-2 p-2">
                    {/* Voice Mic Button */}
                    <button
                        onClick={speechSupported ? startListening : undefined}
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-90"
                        style={{
                            background: speechSupported
                                ? 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)'
                                : 'var(--neu-bg-soft)',
                            boxShadow: speechSupported ? '0 2px 8px rgba(37,99,235,0.3)' : 'none',
                            opacity: speechSupported ? 1 : 0.5,
                        }}
                        title={speechSupported ? 'Voice input' : 'Speech recognition not supported in this browser'}
                    >
                        <span className="material-symbols-outlined text-[20px]" style={{ color: speechSupported ? '#fff' : 'var(--neu-text-muted)' }}>mic</span>
                    </button>

                    {/* Text Input */}
                    <div className="flex-1 neu-ins rounded-xl px-3 py-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask anything..."
                            className="w-full bg-transparent border-none outline-none text-[12px] font-medium"
                            style={{ color: 'var(--neu-text)' }}
                        />
                    </div>

                    {/* Send */}
                    <button
                        onClick={handleSend}
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90"
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
                            arrow_upward
                        </span>
                    </button>
                </div>

                {/* Bottom Row — NBA Chips */}
                <div className="flex items-center gap-2 px-2 pb-2">
                    {NBA_CHIPS.map((chip) => (
                        <button
                            key={chip.label}
                            onClick={() => {
                                setInputValue(chip.label);
                                if (onCommand) onCommand(chip.label);
                            }}
                            className="rounded-full px-2.5 py-1 flex items-center gap-1 shrink-0 text-[10px] font-semibold active:scale-95 transition-transform"
                            style={{
                                color: 'var(--neu-text-muted)',
                                background: 'var(--neu-bg)',
                                boxShadow: '1px 1px 3px var(--neu-shadow-d), -1px -1px 3px var(--neu-shadow-l)',
                            }}
                        >
                            <span className="material-symbols-outlined text-[11px]" style={{ color: 'var(--neu-accent)' }}>
                                {chip.icon}
                            </span>
                            {chip.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
