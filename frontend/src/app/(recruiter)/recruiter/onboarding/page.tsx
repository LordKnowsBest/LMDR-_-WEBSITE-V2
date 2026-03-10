'use client';

import { useState } from 'react';
import { Card, Badge, Button, DataTable, ProgressBar, KpiCard } from '@/components/ui';

/* ── Types ────────────────────────────────────────────────────── */
type Stage = 'Document Collection' | 'Background Check' | 'Drug Test' | 'Orientation' | 'Complete';
type FilterKey = 'all' | 'in_progress' | 'pending_docs' | 'complete';

interface OnboardingRow {
  id: string;
  name: string;
  carrier: string;
  stage: Stage;
  progress: number;
  docsStatus: string;
  docsComplete: boolean;
  startDate: string;
}

/* ── Stage Config ─────────────────────────────────────────────── */
const stageConfig: Record<Stage, { variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent'; icon: string }> = {
  'Document Collection': { variant: 'warning', icon: 'upload_file' },
  'Background Check': { variant: 'info', icon: 'shield' },
  'Drug Test': { variant: 'accent', icon: 'science' },
  'Orientation': { variant: 'default', icon: 'school' },
  'Complete': { variant: 'success', icon: 'check_circle' },
};

/* ── Mock Data (8 rows) ──────────────────────────────────────── */
const mockData: OnboardingRow[] = [
  { id: 'o1', name: 'Marcus Johnson', carrier: 'Werner Enterprises', stage: 'Background Check', progress: 62, docsStatus: '6/7 uploaded', docsComplete: false, startDate: 'Feb 28, 2026' },
  { id: 'o2', name: 'Sarah Chen', carrier: 'Schneider National', stage: 'Document Collection', progress: 30, docsStatus: '3/7 uploaded', docsComplete: false, startDate: 'Mar 02, 2026' },
  { id: 'o3', name: 'Aisha Mohammed', carrier: 'JB Hunt', stage: 'Drug Test', progress: 75, docsStatus: 'Complete', docsComplete: true, startDate: 'Feb 20, 2026' },
  { id: 'o4', name: 'James O\'Brien', carrier: 'Old Dominion', stage: 'Orientation', progress: 90, docsStatus: 'Complete', docsComplete: true, startDate: 'Feb 15, 2026' },
  { id: 'o5', name: 'Priya Patel', carrier: 'FedEx Freight', stage: 'Document Collection', progress: 18, docsStatus: '1/7 uploaded', docsComplete: false, startDate: 'Mar 05, 2026' },
  { id: 'o6', name: 'Carlos Martinez', carrier: 'XPO Logistics', stage: 'Complete', progress: 100, docsStatus: 'Complete', docsComplete: true, startDate: 'Jan 28, 2026' },
  { id: 'o7', name: 'Tamika Lewis', carrier: 'Heartland Express', stage: 'Background Check', progress: 55, docsStatus: 'Complete', docsComplete: true, startDate: 'Feb 25, 2026' },
  { id: 'o8', name: 'David Nguyen', carrier: 'Werner Enterprises', stage: 'Complete', progress: 100, docsStatus: 'Complete', docsComplete: true, startDate: 'Jan 20, 2026' },
];

/* ── Filter Tabs ──────────────────────────────────────────────── */
const filterTabs: { key: FilterKey; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'groups' },
  { key: 'in_progress', label: 'In Progress', icon: 'pending' },
  { key: 'pending_docs', label: 'Pending Docs', icon: 'upload_file' },
  { key: 'complete', label: 'Complete', icon: 'check_circle' },
];

function filterRows(rows: OnboardingRow[], filter: FilterKey): OnboardingRow[] {
  if (filter === 'all') return rows;
  if (filter === 'complete') return rows.filter((r) => r.stage === 'Complete');
  if (filter === 'pending_docs') return rows.filter((r) => !r.docsComplete);
  // in_progress = everything not complete
  return rows.filter((r) => r.stage !== 'Complete');
}

/* ── Progress Color ───────────────────────────────────────────── */
function progressColor(pct: number): 'green' | 'blue' | 'amber' | 'red' {
  if (pct >= 90) return 'green';
  if (pct >= 60) return 'blue';
  if (pct >= 30) return 'amber';
  return 'red';
}

