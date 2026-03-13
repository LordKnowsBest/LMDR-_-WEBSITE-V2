'use client';

import { adminAgentTurn } from '@/app/(admin)/actions/agent';
import { cn } from '@/lib/cn';
import { useTheme } from '@/lib/theme';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { AdminNavDrawer } from './AdminNavDrawer';
import { AdminTopBanner } from './AdminTopBanner';
import { AdminVoiceCommandBar } from './AdminVoiceCommandBar';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface AdminPortalShellProps {
  brand: string;
  brandIcon: string;
  navItems: NavItem[];
  children: React.ReactNode;
}

interface AdminMessage {
  id: string;
  from: 'admin' | 'assistant';
  text: string;
  time: string;
}

const SERVICE_GROUPS = [
  { label: 'Driver', icon: 'person', detail: 'Profiles, verification, onboarding' },
  { label: 'Carrier', icon: 'local_shipping', detail: 'DOT, enrichment, dispatch' },
  { label: 'Matching', icon: 'handshake', detail: 'Pipelines, scoring, reverse match' },
  { label: 'AI', icon: 'smart_toy', detail: 'Router, providers, agent orchestration' },
  { label: 'Observability', icon: 'monitoring', detail: 'Health, logs, anomaly rules' },
  { label: 'Billing', icon: 'payments', detail: 'Revenue, invoices, commissions' },
];

