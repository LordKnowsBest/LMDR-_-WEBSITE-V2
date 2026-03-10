'use client';

import { useState, useCallback } from 'react';
import { Card, Button, Badge, ProgressBar } from '@/components/ui';
import { matchingApi } from '@/lib/api';
import { useApi } from '@/lib/hooks';

/* ── Constants ── */
const DEMO_DRIVER_ID = 'demo-driver-001';

/* ── Types ── */
interface ScoreBreakdown { safety: number; pay: number; culture: number; location: number; }
interface MatchResult {
  id: string; carrier: string; score: number; breakdown: ScoreBreakdown;
  location: string; payRange: string; truckType: string;
  benefits: string[]; description: string;
}
interface Application {
  id: string; carrier: string; appliedDate: string;
  status: 'Under Review' | 'Interview' | 'Offered' | 'Declined';
}

/* ── Mock Fallback Data ── */
const cdlClasses = ['A', 'B', 'C'] as const;
const expRanges = ['0-1 yr', '2-4 yr', '5-9 yr', '10+ yr'] as const;
const radiusOptions = ['25 mi', '50 mi', '100 mi', '250 mi', 'Nationwide'] as const;

const mockMatches: MatchResult[] = [
  { id: '1', carrier: 'Swift Transportation', score: 94, breakdown: { safety: 96, pay: 91, culture: 93, location: 97 }, location: 'Phoenix, AZ', payRange: '$0.62 - $0.68/mi', truckType: 'Dry Van', benefits: ['Health Insurance', '401k Match', 'Paid Training', 'Home Weekly'], description: 'OTR lanes with dedicated routes available.' },
  { id: '2', carrier: 'Werner Enterprises', score: 89, breakdown: { safety: 92, pay: 88, culture: 85, location: 90 }, location: 'Omaha, NE', payRange: '$0.58 - $0.64/mi', truckType: 'Reefer', benefits: ['Health Insurance', 'Tuition Reimbursement', 'Sign-On Bonus'], description: 'Regional reefer runs, home every weekend.' },
  { id: '3', carrier: 'Schneider National', score: 85, breakdown: { safety: 90, pay: 82, culture: 87, location: 80 }, location: 'Green Bay, WI', payRange: '$0.60 - $0.66/mi', truckType: 'Intermodal', benefits: ['Health Insurance', '401k', 'Paid Vacation', 'Pet Policy'], description: 'Intermodal & dedicated, great equipment.' },
  { id: '4', carrier: 'J.B. Hunt Transport', score: 82, breakdown: { safety: 88, pay: 79, culture: 80, location: 81 }, location: 'Lowell, AR', payRange: '$0.56 - $0.62/mi', truckType: 'Dry Van', benefits: ['Health Insurance', 'Stock Purchase', 'Home Time'], description: 'Dedicated contract lanes, consistent freight.' },
  { id: '5', carrier: 'Old Dominion Freight', score: 78, breakdown: { safety: 85, pay: 76, culture: 74, location: 77 }, location: 'Thomasville, NC', payRange: '$0.54 - $0.60/mi', truckType: 'LTL', benefits: ['Health Insurance', 'Pension', 'Overtime Pay'], description: 'LTL regional routes, excellent work-life balance.' },
  { id: '6', carrier: 'Heartland Express', score: 74, breakdown: { safety: 80, pay: 70, culture: 72, location: 73 }, location: 'North Liberty, IA', payRange: '$0.52 - $0.58/mi', truckType: 'Dry Van', benefits: ['Health Insurance', 'Rider Program', 'Direct Deposit'], description: 'Short-haul OTR, newer equipment fleet.' },
];

const mockApplications: Application[] = [
  { id: 'a1', carrier: 'Swift Transportation', appliedDate: 'Mar 2, 2026', status: 'Interview' },
  { id: 'a2', carrier: 'Werner Enterprises', appliedDate: 'Feb 28, 2026', status: 'Under Review' },
  { id: 'a3', carrier: 'Schneider National', appliedDate: 'Feb 20, 2026', status: 'Offered' },
];

