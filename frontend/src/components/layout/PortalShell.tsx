import { Sidebar, NavItem } from './Sidebar';
import { TopBar } from './TopBar';

interface PortalShellProps {
  brand: string;
  brandIcon: string;
  navItems: NavItem[];
  pageTitle: string;
  pageSubtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function PortalShell({ brand, brandIcon, navItems, pageTitle, pageSubtitle, actions, children }: PortalShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar brand={brand} brandIcon={brandIcon} items={navItems} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar title={pageTitle} subtitle={pageSubtitle} actions={actions} />
        <main className="flex-1 overflow-y-auto p-8 bg-neutral-light">{children}</main>
      </div>
    </div>
  );
}
