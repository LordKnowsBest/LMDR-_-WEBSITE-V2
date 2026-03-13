'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { KpiCard } from '@/components/ui/KpiCard';
import { AdminAlert } from '@/components/admin';
import { useApi } from '@/lib/hooks';
import { listMatches } from '../../actions/matches';

/* ── Types ── */
type MatchStatus = 'applied' | 'interviewed' | 'offered' | 'placed' | 'rejected';

interface Match {
  [key: string]: unknown;
  id: string;
  driverName: string;
  carrierName: string;
  score: number;
  status: MatchStatus;
  date: string;
  driverCdl: string;
  route: string;
}

const statusVariant: Record<MatchStatus, 'info' | 'warning' | 'accent' | 'success' | 'error'> = {
  applied: 'info',
  interviewed: 'warning',
  offered: 'accent',
  placed: 'success',
  rejected: 'error',
};

const statusIcon: Record<MatchStatus, string> = {
  applied: 'send',
  interviewed: 'record_voice_over',
  offered: 'description',
  placed: 'check_circle',
  rejected: 'cancel',
};

/* ── Mock Matches (fallback) ── */
const MOCK_MATCHES: Match[] = [
  { id: '1', driverName: 'Marcus Johnson', carrierName: 'FastFreight Inc', score: 94, status: 'placed', date: '2026-03-09', driverCdl: 'A', route: 'OTR' },
  { id: '2', driverName: 'Sarah Chen', carrierName: 'Summit Carriers', score: 91, status: 'interviewed', date: '2026-03-09', driverCdl: 'A', route: 'Regional' },
  { id: '3', driverName: 'Kevin Brown', carrierName: 'Pacific Route LLC', score: 88, status: 'placed', date: '2026-03-08', driverCdl: 'A', route: 'OTR' },
  { id: '4', driverName: 'Maria Garcia', carrierName: 'TransPro Logistics', score: 85, status: 'offered', date: '2026-03-08', driverCdl: 'A', route: 'Dedicated' },
  { id: '5', driverName: 'James Wilson', carrierName: 'Eagle Transport', score: 72, status: 'rejected', date: '2026-03-07', driverCdl: 'A', route: 'Local' },
  { id: '6', driverName: 'David Lee', carrierName: 'Horizon Trucking', score: 96, status: 'placed', date: '2026-03-07', driverCdl: 'A', route: 'OTR' },
  { id: '7', driverName: 'Ashley Martinez', carrierName: 'Midwest Haulers', score: 79, status: 'applied', date: '2026-03-06', driverCdl: 'B', route: 'Regional' },
  { id: '8', driverName: 'Robert Davis', carrierName: 'Delta Freight Co', score: 67, status: 'rejected', date: '2026-03-06', driverCdl: 'B', route: 'Local' },
  { id: '9', driverName: 'Jennifer Adams', carrierName: 'Blue Ridge Carriers', score: 83, status: 'interviewed', date: '2026-03-05', driverCdl: 'A', route: 'Dedicated' },
  { id: '10', driverName: 'Michael Torres', carrierName: 'Lone Star Express', score: 90, status: 'offered', date: '2026-03-05', driverCdl: 'A', route: 'OTR' },
];

const filterTabs = ['All', 'High Score', 'Applied', 'Interviewed', 'Placed'] as const;

function scoreColor(score: number): string {
  if (score >= 90) return '#10b981';
  if (score >= 80) return '#2563eb';
  if (score >= 70) return '#f59e0b';
  return '#ef4444';
}

