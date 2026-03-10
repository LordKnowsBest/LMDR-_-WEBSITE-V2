'use client';

import { KpiCard } from '@/components/ui/KpiCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatusDot } from '@/components/ui/StatusDot';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useApi } from '@/lib/hooks';
import { analyticsApi } from '@/lib/api';

/* ── Mock KPI Data (fallback) ── */
const MOCK_KPIS = [
  { label: 'Total Drivers', value: '2,847', icon: 'people', trend: '+12% this month', trendUp: true },
  { label: 'Active Carriers', value: '463', icon: 'local_shipping', trend: '+5% this month', trendUp: true },
  { label: 'Matches Made', value: '1,284', icon: 'handshake', trend: '+18% this month', trendUp: true },
  { label: 'Avg Match Score', value: '84.7', icon: 'grade', trend: '-1.2 pts', trendUp: false },
];

/* ── Mock System Health (fallback) ── */
const MOCK_HEALTH_SERVICES = [
  { name: 'Database', status: 'active' as const, detail: 'Cloud SQL — 2ms avg' },
  { name: 'AI Engine', status: 'active' as const, detail: '5 providers online' },
  { name: 'FMCSA API', status: 'warning' as const, detail: 'Rate limit 78%' },
  { name: 'Enrichment', status: 'active' as const, detail: 'Batch #4821 complete' },
];

/* ── Mock Activity Feed (fallback) ── */
const MOCK_ACTIVITY = [
  { id: 1, action: 'Driver verified', detail: 'Marcus Johnson — CDL-A verified by FMCSA', time: '5 min ago', icon: 'verified', variant: 'success' as const },
  { id: 2, action: 'New carrier registered', detail: 'TransPro Logistics (DOT #3847291)', time: '12 min ago', icon: 'add_business', variant: 'info' as const },
  { id: 3, action: 'Match accepted', detail: 'Sarah Chen ↔ FastFreight Inc — Score 94', time: '28 min ago', icon: 'check_circle', variant: 'success' as const },
  { id: 4, action: 'Enrichment completed', detail: 'Batch #4821 — 45 carriers enriched', time: '1 hr ago', icon: 'auto_awesome', variant: 'info' as const },
  { id: 5, action: 'Driver suspended', detail: 'Robert Davis — MVR flag detected', time: '2 hrs ago', icon: 'warning', variant: 'warning' as const },
  { id: 6, action: 'AI Router fallback', detail: 'Groq timeout — routed to Claude', time: '3 hrs ago', icon: 'smart_toy', variant: 'error' as const },
  { id: 7, action: 'Subscription upgraded', detail: 'Eagle Transport → Enterprise plan', time: '4 hrs ago', icon: 'workspace_premium', variant: 'accent' as const },
];

/* ── Quick Actions ── */
const quickActions = [
  { label: 'Verify Drivers', icon: 'verified_user', color: '#16a34a' },
  { label: 'Run Enrichment', icon: 'auto_awesome', color: '#2563eb' },
  { label: 'Export Report', icon: 'download', color: '#7c3aed' },
  { label: 'Send Broadcast', icon: 'campaign', color: '#f59e0b' },
  { label: 'FMCSA Sync', icon: 'sync', color: '#06b6d4' },
];

/* ── Mock Feature Adoption (fallback) ── */
const MOCK_FEATURES = [
  { name: 'AI Matching', users: 2412, pct: 92 },
  { name: 'Voice Agent', users: 823, pct: 38 },
  { name: 'Market Signals', users: 614, pct: 28 },
  { name: 'Health Resources', users: 487, pct: 22 },
  { name: 'Pet Friendly Map', users: 412, pct: 19 },
];

