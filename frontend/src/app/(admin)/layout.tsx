'use client';

import { AdminPortalShell } from '@/components/admin';
import { ThemeProvider } from '@/lib/theme';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: 'dashboard' },
  { label: 'Drivers', href: '/admin/drivers', icon: 'people' },
  { label: 'Carriers', href: '/admin/carriers', icon: 'local_shipping' },
  { label: 'Matches', href: '/admin/matches', icon: 'handshake' },
  { label: 'AI Router', href: '/admin/ai-router', icon: 'smart_toy' },
  { label: 'Analytics', href: '/admin/analytics', icon: 'analytics' },
  { label: 'Observability', href: '/admin/observability', icon: 'monitoring' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AdminPortalShell brand="VelocityMatch" brandIcon="VM" navItems={navItems}>
        {children}
      </AdminPortalShell>
    </ThemeProvider>
  );
}
