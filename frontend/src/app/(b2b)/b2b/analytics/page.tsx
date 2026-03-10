'use client';

import { Card, KpiCard, Badge, ProgressBar } from '@/components/ui';

/* ── Mock Data ─────────────────────────────────────────────────── */

const kpis = [
  { label: 'Win Rate', value: '68%', icon: 'emoji_events', trend: '+4.2% vs last quarter', trendUp: true },
  { label: 'Avg Deal Size', value: '$156K', icon: 'payments', trend: '+$12K vs Q3', trendUp: true },
  { label: 'Sales Cycle', value: '34 days', icon: 'schedule', trend: '-6 days vs Q3', trendUp: true },
  { label: 'Pipeline Coverage', value: '3.8x', icon: 'layers', trend: '+0.4x vs target', trendUp: true },
];

const revenueByMonth = [
  { month: 'Apr', value: 62 },
  { month: 'May', value: 58 },
  { month: 'Jun', value: 71 },
  { month: 'Jul', value: 68 },
  { month: 'Aug', value: 74 },
  { month: 'Sep', value: 82 },
  { month: 'Oct', value: 79 },
  { month: 'Nov', value: 86 },
  { month: 'Dec', value: 93 },
  { month: 'Jan', value: 98 },
  { month: 'Feb', value: 104 },
  { month: 'Mar', value: 112 },
];

const dealSources = [
  { source: 'Outbound', count: 42, value: 2840000, pct: 38, color: 'blue' as const },
  { source: 'Inbound', count: 31, value: 1960000, pct: 26, color: 'green' as const },
  { source: 'Referral', count: 18, value: 1420000, pct: 19, color: 'purple' as const },
  { source: 'Partner', count: 9, value: 870000, pct: 12, color: 'amber' as const },
  { source: 'Event', count: 5, value: 390000, pct: 5, color: 'red' as const },
];

const funnelStages = [
  { stage: 'Leads Generated', count: 342, conversion: null },
  { stage: 'Qualified', count: 186, conversion: 54.4 },
  { stage: 'Demo Completed', count: 98, conversion: 52.7 },
  { stage: 'Proposal Sent', count: 61, conversion: 62.2 },
  { stage: 'Closed Won', count: 38, conversion: 62.3 },
];

const topPerformers = [
  { rank: 1, name: 'Alex Rodriguez', placements: 14, revenue: '$1.42M', winRate: '78%', medal: 'gold' },
  { rank: 2, name: 'Jordan Mitchell', placements: 11, revenue: '$1.08M', winRate: '72%', medal: 'silver' },
  { rank: 3, name: 'Sam Kowalski', placements: 9, revenue: '$860K', winRate: '65%', medal: 'bronze' },
];

const medalColors: Record<string, string> = {
  gold: 'from-amber-400 to-yellow-500',
  silver: 'from-slate-300 to-slate-400',
  bronze: 'from-orange-300 to-orange-500',
};

