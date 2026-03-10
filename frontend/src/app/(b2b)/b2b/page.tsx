'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';

interface TopAccount {
  [key: string]: unknown;
  company: string;
  stage: string;
  value: string;
  lastActivity: string;
}

const stats = [
  { label: 'Total Accounts', value: '142', trend: '+8', trendUp: true, icon: 'business' },
  { label: 'Active Deals', value: '34', trend: '+5', trendUp: true, icon: 'handshake' },
  { label: 'Pipeline Value', value: '$2.4M', trend: '+12%', trendUp: true, icon: 'trending_up' },
  { label: 'Won This Quarter', value: '$680K', trend: '+22%', trendUp: true, icon: 'emoji_events' },
];

const topAccounts: TopAccount[] = [
  { company: 'Werner Enterprises', stage: 'Negotiation', value: '$240,000', lastActivity: '2 hrs ago' },
  { company: 'Schneider National', stage: 'Proposal', value: '$185,000', lastActivity: '1 day ago' },
  { company: 'J.B. Hunt Transport', stage: 'Demo', value: '$320,000', lastActivity: '3 hrs ago' },
  { company: 'Knight-Swift', stage: 'Qualified', value: '$150,000', lastActivity: '5 hrs ago' },
  { company: 'XPO Logistics', stage: 'Negotiation', value: '$210,000', lastActivity: '1 day ago' },
];

const stageVariant: Record<string, 'default' | 'info' | 'warning' | 'success'> = {
  Prospect: 'default',
  Qualified: 'info',
  Demo: 'info',
  Proposal: 'warning',
  Negotiation: 'warning',
  'Closed Won': 'success',
};

const accountColumns = [
  { key: 'company', header: 'Company' },
  {
    key: 'stage',
    header: 'Deal Stage',
    render: (row: TopAccount) => (
      <Badge variant={stageVariant[row.stage] ?? 'default'}>{row.stage}</Badge>
    ),
  },
  { key: 'value', header: 'Value', className: 'text-right font-semibold' },
  { key: 'lastActivity', header: 'Last Activity' },
];

export default function B2BDashboardPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-lmdr-dark">B2B Dashboard</h2>

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
              <span className="text-xs font-medium text-sg">
                {stat.trend} this quarter
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Top Accounts */}
      <div>
        <h3 className="text-lg font-semibold text-lmdr-dark mb-4">Top Accounts</h3>
        <DataTable<TopAccount>
          columns={accountColumns}
          data={topAccounts}
          onRowClick={() => {}}
        />
      </div>
    </div>
  );
}
