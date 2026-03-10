'use client';

import { KpiCard, Card, Badge, Button, DataTable, ProgressBar, StatusDot } from '@/components/ui';
import { analyticsApi } from '@/lib/api';
import { useApi } from '@/lib/hooks';

/* ── Fallback Mock Data ──────────────────────────────────────────── */

const mockKpis = [
  { label: 'Total Revenue', value: '$1.24M', icon: 'payments', trend: '+18.4% YoY', trendUp: true },
  { label: 'Active Accounts', value: '87', icon: 'business', trend: '+12 this quarter', trendUp: true },
  { label: 'Monthly Recurring Revenue', value: '$103.6K', icon: 'autorenew', trend: '+6.2% MoM', trendUp: true },
  { label: 'Churn Rate', value: '2.1%', icon: 'person_remove', trend: '-0.4% vs last month', trendUp: true },
];

const mockRevenueMonths = [
  { month: 'Oct', value: 72 },
  { month: 'Nov', value: 78 },
  { month: 'Dec', value: 85 },
  { month: 'Jan', value: 91 },
  { month: 'Feb', value: 96 },
  { month: 'Mar', value: 104 },
];

interface TopAccount {
  [key: string]: unknown;
  account: string;
  plan: string;
  mrr: string;
  mrrNum: number;
  healthScore: number;
  status: string;
}

const mockTopAccounts: TopAccount[] = [
  { account: 'Werner Enterprises', plan: 'Enterprise', mrr: '$8,400', mrrNum: 8400, healthScore: 92, status: 'Active' },
  { account: 'Schneider National', plan: 'Enterprise', mrr: '$7,200', mrrNum: 7200, healthScore: 88, status: 'Active' },
  { account: 'J.B. Hunt Transport', plan: 'Growth', mrr: '$4,800', mrrNum: 4800, healthScore: 76, status: 'Active' },
  { account: 'Knight-Swift Holdings', plan: 'Enterprise', mrr: '$9,100', mrrNum: 9100, healthScore: 95, status: 'Active' },
  { account: 'XPO Logistics', plan: 'Growth', mrr: '$3,600', mrrNum: 3600, healthScore: 54, status: 'Trial' },
];

const planBadgeVariant: Record<string, 'accent' | 'info' | 'warning'> = {
  Enterprise: 'accent',
  Growth: 'info',
  Starter: 'warning',
};

const statusBadgeVariant: Record<string, 'success' | 'warning' | 'error'> = {
  Active: 'success',
  Trial: 'warning',
  Churned: 'error',
};

function healthColor(score: number): 'green' | 'amber' | 'red' {
  if (score >= 80) return 'green';
  if (score >= 60) return 'amber';
  return 'red';
}

const columns = [
  { key: 'account', header: 'Account' },
  {
    key: 'plan',
    header: 'Plan',
    render: (row: TopAccount) => (
      <Badge variant={planBadgeVariant[row.plan] ?? 'default'} icon="verified">{row.plan}</Badge>
    ),
  },
  { key: 'mrr', header: 'MRR', className: 'text-right font-semibold' },
  {
    key: 'healthScore',
    header: 'Health Score',
    render: (row: TopAccount) => (
      <ProgressBar value={row.healthScore} color={healthColor(row.healthScore)} showValue className="min-w-[100px]" />
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row: TopAccount) => (
      <Badge variant={statusBadgeVariant[row.status] ?? 'default'} dot>{row.status}</Badge>
    ),
  },
  {
    key: 'actions',
    header: '',
    render: () => (
      <Button variant="ghost" size="sm" icon="open_in_new">View</Button>
    ),
  },
];

const quickActions = [
  { label: 'New Account', icon: 'person_add', color: 'from-blue-500 to-blue-700' },
  { label: 'Create Proposal', icon: 'description', color: 'from-emerald-500 to-emerald-700' },
  { label: 'Schedule Demo', icon: 'videocam', color: 'from-amber-500 to-amber-700' },
  { label: 'Run Report', icon: 'assessment', color: 'from-purple-500 to-purple-700' },
];