const appStatusVariant: Record<Application['status'], 'info' | 'warning' | 'success' | 'error'> = {
  'Under Review': 'warning', Interview: 'info', Offered: 'success', Declined: 'error',
};

/* ── Helpers ── */
function scoreColor(s: number) {
  if (s >= 90) return 'text-green-600';
  if (s >= 80) return 'text-blue-600';
  if (s >= 70) return 'text-amber-600';
  return 'text-red-500';
}
function scoreBadge(s: number): 'success' | 'info' | 'warning' | 'error' {
  if (s >= 90) return 'success';
  if (s >= 80) return 'info';
  if (s >= 70) return 'warning';
  return 'error';
}
function scoreBarColor(s: number): 'green' | 'blue' | 'amber' | 'red' {
  if (s >= 90) return 'green';
  if (s >= 80) return 'blue';
  if (s >= 70) return 'amber';
  return 'red';
}

export default function DriverMatchesPage() {
  const [selectedCdl, setSelectedCdl] = useState<string>('A');
  const [selectedExp, setSelectedExp] = useState<string>('5-9 yr');
  const [selectedRadius, setSelectedRadius] = useState<string>('100 mi');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  /* ── Build filter object from UI state ── */
  const filters = { cdlClass: selectedCdl, experience: selectedExp, radius: selectedRadius };

  /* ── API Data ── */
  const fetcher = useCallback(
    () => matchingApi.findJobsForDriver(DEMO_DRIVER_ID, filters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedCdl, selectedExp, selectedRadius]
  );
  const { data: matchData, loading, error, refresh } = useApi<Record<string, unknown>>(
    fetcher,
    [selectedCdl, selectedExp, selectedRadius]
  );

  /* ── Derive display values (API data with mock fallback) ── */
  const matches: MatchResult[] = matchData?.matches
    ? (matchData.matches as MatchResult[])
    : mockMatches;

  const applications: Application[] = matchData?.applications
    ? (matchData.applications as Application[])
    : mockApplications;

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>AI Job Matches</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--neu-text-muted)' }}>
            {loading ? 'Searching...' : `${matches.length} carriers matched to your profile`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon="refresh" onClick={refresh}>Refresh</Button>
          <Button icon="auto_awesome" onClick={refresh}>Run New Match</Button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <Card elevation="xs" className="!bg-red-50 dark:!bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500">warning</span>
              <p className="text-sm text-red-700 dark:text-red-300">
                Failed to load matches from server. Showing cached results.
              </p>
            </div>
            <Button variant="ghost" size="sm" icon="refresh" onClick={refresh}>Retry</Button>
          </div>
        </Card>
      )}

      {/* ── Filter Section ── */}
      <Card elevation="sm" className="animate-fade-up stagger-1">
        <div className="space-y-4">
          {/* CDL Class Pills */}
          <div>
            <p className="kpi-label mb-2">CDL Class</p>
            <div className="flex gap-2">
              {cdlClasses.map(cls => (
                <button
                  key={cls}
                  onClick={() => setSelectedCdl(cls)}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                    selectedCdl === cls
                      ? 'btn-glow text-white'
                      : 'neu-x'
                  }`}
                  style={selectedCdl !== cls ? { color: 'var(--neu-text)' } : undefined}
                >
                  Class {cls}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Experience Range */}
            <div>
              <p className="kpi-label mb-2">Experience</p>
              <div className="flex flex-wrap gap-2">
                {expRanges.map(exp => (
                  <button
                    key={exp}
                    onClick={() => setSelectedExp(exp)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                      selectedExp === exp
                        ? 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300'
                        : 'neu-x'
                    }`}
                    style={selectedExp !== exp ? { color: 'var(--neu-text-muted)' } : undefined}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Radius */}
            <div>
              <p className="kpi-label mb-2">Location Radius</p>
              <div className="flex flex-wrap gap-2">
                {radiusOptions.map(r => (
                  <button
                    key={r}
                    onClick={() => setSelectedRadius(r)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                      selectedRadius === r
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300'
                        : 'neu-x'
                    }`}
                    style={selectedRadius !== r ? { color: 'var(--neu-text-muted)' } : undefined}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Loading Skeleton ── */}
      {loading && !matchData && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} elevation="sm" className="animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[var(--neu-border)]" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-48 rounded bg-[var(--neu-border)]" />
                  <div className="h-4 w-72 rounded bg-[var(--neu-border)]" />
                  <div className="h-3 w-64 rounded bg-[var(--neu-border)]" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Match Result Cards ── */}
      {(!loading || matchData) && (
        <div className="space-y-4">
          {matches.map((match, i) => (
            <Card
              key={match.id}
              elevation="sm"
              hover
              className={`animate-fade-up stagger-${Math.min(i + 2, 8)}`}
              onClick={() => setExpandedCard(expandedCard === match.id ? null : match.id)}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                {/* Left: Info */}
                <div className="flex items-start gap-4 flex-1">
                  {/* Large Score Circle */}
                  <div className="neu-ins w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0">
                    <span className={`text-2xl font-black leading-none ${scoreColor(match.score)}`}>{match.score}</span>
                    <span className="text-[9px] font-bold" style={{ color: 'var(--neu-text-muted)' }}>MATCH</span>
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold" style={{ color: 'var(--neu-text)' }}>{match.carrier}</h3>
                      <Badge variant={scoreBadge(match.score)} dot>{match.score}% Match</Badge>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>{match.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="flex items-center gap-1" style={{ color: 'var(--neu-text)' }}>
                        <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-accent)' }}>location_on</span>
                        {match.location}
                      </span>
                      <span className="flex items-center gap-1" style={{ color: 'var(--neu-text)' }}>
                        <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-accent)' }}>payments</span>
                        {match.payRange}
                      </span>
                      <span className="flex items-center gap-1" style={{ color: 'var(--neu-text)' }}>
                        <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-accent)' }}>local_shipping</span>
                        {match.truckType}
                      </span>
                    </div>
                    {/* Benefits */}
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {match.benefits.map(b => (
                        <Badge key={b} variant="accent" icon="check_circle">{b}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex gap-2 shrink-0 self-start">
                  <Button variant="ghost" size="sm" icon="info">Details</Button>
                  <Button size="sm" icon="send">Apply</Button>
                </div>
              </div>

              {/* ── Score Breakdown (expanded) ── */}
              {expandedCard === match.id && (
                <div className="mt-5 pt-5 border-t" style={{ borderColor: 'var(--neu-border)' }}>
                  <p className="kpi-label mb-3">Score Breakdown</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {([
                      { key: 'safety', label: 'Safety', icon: 'shield' },
                      { key: 'pay', label: 'Pay', icon: 'payments' },
                      { key: 'culture', label: 'Culture', icon: 'groups' },
                      { key: 'location', label: 'Location', icon: 'location_on' },
                    ] as const).map(item => {
                      const val = match.breakdown[item.key];
                      return (
                        <div key={item.key} className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-accent)' }}>{item.icon}</span>
                            <span className="text-xs font-bold" style={{ color: 'var(--neu-text)' }}>{item.label}</span>
                            <span className={`text-xs font-black ml-auto ${scoreColor(val)}`}>{val}</span>
                          </div>
                          <ProgressBar value={val} color={scoreBarColor(val)} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* ── My Applications ── */}
      <Card className="animate-fade-up stagger-8">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold" style={{ color: 'var(--neu-text)' }}>My Applications</h3>
          <Badge variant="accent">{applications.length} Active</Badge>
        </div>
        <div className="space-y-3">
          {applications.map(app => (
            <Card key={app.id} elevation="xs" className="!p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="neu-x w-10 h-10 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--neu-accent)' }}>business</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>{app.carrier}</p>
                    <p className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>Applied {app.appliedDate}</p>
                  </div>
                </div>
                <Badge variant={appStatusVariant[app.status]} dot>{app.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
