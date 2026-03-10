'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const featureAdoption = [
  { feature: 'AI Matching', users: 1842, adoption: 92, trend: 'up' },
  { feature: 'Voice Agent', users: 623, adoption: 31, trend: 'up' },
  { feature: 'Pet Friendly Map', users: 412, adoption: 21, trend: 'stable' },
  { feature: 'Health Resources', users: 387, adoption: 19, trend: 'up' },
  { feature: 'Market Signals', users: 298, adoption: 15, trend: 'down' },
  { feature: 'Carrier Coaching', users: 256, adoption: 13, trend: 'up' },
];

function ChartPlaceholder({ title, type, height = 'h-64' }: { title: string; type: string; height?: string }) {
  return (
    <Card elevation="sm" className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lmdr-dark">{title}</h3>
        <Badge variant="info">{type}</Badge>
      </div>
      <div className={`${height} rounded-lg bg-beige-d/50 flex items-center justify-center border border-tan/10`}>
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-tan/40">bar_chart</span>
          <p className="text-sm text-tan mt-2">Chart renders here when API is connected</p>
        </div>
      </div>
    </Card>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-lmdr-dark">Platform Analytics</h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: '4,291', icon: 'group' },
          { label: 'Match Rate', value: '78%', icon: 'percent' },
          { label: 'Avg Score', value: '84.2', icon: 'grade' },
          { label: 'API Calls Today', value: '12,847', icon: 'api' },
        ].map((s) => (
          <Card key={s.label} elevation="sm" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-lmdr-blue/10 text-lmdr-blue">
              <span className="material-symbols-outlined">{s.icon}</span>
            </div>
            <div>
              <p className="text-xs text-tan">{s.label}</p>
              <p className="text-xl font-bold text-lmdr-dark">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPlaceholder title="User Growth" type="Line Chart" />
        <ChartPlaceholder title="Match Rate by Month" type="Bar Chart" />
        <ChartPlaceholder title="AI Provider Usage" type="Pie Chart" />

        {/* Feature Adoption Table */}
        <Card elevation="sm">
          <h3 className="font-semibold text-lmdr-dark mb-4">Feature Adoption</h3>
          <div className="space-y-3">
            {featureAdoption.map((f) => (
              <div key={f.feature} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-lmdr-dark">{f.feature}</span>
                    <span className="text-xs text-tan">{f.users.toLocaleString()} users</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-beige-d">
                    <div
                      className="h-2 rounded-full bg-lmdr-blue transition-all"
                      style={{ width: `${f.adoption}%` }}
                    />
                  </div>
                </div>
                <span className={`material-symbols-outlined text-base ${f.trend === 'up' ? 'text-sg' : f.trend === 'down' ? 'text-status-suspended' : 'text-tan'}`}>
                  {f.trend === 'up' ? 'trending_up' : f.trend === 'down' ? 'trending_down' : 'trending_flat'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
