'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';

interface Account {
  [key: string]: unknown;
  id: string;
  company: string;
  industry: string;
  size: string;
  status: 'prospect' | 'active' | 'churned';
  owner: string;
  lastContact: string;
}

const accounts: Account[] = [
  { id: 'ACC-001', company: 'Werner Enterprises', industry: 'Truckload', size: 'Enterprise', status: 'active', owner: 'Alex R.', lastContact: '2026-03-08' },
  { id: 'ACC-002', company: 'Schneider National', industry: 'Intermodal', size: 'Enterprise', status: 'active', owner: 'Jordan M.', lastContact: '2026-03-07' },
  { id: 'ACC-003', company: 'J.B. Hunt Transport', industry: 'Truckload', size: 'Enterprise', status: 'prospect', owner: 'Alex R.', lastContact: '2026-03-05' },
  { id: 'ACC-004', company: 'Knight-Swift', industry: 'Truckload', size: 'Enterprise', status: 'prospect', owner: 'Sam K.', lastContact: '2026-03-04' },
  { id: 'ACC-005', company: 'XPO Logistics', industry: 'Brokerage', size: 'Large', status: 'active', owner: 'Jordan M.', lastContact: '2026-03-06' },
  { id: 'ACC-006', company: 'Heartland Express', industry: 'Truckload', size: 'Mid-Market', status: 'churned', owner: 'Alex R.', lastContact: '2026-02-15' },
  { id: 'ACC-007', company: 'Saia Inc.', industry: 'LTL', size: 'Mid-Market', status: 'prospect', owner: 'Sam K.', lastContact: '2026-03-03' },
  { id: 'ACC-008', company: 'Old Dominion', industry: 'LTL', size: 'Large', status: 'active', owner: 'Jordan M.', lastContact: '2026-03-09' },
];

const statusVariant: Record<string, 'success' | 'info' | 'error'> = {
  active: 'success',
  prospect: 'info',
  churned: 'error',
};

export default function B2BAccountsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'prospect' | 'active' | 'churned'>('all');

  const filtered = accounts.filter((a) => {
    const matchSearch = a.company.toLowerCase().includes(search.toLowerCase()) ||
      a.industry.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns = [
    { key: 'company', header: 'Company Name' },
    { key: 'industry', header: 'Industry' },
    { key: 'size', header: 'Size' },
    {
      key: 'status',
      header: 'Status',
      render: (row: Account) => (
        <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
      ),
    },
    { key: 'owner', header: 'Owner' },
    { key: 'lastContact', header: 'Last Contact' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-lmdr-dark">Account Management</h2>
        <Button variant="primary">
          <span className="material-symbols-outlined text-lg mr-1.5">add</span>
          Add Account
        </Button>
      </div>

      {/* Search + Filters */}
      <Card elevation="sm" className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <Input
            id="search"
            placeholder="Search companies or industries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'prospect', 'active', 'churned'] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </Card>

      {/* Accounts Table */}
      <DataTable<Account>
        columns={columns}
        data={filtered}
        onRowClick={() => {}}
        emptyMessage="No accounts match your search"
      />
    </div>
  );
}
