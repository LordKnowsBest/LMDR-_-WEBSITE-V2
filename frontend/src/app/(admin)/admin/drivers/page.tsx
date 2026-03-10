'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import { KpiCard } from '@/components/ui/KpiCard';
import { useApi } from '@/lib/hooks';
import { matchingApi } from '@/lib/api';

/* ── Types ── */
type DriverStatus = 'active' | 'pending' | 'suspended';

interface Driver {
  [key: string]: unknown;
  id: string;
  name: string;
  cdlClass: string;
  status: DriverStatus;
  experience: number;
  location: string;
  matchScore: number;
  endorsements: string;
  lastActive: string;
}

const statusVariant: Record<DriverStatus, 'success' | 'warning' | 'error'> = {
  active: 'success',
  pending: 'warning',
  suspended: 'error',
};

/* ── Mock Drivers (fallback) ── */
const MOCK_DRIVERS: Driver[] = [
  { id: '1', name: 'Marcus Johnson', cdlClass: 'A', status: 'active', experience: 8, location: 'Dallas, TX', matchScore: 94, endorsements: 'H, T, N', lastActive: '2 hrs ago' },
  { id: '2', name: 'Sarah Chen', cdlClass: 'A', status: 'active', experience: 5, location: 'Los Angeles, CA', matchScore: 91, endorsements: 'T, N', lastActive: '30 min ago' },
  { id: '3', name: 'Robert Davis', cdlClass: 'B', status: 'suspended', experience: 3, location: 'Columbus, OH', matchScore: 67, endorsements: 'P', lastActive: '3 days ago' },
  { id: '4', name: 'Maria Garcia', cdlClass: 'A', status: 'active', experience: 12, location: 'Miami, FL', matchScore: 97, endorsements: 'H, T, N, X', lastActive: '1 hr ago' },
  { id: '5', name: 'James Wilson', cdlClass: 'A', status: 'pending', experience: 1, location: 'Chicago, IL', matchScore: 72, endorsements: 'N', lastActive: '5 hrs ago' },
  { id: '6', name: 'Linda Thompson', cdlClass: 'C', status: 'pending', experience: 6, location: 'New York, NY', matchScore: 78, endorsements: 'P', lastActive: '1 day ago' },
  { id: '7', name: 'Kevin Brown', cdlClass: 'A', status: 'active', experience: 10, location: 'Atlanta, GA', matchScore: 89, endorsements: 'H, T', lastActive: '45 min ago' },
  { id: '8', name: 'Ashley Martinez', cdlClass: 'B', status: 'pending', experience: 2, location: 'Phoenix, AZ', matchScore: 74, endorsements: 'N', lastActive: '2 days ago' },
  { id: '9', name: 'David Lee', cdlClass: 'A', status: 'active', experience: 15, location: 'Seattle, WA', matchScore: 96, endorsements: 'H, T, N, X', lastActive: '15 min ago' },
  { id: '10', name: 'Jennifer Adams', cdlClass: 'A', status: 'active', experience: 7, location: 'Denver, CO', matchScore: 88, endorsements: 'T, N', lastActive: '3 hrs ago' },
  { id: '11', name: 'Michael Torres', cdlClass: 'A', status: 'active', experience: 9, location: 'Nashville, TN', matchScore: 85, endorsements: 'H, T', lastActive: '1 hr ago' },
  { id: '12', name: 'Patricia Kim', cdlClass: 'B', status: 'pending', experience: 4, location: 'Portland, OR', matchScore: 76, endorsements: 'P, N', lastActive: '6 hrs ago' },
];

const filters = ['All', 'Active', 'Pending', 'Suspended'] as const;

function scoreColor(score: number): string {
  if (score >= 90) return '#10b981';
  if (score >= 80) return '#2563eb';
  if (score >= 70) return '#f59e0b';
  return '#ef4444';
}

