import { PortalShell } from '@/components/layout';

const navItems = [
  { label: 'Dashboard', href: '/carrier', icon: 'dashboard' },
  { label: 'Jobs', href: '/carrier/jobs', icon: 'work' },
  { label: 'Dispatch', href: '/carrier/dispatch', icon: 'route' },
  { label: 'Billing', href: '/carrier/billing', icon: 'payments' },
  { label: 'Settings', href: '/carrier/settings', icon: 'settings' },
];

export default function CarrierLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell brand="VelocityMatch" brandIcon="VM" navItems={navItems} pageTitle="Carrier Portal">
      {children}
    </PortalShell>
  );
}
