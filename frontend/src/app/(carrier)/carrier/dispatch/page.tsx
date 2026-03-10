'use client';

import { useState } from 'react';
import { Card, Badge, Button, DataTable, StatusDot } from '@/components/ui';
import { carrierApi } from '@/lib/api';
import { useApi } from '@/lib/hooks';

/* ── Types ──────────────────────────────────────────────────── */
interface DispatchRow {
  [key: string]: unknown;
  loadId: string;
  driver: string;
  origin: string;
  destination: string;
  pickupDate: string;
  status: 'pending' | 'in_transit' | 'delivered';
  eta: string;
}

type FilterKey = 'all' | 'pending' | 'in_transit' | 'delivered';

/* ── Fallback Mock Data ────────────────────────────────────────── */
const mockDispatches: DispatchRow[] = [
  { loadId: 'LD-7001', driver: 'Marcus Johnson', origin: 'Dallas, TX', destination: 'Atlanta, GA', pickupDate: 'Mar 9, 2026', status: 'in_transit', eta: 'Mar 10, 14:30' },
  { loadId: 'LD-7002', driver: 'Sarah Chen', origin: 'Miami, FL', destination: 'Jacksonville, FL', pickupDate: 'Mar 9, 2026', status: 'in_transit', eta: 'Mar 9, 19:00' },
  { loadId: 'LD-7003', driver: 'James Williams', origin: 'Houston, TX', destination: 'San Antonio, TX', pickupDate: 'Mar 10, 2026', status: 'pending', eta: 'Mar 10, 16:00' },
  { loadId: 'LD-7004', driver: 'Maria Garcia', origin: 'Beaumont, TX', destination: 'New Orleans, LA', pickupDate: 'Mar 8, 2026', status: 'delivered', eta: 'Delivered' },
  { loadId: 'LD-7005', driver: 'David Lee', origin: 'Chicago, IL', destination: 'Memphis, TN', pickupDate: 'Mar 8, 2026', status: 'in_transit', eta: 'Mar 9, 22:00' },
  { loadId: 'LD-7006', driver: 'Robert Davis', origin: 'Chicago, IL', destination: 'Detroit, MI', pickupDate: 'Mar 10, 2026', status: 'pending', eta: 'Mar 10, 20:00' },
  { loadId: 'LD-7007', driver: 'Lisa Taylor', origin: 'Charlotte, NC', destination: 'Raleigh, NC', pickupDate: 'Mar 7, 2026', status: 'delivered', eta: 'Delivered' },
  { loadId: 'LD-7008', driver: 'Anthony Brown', origin: 'Los Angeles, CA', destination: 'Phoenix, AZ', pickupDate: 'Mar 9, 2026', status: 'in_transit', eta: 'Mar 10, 06:00' },
  { loadId: 'LD-7009', driver: 'Kevin Martinez', origin: 'Nashville, TN', destination: 'Louisville, KY', pickupDate: 'Mar 10, 2026', status: 'pending', eta: 'Mar 11, 08:00' },
  { loadId: 'LD-7010', driver: 'Jennifer Wilson', origin: 'Denver, CO', destination: 'Kansas City, MO', pickupDate: 'Mar 7, 2026', status: 'delivered', eta: 'Delivered' },
];

/* ── Mappings ───────────────────────────────────────────────── */
const statusConfig: Record<string, { variant: 'warning' | 'info' | 'success'; icon: string; label: string; dot: 'warning' | 'active' | 'idle' }> = {
  pending: { variant: 'warning', icon: 'schedule', label: 'Pending', dot: 'warning' },
  in_transit: { variant: 'info', icon: 'local_shipping', label: 'In Transit', dot: 'active' },
  delivered: { variant: 'success', icon: 'inventory_2', label: 'Delivered', dot: 'idle' },
};

/* ── Filter pills ───────────────────────────────────────────── */
const filterPills: { key: FilterKey; label: string; icon: string }[] = [
  { key: 'all', label: 'All Loads', icon: 'list_alt' },
  { key: 'pending', label: 'Pending', icon: 'schedule' },
  { key: 'in_transit', label: 'In Transit', icon: 'local_shipping' },
  { key: 'delivered', label: 'Delivered', icon: 'inventory_2' },
];

