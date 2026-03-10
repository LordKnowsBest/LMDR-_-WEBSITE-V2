interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <header className="flex items-center justify-between px-8 py-4 bg-beige border-b border-tan/20">
      <div>
        <h1 className="text-xl font-bold text-lmdr-dark">{title}</h1>
        {subtitle && <p className="text-sm text-tan mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
