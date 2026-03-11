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

/* ══════════════════════════════════════════════════════
   6 SEARCH FACTORS (from AI_MATCHING.html)
   ══════════════════════════════════════════════════════ */

/* Factor 1: Location Radius */
const radiusOptions = [
  { value: '50', label: '50 mi' },
  { value: '100', label: '100 mi' },
  { value: '250', label: '250 mi' },
  { value: '500', label: '500 mi' },
  { value: '1000', label: 'National' },
] as const;

/* Factor 2: Min Pay (CPM) */
const payOptions = [
  { value: '0.45', label: '$0.45+' },
  { value: '0.55', label: '$0.55+' },
  { value: '0.65', label: '$0.65+' },
  { value: '0.75', label: '$0.75+' },
] as const;

/* Factor 3: Run Type */
const runTypes = [
  { value: 'any', label: 'Any', icon: 'done_all' },
  { value: 'OTR', label: 'OTR', icon: 'route' },
  { value: 'Regional', label: 'Regional', icon: 'map' },
  { value: 'Local', label: 'Local', icon: 'home' },
] as const;

/* Factor 4: Max Turnover */
const turnoverOptions = [
  { value: '200', label: 'Any' },
  { value: '90', label: '<90%' },
  { value: '50', label: '<50%' },
  { value: '25', label: '<25%' },
] as const;

/* Factor 5: Max Truck Age */
const truckAgeOptions = [
  { value: '99', label: 'Any' },
  { value: '10', label: '<10yr' },
  { value: '5', label: '<5yr' },
  { value: '3', label: '<3yr' },
] as const;

/* Factor 6: Fleet Size */
const fleetSizes = [
  { value: 'any', label: 'Any', icon: 'select_check_box' },
  { value: 'small', label: 'Small', icon: 'local_shipping' },
  { value: 'medium', label: 'Medium', icon: 'local_shipping' },
  { value: 'large', label: 'Large', icon: 'warehouse' },
] as const;

/* ── Mock Fallback Data ── */
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

/* ══════════════════════════════════════════════════════
   Filter Pill Component — reusable across all 6 factors
   ══════════════════════════════════════════════════════ */
