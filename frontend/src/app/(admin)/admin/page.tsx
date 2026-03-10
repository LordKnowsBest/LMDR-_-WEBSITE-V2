'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const stats = [
  { label: 'Total Drivers', value: '2,847', trend: '+12%', trendUp: true, icon: 'people' },
  { label: 'Active Carriers', value: '463', trend: '+5%', trendUp: true, icon: 'local_shipping' },
  { label: 'Pending Matches', value: '184', trend: '-3%', trendUp: false, icon: 'handshake' },
  { label: 'Active Jobs', value: '721', trend: '+8%', trendUp: true, icon: 'work' },
];

const recentActivity = [
  { id: 1, action: 'Driver verified', detail: 'Marcus Johnson — CDL-A verified by FMCSA', time: '5 min ago', icon: 'verified', variant: 'success' as const },
  { id: 2, action: 'New carrier registered', detail: 'TransPro Logistics (DOT #3847291)', time: '12 min ago', icon: 'add_business', variant: 'info' as const },
  { id: 3, action: 'Match accepted', detail: 'Sarah Chen ↔ FastFreight Inc — Score 94', time: '28 min ago', icon: 'check_circle', variant: 'success' as const },
  { id: 4, action: 'Enrichment completed', detail: 'Batch #4821 — 45 carriers enriched', time: '1 hr ago', icon: 'auto_awesome', variant: 'info' as const },
  { id: 5, action: 'Driver suspended', detail: 'Robert Davis — MVR flag detected', time: '2 hrs ago', icon: 'warning', variant: 'warning' as const },
  { id: 6, action: 'AI Router fallback', detail: 'Groq timeout — routed to Claude', time: '3 hrs ago', icon: 'smart_toy', variant: 'error' as const },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-lmdr-dark">Admin Dashboard</h2>

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
                {stat.trend} this month
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card elevation="md">
        <h3 className="text-lg font-semibold text-lmdr-dark mb-4">Recent Activity</h3>
        <div className="divide-y divide-tan/10">
          {recentActivity.map((item) => (
            <div key={item.id} className="flex items-start gap-4 py-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-beige-d">
                <span className="material-symbols-outlined text-lg text-tan">{item.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-lmdr-dark">{item.action}</p>
                  <Badge variant={item.variant}>{item.variant}</Badge>
                </div>
                <p className="text-sm text-tan truncate">{item.detail}</p>
              </div>
              <span className="text-xs text-tan whitespace-nowrap">{item.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
