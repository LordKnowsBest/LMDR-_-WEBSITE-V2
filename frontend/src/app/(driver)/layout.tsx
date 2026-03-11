'use client';

import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { DriverHeader, DriverTabBar, VoiceCommandBar, DriverNavDrawer, DriverChatDrawer, DriverTopBanner } from '@/components/driver';
import { ThemeProvider } from '@/lib/theme';

/* ── AI mock response simulator ── */
const AI_RESPONSES: Record<string, string> = {
  'find me a job': "I found 12 matches near Dallas, TX. Your top match is Swift Transportation at 94% — $0.65/mi OTR with home weekends. Want me to show the full list?",
  'check my matches': "You have 12 active matches. Top 3:\n1. Swift Transportation — 94%\n2. Werner Enterprises — 87%\n3. Schneider National — 82%\nWant details on any of these?",
  'upload my cdl': "To upload your CDL, head to Profile → My Documents and tap the upload button on the CDL row, or simply take a photo of your CDL front and back. Want me to take you there?",
  'find my top matches': "Based on your CDL-A, 8 years of experience, and Dallas home base, here are your best matches today:\n\n🥇 Swift Transportation — 94% match\n🥈 Werner Enterprises — 87%\n🥉 Schneider National — 82%\n\nWould you like to apply to any of these?",
  'check application status': "You have 5 applications:\n• Swift — Interview scheduled (Thu 3 PM)\n• Werner — Under Review\n• Schneider — Offer received! ($0.68/mi)\n• J.B. Hunt — Closed\n• KLLM — Closed\n\nWant to accept the Schneider offer?",
};

function getAiResponse(input: string): string {
  const lower = input.toLowerCase().trim();
  for (const [key, val] of Object.entries(AI_RESPONSES)) {
    if (lower.includes(key)) return val;
  }
  return `I can help with that! Based on your profile, let me look into "${input}" for you. Here's what I found:\n\nYour CDL-A Class license with H and T endorsements qualifies you for premium routes. I'd recommend checking the AI Job Matches section for the latest opportunities.\n\nWant me to refine your search filters?`;
}

function nowTime(): string {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

interface AiMessage {
  id: string;
  from: 'driver' | 'ai';
  text: string;
  time: string;
}

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMode, setChatMode] = useState<'messages' | 'ai'>('messages');
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);

  /* Hide the command bar on the messages page — it has its own chat input */
  const isMessagesPage = pathname === '/driver/messages';

  /* ── Open chat drawer from MT avatar → messages mode ── */
  const openMessages = useCallback(() => {
    setChatMode('messages');
    setChatOpen(true);
  }, []);

  /* ── Handle AI message ── */
  const handleAiMessage = useCallback((text: string) => {
    const driverMsg: AiMessage = {
      id: `d-${Date.now()}`,
      from: 'driver',
      text,
      time: nowTime(),
    };

    setAiMessages((prev) => [...prev, driverMsg]);
    setChatMode('ai');
    setChatOpen(true);

    // Simulate AI response after a short delay
    setTimeout(() => {
      const aiMsg: AiMessage = {
        id: `ai-${Date.now()}`,
        from: 'ai',
        text: getAiResponse(text),
        time: nowTime(),
      };
      setAiMessages((prev) => [...prev, aiMsg]);
    }, 1200);
  }, []);

  /* ── Command bar sends → opens AI drawer ── */
  const handleCommand = useCallback((text: string) => {
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
        <DriverHeader />

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
        <DriverNavDrawer open={navOpen} onClose={() => setNavOpen(false)} />

        {/* RIGHT Drawer — Chat (Messages OR AI) */}
        <DriverChatDrawer
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          mode={chatMode}
          aiMessages={aiMessages}
          onAiSend={handleAiMessage}
        />
      </div>
    </ThemeProvider>
  );
}
