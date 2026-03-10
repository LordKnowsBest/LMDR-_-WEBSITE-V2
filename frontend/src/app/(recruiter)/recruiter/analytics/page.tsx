'use client';

import { Card, Badge, KpiCard } from '@/components/ui';

/* ── KPI Data ─────────────────────────────────────────────────── */
const kpis = [
  { label: 'Time-to-Fill', value: '18 days', icon: 'timer', trend: '-3 days vs Q3', trendUp: true },
  { label: 'Cost-per-Hire', value: '$2,340', icon: 'payments', trend: '-$180 vs Q3', trendUp: true },
  { label: 'Pipeline Velocity', value: '4.2x', icon: 'speed', trend: '+0.6x vs last month', trendUp: true },
  { label: 'Offer Acceptance', value: '78%', icon: 'handshake', trend: '-2% vs last month', trendUp: false },
];

/* ── Monthly Placements (12 months) ───────────────────────────── */
const months = [
  { label: 'Apr', value: 4 },
  { label: 'May', value: 6 },
  { label: 'Jun', value: 5 },
  { label: 'Jul', value: 8 },
  { label: 'Aug', value: 7 },
  { label: 'Sep', value: 9 },
  { label: 'Oct', value: 6 },
  { label: 'Nov', value: 10 },
  { label: 'Dec', value: 8 },
  { label: 'Jan', value: 11 },
  { label: 'Feb', value: 9 },
  { label: 'Mar', value: 6 },
];
const maxMonth = Math.max(...months.map((m) => m.value));

/* ── Source Attribution ────────────────────────────────────────── */
const sources = [
  { name: 'Job Boards', pct: 35, color: 'bg-blue-500', icon: 'work' },
  { name: 'Referrals', pct: 28, color: 'bg-green-500', icon: 'group_add' },
  { name: 'Direct Apply', pct: 20, color: 'bg-amber-500', icon: 'web' },
  { name: 'Social Media', pct: 12, color: 'bg-purple-500', icon: 'share' },
  { name: 'Other', pct: 5, color: 'bg-gray-400', icon: 'more_horiz' },
];

