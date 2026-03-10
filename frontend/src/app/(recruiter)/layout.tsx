import { PortalShell } from '@/components/layout';

const navItems = [
  { label: 'Console', href: '/recruiter', icon: 'terminal' },
  { label: 'Candidates', href: '/recruiter/candidates', icon: 'person_search' },
  { label: 'Pipeline', href: '/recruiter/pipeline', icon: 'filter_alt' },
  { label: 'Onboarding', href: '/recruiter/onboarding', icon: 'checklist' },
  { label: 'Analytics', href: '/recruiter/analytics', icon: 'analytics' },
];

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell brand="VelocityMatch" brandIcon="VM" navItems={navItems} pageTitle="Recruiter Console">
      {children}
    </PortalShell>
  );
}
