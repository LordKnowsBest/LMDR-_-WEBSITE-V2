'use client';

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <header
      className="flex items-center justify-between px-6 shrink-0 animate-fade-in"
      style={{
        height: '52px',
        background: 'var(--neu-topbar-bg)',
        boxShadow: '0 4px 16px rgba(37, 99, 235, 0.12)',
      }}
    >
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-[15px] font-bold text-white leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-[11px] text-white/60 font-medium">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
