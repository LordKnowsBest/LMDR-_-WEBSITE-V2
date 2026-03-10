'use client';
import { cn } from '@/lib/cn';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavItem {
  label: string;
  href: string;
  icon: string; // Material Symbols name
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
    <aside className="flex flex-col w-64 h-screen bg-beige shadow-[6px_0_12px_#C8B896] shrink-0">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-tan/20">
        <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-lmdr-blue text-white font-bold text-sm">
          {brandIcon}
        </span>
        <span className="text-lg font-bold text-lmdr-dark">{brand}</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-lmdr-blue/10 text-lmdr-blue shadow-[inset_2px_2px_4px_#C8B896,inset_-2px_-2px_4px_#FFFFF5]'
                  : 'text-lmdr-dark hover:bg-beige-d'
              )}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      {footer && <div className="px-4 py-3 border-t border-tan/20">{footer}</div>}
    </aside>
  );
}
