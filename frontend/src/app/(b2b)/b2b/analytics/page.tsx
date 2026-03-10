'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const revenueMetrics = [
  { label: 'MRR', value: '$87,400', trend: '+6.2%', trendUp: true, icon: 'payments' },
  { label: 'ARR', value: '$1.05M', trend: '+18%', trendUp: true, icon: 'account_balance' },
  { label: 'Churn Rate', value: '2.4%', trend: '-0.8%', trendUp: true, icon: 'trending_down' },
  { label: 'LTV', value: '$42,600', trend: '+12%', trendUp: true, icon: 'diamond' },
];

const pipelineByStage = [
  { stage: 'Prospect', count: 24, value: '$480K', pct: 15 },
  { stage: 'Qualified', count: 18, value: '$620K', pct: 20 },
  { stage: 'Demo', count: 12, value: '$540K', pct: 17 },
  { stage: 'Proposal', count: 8, value: '$720K', pct: 23 },
  { stage: 'Negotiation', count: 6, value: '$810K', pct: 25 },
];

const quarterlyWinLoss = [
  { quarter: 'Q1 2025', won: 8, lost: 3, rate: '73%' },
  { quarter: 'Q2 2025', won: 11, lost: 4, rate: '73%' },
  { quarter: 'Q3 2025', won: 9, lost: 5, rate: '64%' },
  { quarter: 'Q4 2025', won: 14, lost: 3, rate: '82%' },
  { quarter: 'Q1 2026', won: 10, lost: 2, rate: '83%' },
];

const accountHealth = [
  { label: 'Healthy', count: 89, color: 'bg-sg' },
  { label: 'At Risk', count: 12, color: 'bg-status-pending' },
  { label: 'Churned', count: 6, color: 'bg-status-suspended' },
];

export default function B2BAnalyticsPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-lmdr-dark">B2B Analytics</h2>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {revenueMetrics.map((metric) => (
          <Card key={metric.label} elevation="sm" className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-lmdr-blue/10 text-lmdr-blue">
              <span className="material-symbols-outlined text-2xl">{metric.icon}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-tan">{metric.label}</p>
              <p className="text-2xl font-bold text-lmdr-dark">{metric.value}</p>
              <span className={`text-xs font-medium ${metric.trendUp ? 'text-sg' : 'text-status-suspended'}`}>
                {metric.trend} vs last quarter
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend (placeholder chart) */}
        <Card elevation="md">
          <h3 className="text-lg font-semibold text-lmdr-dark mb-4">Revenue Trend</h3>
          <Card inset className="flex items-center justify-center h-48">
            <div className="text-center">
              <span className="material-symbols-outlined text-4xl text-tan/40">show_chart</span>
              <p className="text-sm text-tan mt-2">Chart visualization will render here</p>
            </div>
          </Card>
        </Card>

        {/* Pipeline by Stage */}
        <Card elevation="md">
          <h3 className="text-lg font-semibold text-lmdr-dark mb-4">Pipeline by Stage</h3>
          <div className="space-y-3">
            {pipelineByStage.map((item) => (
              <div key={item.stage}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-lmdr-dark font-medium">{item.stage}</span>
                  <span className="text-tan">{item.count} deals &middot; {item.value}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-beige-d">
                  <div
                    className="h-2 rounded-full bg-lmdr-blue transition-all"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Win/Loss by Quarter */}
        <Card elevation="md">
          <h3 className="text-lg font-semibold text-lmdr-dark mb-4">Win/Loss by Quarter</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-tan/20">
                  <th className="text-left py-2 px-2 font-semibold text-lmdr-dark">Quarter</th>
                  <th className="text-center py-2 px-2 font-semibold text-sg">Won</th>
                  <th className="text-center py-2 px-2 font-semibold text-status-suspended">Lost</th>
                  <th className="text-right py-2 px-2 font-semibold text-lmdr-dark">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {quarterlyWinLoss.map((q) => (
                  <tr key={q.quarter} className="border-b border-tan/10">
                    <td className="py-2 px-2 text-lmdr-dark">{q.quarter}</td>
                    <td className="py-2 px-2 text-center">
                      <Badge variant="success">{q.won}</Badge>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Badge variant="error">{q.lost}</Badge>
                    </td>
                    <td className="py-2 px-2 text-right font-semibold text-lmdr-dark">{q.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Account Health */}
        <Card elevation="md">
          <h3 className="text-lg font-semibold text-lmdr-dark mb-4">Account Health</h3>
          <div className="flex items-center gap-6 mb-4">
            {accountHealth.map((h) => (
              <div key={h.label} className="text-center">
                <p className="text-3xl font-bold text-lmdr-dark">{h.count}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${h.color}`} />
                  <span className="text-sm text-tan">{h.label}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Placeholder donut chart */}
          <Card inset className="flex items-center justify-center h-32">
            <div className="text-center">
              <span className="material-symbols-outlined text-4xl text-tan/40">donut_large</span>
              <p className="text-sm text-tan mt-2">Health distribution chart</p>
            </div>
          </Card>
        </Card>
      </div>
    </div>
  );
}
