'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/theme';
import { useEffect, useMemo, useState } from 'react';

interface AdminNavDrawerProps {
  open: boolean;
  onClose: () => void;
  preferredSection?: number;
}

const NAV_SECTIONS = [
  {
    title: 'Core Operations',
    items: [
      { href: '/admin', icon: 'dashboard', label: 'Dashboard' },
      { href: '/admin/drivers', icon: 'people', label: 'Drivers' },
      { href: '/admin/carriers', icon: 'local_shipping', label: 'Carriers' },
      { href: '/admin/matches', icon: 'handshake', label: 'Matches' },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { href: '/admin/ai-router', icon: 'smart_toy', label: 'AI Router' },
      { href: '/admin/analytics', icon: 'analytics', label: 'Analytics' },
      { href: '/admin/observability', icon: 'monitoring', label: 'Observability' },
    ],
  },
];

export function AdminNavDrawer({ open, onClose, preferredSection }: AdminNavDrawerProps) {
  const pathname = usePathname();
  const { theme, themes, setTheme } = useTheme();

  const initialActiveSection = useMemo(
    () => NAV_SECTIONS.findIndex((section) =>
      section.items.some((item) =>
        item.href === '/admin' ? pathname === '/admin' : pathname?.startsWith(item.href)
      )
    ),
    [pathname]
  );

  const [expandedSection, setExpandedSection] = useState(
    preferredSection ?? (initialActiveSection !== -1 ? initialActiveSection : 0)
  );

  useEffect(() => {
    if (open && preferredSection !== undefined) {
      setExpandedSection(preferredSection);
    }
  }, [open, preferredSection]);

  return (
    <>
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 left-0 md:left-[104px] bottom-0 z-50 w-[320px] max-w-[calc(100vw-1rem)] flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'var(--neu-bg)',
          borderRight: '1px solid var(--neu-border)',
          boxShadow: open ? '8px 0 32px rgba(0,0,0,0.2)' : 'none',
        }}
      >
        <div className="px-5 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--neu-border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)' }}
            >
              <span className="text-white text-[14px] font-black tracking-wider">VM</span>
            </div>
            <div>
              <p className="text-[14px] font-extrabold" style={{ color: 'var(--neu-text)' }}>AdminOS</p>
              <p className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>Cloud Run ops shell</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="neu-x w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-text-muted)' }}>close</span>
          </button>
        </div>

        <div className="px-4 py-4">
          <div className="neu-x rounded-xl p-3 flex items-center gap-3">
            <div className="neu-ins w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-[13px] font-bold" style={{ color: 'var(--neu-accent)' }}>AO</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold truncate" style={{ color: 'var(--neu-text)' }}>Admin Operations</p>
              <p className="text-[9px]" style={{ color: 'var(--neu-text-muted)' }}>Drivers, carriers, AI, billing, audit</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <div className="space-y-2">
            {NAV_SECTIONS.map((section, index) => {
              const isExpanded = expandedSection === index;
              const hasActiveChild = section.items.some((item) =>
                item.href === '/admin' ? pathname === '/admin' : pathname?.startsWith(item.href)
              );

              return (
                <div key={section.title} className="rounded-xl overflow-hidden shadow-sm neu-x transition-all duration-300 relative">
                  <button
                    onClick={() => setExpandedSection(isExpanded ? -1 : index)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left transition-colors relative"
                    style={{ background: isExpanded ? 'var(--neu-bg-soft)' : 'transparent' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold tracking-wide" style={{ color: isExpanded ? 'var(--neu-accent)' : 'var(--neu-text)' }}>
                        {section.title}
                      </span>
                      {hasActiveChild && !isExpanded && (
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--neu-accent)' }} />
                      )}
                    </div>
                    <span
                      className="material-symbols-outlined text-[16px] transition-transform duration-300"
                      style={{
                        color: isExpanded ? 'var(--neu-accent)' : 'var(--neu-text-muted)',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      expand_more
                    </span>
                  </button>

                  <div
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{
                      maxHeight: isExpanded ? '1000px' : '0px',
                      opacity: isExpanded ? 1 : 0,
                    }}
                  >
                    <div className="px-2 pb-2 pt-1 space-y-1">
                      {section.items.map((item) => {
                        const isActive = item.href === '/admin' ? pathname === '/admin' : pathname?.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
                            style={
                              isActive
                                ? { background: 'var(--neu-accent)', color: '#fff' }
                                : { color: 'var(--neu-text)' }
                            }
                          >
                            <span
                              className="material-symbols-outlined text-[17px]"
                              style={{
                                color: isActive ? '#fff' : 'var(--neu-accent)',
                                fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                                opacity: isActive ? 1 : 0.8,
                              }}
                            >
                              {item.icon}
                            </span>
                            <span className="text-[11px] font-semibold flex-1">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </nav>

        <div className="px-5 py-4" style={{ borderTop: '1px solid var(--neu-border)' }}>
          <p className="text-[9px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--neu-text-muted)' }}>Theme</p>
          <div className="flex gap-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex-1 py-1.5 rounded-xl text-center transition-all duration-200 ${theme === t.id ? '' : 'neu-x'}`}
                style={
                  theme === t.id
                    ? { background: 'var(--neu-accent)', color: '#fff' }
                    : { color: 'var(--neu-text-muted)' }
                }
              >
                <span className="material-symbols-outlined text-[16px] block mb-0.5">
                  {t.icon}
                </span>
                <span className="text-[8px] font-bold">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