export default function AdminDriversPage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  /* ── API Call ── */
  const { data: apiDrivers, loading, error, refresh } = useApi<Driver[]>(() => matchingApi.searchDrivers({ limit: 100 }) as Promise<{ data: Driver[] }>);

  /* ── Resolve with fallback ── */
  const allDrivers: Driver[] = apiDrivers ?? MOCK_DRIVERS;

  const filtered = allDrivers.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.location.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'All' || d.status === activeFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((d) => d.id)));
    }
  };

  const activeCount = allDrivers.filter((d) => d.status === 'active').length;
  const pendingCount = allDrivers.filter((d) => d.status === 'pending').length;
  const avgScore = allDrivers.length > 0 ? Math.round(allDrivers.reduce((a, d) => a + d.matchScore, 0) / allDrivers.length) : 0;

  const columns = [
    {
      key: 'select',
      header: '',
      className: 'w-10',
      render: (row: Driver) => (
        <input
          type="checkbox"
          checked={selected.has(row.id)}
          onChange={() => toggleSelect(row.id)}
          className="rounded accent-[var(--neu-accent)]"
        />
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (row: Driver) => (
        <div className="flex items-center gap-3">
          <div
            className="neu-x w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
            style={{ color: 'var(--neu-accent)' }}
          >
            {row.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--neu-text)' }}>{row.name}</p>
            <p className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>{row.endorsements}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'cdlClass',
      header: 'CDL Class',
      className: 'w-24 text-center',
      render: (row: Driver) => (
        <Badge variant="accent">Class {row.cdlClass}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-28',
      render: (row: Driver) => <Badge variant={statusVariant[row.status]} dot>{row.status}</Badge>,
    },
    {
      key: 'experience',
      header: 'Experience',
      className: 'w-28 text-center',
      render: (row: Driver) => (
        <span className="text-sm font-medium" style={{ color: 'var(--neu-text)' }}>{row.experience} yrs</span>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (row: Driver) => (
        <span className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>
          <span className="material-symbols-outlined text-[14px] mr-1 align-middle" style={{ color: 'var(--neu-accent)' }}>location_on</span>
          {row.location}
        </span>
      ),
    },
    {
      key: 'matchScore',
      header: 'Match Score',
      className: 'w-28 text-center',
      render: (row: Driver) => (
        <span className="text-sm font-extrabold" style={{ color: scoreColor(row.matchScore) }}>
          {row.matchScore}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24 text-right',
      render: (row: Driver) => (
        <Button variant="ghost" size="sm" icon="more_horiz" onClick={() => alert(`View ${row.name}`)} />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Error Banner ── */}
      {error && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
          <span className="material-symbols-outlined text-[18px]">warning</span>
          <span>API unavailable — showing cached data. {error}</span>
          <button onClick={refresh} className="ml-auto font-semibold underline">Retry</button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold animate-fade-up" style={{ color: 'var(--neu-text)' }}>
            Driver Management
          </h2>
          <p className="text-sm mt-1 animate-fade-up stagger-1" style={{ color: 'var(--neu-text-muted)' }}>
            {allDrivers.length} drivers in system
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon="refresh" onClick={refresh} loading={loading}>Refresh</Button>
          <Button variant="primary" size="sm" icon="person_add">Add Driver</Button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Active Drivers" value={String(activeCount)} icon="person" trend="+4 this week" trendUp className="stagger-1" />
        <KpiCard label="Pending Review" value={String(pendingCount)} icon="pending_actions" trend="3 urgent" trendUp={false} className="stagger-2" />
        <KpiCard label="Avg Match Score" value={String(avgScore)} icon="grade" trend="+2.1 pts" trendUp className="stagger-3" />
      </div>

      {/* ── Search + Filters ── */}
      <Card elevation="sm" className="flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-up stagger-4">
        <div className="w-full sm:w-80">
          <Input placeholder="Search by name or location..." icon="search" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <Button key={f} variant={activeFilter === f ? 'primary' : 'secondary'} size="sm" onClick={() => setActiveFilter(f)}>
              {f}
              {f !== 'All' && (
                <span className="ml-1 text-[10px] opacity-70">
                  ({allDrivers.filter((d) => d.status === f.toLowerCase()).length})
                </span>
              )}
            </Button>
          ))}
        </div>
      </Card>

      {/* ── Bulk Actions ── */}
      {selected.size > 0 && (
        <Card elevation="xs" className="flex items-center gap-3 animate-fade-up" style={{ borderLeft: '3px solid var(--neu-accent)' }}>
          <Badge variant="accent">{selected.size} selected</Badge>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" icon="verified">Verify Selected</Button>
            <Button variant="secondary" size="sm" icon="download">Export CSV</Button>
            <Button variant="danger" size="sm" icon="block">Suspend</Button>
          </div>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-[11px] font-semibold"
            style={{ color: 'var(--neu-text-muted)' }}
          >
            Clear
          </button>
        </Card>
      )}

      {/* ── Data Table ── */}
      <div className="animate-fade-up stagger-5">
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          emptyMessage="No drivers match your filters"
          emptyIcon="person_off"
        />
      </div>
    </div>
  );
}