/* ── Columns ────────────────────────────────────────────────── */
const columns = [
  { key: 'loadId', header: 'Load ID', className: 'w-28', render: (r: DispatchRow) => (
    <span className="font-mono text-xs font-bold" style={{ color: 'var(--neu-accent)' }}>{r.loadId}</span>
  )},
  { key: 'driver', header: 'Driver', render: (r: DispatchRow) => (
    <div className="flex items-center gap-2">
      <div className="neu-x w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--neu-accent)' }}>person</span>
      </div>
      <span className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>{r.driver}</span>
    </div>
  )},
  { key: 'route', header: 'Origin / Destination', render: (r: DispatchRow) => (
    <div className="flex items-center gap-1.5 text-sm">
      <span style={{ color: 'var(--neu-text)' }}>{r.origin}</span>
      <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--neu-text-muted)' }}>arrow_forward</span>
      <span style={{ color: 'var(--neu-text)' }}>{r.destination}</span>
    </div>
  )},
  { key: 'pickupDate', header: 'Pickup Date' },
  { key: 'status', header: 'Status', render: (r: DispatchRow) => (
    <Badge variant={statusConfig[r.status].variant} icon={statusConfig[r.status].icon}>
      {statusConfig[r.status].label}
    </Badge>
  )},
  { key: 'eta', header: 'ETA', render: (r: DispatchRow) => (
    <span className="text-xs font-semibold" style={{ color: r.status === 'delivered' ? 'var(--neu-text-muted)' : 'var(--neu-text)' }}>
      {r.eta}
    </span>
  )},
  { key: 'actions', header: '', render: (r: DispatchRow) => (
    <div className="flex gap-1">
      {r.status !== 'delivered' && (
        <>
          <button className="p-1.5 rounded-lg hover:bg-[var(--neu-shadow-d)]/10 transition-colors" title="Track">
            <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-accent)' }}>location_on</span>
          </button>
          <button className="p-1.5 rounded-lg hover:bg-[var(--neu-shadow-d)]/10 transition-colors" title="Reassign">
            <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-text-muted)' }}>swap_horiz</span>
          </button>
          <button className="p-1.5 rounded-lg hover:bg-[var(--neu-shadow-d)]/10 transition-colors" title="Mark Delivered">
            <span className="material-symbols-outlined text-[16px]" style={{ color: '#22c55e' }}>check_circle</span>
          </button>
        </>
      )}
      {r.status === 'delivered' && (
        <button className="p-1.5 rounded-lg hover:bg-[var(--neu-shadow-d)]/10 transition-colors" title="View POD">
          <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-text-muted)' }}>receipt_long</span>
        </button>
      )}
    </div>
  )},
];

export default function CarrierDispatchPage() {
  const [filter, setFilter] = useState<FilterKey>('all');

  const { data: apiDispatches, loading, error, refresh } = useApi<DispatchRow[]>(
    () => carrierApi.getDispatchQueue() as Promise<{ data: DispatchRow[] }>,
    []
  );

  const dispatches: DispatchRow[] = apiDispatches ?? mockDispatches;
  const filtered = filter === 'all' ? dispatches : dispatches.filter((d) => d.status === filter);

  const counts: Record<FilterKey, number> = {
    all: dispatches.length,
    pending: dispatches.filter((d) => d.status === 'pending').length,
    in_transit: dispatches.filter((d) => d.status === 'in_transit').length,
    delivered: dispatches.filter((d) => d.status === 'delivered').length,
  };

  return (
    <div className="space-y-7">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>Dispatch Queue</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>
            Track loads and manage driver assignments
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
          <Button variant="primary" icon="add_circle">New Dispatch</Button>
        </div>
      </div>

      {/* ═══ Summary Bar ═══ */}
      <Card elevation="sm" className="animate-fade-up stagger-1">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <StatusDot status="warning" />
              <span className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                {counts.pending} Pending
              </span>
            </div>
            <div className="flex items-center gap-2">
              <StatusDot status="active" />
              <span className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                {counts.in_transit} In Transit
              </span>
            </div>
            <div className="flex items-center gap-2">
              <StatusDot status="idle" />
              <span className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                {counts.delivered} Delivered Today
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-text-muted)' }}>update</span>
            <span className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>Last updated: just now</span>
          </div>
        </div>
      </Card>

      {/* ═══ Filter Pills ═══ */}
      <div className="flex gap-2 animate-fade-up stagger-2">
        {filterPills.map((pill) => (
          <button
            key={pill.key}
            onClick={() => setFilter(pill.key)}
            className={`
              inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200
              ${filter === pill.key
                ? 'btn-glow text-white'
                : 'neu-x hover:translate-y-[-1px]'
              }
            `}
            style={filter !== pill.key ? { color: 'var(--neu-text)' } : undefined}
          >
            <span className="material-symbols-outlined text-[16px]">{pill.icon}</span>
            {pill.label}
            <span className={`
              inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[10px] font-bold
              ${filter === pill.key ? 'bg-white/20' : 'bg-[var(--neu-accent)]/10'}
            `}
              style={filter !== pill.key ? { color: 'var(--neu-accent)' } : undefined}
            >
              {counts[pill.key]}
            </span>
          </button>
        ))}
      </div>

      {/* ═══ Dispatch Table ═══ */}
      <div className="animate-fade-up stagger-3">
        <DataTable<DispatchRow>
          columns={columns}
          data={filtered}
          emptyMessage="No dispatches match this filter"
          emptyIcon="local_shipping"
        />
      </div>
    </div>
  );
}
