'use client';

import { useState, useCallback } from 'react';
import { Card, Badge, Button, DataTable } from '@/components/ui';
import { carrierApi } from '@/lib/api';
import { useApi, useMutation } from '@/lib/hooks';

const DEMO_CARRIER_ID = 'demo-carrier-001';

/* ── Types ──────────────────────────────────────────────────── */
interface Job {
  [key: string]: unknown;
  id: string;
  title: string;
  routeType: string;
  payRange: string;
  truckType: string;
  posted: string;
  applications: number;
  status: 'active' | 'paused' | 'closed';
}

type TabFilter = 'all' | 'active' | 'paused' | 'closed';

/* ── Fallback Mock Data ────────────────────────────────────────── */
const mockJobs: Job[] = [
  { id: 'J-4001', title: 'OTR Dry Van Driver', routeType: 'OTR', payRange: '$0.62 - $0.68/mi', truckType: 'Freightliner Cascadia', posted: 'Mar 3, 2026', applications: 14, status: 'active' },
  { id: 'J-4002', title: 'Regional Reefer Driver', routeType: 'Regional', payRange: '$1,450 - $1,650/wk', truckType: 'Kenworth T680', posted: 'Mar 1, 2026', applications: 8, status: 'active' },
  { id: 'J-4003', title: 'Local Flatbed Operator', routeType: 'Local', payRange: '$26 - $30/hr', truckType: 'Peterbilt 579', posted: 'Feb 28, 2026', applications: 5, status: 'active' },
  { id: 'J-4004', title: 'Tanker Hazmat CDL-A', routeType: 'OTR', payRange: '$0.72 - $0.80/mi', truckType: 'Mack Anthem', posted: 'Feb 25, 2026', applications: 3, status: 'active' },
  { id: 'J-4005', title: 'OTR Team Drivers', routeType: 'OTR', payRange: '$0.70 - $0.75/mi split', truckType: 'Volvo VNL 860', posted: 'Feb 20, 2026', applications: 22, status: 'paused' },
  { id: 'J-4006', title: 'Dedicated Chicago - Detroit', routeType: 'Dedicated', payRange: '$1,200/wk', truckType: 'International LT', posted: 'Feb 15, 2026', applications: 11, status: 'closed' },
  { id: 'J-4007', title: 'Southeast Regional LTL', routeType: 'Regional', payRange: '$1,350 - $1,500/wk', truckType: 'Freightliner Cascadia', posted: 'Feb 12, 2026', applications: 17, status: 'active' },
  { id: 'J-4008', title: 'Intermodal Drayage Driver', routeType: 'Local', payRange: '$28 - $32/hr', truckType: 'Kenworth T880', posted: 'Feb 10, 2026', applications: 6, status: 'closed' },
];

/* ── Mappings ───────────────────────────────────────────────── */
const statusBadge: Record<string, { variant: 'success' | 'warning' | 'default'; icon: string }> = {
  active: { variant: 'success', icon: 'check_circle' },
  paused: { variant: 'warning', icon: 'pause_circle' },
  closed: { variant: 'default', icon: 'cancel' },
};

const routeBadge: Record<string, 'info' | 'accent' | 'success' | 'warning'> = {
  OTR: 'info',
  Regional: 'accent',
  Local: 'success',
  Dedicated: 'warning',
};

/* ── Columns ────────────────────────────────────────────────── */
const columns = [
  { key: 'title', header: 'Job Title', render: (r: Job) => (
    <span className="font-semibold" style={{ color: 'var(--neu-text)' }}>{r.title}</span>
  )},
  { key: 'routeType', header: 'Route Type', render: (r: Job) => (
    <Badge variant={routeBadge[r.routeType] ?? 'default'}>{r.routeType}</Badge>
  )},
  { key: 'payRange', header: 'Pay Range' },
  { key: 'truckType', header: 'Truck Type' },
  { key: 'posted', header: 'Posted' },
  { key: 'applications', header: 'Apps', className: 'text-center', render: (r: Job) => (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg neu-x text-xs font-bold" style={{ color: 'var(--neu-accent)' }}>
      {r.applications}
    </span>
  )},
  { key: 'status', header: 'Status', render: (r: Job) => (
    <Badge variant={statusBadge[r.status].variant} icon={statusBadge[r.status].icon}>
      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
    </Badge>
  )},
  { key: 'actions', header: '', render: (r: Job) => (
    <div className="flex gap-1">
      <button className="p-1.5 rounded-lg hover:bg-[var(--neu-shadow-d)]/10 transition-colors" title="Edit">
        <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-text-muted)' }}>edit</span>
      </button>
      {r.status === 'active' && (
        <button className="p-1.5 rounded-lg hover:bg-[var(--neu-shadow-d)]/10 transition-colors" title="Pause">
          <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-text-muted)' }}>pause</span>
        </button>
      )}
      <button className="p-1.5 rounded-lg hover:bg-[var(--neu-shadow-d)]/10 transition-colors" title="Duplicate">
        <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-text-muted)' }}>content_copy</span>
      </button>
    </div>
  )},
];