const mockRecentActivity = [
  { icon: 'check_circle', iconColor: 'text-green-500', text: 'Knight-Swift signed Enterprise contract', time: '12 min ago' },
  { icon: 'call', iconColor: 'text-blue-500', text: 'Demo call completed with Ryder System', time: '1 hr ago' },
  { icon: 'send', iconColor: 'text-amber-500', text: 'Proposal sent to Old Dominion Freight', time: '2 hrs ago' },
  { icon: 'person_add', iconColor: 'text-purple-500', text: 'New account created: Saia Inc.', time: '4 hrs ago' },
  { icon: 'warning', iconColor: 'text-red-400', text: 'Health score drop detected for XPO Logistics', time: '6 hrs ago' },
];

/* ── Dashboard Data Shape ────────────────────────────────────────── */
interface DashboardData {
  kpis?: typeof mockKpis;
  revenueMonths?: typeof mockRevenueMonths;
  topAccounts?: TopAccount[];
  recentActivity?: typeof mockRecentActivity;
}

/* ── Page Component ────────────────────────────────────────────── */

export default function B2BDashboardPage() {
  const { data: dashboardData, loading, error, refresh } = useApi<DashboardData>(
    () => analyticsApi.getDashboard() as Promise<{ data: DashboardData }>,
    []
  );

  // Use API data if available, fallback to mock
  const kpis = dashboardData?.kpis ?? mockKpis;
  const revenueMonths = dashboardData?.revenueMonths ?? mockRevenueMonths;
  const topAccounts = dashboardData?.topAccounts ?? mockTopAccounts;
  const recentActivity = dashboardData?.recentActivity ?? mockRecentActivity;

  const maxRevenue = Math.max(...revenueMonths.map((m) => m.value));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>B2B Sales Dashboard</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--neu-text-muted)' }}>VelocityMatch partner performance overview</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && (
            <span className="text-xs font-semibold animate-pulse" style={{ color: 'var(--neu-text-muted)' }}>
              Loading...
            </span>
          )}
          {error && (
            <Badge variant="warning" icon="cloud_off">Using cached data</Badge>
          )}
          <Button variant="ghost" icon="refresh" size="sm" onClick={refresh}>
            Refresh
          </Button>
          <StatusDot status="active" label="All systems operational" />
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} className={`stagger-${i + 1}`} />
        ))}
      </div>

      {/* Revenue Trend + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Mini Chart */}
        <Card elevation="md" className="lg:col-span-2 animate-fade-up stagger-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Revenue Trend</h3>
            <Badge variant="success" icon="trending_up">+44% growth</Badge>
          </div>
          <Card inset className="p-4">
            <div className="flex items-end justify-between gap-3" style={{ height: 140 }}>
              {revenueMonths.map((m) => {
                const pct = (m.value / maxRevenue) * 100;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold" style={{ color: 'var(--neu-text)' }}>${m.value}K</span>
                    <div className="w-full relative rounded-lg overflow-hidden" style={{ height: `${pct}%`, minHeight: 8 }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-600 to-blue-400 rounded-lg" />
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: 'var(--neu-text-muted)' }}>{m.month}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </Card>

        {/* Quick Actions */}
        <Card elevation="md" className="animate-fade-up stagger-6">
          <h3 className="text-base font-bold mb-4" style={{ color: 'var(--neu-text)' }}>Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                className="neu-s rounded-xl p-3 flex flex-col items-center gap-2 transition-all duration-200 hover:translate-y-[-2px] active:neu-ins active:scale-[0.97] cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md`}>
                  <span className="material-symbols-outlined text-white text-[20px]">{action.icon}</span>
                </div>
                <span className="text-[11px] font-bold" style={{ color: 'var(--neu-text)' }}>{action.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Accounts Table */}
      <div className="animate-fade-up stagger-7">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Top Accounts</h3>
          <Button variant="ghost" size="sm" icon="arrow_forward">View All</Button>
        </div>
        <DataTable<TopAccount> columns={columns} data={topAccounts} onRowClick={() => {}} />
      </div>

      {/* Recent Activity Feed */}
      <Card elevation="md" className="animate-fade-up stagger-8">
        <h3 className="text-base font-bold mb-4" style={{ color: 'var(--neu-text)' }}>Recent Activity</h3>
        <div className="space-y-1">
          {recentActivity.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl transition-colors duration-150 hover:bg-[var(--neu-shadow-d)]/5"
            >
              <div className="neu-x w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
                <span className={`material-symbols-outlined text-[18px] ${item.iconColor}`}>{item.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--neu-text)' }}>{item.text}</p>
              </div>
              <span className="text-[11px] font-medium shrink-0" style={{ color: 'var(--neu-text-muted)' }}>{item.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
