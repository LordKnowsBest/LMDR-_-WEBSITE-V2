'use client';

import { useState } from 'react';
import { Card, Badge, Button, DataTable } from '@/components/ui';

type OnboardingStatus = 'documents_needed' | 'in_review' | 'background_check' | 'complete';

interface OnboardingDriver {
  id: string;
  name: string;
  currentStep: number;
  stepLabel: string;
  progress: number;
  requiredDocs: string;
  lastUpdated: string;
  status: OnboardingStatus;
}

const STEPS = [
  'Application',
  'CDL Verification',
  'Document Upload',
  'Background Check',
  'Drug Screen',
  'Orientation',
  'Placement',
];

const mockOnboarding: OnboardingDriver[] = [
  { id: 'o1', name: 'Marcus Johnson', currentStep: 4, stepLabel: 'Background Check', progress: 57, requiredDocs: '1 missing', lastUpdated: '2 hrs ago', status: 'background_check' },
  { id: 'o2', name: 'Sarah Chen', currentStep: 3, stepLabel: 'Document Upload', progress: 42, requiredDocs: '3 missing', lastUpdated: '1 day ago', status: 'documents_needed' },
  { id: 'o3', name: 'Aisha Mohammed', currentStep: 5, stepLabel: 'Drug Screen', progress: 71, requiredDocs: 'Complete', lastUpdated: '3 hrs ago', status: 'in_review' },
  { id: 'o4', name: 'James O\'Brien', currentStep: 6, stepLabel: 'Orientation', progress: 85, requiredDocs: 'Complete', lastUpdated: '5 hrs ago', status: 'in_review' },
  { id: 'o5', name: 'Priya Patel', currentStep: 2, stepLabel: 'CDL Verification', progress: 28, requiredDocs: '2 missing', lastUpdated: '2 days ago', status: 'documents_needed' },
  { id: 'o6', name: 'Carlos Martinez', currentStep: 7, stepLabel: 'Placement', progress: 100, requiredDocs: 'Complete', lastUpdated: '1 hr ago', status: 'complete' },
  { id: 'o7', name: 'Tamika Lewis', currentStep: 4, stepLabel: 'Background Check', progress: 57, requiredDocs: 'Complete', lastUpdated: '6 hrs ago', status: 'background_check' },
];

const statusConfig: Record<OnboardingStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  documents_needed: { label: 'Docs Needed', variant: 'warning' },
  in_review: { label: 'In Review', variant: 'info' },
  background_check: { label: 'BG Check', variant: 'default' },
  complete: { label: 'Complete', variant: 'success' },
};

const filterTabs = [
  { key: 'all', label: 'All', icon: 'groups' },
  { key: 'documents_needed', label: 'Documents Needed', icon: 'upload_file' },
  { key: 'in_review', label: 'In Review', icon: 'pending' },
  { key: 'background_check', label: 'Background Check', icon: 'shield' },
] as const;

function MiniProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${
            i < step ? 'bg-lmdr-blue' : 'bg-tan/20'
          }`}
        />
      ))}
    </div>
  );
}

export default function OnboardingDashboardPage() {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filtered = activeFilter === 'all'
    ? mockOnboarding
    : mockOnboarding.filter((d) => d.status === activeFilter);

  const columns = [
    {
      key: 'name',
      header: 'Driver Name',
      render: (row: OnboardingDriver) => (
        <span className="font-medium text-lmdr-dark">{row.name}</span>
      ),
    },
    {
      key: 'stepLabel',
      header: 'Current Step',
      render: (row: OnboardingDriver) => (
        <div className="flex items-center gap-2">
          <span className="text-xs text-tan">Step {row.currentStep}/7</span>
          <span className="text-sm text-lmdr-dark">{row.stepLabel}</span>
        </div>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (row: OnboardingDriver) => (
        <div className="w-32 space-y-1">
          <MiniProgressBar step={row.currentStep} total={STEPS.length} />
          <span className="text-xs text-tan">{row.progress}%</span>
        </div>
      ),
    },
    {
      key: 'requiredDocs',
      header: 'Required Docs',
      render: (row: OnboardingDriver) => (
        <span className={row.requiredDocs === 'Complete' ? 'text-sg text-sm' : 'text-status-pending text-sm'}>
          {row.requiredDocs}
        </span>
      ),
    },
    {
      key: 'lastUpdated',
      header: 'Last Updated',
      render: (row: OnboardingDriver) => (
        <span className="text-sm text-tan">{row.lastUpdated}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: OnboardingDriver) => {
        const cfg = statusConfig[row.status];
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      key: 'action',
      header: '',
      render: (row: OnboardingDriver) => (
        <Button variant="ghost" size="sm">
          <span className="material-symbols-outlined text-base">open_in_new</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card elevation="sm" className="!p-4">
          <p className="text-xs text-tan uppercase tracking-wide">Total In Onboarding</p>
          <p className="text-2xl font-bold text-lmdr-dark mt-1">{mockOnboarding.length}</p>
        </Card>
        <Card elevation="sm" className="!p-4">
          <p className="text-xs text-tan uppercase tracking-wide">Docs Needed</p>
          <p className="text-2xl font-bold text-status-pending mt-1">
            {mockOnboarding.filter((d) => d.status === 'documents_needed').length}
          </p>
        </Card>
        <Card elevation="sm" className="!p-4">
          <p className="text-xs text-tan uppercase tracking-wide">In Review</p>
          <p className="text-2xl font-bold text-lmdr-blue mt-1">
            {mockOnboarding.filter((d) => d.status === 'in_review').length}
          </p>
        </Card>
        <Card elevation="sm" className="!p-4">
          <p className="text-xs text-tan uppercase tracking-wide">Completed</p>
          <p className="text-2xl font-bold text-sg mt-1">
            {mockOnboarding.filter((d) => d.status === 'complete').length}
          </p>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeFilter === tab.key
                ? 'bg-lmdr-blue text-white shadow-md'
                : 'bg-beige text-tan shadow-[3px_3px_6px_#C8B896,-3px_-3px_6px_#FFFFF5] hover:bg-beige-d'
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Onboarding Table */}
      <DataTable<OnboardingDriver> columns={columns} data={filtered} emptyMessage="No drivers match this filter." />
    </div>
  );
}