/* ── Funnel Conversion ────────────────────────────────────────── */
const funnel = [
  { label: 'Leads', count: 342, color: 'bg-blue-400' },
  { label: 'Contacted', count: 198, color: 'bg-blue-500' },
  { label: 'Interview', count: 87, color: 'bg-purple-500' },
  { label: 'Offer', count: 42, color: 'bg-emerald-500' },
  { label: 'Placed', count: 28, color: 'bg-green-600' },
];
const funnelMax = funnel[0].count;

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>Analytics</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>Recruiting performance metrics and pipeline insights</p>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────── */}
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

      {/* ── Charts Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placements by Month (CSS bar chart) */}
        <Card className="animate-fade-up stagger-2">
          <div className="flex items-center gap-2 mb-6">
            <div className="neu-x w-9 h-9 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>bar_chart</span>
            </div>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: 'var(--neu-text)' }}>Placements by Month</h3>
              <p className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>Last 12 months rolling</p>
            </div>
          </div>
          <div className="flex items-end gap-2 h-52">
            {months.map((m, i) => {
              const heightPct = (m.value / maxMonth) * 100;
              const isHighest = m.value === maxMonth;
              return (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5 group">
                  {/* Value label on hover */}
                  <span
                    className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--neu-text)' }}
                  >
                    {m.value}
                  </span>
                  {/* Bar */}
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isHighest ? 'bg-gradient-to-t from-blue-600 to-blue-400' : 'bg-[var(--neu-accent)]/50 group-hover:bg-[var(--neu-accent)]/80'
                    }`}
                    style={{
                      height: `${heightPct}%`,
                      animationDelay: `${i * 0.06}s`,
                    }}
                  />
                  {/* Month label */}
                  <span className="text-[10px] font-medium" style={{ color: 'var(--neu-text-muted)' }}>{m.label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid var(--neu-border)' }}>
            <span className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>
              Total: {months.reduce((s, m) => s + m.value, 0)} placements
            </span>
            <span className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>
              Avg: {(months.reduce((s, m) => s + m.value, 0) / months.length).toFixed(1)}/mo
            </span>
          </div>
        </Card>

        {/* Source Attribution */}
        <Card className="animate-fade-up stagger-3">
          <div className="flex items-center gap-2 mb-6">
            <div className="neu-x w-9 h-9 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>pie_chart</span>
            </div>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: 'var(--neu-text)' }}>Source Attribution</h3>
              <p className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>Where your best candidates come from</p>
            </div>
          </div>
          <div className="space-y-4">
            {sources.map((source, i) => (
              <div key={source.name} className={`animate-fade-up stagger-${i + 1}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-text-muted)' }}>{source.icon}</span>
                    <span className="text-[13px] font-medium" style={{ color: 'var(--neu-text)' }}>{source.name}</span>
                  </div>
                  <span className="text-[13px] font-bold" style={{ color: 'var(--neu-text)' }}>{source.pct}%</span>
                </div>
                <div className="neu-ins rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${source.color} transition-all duration-700`}
                    style={{ width: `${source.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-3" style={{ borderTop: '1px solid var(--neu-border)' }}>
            <div className="flex gap-3 flex-wrap">
              {sources.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${s.color}`} />
                  <span className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Funnel Conversion ──────────────────────────────────── */}
      <Card className="animate-fade-up stagger-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="neu-x w-9 h-9 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>filter_alt</span>
          </div>
          <div>
            <h3 className="text-[15px] font-bold" style={{ color: 'var(--neu-text)' }}>Funnel Conversion</h3>
            <p className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>Lead-to-placement conversion across all stages</p>
          </div>
        </div>

        <div className="space-y-3">
          {funnel.map((stage, i) => {
            const widthPct = (stage.count / funnelMax) * 100;
            const convRate = i < funnel.length - 1
              ? Math.round((funnel[i + 1].count / stage.count) * 100)
              : null;

            return (
              <div key={stage.label}>
                {/* Stage row */}
                <div className={`flex items-center gap-4 animate-fade-up stagger-${i + 1}`}>
                  <span className="w-20 text-[13px] font-semibold text-right" style={{ color: 'var(--neu-text)' }}>
                    {stage.label}
                  </span>
                  <div className="flex-1">
                    <div style={{ width: `${widthPct}%` }} className="transition-all duration-700">
                      <div className={`${stage.color} rounded-xl px-4 py-2.5 flex items-center justify-between group hover:brightness-110 transition-all`}>
                        <span className="text-[12px] font-bold text-white">{stage.count} candidates</span>
                        <Badge variant="info" className="!bg-white/20 !text-white !text-[10px]">
                          {Math.round((stage.count / funnelMax) * 100)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <span className="w-16 text-right">
                    {convRate !== null ? (
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--neu-text-muted)' }}>
                        {convRate}% conv.
                      </span>
                    ) : (
                      <Badge variant="success" icon="flag" className="!text-[10px]">Final</Badge>
                    )}
                  </span>
                </div>

                {/* Conversion arrow between stages */}
                {convRate !== null && (
                  <div className="flex items-center gap-4 py-1">
                    <span className="w-20" />
                    <div className="flex items-center gap-1 pl-4">
                      <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--neu-text-muted)', opacity: 0.5 }}>
                        arrow_downward
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--neu-text-muted)', opacity: 0.5 }}>
                        {convRate}% pass
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary footer */}
        <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid var(--neu-border)' }}>
          <div className="flex items-center gap-4">
            <div>
              <span className="kpi-label block">Overall Conversion</span>
              <span className="text-lg font-bold" style={{ color: 'var(--neu-text)' }}>
                {Math.round((funnel[funnel.length - 1].count / funnel[0].count) * 100)}%
              </span>
            </div>
            <div>
              <span className="kpi-label block">Biggest Drop-off</span>
              <span className="text-lg font-bold" style={{ color: 'var(--neu-accent)' }}>
                Contacted → Interview
              </span>
            </div>
          </div>
          <Badge variant="info" icon="insights" className="text-xs px-3 py-1.5">
            {funnel[0].count} → {funnel[funnel.length - 1].count} placed
          </Badge>
        </div>
      </Card>
    </div>
  );
}
