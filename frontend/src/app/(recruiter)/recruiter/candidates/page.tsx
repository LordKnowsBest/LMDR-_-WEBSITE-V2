'use client';

import { useState } from 'react';
import { Card, Badge, Button, Input } from '@/components/ui';

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

const mockDrivers: Driver[] = [
  { id: 'd1', name: 'Marcus Johnson', cdlClass: 'A', experience: 8, homeState: 'TX', freightType: 'OTR Dry Van', matchScore: 94, endorsements: ['Hazmat', 'Tanker'], available: true },
  { id: 'd2', name: 'Sarah Chen', cdlClass: 'A', experience: 5, homeState: 'CA', freightType: 'Regional Reefer', matchScore: 88, endorsements: ['Doubles/Triples'], available: true },
  { id: 'd3', name: 'Robert Williams', cdlClass: 'A', experience: 12, homeState: 'OH', freightType: 'OTR Flatbed', matchScore: 91, endorsements: ['Hazmat', 'Tanker', 'Doubles/Triples'], available: false },
  { id: 'd4', name: 'Priya Patel', cdlClass: 'B', experience: 3, homeState: 'GA', freightType: 'Local Delivery', matchScore: 76, endorsements: [], available: true },
  { id: 'd5', name: 'James O\'Brien', cdlClass: 'A', experience: 6, homeState: 'IL', freightType: 'Dedicated Dry Van', matchScore: 85, endorsements: ['Hazmat'], available: true },
  { id: 'd6', name: 'Aisha Mohammed', cdlClass: 'A', experience: 4, homeState: 'FL', freightType: 'Regional Reefer', matchScore: 82, endorsements: ['Tanker'], available: true },
];

function getScoreBadgeVariant(score: number) {
  if (score >= 90) return 'success' as const;
  if (score >= 80) return 'info' as const;
  if (score >= 70) return 'warning' as const;
  return 'default' as const;
}

export default function CandidateSearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cdlFilter, setCdlFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState('');
  const [minExp, setMinExp] = useState('');
  const [freightFilter, setFreightFilter] = useState<string>('all');

  const filtered = mockDrivers.filter((d) => {
    if (searchTerm && !d.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (cdlFilter !== 'all' && d.cdlClass !== cdlFilter) return false;
    if (stateFilter && d.homeState.toLowerCase() !== stateFilter.toLowerCase()) return false;
    if (minExp && d.experience < Number(minExp)) return false;
    if (freightFilter !== 'all' && !d.freightType.toLowerCase().includes(freightFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <Card elevation="sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-xl text-lmdr-blue">search</span>
            <Input
              placeholder="Search drivers by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-tan uppercase tracking-wide">CDL Class</label>
              <select
                value={cdlFilter}
                onChange={(e) => setCdlFilter(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm bg-beige text-lmdr-dark shadow-[inset_4px_4px_8px_#C8B896,inset_-4px_-4px_8px_#FFFFF5] focus:outline-none focus:ring-2 focus:ring-lmdr-blue/40"
              >
                <option value="all">All Classes</option>
                <option value="A">Class A</option>
                <option value="B">Class B</option>
              </select>
            </div>
            <Input
              label="State"
              placeholder="e.g. TX"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            />
            <Input
              label="Min Experience (yrs)"
              type="number"
              placeholder="0"
              value={minExp}
              onChange={(e) => setMinExp(e.target.value)}
            />
            <div className="space-y-1">
              <label className="block text-xs font-medium text-tan uppercase tracking-wide">Freight Type</label>
              <select
                value={freightFilter}
                onChange={(e) => setFreightFilter(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm bg-beige text-lmdr-dark shadow-[inset_4px_4px_8px_#C8B896,inset_-4px_-4px_8px_#FFFFF5] focus:outline-none focus:ring-2 focus:ring-lmdr-blue/40"
              >
                <option value="all">All Types</option>
                <option value="otr">OTR</option>
                <option value="regional">Regional</option>
                <option value="local">Local</option>
                <option value="dedicated">Dedicated</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Results Count */}
      <p className="text-sm text-tan">{filtered.length} candidate{filtered.length !== 1 ? 's' : ''} found</p>

      {/* Candidate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((driver) => (
          <Card key={driver.id} elevation="sm" className="flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-base font-semibold text-lmdr-dark">{driver.name}</h4>
                <p className="text-xs text-tan mt-0.5">CDL Class {driver.cdlClass} &middot; {driver.homeState}</p>
              </div>
              <Badge variant={getScoreBadgeVariant(driver.matchScore)}>
                {driver.matchScore}% match
              </Badge>
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 text-sm text-lmdr-dark">
                <span className="material-symbols-outlined text-base text-tan">local_shipping</span>
                {driver.freightType}
              </div>
              <div className="flex items-center gap-2 text-sm text-lmdr-dark">
                <span className="material-symbols-outlined text-base text-tan">schedule</span>
                {driver.experience} years experience
              </div>
              {driver.endorsements.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {driver.endorsements.map((e) => (
                    <Badge key={e} variant="default">{e}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-tan/15">
              <Badge variant={driver.available ? 'success' : 'warning'}>
                {driver.available ? 'Available' : 'Unavailable'}
              </Badge>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <span className="material-symbols-outlined text-base mr-1">visibility</span>
                  Profile
                </Button>
                <Button variant="secondary" size="sm">
                  <span className="material-symbols-outlined text-base mr-1">add</span>
                  Pipeline
                </Button>
                <Button size="sm">
                  <span className="material-symbols-outlined text-base mr-1">call</span>
                  Call
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-tan/40">person_off</span>
          <p className="text-tan mt-2">No candidates match your filters. Try broadening your search.</p>
        </Card>
      )}
    </div>
  );
}
