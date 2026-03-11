'use client';

import { useTheme } from '@/lib/theme';

interface DriverHeaderProps {
  driverInitials?: string;
  notificationCount?: number;
}

export function DriverHeader({
  driverInitials = 'MT',
  notificationCount = 3,
}: DriverHeaderProps) {
  const { theme, cycleTheme, themes } = useTheme();
  const currentTheme = themes.find((t) => t.id === theme);

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

        {/* Avatar Orb */}
        <div className="neu-x w-9 h-9 rounded-xl flex items-center justify-center">
          <span className="text-[11px] font-bold" style={{ color: 'var(--neu-text-muted)' }}>
            {driverInitials}
          </span>
        </div>
      </div>
    </header>
  );
}
