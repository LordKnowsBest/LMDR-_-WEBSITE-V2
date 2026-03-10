'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';

type DriverStatus = 'active' | 'pending' | 'suspended';

interface Driver {
  [key: string]: unknown;
  id: string;
  name: string;
  cdlClass: string;
  state: string;
  experience: number;
  status: DriverStatus;
  onboardingStep: string;
}

const statusVariant: Record<DriverStatus, 'success' | 'warning' | 'error'> = {
  active: 'success',
  pending: 'warning',
  suspended: 'error',
};

const placeholderDrivers: Driver[] = [
  { id: '1', name: 'Marcus Johnson', cdlClass: 'A', state: 'TX', experience: 8, status: 'active', onboardingStep: 'Complete' },
  { id: '2', name: 'Sarah Chen', cdlClass: 'A', state: 'CA', experience: 5, status: 'active', onboardingStep: 'Complete' },
  { id: '3', name: 'Robert Davis', cdlClass: 'B', state: 'OH', experience: 3, status: 'suspended', onboardingStep: 'MVR Review' },
  { id: '4', name: 'Maria Garcia', cdlClass: 'A', state: 'FL', experience: 12, status: 'active', onboardingStep: 'Complete' },
  { id: '5', name: 'James Wilson', cdlClass: 'A', state: 'IL', experience: 1, status: 'pending', onboardingStep: 'Doc Upload' },
  { id: '6', name: 'Linda Thompson', cdlClass: 'C', state: 'NY', experience: 6, status: 'pending', onboardingStep: 'Verification' },
  { id: '7', name: 'Kevin Brown', cdlClass: 'A', state: 'GA', experience: 10, status: 'active', onboardingStep: 'Complete' },
  { id: '8', name: 'Ashley Martinez', cdlClass: 'B', state: 'AZ', experience: 2, status: 'pending', onboardingStep: 'CDL Check' },
];

const filters = ['All', 'Active', 'Pending', 'Suspended'] as const;

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'cdlClass', header: 'CDL Class', className: 'w-24 text-center' },
  { key: 'state', header: 'State', className: 'w-20 text-center' },
  { key: 'experience', header: 'Experience', render: (row: Driver) => `${row.experience} yrs` },
  {
    key: 'status',
    header: 'Status',
    render: (row: Driver) => <Badge variant={statusVariant[row.status]}>{row.status}</Badge>,
  },
  { key: 'onboardingStep', header: 'Onboarding Step' },
];

export default function AdminDriversPage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = placeholderDrivers.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
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

  const selectableColumns = [
    {
      key: 'select',
      header: '',
      className: 'w-10',
      render: (row: Driver) => (
        <input
          type="checkbox"
          checked={selected.has(row.id)}
          onChange={() => toggleSelect(row.id)}
          className="rounded border-tan/30"
        />
      ),
    },
    ...columns,
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-lmdr-dark">Driver Management</h2>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" disabled={selected.size === 0}>
            <span className="material-symbols-outlined text-base mr-1">verified</span>
            Verify ({selected.size})
          </Button>
          <Button variant="danger" size="sm" disabled={selected.size === 0}>
            <span className="material-symbols-outlined text-base mr-1">block</span>
            Suspend ({selected.size})
          </Button>
        </div>
      </div>

      <Card elevation="sm" className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-full sm:w-72">
          <Input placeholder="Search drivers..." value={search} onChange={(e) => setSearch(e.target.value)} />
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

      <DataTable columns={selectableColumns} data={filtered} emptyMessage="No drivers match your filters" />
    </div>
  );
}