export default function AdminDashboardPage() {
  /* ── API Calls ── */
  const { data: dashData, loading: dashLoading, error: dashError, refresh: refreshDash } = useApi<Record<string, unknown>>(() => analyticsApi.getDashboard() as Promise<{ data: Record<string, unknown> }>);
  const { data: adoptionData, loading: adoptionLoading, error: adoptionError, refresh: refreshAdoption } = useApi<Record<string, unknown>>(() => analyticsApi.getFeatureAdoption() as Promise<{ data: Record<string, unknown> }>);

  /* ── Resolve data with fallbacks ── */
  const kpis = (dashData as Record<string, unknown>)?.kpis as typeof MOCK_KPIS ?? MOCK_KPIS;
  const healthServices = (dashData as Record<string, unknown>)?.healthServices as typeof MOCK_HEALTH_SERVICES ?? MOCK_HEALTH_SERVICES;
  const activity = (dashData as Record<string, unknown>)?.activity as typeof MOCK_ACTIVITY ?? MOCK_ACTIVITY;
  const features = (adoptionData as Record<string, unknown>)?.features as typeof MOCK_FEATURES ?? MOCK_FEATURES;

  const handleRefresh = () => {
    refreshDash();
    refreshAdoption();
  };

  return (
    <div className="space-y-8">
      {/* ── Error Banner ── */}
      {(dashError || adoptionError) && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
          <span className="material-symbols-outlined text-[18px]">warning</span>
          <span>API unavailable — showing cached data. {dashError || adoptionError}</span>
          <button onClick={handleRefresh} className="ml-auto font-semibold underline">Retry</button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold animate-fade-up" style={{ color: 'var(--neu-text)' }}>
            Admin Dashboard
          </h2>
          <p className="text-sm mt-1 animate-fade-up stagger-1" style={{ color: 'var(--neu-text-muted)' }}>
            VelocityMatch platform overview — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon="refresh" onClick={handleRefresh} loading={dashLoading || adoptionLoading}>Refresh</Button>
          <Badge variant="accent" icon="circle" dot>LIVE</Badge>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {dashLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`stagger-${i + 1}`}>
              <Card elevation="sm" className="p-5 animate-pulse">
                <div className="h-4 rounded bg-current opacity-10 w-24 mb-3" />
                <div className="h-8 rounded bg-current opacity-10 w-16 mb-2" />
                <div className="h-3 rounded bg-current opacity-10 w-20" />
              </Card>
            </div>
          ))
        ) : (
          kpis.map((k, i) => (
            <div key={k.label} className={`stagger-${i + 1}`}>
              <KpiCard label={k.label} value={k.value} icon={k.icon} trend={k.trend} trendUp={k.trendUp} />
            </div>
          ))
        )}
      </div>

      {/* ── System Health + Quick Actions row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <Card elevation="md" className="animate-fade-up stagger-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>System Health</h3>
            <Badge variant="success" icon="check_circle">All Systems Operational</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {healthServices.map((svc) => (
              <div key={svc.name} className="neu-s rounded-xl p-4 flex items-start gap-3">
                <StatusDot status={svc.status} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>{svc.name}</p>
                  <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--neu-text-muted)' }}>{svc.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card elevation="md" className="animate-fade-up stagger-6">
          <h3 className="text-base font-bold mb-5" style={{ color: 'var(--neu-text)' }}>Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            {quickActions.map((qa) => (
              <button
                key={qa.label}
                className="neu-x tool-orb rounded-2xl p-4 flex flex-col items-center gap-2 min-w-[90px]"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: `${qa.color}15` }}
                >
                  <span className="material-symbols-outlined text-[22px]" style={{ color: qa.color }}>
                    {qa.icon}
                  </span>
                </div>
                <span className="text-[11px] font-semibold" style={{ color: 'var(--neu-text-muted)' }}>
                  {qa.label}
                </span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Activity Feed + Feature Adoption row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed (2/3) */}
        <Card elevation="md" className="lg:col-span-2 animate-fade-up stagger-7">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Activity Feed</h3>
            <Button variant="ghost" size="sm" icon="refresh" onClick={handleRefresh} loading={dashLoading}>Refresh</Button>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--neu-border)' }}>
            {activity.map((item, i) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 py-3 animate-fade-up stagger-${Math.min(i + 1, 8)}`}
              >
                <div className="neu-x w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={{ color: 'var(--neu-accent)' }}
                  >
                    {item.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>
                      {item.action}
                    </p>
                    <Badge variant={item.variant}>{item.variant}</Badge>
                  </div>
                  <p className="text-[12px] truncate mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>
                    {item.detail}
                  </p>
                </div>
                <span className="text-[11px] whitespace-nowrap shrink-0" style={{ color: 'var(--neu-text-muted)' }}>
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Feature Adoption (1/3) */}
        <Card elevation="md" className="animate-fade-up stagger-8">
          <h3 className="text-base font-bold mb-5" style={{ color: 'var(--neu-text)' }}>Feature Adoption</h3>
          <div className="space-y-4">
            {features.map((f) => (
              <div key={f.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium" style={{ color: 'var(--neu-text)' }}>{f.name}</span>
                  <span className="text-[11px] font-bold" style={{ color: 'var(--neu-text-muted)' }}>
                    {f.users.toLocaleString()} users
                  </span>
                </div>
                <ProgressBar
                  value={f.pct}
                  color={f.pct > 80 ? 'green' : f.pct > 30 ? 'blue' : 'amber'}
                  showValue
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
