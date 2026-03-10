import { Card, Badge } from '@/components/ui';
import Link from 'next/link';

const quickActions = [
  { label: 'View Matches', href: '/driver/matches', icon: 'work', color: 'text-lmdr-blue' },
  { label: 'Update Profile', href: '/driver/profile', icon: 'person', color: 'text-sg' },
  { label: 'Upload Documents', href: '/driver/documents', icon: 'upload_file', color: 'text-status-pending' },
  { label: 'Onboarding Status', href: '/driver/onboarding', icon: 'checklist', color: 'text-carrier-blue' },
];

export default function DriverDashboard() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card elevation="sm" className="hover:shadow-[8px_8px_16px_#C8B896,-8px_-8px_16px_#FFFFF5] transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <span className={`material-symbols-outlined text-3xl ${action.color}`}>{action.icon}</span>
                <span className="text-sm font-semibold text-lmdr-dark">{action.label}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-lmdr-dark mb-4">Recent Matches</h3>
          <p className="text-tan text-sm">Your latest job matches will appear here once your profile is complete.</p>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-lmdr-dark mb-4">Onboarding Progress</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-lmdr-dark">Profile Created</span>
              <Badge variant="success">Complete</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-lmdr-dark">CDL Documents</span>
              <Badge variant="warning">Pending</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-lmdr-dark">Background Check</span>
              <Badge variant="default">Not Started</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
