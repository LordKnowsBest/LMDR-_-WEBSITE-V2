import { PortalShell } from '@/components/layout';

const navItems = [
  { label: 'Dashboard', href: '/b2b', icon: 'dashboard' },
  { label: 'Accounts', href: '/b2b/accounts', icon: 'business' },
  { label: 'Pipeline', href: '/b2b/pipeline', icon: 'filter_alt' },
  { label: 'Analytics', href: '/b2b/analytics', icon: 'analytics' },
];

export default function B2BLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell brand="VelocityMatch" brandIcon="VM" navItems={navItems} pageTitle="B2B Portal">
      {children}
    </PortalShell>
  );
}