/* ── Tabs ───────────────────────────────────────────────────── */
const tabs: { key: TabFilter; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'list' },
  { key: 'active', label: 'Active', icon: 'check_circle' },
  { key: 'paused', label: 'Paused', icon: 'pause_circle' },
  { key: 'closed', label: 'Closed', icon: 'cancel' },
];

export default function CarrierJobsPage() {
  const [filter, setFilter] = useState<TabFilter>('all');

  const { data: apiJobs, loading, error, refresh } = useApi<Job[]>(
    () => carrierApi.getJobs(DEMO_CARRIER_ID) as Promise<{ data: Job[] }>,
    [DEMO_CARRIER_ID]
  );

  const createJobMutation = useMutation<Record<string, unknown>>(
    useCallback((job: Record<string, unknown>) => carrierApi.createJob(DEMO_CARRIER_ID, job), [])
  );

  const jobs: Job[] = apiJobs ?? mockJobs;
  const filtered = filter === 'all' ? jobs : jobs.filter((j) => j.status === filter);
  const counts: Record<TabFilter, number> = {
    all: jobs.length,
    active: jobs.filter((j) => j.status === 'active').length,
    paused: jobs.filter((j) => j.status === 'paused').length,
    closed: jobs.filter((j) => j.status === 'closed').length,
  };

  const handleNewJob = async () => {
    await createJobMutation.execute({
      title: 'New Job Posting',
      routeType: 'OTR',
      status: 'active',
    });
    refresh();
  };

  return (
    <div className="space-y-7">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>Job Board</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>
            Manage your open positions and track applicants
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <Button
            variant="primary"
            icon="add_circle"
            onClick={handleNewJob}
            disabled={createJobMutation.loading}
          >
            {createJobMutation.loading ? 'Creating...' : 'New Job'}
          </Button>
        </div>
      </div>

      {createJobMutation.error && (
        <Card elevation="sm" className="!border-red-300 animate-fade-up">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-red-500">error</span>
            <span className="text-sm text-red-600">{createJobMutation.error}</span>
          </div>
        </Card>
      )}

      {/* ═══ Filter Tabs ═══ */}
      <div className="flex gap-2 animate-fade-up stagger-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`
              inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200
              ${filter === tab.key
                ? 'btn-glow text-white'
                : 'neu-x hover:translate-y-[-1px]'
              }
            `}
            style={filter !== tab.key ? { color: 'var(--neu-text)' } : undefined}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            {tab.label}
            <span className={`
              inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold
              ${filter === tab.key ? 'bg-white/20' : 'bg-[var(--neu-accent)]/10'}
            `}
              style={filter !== tab.key ? { color: 'var(--neu-accent)' } : undefined}
            >
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* ═══ Summary Cards ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-up stagger-3">
        {[
          { label: 'Total Positions', value: jobs.length, icon: 'work', color: 'var(--neu-accent)' },
          { label: 'Total Applications', value: jobs.reduce((s, j) => s + j.applications, 0), icon: 'description', color: '#22c55e' },
          { label: 'Avg Apps / Job', value: jobs.length > 0 ? Math.round(jobs.reduce((s, j) => s + j.applications, 0) / jobs.length) : 0, icon: 'trending_up', color: '#f59e0b' },
          { label: 'Fill Rate', value: '67%', icon: 'pie_chart', color: '#a855f7' },
        ].map((s) => (
          <Card key={s.label} elevation="xs" className="flex items-center gap-3">
            <div className="neu-x w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]" style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div>
              <p className="kpi-label">{s.label}</p>
              <p className="text-lg font-bold" style={{ color: 'var(--neu-text)' }}>{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* ═══ Data Table ═══ */}
      <div className="animate-fade-up stagger-4">
        <DataTable<Job>
          columns={columns}
          data={filtered}
          emptyMessage="No jobs match this filter"
          emptyIcon="work_off"
        />
      </div>
    </div>
  );
}
