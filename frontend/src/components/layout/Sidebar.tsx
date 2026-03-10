'use client';
import { cn } from '@/lib/cn';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

interface SidebarProps {
  brand: string;
  brandIcon: string;
  items: NavItem[];
  footer?: React.ReactNode;
}

export function Sidebar({ brand, brandIcon, items, footer }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col w-[250px] h-screen shrink-0 overflow-hidden"
      style={{ background: 'var(--neu-bg-deep)' }}
    >
      {/* Brand header */}
      <div className="flex items-center gap-3 px-5 py-4 shrink-0">
        <span className="flex items-center justify-center w-10 h-10 rounded-xl text-white font-black text-sm btn-glow">
          {brandIcon}
        </span>
        <span className="text-base font-extrabold tracking-tight" style={{ color: 'var(--neu-text)' }}>
          {brand}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {items.map((item, i) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 animate-fade-up',
                active
                  ? 'neu-ins text-[var(--neu-accent)]'
                  : 'hover:translate-x-0.5'
              )}
              style={{
                color: active ? 'var(--neu-accent)' : 'var(--neu-text-muted)',
                animationDelay: `${i * 0.04}s`,
              }}
            >
              <span
                className={cn(
                  'material-symbols-outlined text-[20px] transition-colors duration-200',
                  active ? '' : 'group-hover:text-[var(--neu-accent)]'
                )}
              >
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {footer && (
        <div className="px-4 py-3 shrink-0" style={{ borderTop: '1px solid var(--neu-border)' }}>
          {footer}
        </div>
      )}
    </aside>
  );
}
