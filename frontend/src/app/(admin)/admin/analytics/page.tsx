'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AdminAlert } from '@/components/admin';
import { useApi } from '@/lib/hooks';
import { getAnalyticsDashboard } from '../../actions/dashboard';

/* ── Mock KPI Data (fallback) ── */
const MOCK_KPIS = [
  { label: 'Time-to-Fill', value: '14.2d', icon: 'schedule', trend: '-2.1 days', trendUp: true },
  { label: 'Cost-per-Hire', value: '$847', icon: 'payments', trend: '-$63', trendUp: true },
  { label: 'Pipeline Velocity', value: '3.8x', icon: 'speed', trend: '+0.4x', trendUp: true },
  { label: 'Offer Acceptance', value: '78%', icon: 'thumb_up', trend: '+5%', trendUp: true },
];

/* ── Mock Monthly Placements (fallback) ── */
const MOCK_MONTHLY_PLACEMENTS = [
  { month: 'Apr', count: 42 },
  { month: 'May', count: 56 },
  { month: 'Jun', count: 51 },
  { month: 'Jul', count: 68 },
  { month: 'Aug', count: 74 },
  { month: 'Sep', count: 63 },
  { month: 'Oct', count: 81 },
  { month: 'Nov', count: 77 },
  { month: 'Dec', count: 59 },
  { month: 'Jan', count: 88 },
  { month: 'Feb', count: 95 },
  { month: 'Mar', count: 84 },
];

/* ── Mock Source Attribution (fallback) ── */
const MOCK_SOURCES = [
  { name: 'AI Matching', value: 42, color: '#2563eb' },
  { name: 'Recruiter Outreach', value: 28, color: '#7c3aed' },
  { name: 'Job Board Import', value: 15, color: '#06b6d4' },
  { name: 'Driver Referral', value: 10, color: '#10b981' },
  { name: 'Organic / Direct', value: 5, color: '#f59e0b' },
];

/* ── Mock Funnel Data (fallback) ── */
const MOCK_FUNNEL = [
  { stage: 'Leads', count: 4291, color: '#3b82f6', width: 100 },
  { stage: 'Contacted', count: 2847, color: '#6366f1', width: 66 },
  { stage: 'Interview', count: 1284, color: '#8b5cf6', width: 30 },
  { stage: 'Offer', count: 463, color: '#a855f7', width: 11 },
  { stage: 'Placed', count: 312, color: '#10b981', width: 7 },
];

export default function AdminAnalyticsPage() {
  /* ── API Call ── */
  const { data: dashData, loading, error, refresh } = useApi<Record<string, unknown>>(
    () => getAnalyticsDashboard().then(d => ({ data: d as Record<string, unknown> }))
  );

  /* ── Resolve data with fallbacks ── */
  const kpis = (dashData as Record<string, unknown>)?.kpis as typeof MOCK_KPIS ?? MOCK_KPIS;
  const monthlyPlacements = (dashData as Record<string, unknown>)?.monthlyPlacements as typeof MOCK_MONTHLY_PLACEMENTS ?? MOCK_MONTHLY_PLACEMENTS;
  const sources = (dashData as Record<string, unknown>)?.sources as typeof MOCK_SOURCES ?? MOCK_SOURCES;
  const funnel = (dashData as Record<string, unknown>)?.funnel as typeof MOCK_FUNNEL ?? MOCK_FUNNEL;
  const maxPlacement = Math.max(...monthlyPlacements.map((m) => m.count));

  return (
    <div className="space-y-8">
      {/* ── Error Banner ── */}
      {error && (
        <AdminAlert
          message={`API unavailable — showing cached data. ${error}`}
          actionLabel="Retry"
          onAction={refresh}
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold animate-fade-up" style={{ color: 'var(--neu-text)' }}>
            Platform Analytics
          </h2>
          <p className="text-sm mt-1 animate-fade-up stagger-1" style={{ color: 'var(--neu-text-muted)' }}>
            Recruiting performance metrics — Last 12 months
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon="refresh" onClick={refresh} loading={loading}>Refresh</Button>
          <Badge variant="accent" icon="calendar_month">FY 2025-26</Badge>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
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

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placements by Month (CSS bar chart) */}
        <Card elevation="md" className="animate-fade-up stagger-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Placements by Month</h3>
            <Badge variant="info" icon="bar_chart">Bar Chart</Badge>
          </div>
          <div className="flex items-end gap-2 h-48">
            {monthlyPlacements.map((m, i) => {
              const heightPct = (m.count / maxPlacement) * 100;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold" style={{ color: 'var(--neu-text)' }}>{m.count}</span>
                  <div className="w-full relative" style={{ height: '160px' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-700 animate-fade-up stagger-${Math.min(i + 1, 8)}`}
                      style={{
                        height: `${heightPct}%`,
                        background: `linear-gradient(180deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)`,
                        opacity: 0.85,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: 'var(--neu-text-muted)' }}>{m.month}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Source Attribution */}
        <Card elevation="md" className="animate-fade-up stagger-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Source Attribution</h3>
            <Badge variant="info" icon="donut_large">Breakdown</Badge>
          </div>
          <div className="space-y-4">
            {sources.map((s) => (
              <div key={s.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--neu-text)' }}>{s.name}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>{s.value}%</span>
                </div>
                <div className="w-full h-3 rounded-full neu-ins overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${s.value}%`, background: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Funnel Visualization ── */}
      <Card elevation="md" className="animate-fade-up stagger-7">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Recruiting Funnel</h3>
          <Badge variant="info" icon="filter_alt">Conversion</Badge>
        </div>
        <div className="space-y-3 max-w-2xl mx-auto">
          {funnel.map((f, i) => {
            const conversionPct = i > 0 ? Math.round((f.count / funnel[i - 1].count) * 100) : 100;
            return (
              <div key={f.stage} className={`animate-fade-up stagger-${i + 1}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>{f.stage}</span>
                    {i > 0 && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: `${f.color}15`, color: f.color }}>
                        {conversionPct}% from prev
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-extrabold" style={{ color: 'var(--neu-text)' }}>
                    {f.count.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-center">
                  <div
                    className="h-8 rounded-xl transition-all duration-700 flex items-center justify-center"
                    style={{
                      width: `${Math.max(f.width, 10)}%`,
                      background: `linear-gradient(135deg, ${f.color}, ${f.color}cc)`,
                    }}
                  >
                    <span className="text-[10px] font-bold text-white/80">
                      {f.count.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Feature Adoption ── */}
      <Card elevation="md" className="animate-fade-up stagger-8">
        <h3 className="text-base font-bold mb-5" style={{ color: 'var(--neu-text)' }}>Feature Usage</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'AI Matching', pct: 92, users: '2,412', icon: 'auto_awesome' },
            { name: 'Voice Agent', pct: 38, users: '823', icon: 'mic' },
            { name: 'Market Signals', pct: 28, users: '614', icon: 'trending_up' },
            { name: 'Health Resources', pct: 22, users: '487', icon: 'health_and_safety' },
            { name: 'Pet Friendly', pct: 19, users: '412', icon: 'pets' },
            { name: 'Carrier Coaching', pct: 15, users: '298', icon: 'school' },
          ].map((f) => (
            <div key={f.name} className="neu-s rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>{f.icon}</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>{f.name}</span>
                <span className="ml-auto text-[10px] font-bold" style={{ color: 'var(--neu-text-muted)' }}>{f.users}</span>
              </div>
              <ProgressBar value={f.pct} color={f.pct > 50 ? 'green' : f.pct > 25 ? 'blue' : 'amber'} showValue />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
