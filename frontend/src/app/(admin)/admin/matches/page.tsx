'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';

type MatchStatus = 'pending' | 'accepted' | 'rejected';

interface Match {
  [key: string]: unknown;
  id: string;
  driverName: string;
  carrierName: string;
  score: number;
  status: MatchStatus;
  date: string;
}

const statusVariant: Record<MatchStatus, 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'error',
};

const placeholderMatches: Match[] = [
  { id: '1', driverName: 'Marcus Johnson', carrierName: 'FastFreight Inc', score: 94, status: 'accepted', date: '2026-03-09' },
  { id: '2', driverName: 'Sarah Chen', carrierName: 'Summit Carriers', score: 91, status: 'pending', date: '2026-03-09' },
  { id: '3', driverName: 'Kevin Brown', carrierName: 'Pacific Route LLC', score: 88, status: 'accepted', date: '2026-03-08' },
  { id: '4', driverName: 'Maria Garcia', carrierName: 'TransPro Logistics', score: 85, status: 'pending', date: '2026-03-08' },
  { id: '5', driverName: 'James Wilson', carrierName: 'Eagle Transport', score: 72, status: 'rejected', date: '2026-03-07' },
  { id: '6', driverName: 'Linda Thompson', carrierName: 'Horizon Trucking', score: 67, status: 'rejected', date: '2026-03-07' },
  { id: '7', driverName: 'Ashley Martinez', carrierName: 'Midwest Haulers', score: 79, status: 'pending', date: '2026-03-06' },
  { id: '8', driverName: 'Robert Davis', carrierName: 'Delta Freight Co', score: 83, status: 'accepted', date: '2026-03-06' },
];

const statusFilters = ['All', 'Pending', 'Accepted', 'Rejected'] as const;
const scoreRanges = ['All Scores', '90+', '80-89', '70-79', '<70'] as const;

function scoreInRange(score: number, range: string): boolean {
  if (range === 'All Scores') return true;
  if (range === '90+') return score >= 90;
  if (range === '80-89') return score >= 80 && score <= 89;
  if (range === '70-79') return score >= 70 && score <= 79;
  return score < 70;
}

export default function AdminMatchesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [scoreFilter, setScoreFilter] = useState<string>('All Scores');

  const filtered = placeholderMatches.filter((m) => {
    const matchesStatus = statusFilter === 'All' || m.status === statusFilter.toLowerCase();
    const matchesScore = scoreInRange(m.score, scoreFilter);
    return matchesStatus && matchesScore;
  });

  const columns = [
    {
      key: 'pair',
      header: 'Match Pair',
      render: (row: Match) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-lmdr-dark">{row.driverName}</span>
          <span className="material-symbols-outlined text-sm text-tan">sync_alt</span>
          <span className="font-medium text-lmdr-dark">{row.carrierName}</span>
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      className: 'w-24 text-center',
      render: (row: Match) => (
        <span className={`font-bold ${row.score >= 85 ? 'text-sg' : row.score >= 70 ? 'text-status-pending' : 'text-status-suspended'}`}>
          {row.score}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-28',
      render: (row: Match) => <Badge variant={statusVariant[row.status]}>{row.status}</Badge>,
    },
    { key: 'date', header: 'Date', className: 'w-32' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-lmdr-dark">Match Management</h2>

      <Card elevation="sm" className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex gap-2">
          {statusFilters.map((f) => (
            <Button
              key={f}
              variant={statusFilter === f ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
        <div className="h-6 w-px bg-tan/20 hidden sm:block" />
        <div className="flex gap-2">
          {scoreRanges.map((r) => (
            <Button
              key={r}
              variant={scoreFilter === r ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setScoreFilter(r)}
            >
              {r}
            </Button>
          ))}
        </div>
      </Card>

      <DataTable columns={columns} data={filtered} emptyMessage="No matches found for the selected filters" />
    </div>
  );
}
