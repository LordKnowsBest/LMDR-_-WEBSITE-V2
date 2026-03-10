'use client';

import { Card, Badge, Button, KpiCard, ProgressBar } from '@/components/ui';
import { analyticsApi } from '@/lib/api';
import { useApi } from '@/lib/hooks';
import Link from 'next/link';

/* ── Fallback KPI Data ───────────────────────────────────────── */
const fallbackKpis = [
  { label: 'Active Candidates', value: '142', icon: 'people', trend: '+12 this week', trendUp: true },
  { label: 'Placements This Month', value: '6', icon: 'handshake', trend: '+2 vs last month', trendUp: true },
  { label: 'Pipeline Value', value: '$84.6K', icon: 'account_balance', trend: '+$12K this week', trendUp: true },
  { label: 'Avg Time-to-Fill', value: '18 days', icon: 'timer', trend: '-3 days vs Q3', trendUp: true },
];

/* ── Quick Action Orbs ────────────────────────────────────────── */
const quickActions = [
  { label: 'New Search', href: '/recruiter/candidates', icon: 'person_search', gradient: 'from-blue-500 to-blue-700' },
  { label: 'Add Candidate', href: '#', icon: 'person_add', gradient: 'from-emerald-500 to-emerald-700' },
  { label: 'Start Campaign', href: '#', icon: 'campaign', gradient: 'from-amber-500 to-amber-700' },
  { label: 'View Pipeline', href: '/recruiter/pipeline', icon: 'filter_alt', gradient: 'from-purple-500 to-purple-700' },
];

/* ── Fallback Activity Feed ──────────────────────────────────── */
const fallbackActivityFeed = [
  { id: 1, text: 'Placement confirmed: Carlos M. started at XPO Logistics', time: '12 min ago', icon: 'check_circle', type: 'placement' as const },
  { id: 2, text: 'Interview scheduled with Maria S. for regional haul role', time: '34 min ago', icon: 'event_available', type: 'interview' as const },
  { id: 3, text: 'Driver John D. applied for OTR position at Werner Enterprises', time: '1 hr ago', icon: 'person_add', type: 'application' as const },
  { id: 4, text: 'New message from Ahmed R. regarding orientation docs', time: '1.5 hrs ago', icon: 'mail', type: 'message' as const },
  { id: 5, text: 'Offer extended to James W. — CDL-A OTR, Schneider National', time: '2 hrs ago', icon: 'send', type: 'placement' as const },
  { id: 6, text: 'Interview complete: Priya P. scored 92/100 on skills assessment', time: '3 hrs ago', icon: 'grading', type: 'interview' as const },
  { id: 7, text: 'Driver Tamika L. uploaded missing CDL documents', time: '4 hrs ago', icon: 'upload_file', type: 'application' as const },
  { id: 8, text: 'Recruiter chat: Sarah C. asked about benefits at Heartland Express', time: '5 hrs ago', icon: 'chat', type: 'message' as const },
];

const activityMeta: Record<string, { variant: 'success' | 'info' | 'warning' | 'accent'; badge: string; color: string }> = {
  placement: { variant: 'success', badge: 'Placed', color: 'text-green-500' },
  interview: { variant: 'info', badge: 'Interview', color: 'text-blue-500' },
  application: { variant: 'warning', badge: 'Applied', color: 'text-amber-500' },
  message: { variant: 'accent', badge: 'Message', color: 'text-purple-500' },
};

/* ── Fallback Pipeline Summary ───────────────────────────────── */
const fallbackPipelineStages = [
  { label: 'New Lead', count: 38, color: 'bg-blue-400' },
  { label: 'Contacted', count: 24, color: 'bg-amber-400' },
  { label: 'Interview', count: 16, color: 'bg-purple-400' },
  { label: 'Offer', count: 8, color: 'bg-emerald-400' },
  { label: 'Placed', count: 6, color: 'bg-green-600' },
];

/* ── Dashboard Response Shape ────────────────────────────────── */
interface DashboardData {
  kpis?: { label: string; value: string; icon: string; trend: string; trendUp: boolean }[];
  activityFeed?: { id: number; text: string; time: string; icon: string; type: 'placement' | 'interview' | 'application' | 'message' }[];
  pipelineStages?: { label: string; count: number; color: string }[];
  marketCondition?: string;
}

