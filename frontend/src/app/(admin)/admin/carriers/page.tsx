'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';

type CarrierStatus = 'active' | 'pending' | 'inactive';

interface Carrier {
  [key: string]: unknown;
  id: string;
  companyName: string;
  dotNumber: string;
  state: string;
  activeJobs: number;
  status: CarrierStatus;
}

const statusVariant: Record<CarrierStatus, 'success' | 'warning' | 'error'> = {
  active: 'success',
  pending: 'warning',
  inactive: 'error',
};

const placeholderCarriers: Carrier[] = [
  { id: '1', companyName: 'FastFreight Inc', dotNumber: '1234567', state: 'TX', activeJobs: 12, status: 'active' },
  { id: '2', companyName: 'TransPro Logistics', dotNumber: '3847291', state: 'CA', activeJobs: 8, status: 'active' },
  { id: '3', companyName: 'Eagle Transport', dotNumber: '2938471', state: 'OH', activeJobs: 0, status: 'inactive' },
  { id: '4', companyName: 'Summit Carriers', dotNumber: '4721983', state: 'FL', activeJobs: 5, status: 'active' },
  { id: '5', companyName: 'Midwest Haulers', dotNumber: '1928374', state: 'IL', activeJobs: 3, status: 'pending' },
  { id: '6', companyName: 'Pacific Route LLC', dotNumber: '5847293', state: 'WA', activeJobs: 15, status: 'active' },
  { id: '7', companyName: 'Delta Freight Co', dotNumber: '3749182', state: 'GA', activeJobs: 0, status: 'pending' },
  { id: '8', companyName: 'Horizon Trucking', dotNumber: '6182937', state: 'AZ', activeJobs: 7, status: 'active' },
];

const filters = ['All', 'Active', 'Pending', 'Inactive'] as const;

export default function AdminCarriersPage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [enrichingId, setEnrichingId] = useState<string | null>(null);

  const filtered = placeholderCarriers.filter((c) => {
    const matchesSearch =
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.dotNumber.includes(search);
    const matchesFilter = activeFilter === 'All' || c.status === activeFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const handleEnrich = (id: string) => {
    setEnrichingId(id);
    setTimeout(() => setEnrichingId(null), 2000);
  };

  const columns = [
    { key: 'companyName', header: 'Company Name' },
    { key: 'dotNumber', header: 'DOT Number', className: 'w-32' },
    { key: 'state', header: 'State', className: 'w-20 text-center' },
    { key: 'activeJobs', header: 'Active Jobs', className: 'w-28 text-center' },
    {
      key: 'status',
      header: 'Status',
      render: (row: Carrier) => <Badge variant={statusVariant[row.status]}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-28 text-right',
      render: (row: Carrier) => (
        <Button
          variant="ghost"
          size="sm"
          loading={enrichingId === row.id}
          onClick={() => handleEnrich(row.id)}
        >
          <span className="material-symbols-outlined text-base mr-1">refresh</span>
          Enrich
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-lmdr-dark">Carrier Management</h2>
        <Button variant="primary" size="sm">
          <span className="material-symbols-outlined text-base mr-1">add_business</span>
          Add Carrier
        </Button>
      </div>

      <Card elevation="sm" className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-full sm:w-72">
          <Input placeholder="Search by name or DOT..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {filters.map((f) => (
            <Button
              key={f}
              variant={activeFilter === f ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
      </Card>

      <DataTable columns={columns} data={filtered} emptyMessage="No carriers match your filters" />
    </div>
  );
}
