'use client';

import { useState } from 'react';
import { Card, Badge, Button, Input } from '@/components/ui';

/* ── Types ────────────────────────────────────────────────────── */
interface Driver {
  id: string;
  name: string;
  cdlClass: 'A' | 'B';
  experience: number;
  homeState: string;
  freightType: string;
  matchScore: number;
  endorsements: string[];
  available: boolean;
}

/* ── Mock Data ────────────────────────────────────────────────── */
const mockDrivers: Driver[] = [
  { id: 'd1', name: 'Marcus Johnson', cdlClass: 'A', experience: 8, homeState: 'TX', freightType: 'OTR Dry Van', matchScore: 94, endorsements: ['Hazmat', 'Tanker'], available: true },
  { id: 'd2', name: 'Sarah Chen', cdlClass: 'A', experience: 5, homeState: 'CA', freightType: 'Regional Reefer', matchScore: 88, endorsements: ['Doubles/Triples'], available: true },
  { id: 'd3', name: 'Robert Williams', cdlClass: 'A', experience: 12, homeState: 'OH', freightType: 'OTR Flatbed', matchScore: 91, endorsements: ['Hazmat', 'Tanker', 'Doubles/Triples'], available: false },
  { id: 'd4', name: 'Priya Patel', cdlClass: 'B', experience: 3, homeState: 'GA', freightType: 'Local Delivery', matchScore: 76, endorsements: [], available: true },
  { id: 'd5', name: 'James O\'Brien', cdlClass: 'A', experience: 6, homeState: 'IL', freightType: 'Dedicated Dry Van', matchScore: 85, endorsements: ['Hazmat'], available: true },
  { id: 'd6', name: 'Aisha Mohammed', cdlClass: 'A', experience: 4, homeState: 'FL', freightType: 'Regional Reefer', matchScore: 82, endorsements: ['Tanker'], available: true },
];

/* ── Filter Orb Definitions ───────────────────────────────────── */
const cdlFilters = [
  { key: 'all', label: 'All CDL', icon: 'badge' },
  { key: 'A', label: 'Class A', icon: 'local_shipping' },
  { key: 'B', label: 'Class B', icon: 'fire_truck' },
];

const expFilters = [
  { key: 'all', label: 'Any Exp', icon: 'work_history' },
  { key: '1-3', label: '1-3 yr', icon: 'trending_up' },
  { key: '3-5', label: '3-5 yr', icon: 'show_chart' },
  { key: '5+', label: '5+ yr', icon: 'military_tech' },
];

const sortOptions = [
  { key: 'score', label: 'Match Score' },
  { key: 'experience', label: 'Experience' },
  { key: 'name', label: 'Name' },
];

/* ── Helpers ──────────────────────────────────────────────────── */
function getScoreColor(score: number): string {
  if (score >= 90) return 'bg-green-500';
  if (score >= 80) return 'bg-blue-500';
  if (score >= 70) return 'bg-amber-500';
  return 'bg-red-400';
}

function getScoreVariant(score: number) {
  if (score >= 90) return 'success' as const;
  if (score >= 80) return 'info' as const;
  if (score >= 70) return 'warning' as const;
  return 'error' as const;
}

function matchesExpFilter(exp: number, filter: string): boolean {
  if (filter === 'all') return true;
  if (filter === '1-3') return exp >= 1 && exp <= 3;
  if (filter === '3-5') return exp > 3 && exp <= 5;
  if (filter === '5+') return exp > 5;
  return true;
}