function nowTime(): string {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function sectionIndexForHref(href: string): number {
  if (href === '/admin' || href.startsWith('/admin/drivers') || href.startsWith('/admin/carriers') || href.startsWith('/admin/matches')) {
    return 0;
  }
  return 1;
}

export function AdminPortalShell({ brand, brandIcon, navItems, children }: AdminPortalShellProps) {
  const pathname = usePathname();
  const { theme, cycleTheme } = useTheme();
  const [copilotOpen, setCopilotOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSection, setDrawerSection] = useState(0);
  const [messages, setMessages] = useState<AdminMessage[]>([
    {
      id: 'welcome',
      from: 'assistant',
      text: 'Admin Copilot is wired for dashboard, driver, carrier, matching, AI router, observability, billing, and audit workflows.',
      time: nowTime(),
    },
  ]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const activeItem = useMemo(
    () => navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) || navItems[0],
    [navItems, pathname]
  );

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, copilotOpen]);

  function openDrawerForItem(item: NavItem) {
    setDrawerSection(sectionIndexForHref(item.href));
    setDrawerOpen(true);
  }

  async function handleCommand(text: string) {
    const prompt = text.trim();
    if (!prompt || sending) return;

    const adminMessage: AdminMessage = {
      id: `admin-${Date.now()}`,
      from: 'admin',
      text: prompt,
      time: nowTime(),
    };
    const thinkingId = `thinking-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      adminMessage,
      { id: thinkingId, from: 'assistant', text: 'Thinking...', time: nowTime() },
    ]);
    setCopilotOpen(true);
    setSending(true);

    try {
      const result = await adminAgentTurn(prompt);
      const reply = result.error ? result.text : (result.text || 'No response returned.');
      setMessages((prev) =>
        prev.map((message) =>
          message.id === thinkingId
            ? { id: `assistant-${Date.now()}`, from: 'assistant', text: reply, time: nowTime() }
            : message
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === thinkingId
            ? {
                id: `assistant-${Date.now()}`,
                from: 'assistant',
                text: 'Admin Copilot is temporarily unavailable. Retry in a moment.',
                time: nowTime(),
              }
            : message
        )
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--neu-bg)' }}>
      <aside
        className="hidden md:flex w-[104px] shrink-0 flex-col items-center gap-4 px-3 py-4"
        style={{
          background: 'linear-gradient(180deg, var(--neu-bg-deep) 0%, var(--neu-bg) 100%)',
          borderRight: '1px solid var(--neu-border)',
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="btn-glow w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-black">
            {brandIcon}
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--neu-text-muted)' }}>
              {brand}
            </p>
            <p className="text-[9px]" style={{ color: 'var(--neu-text-muted)' }}>
              Admin OS
            </p>
          </div>
        </div>

        <nav className="flex-1 w-full space-y-3 overflow-y-auto pt-2">
          {navItems.map((item, index) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <button
                key={item.href}
                onClick={() => openDrawerForItem(item)}
                className={cn(
                  'group flex w-full flex-col items-center gap-1.5 rounded-2xl px-2 py-2.5 text-center animate-fade-up transition-transform',
                  active ? 'neu-in' : 'neu-x hover:translate-y-[-2px]'
                )}
                style={{ animationDelay: `${index * 0.04}s` }}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ color: active ? 'var(--neu-accent)' : 'var(--neu-text)' }}
                >
                  {item.icon}
                </span>
                <span
                  className="text-[9px] font-bold leading-tight"
                  style={{ color: active ? 'var(--neu-accent)' : 'var(--neu-text-muted)' }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="w-full space-y-2">
          <button
            onClick={cycleTheme}
            className="neu-x w-full rounded-2xl px-2 py-2 text-center hover:translate-y-[-1px] transition-transform"
          >
            <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>
              palette
            </span>
            <p className="text-[9px] font-bold mt-1" style={{ color: 'var(--neu-text)' }}>
              {theme}
            </p>
          </button>
          <button
            onClick={() => setCopilotOpen((current) => !current)}
            className="neu-x w-full rounded-2xl px-2 py-2 text-center hover:translate-y-[-1px] transition-transform"
          >
            <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>
              auto_awesome
            </span>
            <p className="text-[9px] font-bold mt-1" style={{ color: 'var(--neu-text)' }}>
              Copilot
            </p>
          </button>
        </div>
      </aside>

      <AdminNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        preferredSection={drawerSection}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminTopBanner
          onOpenNav={() => {
            setDrawerSection(sectionIndexForHref(activeItem?.href || '/admin'));
            setDrawerOpen(true);
          }}
          onOpenCopilot={() => setCopilotOpen(true)}
        />

        <header
          className="shrink-0 px-4 md:px-6 py-3"
          style={{
            background: 'var(--neu-topbar-bg)',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.18)',
          }}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-white/80">
                <span className="material-symbols-outlined text-[16px]">grid_view</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.22em]">Operational Shell</span>
              </div>
              <div className="mt-1 flex items-center gap-3">
                <h1 className="text-xl md:text-2xl font-black text-white leading-none">
                  {activeItem?.label || 'Admin'}
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-white/12 px-2.5 py-1 text-[10px] font-bold text-white/85">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                  Cloud Run Live Surface
                </span>
              </div>
              <p className="text-[11px] md:text-[12px] mt-1 text-white/70">
                Command space for operations, AI routing, observability, billing, and audit workflows.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="hidden md:flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                <span className="material-symbols-outlined text-[16px] text-white/85">hub</span>
                <span className="text-[11px] font-semibold text-white/85">Admin Gateway</span>
              </div>
              <div className="hidden md:flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                <span className="material-symbols-outlined text-[16px] text-white/85">graphic_eq</span>
                <span className="text-[11px] font-semibold text-white/85">Voice Surface Ready</span>
              </div>
              <button
                onClick={() => setCopilotOpen((current) => !current)}
                className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-2 text-[11px] font-bold text-white hover:bg-white/18 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">forum</span>
                {copilotOpen ? 'Hide Copilot' : 'Open Copilot'}
              </button>
            </div>
          </div>
        </header>

        <div className="relative flex-1 overflow-hidden">
          <main
            className="h-full overflow-y-auto ws-grid transition-[padding] duration-300"
            style={{
              background: 'radial-gradient(circle at top right, rgba(37,99,235,0.07), transparent 28%), var(--neu-bg)',
              paddingRight: copilotOpen ? 'min(360px, 32vw)' : '0px',
            }}
          >
            <div className="px-4 py-5 md:px-6 md:py-6 pb-36 space-y-6">
              {children}
            </div>
          </main>

          <aside
            className={cn(
              'absolute inset-y-0 right-0 z-20 w-[min(360px,100%)] border-l transition-transform duration-300',
              copilotOpen ? 'translate-x-0' : 'translate-x-full'
            )}
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 100%), var(--neu-bg)',
              borderColor: 'var(--neu-border)',
              backdropFilter: 'blur(14px)',
            }}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid var(--neu-border)' }}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>
                      smart_toy
                    </span>
                    <h2 className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                      Admin Copilot
                    </h2>
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--neu-text-muted)' }}>
                    Wired for admin actions and Cloud Run service domains.
                  </p>
                </div>
                <button
                  onClick={() => setCopilotOpen(false)}
                  className="neu-x w-9 h-9 rounded-xl flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-text)' }}>
                    close
                  </span>
                </button>
              </div>

              <div className="px-4 py-4 space-y-3" style={{ borderBottom: '1px solid var(--neu-border)' }}>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICE_GROUPS.map((service) => (
                    <div key={service.label} className="neu-s rounded-2xl p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-accent)' }}>
                          {service.icon}
                        </span>
                        <span className="text-[11px] font-bold" style={{ color: 'var(--neu-text)' }}>
                          {service.label}
                        </span>
                      </div>
                      <p className="text-[10px] leading-4" style={{ color: 'var(--neu-text-muted)' }}>
                        {service.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'rounded-2xl px-4 py-3 max-w-[92%] animate-fade-up',
                      message.from === 'assistant' ? 'neu-s mr-auto' : 'ml-auto'
                    )}
                    style={
                      message.from === 'assistant'
                        ? undefined
                        : {
                            background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)',
                            color: '#fff',
                            boxShadow: '0 12px 24px rgba(37, 99, 235, 0.18)',
                          }
                    }
                  >
                    <p
                      className="text-[12px] leading-5 whitespace-pre-wrap"
                      style={{ color: message.from === 'assistant' ? 'var(--neu-text)' : '#fff' }}
                    >
                      {message.text}
                    </p>
                    <p
                      className="text-[10px] mt-2"
                      style={{ color: message.from === 'assistant' ? 'var(--neu-text-muted)' : 'rgba(255,255,255,0.75)' }}
                    >
                      {message.time}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <AdminVoiceCommandBar onCommand={(text) => void handleCommand(text)} drawerOpen={copilotOpen} />
    </div>
  );
}
