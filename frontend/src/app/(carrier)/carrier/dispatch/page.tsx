'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';

interface Dispatch {
  [key: string]: unknown;
  id: string;
  driverName: string;
  job: string;
  route: string;
  status: 'assigned' | 'in-transit' | 'delivered';
  assignedDate: string;
}

const dispatches: Dispatch[] = [
  { id: 'D-3001', driverName: 'Marcus Johnson', job: 'OTR Dry Van', route: 'Dallas → Atlanta', status: 'in-transit', assignedDate: '2026-03-07' },
  { id: 'D-3002', driverName: 'Sarah Chen', job: 'Regional Reefer', route: 'Miami → Jacksonville', status: 'in-transit', assignedDate: '2026-03-06' },
  { id: 'D-3003', driverName: 'James Williams', job: 'Local Flatbed', route: 'Houston Metro', status: 'assigned', assignedDate: '2026-03-09' },
  { id: 'D-3004', driverName: 'Maria Garcia', job: 'Tanker Hazmat', route: 'Beaumont → New Orleans', status: 'delivered', assignedDate: '2026-03-05' },
  { id: 'D-3005', driverName: 'David Lee', job: 'OTR Dry Van', route: 'Chicago → Memphis', status: 'in-transit', assignedDate: '2026-03-08' },
  { id: 'D-3006', driverName: 'Robert Davis', job: 'Dedicated Route', route: 'Chicago → Detroit', status: 'assigned', assignedDate: '2026-03-09' },
  { id: 'D-3007', driverName: 'Lisa Taylor', job: 'Regional Reefer', route: 'Charlotte → Raleigh', status: 'delivered', assignedDate: '2026-03-04' },
];

const statusVariant: Record<string, 'warning' | 'info' | 'success'> = {
  assigned: 'warning',
  'in-transit': 'info',
  delivered: 'success',
};

type StatusFilter = 'all' | 'assigned' | 'in-transit' | 'delivered';

const columns = [
  { key: 'id', header: 'Dispatch #', className: 'w-28' },
  { key: 'driverName', header: 'Driver' },
  { key: 'job', header: 'Job' },
  { key: 'route', header: 'Route' },
  {
    key: 'status',
    header: 'Status',
    render: (row: Dispatch) => (
      <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
    ),
  },
  { key: 'assignedDate', header: 'Assigned' },
  {
    key: 'actions',
    header: 'Actions',
    render: (row: Dispatch) => (
      <div className="flex gap-1">
        {row.status !== 'delivered' && (
          <>
            <button className="p-1 rounded hover:bg-beige-d text-tan hover:text-lmdr-blue" title="Reassign">
              <span className="material-symbols-outlined text-base">swap_horiz</span>
            </button>
            <button className="p-1 rounded hover:bg-beige-d text-tan hover:text-sg" title="Complete">
              <span className="material-symbols-outlined text-base">check_circle</span>
            </button>
            <button className="p-1 rounded hover:bg-beige-d text-tan hover:text-status-suspended" title="Cancel">
              <span className="material-symbols-outlined text-base">cancel</span>
            </button>
          </>
        )}
      </div>
    ),
  },
];

export default function CarrierDispatchPage() {
  const [filter, setFilter] = useState<StatusFilter>('all');

  const filtered = filter === 'all' ? dispatches : dispatches.filter((d) => d.status === filter);

  const counts = {
    all: dispatches.length,
    assigned: dispatches.filter((d) => d.status === 'assigned').length,
    'in-transit': dispatches.filter((d) => d.status === 'in-transit').length,
    delivered: dispatches.filter((d) => d.status === 'delivered').length,
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-lmdr-dark">Dispatch Queue</h2>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(
          [
            { key: 'all', label: 'Total', icon: 'list_alt' },
            { key: 'assigned', label: 'Assigned', icon: 'assignment' },
            { key: 'in-transit', label: 'In Transit', icon: 'local_shipping' },
            { key: 'delivered', label: 'Delivered', icon: 'inventory_2' },
          ] as const
        ).map((s) => (
          <Card key={s.key} elevation="sm" className="flex items-center gap-3 cursor-pointer" onClick={() => setFilter(s.key)}>
            <span className={`material-symbols-outlined text-xl ${filter === s.key ? 'text-lmdr-blue' : 'text-tan'}`}>
              {s.icon}
            </span>
            <div>
              <p className="text-xs text-tan">{s.label}</p>
              <p className="text-lg font-bold text-lmdr-dark">{counts[s.key]}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        {(['all', 'assigned', 'in-transit', 'delivered'] as const).map((s) => (
          <Button
            key={s}
            variant={filter === s ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {/* Dispatch Table */}
      <DataTable<Dispatch>
        columns={columns}
        data={filtered}
        emptyMessage="No dispatches match this filter"
      />
    </div>
  );
}
