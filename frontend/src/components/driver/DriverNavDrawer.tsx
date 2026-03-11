'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/theme';

interface DriverNavDrawerProps {
    open: boolean;
    onClose: () => void;
}

const NAV_SECTIONS = [
    {
        title: 'Main Hub',
        items: [
            { href: '/driver', icon: 'home', label: 'Dashboard' },
            { href: '/driver/matches', icon: 'work', label: 'AI Job Matches' },
            { href: '/driver/applications', icon: 'description', label: 'My Applications' },
            { href: '/driver/messages', icon: 'chat', label: 'Messages', badge: 2 },
        ],
    },
    {
        title: 'Profile & Career',
        items: [
            { href: '/driver/profile', icon: 'person', label: 'My Profile' },
            { href: '/driver/profile#documents', icon: 'folder_open', label: 'My Documents' },
            { href: '/driver/onboarding', icon: 'fact_check', label: 'Onboarding Status' },
            { href: '/driver/mentorship', icon: 'school', label: 'Mentorship' },
            { href: '/driver/retention', icon: 'health_and_safety', label: 'Retention Center' },
            { href: '/driver/compliance', icon: 'policy', label: 'Compliance' },
        ],
    },
    {
        title: 'Community & Perks',
        items: [
            { href: '/driver/gamification', icon: 'military_tech', label: 'Gamification & XP' },
            { href: '/driver/community', icon: 'forum', label: 'Community Forums' },
            { href: '/driver/road', icon: 'directions_car', label: 'Road & Wellness' },
            { href: '/driver/referrals', icon: 'group_add', label: 'Refer a Driver' },
        ],
    },
    {
        title: 'Settings',
        items: [
            { href: '/driver/settings', icon: 'settings', label: 'Settings' },
            { href: '/driver/help', icon: 'help', label: 'Help & Support' },
        ],
    },
];

export function DriverNavDrawer({ open, onClose }: DriverNavDrawerProps) {
    const pathname = usePathname();
    const { theme, themes, setTheme } = useTheme();

    // Determine standard active section on first mount based on current path
    const initialActiveSection = NAV_SECTIONS.findIndex(section =>
        section.items.some(item =>
            item.href === '/driver' ? pathname === '/driver' : pathname?.startsWith(item.href)
        )
    );

    const [expandedSection, setExpandedSection] = useState<number>(
        initialActiveSection !== -1 ? initialActiveSection : 0
    );

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-50 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
                onClick={onClose}
            />

            {/* Drawer Panel — slides from LEFT */}
            <div
                className={`fixed top-0 left-0 bottom-0 z-50 w-[280px] flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'
                    }`}
                style={{
                    background: 'var(--neu-bg)',
                    borderRight: '1px solid var(--neu-border)',
                    boxShadow: open ? '8px 0 32px rgba(0,0,0,0.2)' : 'none',
                }}
            >
                {/* ── Drawer Header ── */}
                <div className="px-5 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--neu-border)' }}>
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)' }}
                        >
                            <span className="text-white text-[14px] font-black tracking-wider">LM</span>
                        </div>
                        <div>
                            <p className="text-[14px] font-extrabold" style={{ color: 'var(--neu-text)' }}>DriverOS</p>
                            <p className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>Last Mile Driver Recruiting</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="neu-x w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-transform"
                    >
                        <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-text-muted)' }}>close</span>
                    </button>
                </div>

                {/* ── Driver Mini Card ── */}
                <div className="px-4 py-4">
                    <div className="neu-x rounded-xl p-3 flex items-center gap-3">
                        <div className="neu-ins w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                            <span className="text-[13px] font-bold" style={{ color: 'var(--neu-accent)' }}>MT</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold truncate" style={{ color: 'var(--neu-text)' }}>Marcus Thompson</p>
                            <p className="text-[9px]" style={{ color: 'var(--neu-text-muted)' }}>CDL-A · 8yr exp</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[13px] font-black" style={{ color: 'var(--neu-accent)' }}>87</span>
                            <span className="text-[7px] font-bold uppercase" style={{ color: 'var(--neu-text-muted)' }}>score</span>
                        </div>
                    </div>
                </div>

                {/* ── Accordion Navigation Links ── */}
                <nav className="flex-1 overflow-y-auto px-3 pb-4">
                    <div className="space-y-2">
                        {NAV_SECTIONS.map((section, idx) => {
                            const isExpanded = expandedSection === idx;

                            // Check if currently active page is within this section (for dot indicator on collapsed view)
                            const hasActiveChild = section.items.some(item =>
                                item.href === '/driver' ? pathname === '/driver' : pathname?.startsWith(item.href)
                            );

                            return (
                                <div key={section.title} className="rounded-xl overflow-hidden shadow-sm neu-x transition-all duration-300 relative">
                                    {/* Accordion Toggle Header */}
                                    <button
                                        onClick={() => setExpandedSection(isExpanded ? -1 : idx)}
                                        className="w-full px-4 py-3 flex items-center justify-between text-left transition-colors relative"
                                        style={{
                                            background: isExpanded ? 'var(--neu-bg-soft)' : 'transparent',
                                        }}
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

                                    {/* Accordion Content */}
                                    <div
                                        className="overflow-hidden transition-all duration-300 ease-in-out"
                                        style={{
                                            maxHeight: isExpanded ? '1000px' : '0px',
                                            opacity: isExpanded ? 1 : 0,
                                        }}
                                    >
                                        <div className="px-2 pb-2 pt-1 space-y-1">
                                            {section.items.map((item) => {
                                                const isActive = item.href === '/driver' ? pathname === '/driver' : pathname?.startsWith(item.href);
                                                return (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        onClick={onClose}
                                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive ? '' : 'hover:bg-black/5 active:scale-[0.98]'
                                                            }`}
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
                                                                opacity: isActive ? 1 : 0.8
                                                            }}
                                                        >
                                                            {item.icon}
                                                        </span>
                                                        <span className="text-[11px] font-semibold flex-1">{item.label}</span>
                                                        {'badge' in item && item.badge && (
                                                            <span
                                                                className="w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center"
                                                                style={
                                                                    isActive
                                                                        ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                                                                        : { background: 'var(--neu-danger, #ef4444)', color: '#fff' }
                                                                }
                                                            >
                                                                {item.badge}
                                                            </span>
                                                        )}
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

                {/* ── Theme Switcher Row ── */}
                <div className="px-5 py-4" style={{ borderTop: '1px solid var(--neu-border)' }}>
                    <p className="text-[9px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--neu-text-muted)' }}>Theme</p>
                    <div className="flex gap-2">
                        {themes.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTheme(t.id)}
                                className={`flex-1 py-1.5 rounded-xl text-center transition-all duration-200 ${theme === t.id ? '' : 'neu-x'
                                    }`}
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

                {/* ── Sign Out ── */}
                <div className="px-5 pb-5">
                    <button
                        className="w-full py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 neu-x active:scale-[0.97] transition-transform"
                        style={{ color: 'var(--neu-danger, #ef4444)' }}
                    >
                        <span className="material-symbols-outlined text-[14px]">logout</span>
                        Sign Out
                    </button>
                </div>
            </div>
        </>
    );
}