function FilterPill({
  icon, label, options, value, onChange, activeColor = 'blue',
}: {
  icon: string;
  label: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  activeColor?: 'blue' | 'green' | 'amber' | 'rose';
}) {
  const colorMap = {
    blue: 'bg-blue-500/15 text-blue-400',
    green: 'bg-green-500/15 text-green-400',
    amber: 'bg-amber-500/15 text-amber-400',
    rose: 'bg-rose-500/15 text-rose-400',
  };

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--neu-accent)' }}>{icon}</span>
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>{label}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 ${value === opt.value
              ? colorMap[activeColor]
              : 'neu-x'
              }`}
            style={value !== opt.value ? { color: 'var(--neu-text-muted)' } : undefined}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ══════════════════════════════════════════════════════ */
/* ── Weight slider config ── */
const WEIGHT_DEFAULTS = { location: 25, pay: 20, route: 15, safety: 10, retention: 12, fleetAge: 8 };
const WEIGHT_SLIDERS = [
  { key: 'location', label: 'Home Location', icon: 'location_on' },
  { key: 'pay', label: 'Driver Pay', icon: 'payments' },
  { key: 'route', label: 'Route Match', icon: 'route' },
  { key: 'safety', label: 'Safety Record', icon: 'shield' },
  { key: 'retention', label: 'Driver Retention', icon: 'group' },
  { key: 'fleetAge', label: 'Fleet Age', icon: 'local_shipping' },
] as const;

function weightLabel(v: number): string {
  if (v <= 5) return 'Off';
  if (v <= 15) return 'Low';
  if (v <= 30) return 'Standard';
  if (v <= 60) return 'High';
  return 'Critical';
}

function weightColor(v: number): string {
  if (v <= 5) return 'var(--neu-text-muted)';
  if (v <= 15) return 'var(--neu-info, #60a5fa)';
  if (v <= 30) return 'var(--neu-accent)';
  if (v <= 60) return 'var(--neu-warning, #f59e0b)';
  return 'var(--neu-danger, #ef4444)';
}

export default function DriverMatchesPage() {
  /* ── 6 Filter States ── */
  const [radius, setRadius] = useState('100');
  const [minPay, setMinPay] = useState('0.55');
  const [runType, setRunType] = useState('any');
  const [maxTurnover, setMaxTurnover] = useState('90');
  const [maxTruckAge, setMaxTruckAge] = useState('5');
  const [fleetSize, setFleetSize] = useState('any');

  /* ── Weight States ── */
  const [weights, setWeights] = useState(WEIGHT_DEFAULTS);
  const [showPriorities, setShowPriorities] = useState(false);

  const setWeight = (key: string, val: number) =>
    setWeights((prev) => ({ ...prev, [key]: val }));

  const resetWeights = () => setWeights(WEIGHT_DEFAULTS);

  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  /* ── Build filter object from UI state ── */
  const filters = { radius, minPay, runType, maxTurnover, maxTruckAge, fleetSize };

  /* ── API Data ── */
  const fetcher = useCallback(
    () => matchingApi.findJobsForDriver(DEMO_DRIVER_ID, filters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [radius, minPay, runType, maxTurnover, maxTruckAge, fleetSize]
  );
  const { data: matchData, loading, error, refresh } = useApi<Record<string, unknown>>(
    fetcher,
    [radius, minPay, runType, maxTurnover, maxTruckAge, fleetSize]
  );

  /* ── Derive display values (API data with mock fallback) ── */
  const matches: MatchResult[] = matchData?.matches
    ? (matchData.matches as MatchResult[])
    : mockMatches;

  const applications: Application[] = matchData?.applications
    ? (matchData.applications as Application[])
    : mockApplications;

  /* ── Count active filters ── */
  const activeFilterCount = [
    radius !== '1000',
    minPay !== '0.45',
    runType !== 'any',
    maxTurnover !== '200',
    maxTruckAge !== '99',
    fleetSize !== 'any',
  ].filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold" style={{ color: 'var(--neu-text)' }}>AI Job Matches</h1>
            <Badge variant="accent">{matches.length}</Badge>
          </div>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>
            {loading ? 'Searching...' : 'FMCSA Verified · AI Powered'}
          </p>
        </div>
        <button
          onClick={refresh}
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-90"
          style={{
            background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)',
          }}
        >
          <span className="material-symbols-outlined text-white text-[18px]">auto_awesome</span>
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="neu-x rounded-xl px-3 py-2.5 flex items-center gap-2 text-[12px]" style={{ color: 'var(--neu-danger, #ef4444)' }}>
          <span className="material-symbols-outlined text-[16px]">warning</span>
          <span className="flex-1">Offline — showing cached data</span>
          <button onClick={refresh} className="font-bold underline" style={{ color: 'var(--neu-accent)' }}>Retry</button>
        </div>
      )}

      {/* ══════════════════════════════════════════
           FILTER SECTION — 6 Factors
           ══════════════════════════════════════════ */}
      <Card elevation="sm" className="animate-fade-up">
        {/* Toggle Header */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>tune</span>
            <span className="text-[13px] font-bold" style={{ color: 'var(--neu-text)' }}>Search Filters</span>
            {activeFilterCount > 0 && (
              <span
                className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                style={{ background: 'var(--neu-accent)' }}
              >
                {activeFilterCount}
              </span>
            )}
          </div>
          <span
            className="material-symbols-outlined text-[18px] transition-transform"
            style={{
              color: 'var(--neu-text-muted)',
              transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            expand_more
          </span>
        </button>

        {/* Filters Grid */}
        {showFilters && (
          <div className="mt-4 space-y-4 animate-fade-up">
            {/* Row 1: Location + Pay */}
            <div className="grid grid-cols-2 gap-4">
              <FilterPill
                icon="location_on"
                label="Radius"
                options={radiusOptions}
                value={radius}
                onChange={setRadius}
                activeColor="blue"
              />
              <FilterPill
                icon="payments"
                label="Min Pay (CPM)"
                options={payOptions}
                value={minPay}
                onChange={setMinPay}
                activeColor="green"
              />
            </div>

            {/* Row 2: Run Type (full width) */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--neu-accent)' }}>route</span>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>Run Type</p>
              </div>
              <div className="flex gap-2">
                {runTypes.map((rt) => (
                  <button
                    key={rt.value}
                    onClick={() => setRunType(rt.value)}
                    className={`flex-1 py-2 rounded-xl text-center transition-all duration-200 ${runType === rt.value
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'neu-x'
                      }`}
                    style={runType !== rt.value ? { color: 'var(--neu-text-muted)' } : undefined}
                  >
                    <span className="material-symbols-outlined text-[16px] block mb-0.5">{rt.icon}</span>
                    <span className="text-[10px] font-bold">{rt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3: Turnover + Truck Age */}
            <div className="grid grid-cols-2 gap-4">
              <FilterPill
                icon="group"
                label="Max Turnover"
                options={turnoverOptions}
                value={maxTurnover}
                onChange={setMaxTurnover}
                activeColor="rose"
              />
              <FilterPill
                icon="local_shipping"
                label="Truck Age"
                options={truckAgeOptions}
                value={maxTruckAge}
                onChange={setMaxTruckAge}
                activeColor="amber"
              />
            </div>

            {/* Row 4: Fleet Size (full width) */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--neu-accent)' }}>warehouse</span>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>Fleet Size</p>
              </div>
              <div className="flex gap-2">
                {fleetSizes.map((fs) => (
                  <button
                    key={fs.value}
                    onClick={() => setFleetSize(fs.value)}
                    className={`flex-1 py-2 rounded-xl text-center transition-all duration-200 ${fleetSize === fs.value
                      ? 'bg-blue-500/15 text-blue-400'
                      : 'neu-x'
                      }`}
                    style={fleetSize !== fs.value ? { color: 'var(--neu-text-muted)' } : undefined}
                  >
                    <span className="material-symbols-outlined text-[16px] block mb-0.5">{fs.icon}</span>
                    <span className="text-[10px] font-bold">{fs.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── MATCH PRIORITIES (Weight Sliders) ── */}
            <div>
              <button
                onClick={() => setShowPriorities(!showPriorities)}
                className="w-full flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--neu-accent)' }}>tune</span>
                  <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>Match Priorities</p>
                </div>
                <span
                  className="material-symbols-outlined text-[14px] transition-transform"
                  style={{
                    color: 'var(--neu-text-muted)',
                    transform: showPriorities ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  expand_more
                </span>
              </button>

              {showPriorities && (
                <div className="space-y-3 mt-2 animate-fade-up">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>Adjust what matters most in your match score</p>
                    <button
                      onClick={resetWeights}
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full neu-x active:scale-95 transition-transform"
                      style={{ color: 'var(--neu-accent)' }}
                    >
                      Reset
                    </button>
                  </div>

                  {WEIGHT_SLIDERS.map((slider) => {
                    const val = weights[slider.key as keyof typeof weights];
                    return (
                      <div key={slider.key} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[12px]" style={{ color: 'var(--neu-accent)' }}>{slider.icon}</span>
                            <span className="text-[11px] font-semibold" style={{ color: 'var(--neu-text)' }}>{slider.label}</span>
                          </span>
                          <span
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{ color: weightColor(val), background: `${weightColor(val)}15` }}
                          >
                            {weightLabel(val)}
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={val}
                            onChange={(e) => setWeight(slider.key, Number(e.target.value))}
                            className="neu-slider w-full"
                            style={{
                              '--slider-pct': `${val}%`,
                              '--slider-color': weightColor(val),
                            } as React.CSSProperties}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Run Match Button */}
            <button
              onClick={refresh}
              className="w-full py-3 rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{
                background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)',
                boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
              }}
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              Run AI Match
            </button>
          </div>
        )}
      </Card>

      {/* ── Loading Skeleton ── */}
      {loading && !matchData && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} elevation="sm" className="animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl" style={{ background: 'var(--neu-border)' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 rounded" style={{ background: 'var(--neu-border)' }} />
                  <div className="h-3 w-52 rounded" style={{ background: 'var(--neu-border)' }} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════
           MATCH RESULT CARDS
           ══════════════════════════════════════════ */}
      {(!loading || matchData) && (
        <div className="space-y-3">
          {matches.map((match, i) => (
            <button
              key={match.id}
              onClick={() => setExpandedCard(expandedCard === match.id ? null : match.id)}
              className="w-full text-left animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <Card elevation="sm" hover className="!p-3.5">
                <div className="flex items-start gap-3">
                  {/* Score Orb */}
                  <div className="neu-ins w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0">
                    <span className={`text-[17px] font-black leading-none ${scoreColor(match.score)}`}>{match.score}</span>
                    <span className="text-[7px] font-bold uppercase" style={{ color: 'var(--neu-text-muted)' }}>match</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[13px] font-bold truncate" style={{ color: 'var(--neu-text)' }}>{match.carrier}</h3>
                      <Badge variant={scoreBadge(match.score)}>{match.score}%</Badge>
                    </div>
                    <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--neu-text-muted)' }}>{match.description}</p>

                    {/* Meta Pills */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>
                        <span className="material-symbols-outlined text-[11px]">location_on</span>
                        {match.location}
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>
                        <span className="material-symbols-outlined text-[11px]">payments</span>
                        {match.payRange}
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>
                        <span className="material-symbols-outlined text-[11px]">local_shipping</span>
                        {match.truckType}
                      </span>
                    </div>
                  </div>

                  {/* Expand chevron */}
                  <span
                    className="material-symbols-outlined text-[16px] mt-1 transition-transform"
                    style={{
                      color: 'var(--neu-text-muted)',
                      transform: expandedCard === match.id ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  >
                    expand_more
                  </span>
                </div>

                {/* ── Expanded Details ── */}
                {expandedCard === match.id && (
                  <div className="mt-3 pt-3 border-t space-y-3" style={{ borderColor: 'var(--neu-border)' }}>
                    {/* Score Breakdown */}
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { key: 'safety', label: 'Safety', icon: 'shield' },
                        { key: 'pay', label: 'Pay', icon: 'payments' },
                        { key: 'culture', label: 'Culture', icon: 'groups' },
                        { key: 'location', label: 'Location', icon: 'location_on' },
                      ] as const).map(item => {
                        const val = match.breakdown[item.key];
                        return (
                          <div key={item.key} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: 'var(--neu-text-muted)' }}>
                                <span className="material-symbols-outlined text-[12px]" style={{ color: 'var(--neu-accent)' }}>{item.icon}</span>
                                {item.label}
                              </span>
                              <span className={`text-[10px] font-black ${scoreColor(val)}`}>{val}</span>
                            </div>
                            <ProgressBar value={val} color={scoreBarColor(val)} />
                          </div>
                        );
                      })}
                    </div>

                    {/* Benefits */}
                    <div className="flex flex-wrap gap-1.5">
                      {match.benefits.map(b => (
                        <span
                          key={b}
                          className="neu-x rounded-full px-2 py-0.5 text-[9px] font-semibold"
                          style={{ color: 'var(--neu-text-muted)' }}
                        >
                          {b}
                        </span>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        className="flex-1 py-2.5 rounded-xl text-[12px] font-bold text-white flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
                        style={{
                          background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)',
                        }}
                      >
                        <span className="material-symbols-outlined text-[14px]">send</span>
                        Apply Now
                      </button>
                      <button className="neu-x py-2.5 px-4 rounded-xl text-[12px] font-bold flex items-center gap-1.5 active:scale-[0.97] transition-transform" style={{ color: 'var(--neu-text)' }}>
                        <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--neu-accent)' }}>bookmark</span>
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
