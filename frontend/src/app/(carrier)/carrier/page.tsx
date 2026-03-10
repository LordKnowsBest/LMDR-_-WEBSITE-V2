'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const stats = [
  { label: 'Active Drivers', value: '38', trend: '+4', trendUp: true, icon: 'people' },
  { label: 'Open Jobs', value: '12', trend: '+2', trendUp: true, icon: 'work' },
  { label: 'Pending Applications', value: '27', trend: '+9', trendUp: true, icon: 'pending_actions' },
  { label: 'Fleet Utilization', value: '84%', trend: '+3%', trendUp: true, icon: 'speed' },
];

const recentApplications = [
  { id: 1, driver: 'Marcus Johnson', cdl: 'A', experience: '8 yrs', route: 'Dallas → Houston', time: '15 min ago', status: 'new' as const },
  { id: 2, driver: 'Sarah Chen', cdl: 'A', experience: '5 yrs', route: 'OTR Southeast', time: '1 hr ago', status: 'new' as const },
  { id: 3, driver: 'James Williams', cdl: 'B', experience: '3 yrs', route: 'Local Chicago', time: '2 hrs ago', status: 'reviewed' as const },
  { id: 4, driver: 'Maria Garcia', cdl: 'A', experience: '12 yrs', route: 'I-10 Corridor', time: '4 hrs ago', status: 'reviewed' as const },
  { id: 5, driver: 'David Lee', cdl: 'A', experience: '6 yrs', route: 'Northeast Regional', time: '5 hrs ago', status: 'contacted' as const },
];

const statusVariant: Record<string, 'info' | 'warning' | 'success'> = {
  new: 'info',
  reviewed: 'warning',
  contacted: 'success',
};

export default function CarrierDashboardPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-lmdr-dark">Carrier Dashboard</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} elevation="sm" className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-lmdr-blue/10 text-lmdr-blue">
              <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-tan">{stat.label}</p>
              <p className="text-2xl font-bold text-lmdr-dark">{stat.value}</p>
              <span className={`text-xs font-medium ${stat.trendUp ? 'text-sg' : 'text-status-suspended'}`}>
                {stat.trendUp ? '+' : ''}{stat.trend} this month
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" size="md">
          <span className="material-symbols-outlined text-lg mr-1.5">add</span>
          Post New Job
        </Button>
        <Button variant="secondary" size="md">
          <span className="material-symbols-outlined text-lg mr-1.5">route</span>
          View Dispatch Queue
        </Button>
        <Button variant="secondary" size="md">
          <span className="material-symbols-outlined text-lg mr-1.5">payments</span>
          Billing
        </Button>
      </div>

      {/* Recent Applications */}
      <Card elevation="md">
        <h3 className="text-lg font-semibold text-lmdr-dark mb-4">Recent Driver Applications</h3>
        <div className="divide-y divide-tan/10">
          {recentApplications.map((app) => (
            <div key={app.id} className="flex items-center gap-4 py-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-beige-d">
                <span className="material-symbols-outlined text-lg text-tan">person</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-lmdr-dark">{app.driver}</p>
                <p className="text-xs text-tan">CDL-{app.cdl} &middot; {app.experience} &middot; {app.route}</p>
              </div>
              <Badge variant={statusVariant[app.status]}>{app.status}</Badge>
              <span className="text-xs text-tan whitespace-nowrap">{app.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
