'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { DriverHeader, DriverTabBar, VoiceCommandBar, DriverNavDrawer, DriverChatDrawer, DriverTopBanner } from '@/components/driver';
import { ThemeProvider } from '@/lib/theme';
import { useApi } from '@/lib/hooks';
import { agentTurn } from './actions/agent';
import { textToSpeech } from './actions/voice';
import { getProfile } from './actions/profile';
import { getNotifications } from './actions/cockpit';
import { getConversations } from './actions/messaging';

function nowTime(): string {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Play base64 MP3 audio */
function playAudio(base64: string) {
  try {
    const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
    audio.play().catch(() => { /* autoplay blocked — silent fail */ });
  } catch { /* ignore audio errors */ }
}

interface AiMessage {
  id: string;
  from: 'driver' | 'ai';
  text: string;
  time: string;
}

const DEMO_DRIVER_ID = 'demo-driver-001';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  /* ── Fetch shell data from Cloud Run ── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData } = useApi<Record<string, any>>(
    () => getProfile(DEMO_DRIVER_ID).then(d => ({ data: d as Record<string, any> })),
  );
  const { data: notificationsData } = useApi<unknown[]>(
    () => getNotifications(DEMO_DRIVER_ID).then(d => ({ data: (Array.isArray(d) ? d : []) })),
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: conversationsData } = useApi<any>(
    () => getConversations(DEMO_DRIVER_ID).then(d => ({ data: d })),
  );

  /* ── Derive shell props with fallbacks ── */
  const firstName = profileData?.first_name ?? profileData?.firstName ?? '';
  const lastName = profileData?.last_name ?? profileData?.lastName ?? '';
  const userName = (firstName && lastName) ? `${firstName} ${lastName}` : '';
  const userInitials = (firstName && lastName)
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : '';
  const cdlClass = profileData?.cdl_class ?? profileData?.cdlClass ?? '';
  const yearsExperience = profileData?.years_experience ?? profileData?.yearsExperience ?? undefined;
  const notificationCount = Array.isArray(notificationsData)
    ? notificationsData.filter((n: any) => !(n as any)?.read).length || notificationsData.length
    : undefined;

  /* ── Map API conversations to ChatDrawer thread shape ── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chatConversations = useMemo(() => {
    const raw = conversationsData?.conversations ?? conversationsData;
    if (!Array.isArray(raw) || raw.length === 0) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return raw.map((c: any) => {
      const name = c.recruiterName ?? c.recipientName ?? c.name ?? 'Recruiter';
      const parts = name.split(' ');
      const initials = parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();
      return {
        id: c._id ?? c.id ?? String(Math.random()),
        recruiterName: name,
        company: c.company ?? c.carrierName ?? '',
        initials,
        online: c.online ?? false,
        messages: Array.isArray(c.messages) ? c.messages : [],
      };
    });
  }, [conversationsData]);

  const [navOpen, setNavOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMode, setChatMode] = useState<'messages' | 'ai'>('messages');
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const conversationRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const voiceTriggeredRef = useRef(false);

  /* Hide the command bar on the messages page — it has its own chat input */
  const isMessagesPage = pathname === '/driver/messages';

  /* ── Open chat drawer from MT avatar → messages mode ── */
  const openMessages = useCallback(() => {
    setChatMode('messages');
    setChatOpen(true);
  }, []);

  /* ── Handle AI message — calls real AI service ── */
  const handleAiMessage = useCallback(async (text: string) => {
    const driverMsg: AiMessage = {
      id: `d-${Date.now()}`,
      from: 'driver',
      text,
      time: nowTime(),
    };

    setAiMessages((prev) => [...prev, driverMsg]);
    setChatMode('ai');
    setChatOpen(true);

    // Add a "thinking" indicator
    const thinkingId = `thinking-${Date.now()}`;
    setAiMessages((prev) => [...prev, { id: thinkingId, from: 'ai', text: 'Thinking...', time: nowTime() }]);

    try {
      const result = await agentTurn(text, conversationRef.current);

      // Track conversation history for multi-turn context
      conversationRef.current.push({ role: 'user', content: text });
      conversationRef.current.push({ role: 'assistant', content: result.text });
      // Keep last 10 turns to avoid token bloat
      if (conversationRef.current.length > 20) {
        conversationRef.current = conversationRef.current.slice(-20);
      }

      // Replace thinking indicator with real response
      setAiMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingId
            ? { id: `ai-${Date.now()}`, from: 'ai' as const, text: result.text || result.error || "I'm having trouble right now. Try again in a moment.", time: nowTime() }
            : m
        )
      );

      // TTS readback for voice-originated messages
      if (voiceTriggeredRef.current && result.text) {
        voiceTriggeredRef.current = false;
        // Truncate long responses for TTS (first 500 chars)
        const ttsText = result.text.length > 500 ? result.text.slice(0, 500) + '...' : result.text;
        textToSpeech(ttsText).then(({ audio }) => playAudio(audio)).catch(() => {});
      }
    } catch {
      // Replace thinking with error message
      setAiMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingId
            ? { id: `ai-${Date.now()}`, from: 'ai' as const, text: "I'm having trouble connecting right now. Try again in a moment!", time: nowTime() }
            : m
        )
      );
    }
  }, []);

  /* ── Command bar sends → opens AI drawer (voice flag for TTS readback) ── */
  const handleCommand = useCallback((text: string) => {
    voiceTriggeredRef.current = true;
    handleAiMessage(text);
  }, [handleAiMessage]);

  return (
    <ThemeProvider>
      <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--neu-bg)' }}>
        {/* New Accent Banner Header */}
        <DriverTopBanner
          onOpenNav={() => setNavOpen(true)}
          onOpenChat={openMessages}
        />

        {/* Mobile Header */}
        <DriverHeader
          driverInitials={userInitials || undefined}
          notificationCount={notificationCount}
        />

        {/* Main Content — less bottom padding on messages page since no command bar */}
        <main className={`flex-1 overflow-y-auto ws-grid ${isMessagesPage ? 'pb-20' : 'pb-36'}`}>
          <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
            {children}
          </div>
        </main>

        {/* Voice Command Bar — hidden on messages page to avoid duplicate input */}
        {!isMessagesPage && <VoiceCommandBar onCommand={handleCommand} />}

        {/* Fixed Bottom Tab Bar */}
        <DriverTabBar />

        {/* LEFT Drawer — Navigation */}
        <DriverNavDrawer
          open={navOpen}
          onClose={() => setNavOpen(false)}
          userName={userName || undefined}
          userInitials={userInitials || undefined}
          cdlClass={cdlClass || undefined}
          yearsExperience={yearsExperience != null ? Number(yearsExperience) : undefined}
        />

        {/* RIGHT Drawer — Chat (Messages OR AI) */}
        <DriverChatDrawer
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          mode={chatMode}
          aiMessages={aiMessages}
          onAiSend={handleAiMessage}
          conversations={chatConversations}
        />
      </div>
    </ThemeProvider>
  );
}
