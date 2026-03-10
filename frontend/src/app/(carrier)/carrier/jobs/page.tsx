'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';

interface Job {
  [key: string]: unknown;
  id: string;
  title: string;
  freightType: string;
  route: string;
  payRange: string;
  applications: number;
  status: 'active' | 'filled' | 'closed';
}

const jobs: Job[] = [
  { id: 'J-1001', title: 'OTR Dry Van Driver', freightType: 'Dry Van', route: 'Dallas → Atlanta', payRange: '$0.62–$0.68/mi', applications: 14, status: 'active' },
  { id: 'J-1002', title: 'Regional Reefer Driver', freightType: 'Refrigerated', route: 'Southeast Regional', payRange: '$1,450–$1,650/wk', applications: 8, status: 'active' },
  { id: 'J-1003', title: 'Local Flatbed Driver', freightType: 'Flatbed', route: 'Houston Metro', payRange: '$26–$30/hr', applications: 5, status: 'active' },
  { id: 'J-1004', title: 'Tanker Hazmat Driver', freightType: 'Tanker', route: 'Gulf Coast', payRange: '$0.72–$0.80/mi', applications: 3, status: 'active' },
  { id: 'J-1005', title: 'OTR Team Driver', freightType: 'Dry Van', route: 'Nationwide', payRange: '$0.70–$0.75/mi', applications: 22, status: 'filled' },
  { id: 'J-1006', title: 'Dedicated Route Driver', freightType: 'Dry Van', route: 'Chicago → Detroit', payRange: '$1,200/wk', applications: 11, status: 'closed' },
];

const statusVariant: Record<string, 'success' | 'info' | 'default'> = {
  active: 'success',
  filled: 'info',
  closed: 'default',
};

const columns = [
  { key: 'id', header: 'Job ID', className: 'w-24' },
  { key: 'title', header: 'Title' },
  { key: 'freightType', header: 'Freight Type' },
  { key: 'route', header: 'Route' },
  { key: 'payRange', header: 'Pay Range' },
  {
    key: 'applications',
    header: 'Applications',
    render: (row: Job) => (
      <span className="font-semibold text-lmdr-dark">{row.applications}</span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row: Job) => (
      <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
    ),
  },
];

export default function CarrierJobsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-lmdr-dark">Job Board Management</h2>
        <Button variant="primary">
          <span className="material-symbols-outlined text-lg mr-1.5">add</span>
          Post New Job
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Jobs', value: jobs.filter((j) => j.status === 'active').length, icon: 'work' },
          { label: 'Total Applications', value: jobs.reduce((s, j) => s + j.applications, 0), icon: 'description' },
          { label: 'Filled This Month', value: jobs.filter((j) => j.status === 'filled').length, icon: 'check_circle' },
        ].map((s) => (
          <Card key={s.label} elevation="sm" className="flex items-center gap-3">
            <span className="material-symbols-outlined text-xl text-lmdr-blue">{s.icon}</span>
            <div>
              <p className="text-xs text-tan">{s.label}</p>
              <p className="text-lg font-bold text-lmdr-dark">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Job Table */}
      <DataTable<Job>
        columns={columns}
        data={jobs}
        onRowClick={(row) => setExpandedId(expandedId === row.id ? null : row.id)}
      />

      {/* Expanded Detail */}
      {expandedId && (
        <Card elevation="sm" className="border-l-4 border-lmdr-blue">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-lmdr-dark">
              {jobs.find((j) => j.id === expandedId)?.title}
            </h4>
            <button onClick={() => setExpandedId(null)} className="text-tan hover:text-lmdr-dark">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-tan">Freight Type</p>
              <p className="text-lmdr-dark font-medium">{jobs.find((j) => j.id === expandedId)?.freightType}</p>
            </div>
            <div>
              <p className="text-tan">Route</p>
              <p className="text-lmdr-dark font-medium">{jobs.find((j) => j.id === expandedId)?.route}</p>
            </div>
            <div>
              <p className="text-tan">Pay Range</p>
              <p className="text-lmdr-dark font-medium">{jobs.find((j) => j.id === expandedId)?.payRange}</p>
            </div>
            <div>
              <p className="text-tan">Applications</p>
              <p className="text-lmdr-dark font-medium">{jobs.find((j) => j.id === expandedId)?.applications}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