export default function OnboardingDashboardPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const filtered = filterRows(mockData, activeFilter);

  const countByStage = (stage: Stage) => mockData.filter((r) => r.stage === stage).length;
  const countInProgress = mockData.filter((r) => r.stage !== 'Complete').length;
  const pendingDocs = mockData.filter((r) => !r.docsComplete).length;
  const avgProgress = Math.round(mockData.reduce((s, r) => s + r.progress, 0) / mockData.length);

  /* ── Table Columns ─────────────────────────────────────────── */
  const columns = [
    {
      key: 'name',
      header: 'Driver',
      render: (row: OnboardingRow) => (
        <div className="flex items-center gap-2.5">
          <div className="neu-x w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-accent)' }}>person</span>
          </div>
          <div>
            <span className="text-[13px] font-bold block" style={{ color: 'var(--neu-text)' }}>{row.name}</span>
            <span className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>{row.carrier}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Stage',
      render: (row: OnboardingRow) => {
        const cfg = stageConfig[row.stage];
        return <Badge variant={cfg.variant} icon={cfg.icon}>{row.stage}</Badge>;
      },
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (row: OnboardingRow) => (
        <div className="w-28">
          <ProgressBar value={row.progress} color={progressColor(row.progress)} showValue />
        </div>
      ),
    },
    {
      key: 'docsStatus',
      header: 'Docs Status',
      render: (row: OnboardingRow) => (
        <div className="flex items-center gap-1.5">
          <span
            className="material-symbols-outlined text-[16px]"
            style={{ color: row.docsComplete ? 'var(--neu-accent)' : undefined }}
          >
            {row.docsComplete ? 'check_circle' : 'warning'}
          </span>
          <span className={`text-[12px] font-medium ${row.docsComplete ? '' : 'text-amber-600'}`} style={row.docsComplete ? { color: 'var(--neu-text)' } : undefined}>
            {row.docsStatus}
          </span>
        </div>
      ),
    },
    {
      key: 'startDate',
      header: 'Start Date',
      render: (row: OnboardingRow) => (
        <span className="text-[12px]" style={{ color: 'var(--neu-text-muted)' }}>{row.startDate}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row: OnboardingRow) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" icon="visibility" />
          <Button variant="ghost" size="sm" icon="mail" />
          {!row.docsComplete && <Button variant="secondary" size="sm" icon="notification_important" />}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>Onboarding Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>Track driver onboarding progress and documentation</p>
        </div>
        <Button size="sm" icon="person_add">New Onboarding</Button>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard label="Total Onboarding" value={String(mockData.length)} icon="groups" trend={`${countInProgress} in progress`} trendUp className="stagger-1" />
        <KpiCard label="Pending Documents" value={String(pendingDocs)} icon="upload_file" trend={`${mockData.length - pendingDocs} complete`} trendUp className="stagger-2" />
        <KpiCard label="Avg Progress" value={`${avgProgress}%`} icon="speed" trend="+8% this week" trendUp className="stagger-3" />
        <KpiCard label="Completed" value={String(countByStage('Complete'))} icon="check_circle" trend="+1 this week" trendUp className="stagger-4" />
      </div>

      {/* ── Stage Summary Chips ────────────────────────────────── */}
      <Card elevation="xs" className="!p-3 animate-fade-up stagger-2">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="kpi-label">Stages:</span>
          {(Object.keys(stageConfig) as Stage[]).map((stage) => {
            const cfg = stageConfig[stage];
            const count = countByStage(stage);
            return (
              <Badge key={stage} variant={cfg.variant} icon={cfg.icon}>
                {stage} ({count})
              </Badge>
            );
          })}
        </div>
      </Card>

      {/* ── Filter Tabs ────────────────────────────────────────── */}
      <div className="flex gap-2 animate-fade-up stagger-3">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold tracking-wide transition-all duration-200 ${
              activeFilter === tab.key
                ? 'btn-glow text-white'
                : 'neu-s hover:translate-y-[-1px]'
            }`}
            style={activeFilter !== tab.key ? { color: 'var(--neu-text)' } : undefined}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Data Table ─────────────────────────────────────────── */}
      <div className="animate-fade-up stagger-4">
        <DataTable<OnboardingRow>
          columns={columns}
          data={filtered}
          emptyMessage="No onboarding records match this filter."
          emptyIcon="school"
        />
      </div>
    </div>
  );
}