export default function CandidateSearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cdlFilter, setCdlFilter] = useState('all');
  const [expFilter, setExpFilter] = useState('all');
  const [sortBy, setSortBy] = useState('score');

  const filtered = mockDrivers
    .filter((d) => {
      if (searchTerm && !d.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (cdlFilter !== 'all' && d.cdlClass !== cdlFilter) return false;
      if (!matchesExpFilter(d.experience, expFilter)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.matchScore - a.matchScore;
      if (sortBy === 'experience') return b.experience - a.experience;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>Candidate Search</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>Find and match CDL drivers to open positions</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="kpi-label mr-1">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="neu-in rounded-xl px-3 py-2 text-[13px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neu-accent)]/30"
            style={{ color: 'var(--neu-text)', background: 'transparent' }}
          >
            {sortOptions.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Search Bar ─────────────────────────────────────────── */}
      <Card elevation="sm" className="animate-fade-up">
        <Input
          icon="search"
          placeholder="Search candidates by name, state, or freight type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Card>

      {/* ── Filter Orbs ────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* CDL Class */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="kpi-label mr-1">CDL Class</span>
          {cdlFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setCdlFilter(f.key)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-bold tracking-wide transition-all duration-200 ${
                cdlFilter === f.key
                  ? 'btn-glow text-white scale-[1.02]'
                  : 'neu-x'
              }`}
              style={cdlFilter !== f.key ? { color: 'var(--neu-text)' } : undefined}
            >
              <span className="material-symbols-outlined text-[15px]">{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>

        {/* Experience */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="kpi-label mr-1">Experience</span>
          {expFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setExpFilter(f.key)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-bold tracking-wide transition-all duration-200 ${
                expFilter === f.key
                  ? 'btn-glow text-white scale-[1.02]'
                  : 'neu-x'
              }`}
              style={expFilter !== f.key ? { color: 'var(--neu-text)' } : undefined}
            >
              <span className="material-symbols-outlined text-[15px]">{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results Count ──────────────────────────────────────── */}
      <p className="text-sm font-medium" style={{ color: 'var(--neu-text-muted)' }}>
        {filtered.length} candidate{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* ── Candidate Cards Grid ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((driver, i) => (
          <Card key={driver.id} elevation="sm" hover className={`flex flex-col animate-fade-up stagger-${Math.min(i + 1, 8)}`}>
            {/* Header: Avatar + Name + Score */}
            <div className="flex items-start gap-3 mb-4">
              <div className="neu-x w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]" style={{ color: 'var(--neu-accent)' }}>person</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-bold" style={{ color: 'var(--neu-text)' }}>{driver.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="accent">CDL-{driver.cdlClass}</Badge>
                  <span className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>{driver.homeState}</span>
                </div>
              </div>
              {/* Score circle */}
              <div className="relative w-11 h-11 shrink-0">
                <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3" className="stroke-[var(--neu-shadow-d)]/20" />
                  <circle
                    cx="18" cy="18" r="15" fill="none" strokeWidth="3"
                    strokeDasharray={`${driver.matchScore * 0.942} 100`}
                    strokeLinecap="round"
                    className={`${driver.matchScore >= 90 ? 'stroke-green-500' : driver.matchScore >= 80 ? 'stroke-blue-500' : 'stroke-amber-500'}`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold" style={{ color: 'var(--neu-text)' }}>
                  {driver.matchScore}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--neu-text)' }}>
                <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-text-muted)' }}>local_shipping</span>
                {driver.freightType}
              </div>
              <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--neu-text)' }}>
                <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-text-muted)' }}>schedule</span>
                {driver.experience} years experience
              </div>

              {/* Endorsement chips */}
              {driver.endorsements.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {driver.endorsements.map((e) => (
                    <span
                      key={e}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wide neu-x"
                      style={{ color: 'var(--neu-accent)' }}
                    >
                      <span className="material-symbols-outlined text-[12px]">verified</span>
                      {e}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Score bar */}
            <div className="mt-3 mb-3">
              <div className="neu-ins rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${getScoreColor(driver.matchScore)}`}
                  style={{ width: `${driver.matchScore}%` }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--neu-border)' }}>
              <Badge variant={driver.available ? 'success' : 'warning'} dot>
                {driver.available ? 'Available' : 'Unavailable'}
              </Badge>
              <div className="flex gap-1.5">
                <Button variant="ghost" size="sm" icon="visibility">View</Button>
                <Button variant="secondary" size="sm" icon="chat">Contact</Button>
                <Button size="sm" icon="add">Pipeline</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <Card className="text-center py-16 animate-fade-up">
          <span className="material-symbols-outlined text-5xl" style={{ color: 'var(--neu-text-muted)', opacity: 0.4 }}>person_off</span>
          <p className="text-sm mt-3" style={{ color: 'var(--neu-text-muted)' }}>No candidates match your filters. Try broadening your search.</p>
        </Card>
      )}
    </div>
  );
}
