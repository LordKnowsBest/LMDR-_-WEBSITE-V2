'use client';

import { Card, Badge, Button } from '@/components/ui';
import Link from 'next/link';

const stats = [
  { label: 'Active Candidates', value: '142', icon: 'people', trend: '+12 this week', trendUp: true },
  { label: 'Open Positions', value: '23', icon: 'work', trend: '3 urgent', trendUp: false },
  { label: 'Interviews This Week', value: '8', icon: 'event', trend: '2 today', trendUp: true },
  { label: 'Placements MTD', value: '6', icon: 'handshake', trend: '+2 vs last month', trendUp: true },
];

const quickActions = [
  { label: 'Search Drivers', href: '/recruiter/candidates', icon: 'person_search', color: 'text-lmdr-blue' },
  { label: 'Post Job', href: '#', icon: 'post_add', color: 'text-sg' },
  { label: 'Schedule Interview', href: '#', icon: 'calendar_month', color: 'text-status-pending' },
  { label: 'View Pipeline', href: '/recruiter/pipeline', icon: 'filter_alt', color: 'text-carrier-blue' },
];

const recentActivity = [
  { id: 1, text: 'Driver John D. applied for OTR position at Werner Enterprises', time: '12 min ago', icon: 'person_add', variant: 'info' as const },
  { id: 2, text: 'Interview scheduled with Maria S. for regional haul role', time: '1 hr ago', icon: 'event_available', variant: 'success' as const },
  { id: 3, text: 'Background check completed for Robert K.', time: '2 hrs ago', icon: 'verified', variant: 'success' as const },
  { id: 4, text: 'Offer extended to James W. — CDL-A OTR, Schneider National', time: '3 hrs ago', icon: 'send', variant: 'info' as const },
  { id: 5, text: 'Driver Tamika L. uploaded missing documents', time: '4 hrs ago', icon: 'upload_file', variant: 'warning' as const },
  { id: 6, text: 'Placement confirmed: Carlos M. started at XPO Logistics', time: '1 day ago', icon: 'check_circle', variant: 'success' as const },
  { id: 7, text: 'New lead: Ahmed R. registered via job board referral', time: '1 day ago', icon: 'fiber_new', variant: 'info' as const },
];

export default function RecruiterConsolePage() {
  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} elevation="sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-tan uppercase tracking-wide">{stat.label}</p>
                <p className="text-3xl font-bold text-lmdr-dark mt-1">{stat.value}</p>
                <p className={`text-xs mt-1 ${stat.trendUp ? 'text-sg' : 'text-status-pending'}`}>
                  {stat.trend}
                </p>
              </div>
              <span className="material-symbols-outlined text-2xl text-lmdr-blue/60">{stat.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-tan uppercase tracking-wide mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Card elevation="sm" className="hover:shadow-[8px_8px_16px_#C8B896,-8px_-8px_16px_#FFFFF5] transition-shadow cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined text-2xl ${action.color}`}>{action.icon}</span>
                  <span className="text-sm font-semibold text-lmdr-dark">{action.label}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-lmdr-dark">Recent Activity</h3>
          <Button variant="ghost" size="sm">View All</Button>
        </div>
        <div className="divide-y divide-tan/10">
          {recentActivity.map((event) => (
            <div key={event.id} className="flex items-start gap-3 py-3">
              <span className="material-symbols-outlined text-xl text-lmdr-blue/70 mt-0.5">{event.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-lmdr-dark">{event.text}</p>
                <p className="text-xs text-tan mt-0.5">{event.time}</p>
              </div>
              <Badge variant={event.variant} className="shrink-0 mt-0.5">
                {event.variant === 'success' ? 'Done' : event.variant === 'warning' ? 'Action' : 'New'}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
