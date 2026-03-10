'use client';

import { Card, Badge } from '@/components/ui';

const kpis = [
  { label: 'Time-to-Fill', value: '18 days', icon: 'timer', trend: '-3 days vs last quarter', trendUp: true },
  { label: 'Cost-per-Hire', value: '$2,340', icon: 'payments', trend: '-$180 vs last quarter', trendUp: true },
  { label: 'Pipeline Velocity', value: '4.2x', icon: 'speed', trend: '+0.6x vs last month', trendUp: true },
  { label: 'Offer Acceptance', value: '78%', icon: 'handshake', trend: '-2% vs last month', trendUp: false },
];

const chartPlaceholders = [
  {
    title: 'Placements by Month',
    icon: 'bar_chart',
    description: 'Monthly placement volume for the past 12 months',
    height: 'h-64',
    bars: [4, 6, 5, 8, 7, 9, 6, 10, 8, 11, 9, 6],
    labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
  },
  {
    title: 'Source Attribution',
    icon: 'pie_chart',
    description: 'Where your best candidates come from',
    height: 'h-64',
    sources: [
      { name: 'Job Boards', pct: 35, color: 'bg-lmdr-blue' },
      { name: 'Referrals', pct: 28, color: 'bg-sg' },
      { name: 'Direct Apply', pct: 20, color: 'bg-status-pending' },
      { name: 'Social Media', pct: 12, color: 'bg-carrier-blue' },
      { name: 'Other', pct: 5, color: 'bg-tan' },
    ],
  },
];

const funnelStages = [
  { label: 'Leads', count: 342, pct: 100, width: 'w-full' },
  { label: 'Contacted', count: 198, pct: 58, width: 'w-[80%]' },
  { label: 'Interview', count: 87, pct: 25, width: 'w-[60%]' },
  { label: 'Offer', count: 42, pct: 12, width: 'w-[40%]' },
  { label: 'Placed', count: 28, pct: 8, width: 'w-[25%]' },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label} elevation="sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-tan uppercase tracking-wide">{kpi.label}</p>
                <p className="text-2xl font-bold text-lmdr-dark mt-1">{kpi.value}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className={`material-symbols-outlined text-sm ${kpi.trendUp ? 'text-sg' : 'text-status-suspended'}`}>
                    {kpi.trendUp ? 'trending_up' : 'trending_down'}
                  </span>
                  <span className={`text-xs ${kpi.trendUp ? 'text-sg' : 'text-status-suspended'}`}>
                    {kpi.trend}
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-2xl text-lmdr-blue/50">{kpi.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placements by Month - Simple Bar Visualization */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-lg text-lmdr-blue">{chartPlaceholders[0]!.icon}</span>
            <h3 className="text-lg font-semibold text-lmdr-dark">{chartPlaceholders[0]!.title}</h3>
          </div>
          <div className="flex items-end gap-2 h-48">
            {chartPlaceholders[0]!.bars!.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-lmdr-blue/70 rounded-t-sm transition-all hover:bg-lmdr-blue"
                  style={{ height: `${(val / 12) * 100}%` }}
                />
                <span className="text-[10px] text-tan">{chartPlaceholders[0]!.labels![i]}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-tan mt-3">{chartPlaceholders[0]!.description}</p>
        </Card>

        {/* Source Attribution */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-lg text-lmdr-blue">{chartPlaceholders[1]!.icon}</span>
            <h3 className="text-lg font-semibold text-lmdr-dark">{chartPlaceholders[1]!.title}</h3>
          </div>
          <div className="space-y-3">
            {chartPlaceholders[1]!.sources!.map((source) => (
              <div key={source.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-lmdr-dark">{source.name}</span>
                  <span className="text-sm font-medium text-lmdr-dark">{source.pct}%</span>
                </div>
                <div className="w-full h-2 bg-tan/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${source.color}`}
                    style={{ width: `${source.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-tan mt-3">{chartPlaceholders[1]!.description}</p>
        </Card>
      </div>

      {/* Funnel Conversion */}
      <Card>
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-lg text-lmdr-blue">filter_alt</span>
          <h3 className="text-lg font-semibold text-lmdr-dark">Funnel Conversion</h3>
        </div>
        <div className="space-y-3">
          {funnelStages.map((stage, i) => (
            <div key={stage.label} className="flex items-center gap-4">
              <span className="w-20 text-sm font-medium text-lmdr-dark text-right">{stage.label}</span>
              <div className="flex-1">
                <div className={`${stage.width} transition-all`}>
                  <div className="bg-lmdr-blue/70 hover:bg-lmdr-blue rounded-lg px-3 py-2 flex items-center justify-between transition-colors">
                    <span className="text-xs font-medium text-white">{stage.count} candidates</span>
                    <Badge variant="info" className="!bg-white/20 !text-white">{stage.pct}%</Badge>
                  </div>
                </div>
              </div>
              {i < funnelStages.length - 1 && (
                <span className="text-xs text-tan w-16">
                  {Math.round((funnelStages[i + 1].count / stage.count) * 100)}% conv.
                </span>
              )}
              {i === funnelStages.length - 1 && <span className="w-16" />}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
