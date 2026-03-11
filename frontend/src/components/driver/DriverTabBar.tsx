'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

interface TabItem {
    href: string;
    icon: string;
    label: string;
    badge?: number;
}

const TABS: TabItem[] = [
    { href: '/driver', icon: 'home', label: 'Home' },
    { href: '/driver/matches', icon: 'work', label: 'Jobs' },
    { href: '/driver/applications', icon: 'description', label: 'Apps' },
    { href: '/driver/messages', icon: 'chat', label: 'Messages', badge: 2 },
    { href: '/driver/profile', icon: 'person', label: 'Profile' },
];

export function DriverTabBar() {
    const pathname = usePathname();

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-30 neu-s"
            style={{
                background: 'var(--neu-bg)',
                borderTop: '1px solid var(--neu-border)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
        >
            <div className="flex items-center justify-around px-2 py-2">
                {TABS.map((tab) => {
                    const isActive =
                        tab.href === '/driver'
                            ? pathname === '/driver'
                            : pathname?.startsWith(tab.href);

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                'flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-200 relative',
                                isActive && 'scale-105'
                            )}
                        >
                            {/* Active Dot */}
                            {isActive && (
                                <div
                                    className="absolute -top-1 w-1 h-1 rounded-full"
                                    style={{ background: 'var(--neu-accent)' }}
                                />
                            )}

                            <span
                                className={cn(
                                    'material-symbols-outlined text-[22px] transition-colors',
                                )}
                                style={{
                                    color: isActive ? 'var(--neu-accent)' : 'var(--neu-text-muted)',
                                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                                }}
                            >
                                {tab.icon}
                            </span>

                            <span
                                className="text-[10px] font-semibold"
                                style={{
                                    color: isActive ? 'var(--neu-accent)' : 'var(--neu-text-muted)',
                                }}
                            >
                                {tab.label}
                            </span>

                            {/* Badge */}
                            {tab.badge && tab.badge > 0 && (
                                <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                                    {tab.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
