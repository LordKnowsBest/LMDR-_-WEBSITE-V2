'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme';

interface DriverHeaderProps {
  driverInitials?: string;
  notificationCount?: number;
  driverName?: string;
  driverEmail?: string;
  completenessScore?: number;
  applicationCount?: number;
  viewCount?: number;
  isDiscoverable?: boolean;
  onToggleVisibility?: (visible: boolean) => void;
}

export function DriverHeader({
  driverInitials = 'MT',
  notificationCount = 3,
  driverName,
  driverEmail,
  completenessScore,
  applicationCount,
  viewCount,
  isDiscoverable,
  onToggleVisibility,
}: DriverHeaderProps) {
  const { theme, cycleTheme, themes } = useTheme();
  const currentTheme = themes.find((t) => t.id === theme);
  const router = useRouter();

  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLButtonElement>(null);

  const toggleFlyout = useCallback(() => {
    setFlyoutOpen((prev) => !prev);
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!flyoutOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        flyoutRef.current &&
        !flyoutRef.current.contains(e.target as Node) &&
        avatarRef.current &&
        !avatarRef.current.contains(e.target as Node)
      ) {
        setFlyoutOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFlyoutOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [flyoutOpen]);

  const handleVisibilityToggle = useCallback(async () => {
    if (!onToggleVisibility || toggling) return;
    setToggling(true);
    try {
      onToggleVisibility(!isDiscoverable);
    } finally {
      setToggling(false);
    }
  }, [onToggleVisibility, isDiscoverable, toggling]);

  const handleViewProfile = useCallback(() => {
    setFlyoutOpen(false);
    router.push('/driver/profile');
  }, [router]);

  const handleSignOut = useCallback(() => {
    console.log('Sign out clicked');
    setFlyoutOpen(false);
  }, []);

  const score = completenessScore ?? 0;

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-5 py-3 backdrop-blur-md"
      style={{ background: 'var(--neu-bg)', borderBottom: '1px solid var(--neu-border)' }}
    >
      {/* Left — Brand Orb + Title */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)',
          }}
        >
          <span className="text-white text-[13px] font-black tracking-wider">LM</span>
        </div>
        <span className="text-[15px] font-extrabold tracking-tight" style={{ color: 'var(--neu-text)' }}>
          DriverOS
        </span>
      </div>

      {/* Right — Theme + Notifications + Avatar */}
      <div className="flex items-center gap-2.5">
        {/* Theme Cycle Button */}
        <button
          onClick={cycleTheme}
          className="neu-x w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
          title={`Theme: ${currentTheme?.label} — tap to cycle`}
        >
          <span
            className="material-symbols-outlined text-[17px]"
            style={{ color: 'var(--neu-text-muted)' }}
          >
            {currentTheme?.icon || 'contrast'}
          </span>
        </button>

        {/* Notification Bell */}
        <button
          className="relative neu-x w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ color: 'var(--neu-text-muted)' }}
          >
            notifications
          </span>
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        {/* Avatar Orb — toggles flyout */}
        <div className="relative">
          <button
            ref={avatarRef}
            onClick={toggleFlyout}
            className="neu-x w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Open profile menu"
            aria-expanded={flyoutOpen}
          >
            <span className="text-[11px] font-bold" style={{ color: 'var(--neu-text-muted)' }}>
              {driverInitials}
            </span>
          </button>

          {/* Profile Flyout */}
          {flyoutOpen && (
            <div
              ref={flyoutRef}
              className="absolute right-0 top-full mt-2 w-72 rounded-2xl z-50 overflow-hidden animate-flyout-in"
              style={{
                background: 'var(--neu-bg)',
                border: '1px solid var(--neu-border)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              {/* Driver Name + Email */}
              <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--neu-border)' }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)',
                    }}
                  >
                    <span className="text-white text-[13px] font-bold">{driverInitials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--neu-text)' }}>
                      {driverName || 'Driver'}
                    </p>
                    {driverEmail && (
                      <p className="text-[12px] truncate" style={{ color: 'var(--neu-text-muted)' }}>
                        {driverEmail}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Completeness */}
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--neu-border)' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-medium" style={{ color: 'var(--neu-text-muted)' }}>
                    Profile completeness
                  </span>
                  <span className="text-[12px] font-bold" style={{ color: 'var(--neu-accent)' }}>
                    {score}%
                  </span>
                </div>
                <div
                  className="neu-in h-2 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${score}%`,
                      background: 'linear-gradient(90deg, var(--neu-accent), var(--neu-accent-deep))',
                    }}
                  />
                </div>
              </div>

              {/* View Profile */}
              <button
                onClick={handleViewProfile}
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors hover:opacity-80"
                style={{ borderBottom: '1px solid var(--neu-border)' }}
              >
                <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>
                  person
                </span>
                <span className="text-[13px] font-medium" style={{ color: 'var(--neu-text)' }}>
                  View Profile
                </span>
              </button>

              {/* Visibility Toggle */}
              <div
                className="flex items-center justify-between px-4 py-2.5"
                style={{ borderBottom: '1px solid var(--neu-border)' }}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>
                    visibility
                  </span>
                  <span className="text-[13px] font-medium" style={{ color: 'var(--neu-text)' }}>
                    Discoverable by recruiters
                  </span>
                </div>
                <button
                  onClick={handleVisibilityToggle}
                  disabled={toggling}
                  className="relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0"
                  style={{
                    background: isDiscoverable ? 'var(--neu-accent)' : 'var(--neu-border)',
                  }}
                  aria-label={isDiscoverable ? 'Disable discoverability' : 'Enable discoverability'}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-200"
                    style={{
                      background: 'var(--neu-bg)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      transform: isDiscoverable ? 'translateX(22px)' : 'translateX(2px)',
                    }}
                  />
                </button>
              </div>

              {/* Quick Stats */}
              <div
                className="flex items-center gap-4 px-4 py-2.5"
                style={{ borderBottom: '1px solid var(--neu-border)' }}
              >
                <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>
                  bar_chart
                </span>
                <span className="text-[12px]" style={{ color: 'var(--neu-text-muted)' }}>
                  {applicationCount ?? 0} applications
                  <span className="mx-1.5" style={{ color: 'var(--neu-border)' }}>&middot;</span>
                  {viewCount ?? 0} carrier views
                </span>
              </div>

              {/* Theme Cycle */}
              <button
                onClick={cycleTheme}
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors hover:opacity-80"
                style={{ borderBottom: '1px solid var(--neu-border)' }}
              >
                <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>
                  {currentTheme?.icon || 'contrast'}
                </span>
                <span className="text-[13px] font-medium" style={{ color: 'var(--neu-text)' }}>
                  Theme: {currentTheme?.label}
                </span>
              </button>

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:opacity-80"
              >
                <span className="material-symbols-outlined text-[18px]" style={{ color: '#ef4444' }}>
                  logout
                </span>
                <span className="text-[13px] font-medium" style={{ color: '#ef4444' }}>
                  Sign Out
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Flyout animation */}
      <style jsx>{`
        @keyframes flyout-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-4px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-flyout-in {
          animation: flyout-in 0.15s ease-out;
        }
      `}</style>
    </header>
  );
}
