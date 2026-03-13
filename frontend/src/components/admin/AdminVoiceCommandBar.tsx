'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type VoiceState = 'idle' | 'listening' | 'processing';

interface AdminVoiceCommandBarProps {
  onCommand?: (text: string) => void;
  drawerOpen?: boolean;
}

const NBA_CHIPS = [
  { label: 'Run diagnostics', icon: 'monitoring' },
  { label: 'Review driver queue', icon: 'people' },
  { label: 'Audit AI spend', icon: 'smart_toy' },
];

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export function AdminVoiceCommandBar({ onCommand, drawerOpen }: AdminVoiceCommandBarProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [inputValue, setInputValue] = useState('');
  const [transcript, setTranscript] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<unknown>(null);

  useEffect(() => {
    const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition
      || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

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
          onCommand?.(final.trim());
          setVoiceState('idle');
          setExpanded(false);
          setTranscript('');
        }, 500);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'aborted') {
        setVoiceState('idle');
        setExpanded(false);
        setTranscript('');
      }
    };

    recognition.onend = () => {
      setVoiceState('idle');
      setExpanded(false);
    };

    recognition.start();
  }, [onCommand]);

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
    onCommand?.(inputValue.trim());
    setInputValue('');
  }, [inputValue, onCommand]);

  if (expanded) {
    return (
      <>
        <div
          className="fixed inset-0 z-40 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={stopListening}
        />

        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
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

          <div className="relative pointer-events-auto">
            <button
              onClick={voiceState === 'listening' ? stopListening : startListening}
              className="relative w-20 h-20 rounded-full flex items-center justify-center transition-transform active:scale-90"
              style={{
                background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)',
                boxShadow: '0 8px 32px rgba(37,99,235,0.5), 0 0 60px rgba(37,99,235,0.2)',
              }}
            >
              <span className="material-symbols-outlined text-white text-[32px]">
                {voiceState === 'processing' ? 'hourglass_empty' : 'mic'}
              </span>
            </button>
          </div>

          <button
            onClick={stopListening}
            className="mt-10 pointer-events-auto text-white/50 text-[12px] font-medium flex items-center gap-1.5 hover:text-white/80 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
            Tap anywhere to cancel
          </button>
        </div>
      </>
    );
  }

  return (
    <div
      className={`fixed left-4 right-4 md:left-[120px] z-20 animate-fade-up ${drawerOpen ? 'md:right-[360px]' : 'md:right-6'}`}
      style={{ bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
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
        <div
          className="h-[2px]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, var(--neu-accent) 30%, var(--neu-accent-deep) 70%, transparent 100%)',
            opacity: 0.45,
          }}
        />

        <div className="flex items-center gap-2 p-2">
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
          >
            <span className="material-symbols-outlined text-[20px]" style={{ color: speechSupported ? '#fff' : 'var(--neu-text-muted)' }}>mic</span>
          </button>

          <div className="flex-1 neu-ins rounded-xl px-3 py-2">
            <input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleSend()}
              placeholder="Ask anything..."
              className="w-full bg-transparent border-none outline-none text-[12px] font-medium"
              style={{ color: 'var(--neu-text)' }}
            />
          </div>

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

        <div className="flex items-center gap-2 px-2 pb-2 overflow-x-auto">
          {NBA_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => {
                setInputValue(chip.label);
                onCommand?.(chip.label);
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