export default function RecruiterConsolePage() {
  const { data, loading, error, refresh } = useApi<DashboardData>(
    () => analyticsApi.getDashboard() as Promise<{ data: DashboardData }>,
    []
  );

  const kpis = data?.kpis ?? fallbackKpis;
  const activityFeed = data?.activityFeed ?? fallbackActivityFeed;
  const pipelineStages = data?.pipelineStages ?? fallbackPipelineStages;
  const marketCondition = data?.marketCondition ?? 'HOT';
  const pipelineTotal = pipelineStages.reduce((s, p) => s + p.count, 0);

  return (
    <div className="space-y-8">
      {/* ── Top Bar: Title + Market Ticker ─────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>Recruiter Console</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>Welcome back. Here is your recruiting snapshot.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon="refresh" onClick={refresh} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          <Badge variant="success" icon="local_fire_department" className="text-xs px-3 py-1.5">
            MARKET: {marketCondition}
          </Badge>
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm font-medium text-red-700 bg-red-50 border border-red-200 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          Failed to load dashboard data. Showing cached results.
          <button onClick={refresh} className="ml-auto underline text-red-600 hover:text-red-800 text-xs font-bold">Retry</button>
        </div>
      )}

      {/* ── Loading Skeleton ─────────────────────────────────── */}
      {loading && !data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </Card>
          ))}
        </div>
      )}

      {/* ── KPI Cards ──────────────────────────────────────────── */}
      {(!loading || data) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, i) => (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              icon={kpi.icon}
              trend={kpi.trend}
              trendUp={kpi.trendUp}
              className={`stagger-${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* ── Quick Action Orbs ──────────────────────────────────── */}
      <div>
        <h3 className="kpi-label mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <Link key={action.label} href={action.href}>
              <Card elevation="sm" hover className={`animate-fade-up stagger-${i + 1}`}>
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg`}>
                    <span className="material-symbols-outlined text-white text-[22px]">{action.icon}</span>
                  </div>
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--neu-text)' }}>{action.label}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Main Content: Activity Feed + Pipeline Summary ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed (2/3 width) */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--neu-accent)' }}>notifications_active</span>
              <h3 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Activity Feed</h3>
            </div>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="space-y-0.5">
            {activityFeed.map((event, i) => {
              const meta = activityMeta[event.type];
              return (
                <div
                  key={event.id}
                  className={`flex items-start gap-3 py-3 animate-fade-up stagger-${i + 1}`}
                  style={{ borderBottom: '1px solid var(--neu-border)' }}
                >
                  <div className="neu-x w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <span className={`material-symbols-outlined text-[18px] ${meta.color}`}>{event.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] leading-snug" style={{ color: 'var(--neu-text)' }}>{event.text}</p>
                    <p className="text-[11px] mt-1" style={{ color: 'var(--neu-text-muted)' }}>{event.time}</p>
                  </div>
                  <Badge variant={meta.variant} className="shrink-0 mt-0.5">{meta.badge}</Badge>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Pipeline Summary (1/3 width) */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--neu-accent)' }}>filter_alt</span>
            <h3 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Pipeline Summary</h3>
          </div>

          {/* Horizontal stacked bar */}
          <div className="neu-ins rounded-xl h-6 flex overflow-hidden mb-5">
            {pipelineStages.map((stage) => (
              <div
                key={stage.label}
                className={`${stage.color} transition-all duration-500 relative group`}
                style={{ width: `${(stage.count / pipelineTotal) * 100}%` }}
                title={`${stage.label}: ${stage.count}`}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-bold text-white drop-shadow-sm">{stage.count}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Stage breakdown */}
          <div className="space-y-3">
            {pipelineStages.map((stage, i) => (
              <div key={stage.label} className={`flex items-center justify-between animate-fade-up stagger-${i + 1}`}>
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                  <span className="text-[13px] font-medium" style={{ color: 'var(--neu-text)' }}>{stage.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold" style={{ color: 'var(--neu-text)' }}>{stage.count}</span>
                  <span className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>
                    {Math.round((stage.count / pipelineTotal) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--neu-border)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold" style={{ color: 'var(--neu-text-muted)' }}>Pipeline Total</span>
              <span className="text-lg font-bold" style={{ color: 'var(--neu-text)' }}>{pipelineTotal}</span>
            </div>
            <ProgressBar value={pipelineStages[4]?.count ?? 0} max={pipelineStages[0]?.count ?? 1} color="green" label="Lead-to-Placed" showValue />
          </div>
        </Card>
      </div>
    </div>
  );
}
