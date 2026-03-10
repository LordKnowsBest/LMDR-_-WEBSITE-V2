import { PortalShell } from '@/components/layout';

const navItems = [
  { label: 'Dashboard', href: '/driver', icon: 'dashboard' },
  { label: 'Job Matches', href: '/driver/matches', icon: 'work' },
  { label: 'Profile', href: '/driver/profile', icon: 'person' },
  { label: 'Documents', href: '/driver/documents', icon: 'description' },
  { label: 'Onboarding', href: '/driver/onboarding', icon: 'checklist' },
];

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell brand="LMDR" brandIcon="LM" navItems={navItems} pageTitle="Driver Portal">
      {children}
    </PortalShell>
  );
}