function formatCurrency(val: number): string {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val}`;
}

/* ── Page Component ────────────────────────────────────────────── */

export default function B2BAnalyticsPage() {
  const maxRevenue = Math.max(...revenueByMonth.map((m) => m.value));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-up">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>B2B Analytics</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--neu-text-muted)' }}>Performance metrics and revenue intelligence</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} className={`stagger-${i + 1}`} />
        ))}
      </div>

      {/* Revenue by Month */}
      <Card elevation="md" className="animate-fade-up stagger-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Revenue by Month</h3>
          <Badge variant="success" icon="trending_up">+81% YoY</Badge>
        </div>
        <Card inset className="p-4">
          <div className="flex items-end justify-between gap-2" style={{ height: 180 }}>
            {revenueByMonth.map((m, i) => {
              const pct = (m.value / maxRevenue) * 100;
              const isRecent = i >= revenueByMonth.length - 3;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[9px] font-bold" style={{ color: 'var(--neu-text)' }}>${m.value}K</span>
                  <div
                    className="w-full rounded-lg transition-all duration-500 relative overflow-hidden"
                    style={{ height: `${pct}%`, minHeight: 6, animationDelay: `${i * 0.05}s` }}
                  >
                    <div className={`absolute inset-0 rounded-lg ${
                      isRecent
                        ? 'bg-gradient-to-t from-blue-600 to-blue-400'
                        : 'bg-gradient-to-t from-blue-400/60 to-blue-300/40'
                    }`} />
                  </div>
                  <span className="text-[9px] font-semibold" style={{ color: 'var(--neu-text-muted)' }}>{m.month}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deal Source Breakdown */}
        <Card elevation="md" className="animate-fade-up stagger-6">
          <h3 className="text-base font-bold mb-5" style={{ color: 'var(--neu-text)' }}>Deal Sources</h3>
          <div className="space-y-4">
            {dealSources.map((ds) => (
              <div key={ds.source}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>{ds.source}</span>
                    <Badge variant="default">{ds.count} deals</Badge>
                  </div>
                  <span className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>{formatCurrency(ds.value)}</span>
                </div>
                <ProgressBar value={ds.pct} max={40} color={ds.color} />
              </div>
            ))}
          </div>
        </Card>

        {/* Sales Funnel */}
        <Card elevation="md" className="animate-fade-up stagger-7">
          <h3 className="text-base font-bold mb-5" style={{ color: 'var(--neu-text)' }}>Sales Funnel</h3>
          <div className="space-y-1">
            {funnelStages.map((fs, i) => {
              const widthPct = ((funnelStages.length - i) / funnelStages.length) * 100;
              const prevCount = i > 0 ? funnelStages[i - 1].count : null;
              return (
                <div key={fs.stage} className="flex items-center gap-3">
                  {/* Funnel bar */}
                  <div className="flex-1">
                    <div
                      className="relative rounded-lg overflow-hidden mx-auto transition-all duration-500"
                      style={{
                        width: `${widthPct}%`,
                        height: 44,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    >
                      <div
                        className="absolute inset-0 rounded-lg"
                        style={{
                          background: `linear-gradient(135deg,
                            hsl(${210 + i * 15}, 70%, ${55 + i * 5}%),
                            hsl(${210 + i * 15}, 80%, ${45 + i * 5}%))`,
                        }}
                      />
                      <div className="relative flex items-center justify-between px-3 h-full">
                        <span className="text-[11px] font-bold text-white truncate">{fs.stage}</span>
                        <span className="text-[12px] font-black text-white">{fs.count}</span>
                      </div>
                    </div>
                  </div>
                  {/* Conversion arrow */}
                  <div className="w-16 text-center shrink-0">
                    {fs.conversion !== null && prevCount !== null ? (
                      <div className="flex flex-col items-center">
                        <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--neu-text-muted)' }}>arrow_downward</span>
                        <span className="text-[10px] font-bold" style={{ color: 'var(--neu-accent)' }}>{fs.conversion}%</span>
                      </div>
                    ) : (
                      <span className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>Start</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--neu-border)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold" style={{ color: 'var(--neu-text-muted)' }}>Overall Lead-to-Close</span>
              <Badge variant="accent" icon="conversion_path">
                {((funnelStages[funnelStages.length - 1].count / funnelStages[0].count) * 100).toFixed(1)}%
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Performers */}
      <Card elevation="md" className="animate-fade-up stagger-8">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Top Performers</h3>
          <Badge variant="accent" icon="leaderboard">This Quarter</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topPerformers.map((rep) => (
            <Card key={rep.name} elevation="sm" hover className="text-center relative overflow-hidden">
              {/* Medal ribbon */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${medalColors[rep.medal]}`} />

              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${medalColors[rep.medal]} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                <span className="text-white text-lg font-black">#{rep.rank}</span>
              </div>

              <p className="text-sm font-bold mb-1" style={{ color: 'var(--neu-text)' }}>{rep.name}</p>

              <div className="grid grid-cols-3 gap-2 mt-3">
                <div>
                  <p className="kpi-label">Placements</p>
                  <p className="text-lg font-black" style={{ color: 'var(--neu-text)' }}>{rep.placements}</p>
                </div>
                <div>
                  <p className="kpi-label">Revenue</p>
                  <p className="text-lg font-black" style={{ color: 'var(--neu-accent)' }}>{rep.revenue}</p>
                </div>
                <div>
                  <p className="kpi-label">Win Rate</p>
                  <p className="text-lg font-black" style={{ color: 'var(--neu-text)' }}>{rep.winRate}</p>
                </div>
              </div>

              <ProgressBar
                value={parseInt(rep.winRate)}
                color={parseInt(rep.winRate) >= 70 ? 'green' : 'amber'}
                className="mt-3"
              />
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
