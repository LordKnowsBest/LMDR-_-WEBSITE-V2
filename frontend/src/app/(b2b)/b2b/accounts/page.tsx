'use client';

import { useState } from 'react';
import { Card, Badge, Button, Input, DataTable, ProgressBar } from '@/components/ui';

/* ── Mock Data ─────────────────────────────────────────────────── */

type Segment = 'All' | 'Enterprise' | 'Mid-Market' | 'Startup';

interface Account {
  [key: string]: unknown;
  name: string;
  industry: string;
  plan: string;
  contacts: number;
  mrr: string;
  mrrNum: number;
  healthScore: number;
  status: 'Active' | 'Churned' | 'Trial';
  segment: Segment;
}

const accounts: Account[] = [
  { name: 'Werner Enterprises', industry: 'Truckload Carrier', plan: 'Enterprise', contacts: 14, mrr: '$9,100', mrrNum: 9100, healthScore: 95, status: 'Active', segment: 'Enterprise' },
  { name: 'Schneider National', industry: 'Intermodal / Logistics', plan: 'Enterprise', contacts: 11, mrr: '$8,400', mrrNum: 8400, healthScore: 88, status: 'Active', segment: 'Enterprise' },
  { name: 'Knight-Swift Holdings', industry: 'Truckload Carrier', plan: 'Enterprise', contacts: 18, mrr: '$10,200', mrrNum: 10200, healthScore: 92, status: 'Active', segment: 'Enterprise' },
  { name: 'J.B. Hunt Transport', industry: 'Truckload / Brokerage', plan: 'Growth', contacts: 7, mrr: '$4,800', mrrNum: 4800, healthScore: 76, status: 'Active', segment: 'Mid-Market' },
  { name: 'XPO Logistics', industry: 'Freight Brokerage', plan: 'Growth', contacts: 5, mrr: '$3,600', mrrNum: 3600, healthScore: 54, status: 'Trial', segment: 'Mid-Market' },
  { name: 'Ryder System', industry: 'Fleet Management', plan: 'Growth', contacts: 9, mrr: '$5,200', mrrNum: 5200, healthScore: 81, status: 'Active', segment: 'Mid-Market' },
  { name: 'TQL (Total Quality Logistics)', industry: 'Freight Brokerage', plan: 'Growth', contacts: 6, mrr: '$4,100', mrrNum: 4100, healthScore: 70, status: 'Active', segment: 'Mid-Market' },
  { name: 'Saia Inc.', industry: 'LTL Carrier', plan: 'Starter', contacts: 3, mrr: '$1,200', mrrNum: 1200, healthScore: 62, status: 'Trial', segment: 'Startup' },
  { name: 'Heartland Express', industry: 'Truckload Carrier', plan: 'Starter', contacts: 2, mrr: '$0', mrrNum: 0, healthScore: 18, status: 'Churned', segment: 'Mid-Market' },
  { name: 'Drive Staffing Solutions', industry: 'CDL Staffing Agency', plan: 'Starter', contacts: 4, mrr: '$980', mrrNum: 980, healthScore: 44, status: 'Trial', segment: 'Startup' },
];

const segments: Segment[] = ['All', 'Enterprise', 'Mid-Market', 'Startup'];

const segmentIcons: Record<Segment, string> = {
  All: 'apps',
  Enterprise: 'domain',
  'Mid-Market': 'business',
  Startup: 'rocket_launch',
};

const planBadge: Record<string, 'accent' | 'info' | 'warning'> = {
  Enterprise: 'accent',
  Growth: 'info',
  Starter: 'warning',
};

const statusBadge: Record<string, 'success' | 'warning' | 'error'> = {
  Active: 'success',
  Trial: 'warning',
  Churned: 'error',
};

function healthColor(score: number): 'green' | 'amber' | 'red' {
  if (score >= 80) return 'green';
  if (score >= 60) return 'amber';
  return 'red';
}

/* ── Page Component ────────────────────────────────────────────── */

export default function B2BAccountsPage() {
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<Segment>('All');

  const filtered = accounts.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.industry.toLowerCase().includes(search.toLowerCase());
    const matchSegment = segment === 'All' || a.segment === segment;
    return matchSearch && matchSegment;
  });

  const columns = [
    {
      key: 'name',
      header: 'Account Name',
      render: (row: Account) => (
        <div className="flex items-center gap-2.5">
          <div className="neu-x w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-[11px] font-black" style={{ color: 'var(--neu-accent)' }}>
              {row.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>{row.name}</p>
            <p className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>{row.industry}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (row: Account) => (
        <Badge variant={planBadge[row.plan] ?? 'default'} icon="verified">{row.plan}</Badge>
      ),
    },
    {
      key: 'contacts',
      header: 'Contacts',
      className: 'text-center',
      render: (row: Account) => (
        <span className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>{row.contacts}</span>
      ),
    },
    {
      key: 'mrr',
      header: 'MRR',
      className: 'text-right',
      render: (row: Account) => (
        <span className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>{row.mrr}</span>
      ),
    },
    {
      key: 'healthScore',
      header: 'Health Score',
      render: (row: Account) => (
        <ProgressBar value={row.healthScore} color={healthColor(row.healthScore)} showValue className="min-w-[100px]" />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Account) => (
        <Badge variant={statusBadge[row.status] ?? 'default'} dot>{row.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: () => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" icon="open_in_new">View</Button>
          <Button variant="ghost" size="sm" icon="more_vert" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>Account Management</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--neu-text-muted)' }}>{accounts.length} total accounts across all segments</p>
        </div>
        <Button variant="primary" icon="person_add">New Account</Button>
      </div>

      {/* Search + Filter Tabs */}
      <Card elevation="sm" className="animate-fade-up stagger-1">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
          <div className="flex-1">
            <Input
              id="account-search"
              placeholder="Search by company name or industry..."
              icon="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {segments.map((s) => (
              <Button
                key={s}
                variant={segment === s ? 'primary' : 'secondary'}
                size="sm"
                icon={segmentIcons[s]}
                onClick={() => setSegment(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Summary Badges */}
      <div className="flex items-center gap-3 animate-fade-up stagger-2">
        <Badge variant="success" dot>{filtered.filter((a) => a.status === 'Active').length} Active</Badge>
        <Badge variant="warning" dot>{filtered.filter((a) => a.status === 'Trial').length} Trial</Badge>
        <Badge variant="error" dot>{filtered.filter((a) => a.status === 'Churned').length} Churned</Badge>
        <span className="text-[11px] font-semibold ml-auto" style={{ color: 'var(--neu-text-muted)' }}>
          Showing {filtered.length} of {accounts.length}
        </span>
      </div>

      {/* Data Table */}
      <div className="animate-fade-up stagger-3">
        <DataTable<Account>
          columns={columns}
          data={filtered}
          onRowClick={() => {}}
          emptyMessage="No accounts match your filters"
          emptyIcon="search_off"
        />
      </div>
    </div>
  );
}