export default function AdminMatchesPage() {
  const [activeTab, setActiveTab] = useState<string>('All');

  /* ── API Call ── */
  const { data: apiMatches, loading, error, refresh } = useApi<Match[]>(
    () => listMatches().then((result) => ({ data: result.items as Match[] }))
  );

  /* ── Resolve with fallback ── */
  const allMatches: Match[] = apiMatches ?? MOCK_MATCHES;

  const filtered = allMatches.filter((m) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'High Score') return m.score >= 90;
    return m.status === activeTab.toLowerCase();
  });

  const totalMatches = allMatches.length;
  const avgScore = totalMatches > 0 ? Math.round(allMatches.reduce((a, m) => a + m.score, 0) / totalMatches) : 0;
  const placedCount = allMatches.filter((m) => m.status === 'placed').length;
  const conversionRate = Math.round((placedCount / totalMatches) * 100);

  const columns = [
    {
      key: 'driver',
      header: 'Driver',
      render: (row: Match) => (
        <div className="flex items-center gap-3">
          <div className="neu-x w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ color: 'var(--neu-accent)' }}>
            {row.driverName.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--neu-text)' }}>{row.driverName}</p>
            <p className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>CDL-{row.driverCdl} / {row.route}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'carrier',
      header: 'Carrier',
      render: (row: Match) => (
        <span className="text-sm font-medium" style={{ color: 'var(--neu-text)' }}>
          <span className="material-symbols-outlined text-[14px] mr-1 align-middle" style={{ color: 'var(--neu-accent)' }}>local_shipping</span>
          {row.carrierName}
        </span>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      className: 'w-24 text-center',
      render: (row: Match) => (
        <div className="flex items-center justify-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: scoreColor(row.score) }}
          />
          <span className="text-sm font-extrabold" style={{ color: scoreColor(row.score) }}>
            {row.score}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-32',
      render: (row: Match) => (
        <Badge variant={statusVariant[row.status]} icon={statusIcon[row.status]}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      className: 'w-28',
      render: (row: Match) => (
        <span className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>
          {new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-20 text-right',
      render: () => (
        <Button variant="ghost" size="sm" icon="visibility">View</Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
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
            Match Management
          </h2>
          <p className="text-sm mt-1 animate-fade-up stagger-1" style={{ color: 'var(--neu-text-muted)' }}>
            Driver-carrier match pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon="refresh" onClick={refresh} loading={loading}>Refresh</Button>
          <Button variant="primary" size="sm" icon="auto_awesome">Run Matching</Button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Total Matches" value={String(totalMatches)} icon="handshake" trend="+24 this week" trendUp className="stagger-1" />
        <KpiCard label="Avg Score" value={String(avgScore)} icon="grade" trend="+3.2 pts" trendUp className="stagger-2" />
        <KpiCard label="Conversion Rate" value={`${conversionRate}%`} icon="trending_up" trend="+5% MoM" trendUp className="stagger-3" />
      </div>

      {/* ── Funnel Summary ── */}
      <Card elevation="sm" className="animate-fade-up stagger-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>filter_alt</span>
          <h3 className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>Pipeline Funnel</h3>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {(['applied', 'interviewed', 'offered', 'placed', 'rejected'] as MatchStatus[]).map((s, i) => {
            const count = allMatches.filter((m) => m.status === s).length;
            return (
              <div key={s} className="flex items-center gap-3">
                <div className="neu-s rounded-xl px-4 py-3 text-center min-w-[100px]">
                  <p className="text-lg font-extrabold" style={{ color: 'var(--neu-text)' }}>{count}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>{s}</p>
                </div>
                {i < 4 && (
                  <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-text-muted)' }}>chevron_right</span>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Filter Tabs ── */}
      <div className="flex gap-2 flex-wrap animate-fade-up stagger-5">
        {filterTabs.map((tab) => (
          <Button key={tab} variant={activeTab === tab ? 'primary' : 'secondary'} size="sm" onClick={() => setActiveTab(tab)}>
            {tab}
            {tab === 'High Score' && <span className="material-symbols-outlined text-[14px] ml-0.5">star</span>}
          </Button>
        ))}
      </div>

      {/* ── Data Table ── */}
      <div className="animate-fade-up stagger-6">
        <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No matches found for selected filter" emptyIcon="handshake" />
      </div>
    </div>
  );
}
