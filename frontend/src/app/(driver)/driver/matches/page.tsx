'use client';
import { useState, useCallback } from 'react';
import { Card, Button, Badge, Input } from '@/components/ui';

interface MatchResult {
  carrierId: string;
  carrierName: string;
  score: number;
  reasoning: string;
  location: string;
  payRange: string;
  freightType: string;
}

export default function DriverMatchesPage() {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ state: '', freightType: '', minPay: '' });

  const runMatch = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Wire to matchingApi.matchDriver() when auth is ready
      // For now, show placeholder
      setMatches([
        { carrierId: '1', carrierName: 'Swift Transportation', score: 92, reasoning: 'CDL-A match, OTR experience, clean MVR', location: 'Phoenix, AZ', payRange: '$0.62-0.68/mi', freightType: 'Dry Van' },
        { carrierId: '2', carrierName: 'Werner Enterprises', score: 87, reasoning: 'Regional routes match home-time preference', location: 'Omaha, NE', payRange: '$0.58-0.64/mi', freightType: 'Reefer' },
        { carrierId: '3', carrierName: 'Schneider National', score: 81, reasoning: 'Dedicated lanes available, good benefits', location: 'Green Bay, WI', payRange: '$0.60-0.66/mi', freightType: 'Intermodal' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-lmdr-dark">AI Job Matches</h2>
          <p className="text-tan text-sm mt-1">Find your best carrier matches powered by AI</p>
        </div>
        <Button onClick={runMatch} loading={loading}>
          <span className="material-symbols-outlined text-[18px] mr-2">auto_awesome</span>
          Find Matches
        </Button>
      </div>

      {/* Filters */}
      <Card elevation="sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Preferred State"
            placeholder="e.g. TX, CA, FL"
            value={filters.state}
            onChange={(e) => setFilters(f => ({ ...f, state: e.target.value }))}
          />
          <Input
            label="Freight Type"
            placeholder="e.g. Dry Van, Reefer"
            value={filters.freightType}
            onChange={(e) => setFilters(f => ({ ...f, freightType: e.target.value }))}
          />
          <Input
            label="Min Pay ($/mi)"
            placeholder="e.g. 0.55"
            value={filters.minPay}
            onChange={(e) => setFilters(f => ({ ...f, minPay: e.target.value }))}
          />
        </div>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {matches.map((match) => (
          <Card key={match.carrierId} elevation="sm" className="hover:shadow-[8px_8px_16px_#C8B896,-8px_-8px_16px_#FFFFF5] transition-shadow">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-lmdr-dark">{match.carrierName}</h3>
                  <Badge variant={match.score >= 90 ? 'success' : match.score >= 80 ? 'info' : 'warning'}>
                    {match.score}% Match
                  </Badge>
                </div>
                <p className="text-sm text-tan">{match.reasoning}</p>
                <div className="flex items-center gap-4 text-sm text-lmdr-dark">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    {match.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">payments</span>
                    {match.payRange}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                    {match.freightType}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Details</Button>
                <Button size="sm">Apply</Button>
              </div>
            </div>
          </Card>
        ))}
        {matches.length === 0 && !loading && (
          <Card className="text-center py-12">
            <span className="material-symbols-outlined text-5xl text-tan mb-3">search</span>
            <p className="text-tan">Click &quot;Find Matches&quot; to discover your best carrier matches</p>
          </Card>
        )}
      </div>
    </div>
  );
}
