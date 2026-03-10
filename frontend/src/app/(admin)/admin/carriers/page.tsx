'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useApi } from '@/lib/hooks';
import { carrierApi } from '@/lib/api';

/* ── Types ── */
type SafetyRating = 'Satisfactory' | 'Conditional' | 'Unsatisfactory' | 'Not Rated';

interface Carrier {
  [key: string]: unknown;
  id: string;
  companyName: string;
  dotNumber: string;
  safetyRating: SafetyRating;
  fleetSize: number;
  activeJobs: number;
  enrichmentPct: number;
  state: string;
  mcNumber: string;
}

const safetyVariant: Record<SafetyRating, 'success' | 'warning' | 'error' | 'default'> = {
  Satisfactory: 'success',
  Conditional: 'warning',
  Unsatisfactory: 'error',
  'Not Rated': 'default',
};

/* ── Mock Carriers (fallback) ── */
const MOCK_CARRIERS: Carrier[] = [
  { id: '1', companyName: 'FastFreight Inc', dotNumber: '1234567', safetyRating: 'Satisfactory', fleetSize: 245, activeJobs: 12, enrichmentPct: 100, state: 'TX', mcNumber: 'MC-987654' },
  { id: '2', companyName: 'TransPro Logistics', dotNumber: '3847291', safetyRating: 'Satisfactory', fleetSize: 180, activeJobs: 8, enrichmentPct: 92, state: 'CA', mcNumber: 'MC-654321' },
  { id: '3', companyName: 'Eagle Transport', dotNumber: '2938471', safetyRating: 'Conditional', fleetSize: 65, activeJobs: 0, enrichmentPct: 45, state: 'OH', mcNumber: 'MC-112233' },
  { id: '4', companyName: 'Summit Carriers', dotNumber: '4721983', safetyRating: 'Satisfactory', fleetSize: 320, activeJobs: 15, enrichmentPct: 88, state: 'FL', mcNumber: 'MC-445566' },
  { id: '5', companyName: 'Midwest Haulers', dotNumber: '1928374', safetyRating: 'Not Rated', fleetSize: 42, activeJobs: 3, enrichmentPct: 30, state: 'IL', mcNumber: 'MC-778899' },
  { id: '6', companyName: 'Pacific Route LLC', dotNumber: '5847293', safetyRating: 'Satisfactory', fleetSize: 410, activeJobs: 22, enrichmentPct: 100, state: 'WA', mcNumber: 'MC-334455' },
  { id: '7', companyName: 'Delta Freight Co', dotNumber: '3749182', safetyRating: 'Unsatisfactory', fleetSize: 28, activeJobs: 0, enrichmentPct: 15, state: 'GA', mcNumber: 'MC-667788' },
  { id: '8', companyName: 'Horizon Trucking', dotNumber: '6182937', safetyRating: 'Satisfactory', fleetSize: 155, activeJobs: 7, enrichmentPct: 76, state: 'AZ', mcNumber: 'MC-990011' },
  { id: '9', companyName: 'Blue Ridge Carriers', dotNumber: '7294816', safetyRating: 'Satisfactory', fleetSize: 88, activeJobs: 5, enrichmentPct: 62, state: 'NC', mcNumber: 'MC-223344' },
  { id: '10', companyName: 'Lone Star Express', dotNumber: '8371924', safetyRating: 'Conditional', fleetSize: 195, activeJobs: 11, enrichmentPct: 54, state: 'TX', mcNumber: 'MC-556677' },
];

const filters = ['All', 'Satisfactory', 'Conditional', 'Unsatisfactory'] as const;

export default function AdminCarriersPage() {
  const [search, setSearch] = useState('');
  const [dotSearch, setDotSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [enrichingId, setEnrichingId] = useState<string | null>(null);

  /* ── DOT Lookup API ── */
  const { data: dotResult, loading: dotLoading, error: dotError, refresh: dotRefresh } = useApi<Carrier>(
    () => dotSearch ? carrierApi.lookupByDot(dotSearch) as Promise<{ data: Carrier }> : Promise.resolve({ data: null as unknown as Carrier }),
    [dotSearch]
  );

  /* ── Resolve with fallback — merge DOT result into list if found ── */
  const allCarriers: Carrier[] = (() => {
    const base = MOCK_CARRIERS;
    if (dotResult && dotSearch && !base.find(c => c.dotNumber === dotResult.dotNumber)) {
      return [dotResult, ...base];
    }
    return base;
  })();

  const filtered = allCarriers.filter((c) => {
    const matchesSearch =
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.dotNumber.includes(search) ||
      c.mcNumber.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'All' || c.safetyRating === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const handleEnrich = (id: string) => {
    setEnrichingId(id);
    setTimeout(() => setEnrichingId(null), 2500);
  };

  const handleDotLookup = () => {
    if (search.match(/^\d{5,8}$/)) {
      setDotSearch(search);
    }
  };

  const totalFleet = allCarriers.reduce((a, c) => a + c.fleetSize, 0);
  const totalJobs = allCarriers.reduce((a, c) => a + c.activeJobs, 0);
  const avgEnrichment = allCarriers.length > 0 ? Math.round(allCarriers.reduce((a, c) => a + c.enrichmentPct, 0) / allCarriers.length) : 0;

  const columns = [
    {
      key: 'companyName',
      header: 'Company',
      render: (row: Carrier) => (
        <div className="flex items-center gap-3">
          <div className="neu-x w-9 h-9 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>local_shipping</span>
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--neu-text)' }}>{row.companyName}</p>
            <p className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>{row.mcNumber}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'dotNumber',
      header: 'DOT #',
      className: 'w-28',
      render: (row: Carrier) => (
        <span className="font-mono text-sm font-medium" style={{ color: 'var(--neu-text)' }}>{row.dotNumber}</span>
      ),
    },
    {
      key: 'safetyRating',
      header: 'Safety Rating',
      className: 'w-36',
      render: (row: Carrier) => <Badge variant={safetyVariant[row.safetyRating]} dot>{row.safetyRating}</Badge>,
    },
    {
      key: 'fleetSize',
      header: 'Fleet Size',
      className: 'w-24 text-center',
      render: (row: Carrier) => (
        <span className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
          {row.fleetSize}
          <span className="text-[10px] font-normal ml-0.5" style={{ color: 'var(--neu-text-muted)' }}>units</span>
        </span>
      ),
    },
    {
      key: 'activeJobs',
      header: 'Active Jobs',
      className: 'w-28 text-center',
      render: (row: Carrier) => (
        <Badge variant={row.activeJobs > 0 ? 'info' : 'default'}>
          {row.activeJobs} {row.activeJobs === 1 ? 'job' : 'jobs'}
        </Badge>
      ),
    },
    {
      key: 'enrichmentPct',
      header: 'Enrichment',
      className: 'w-36',
      render: (row: Carrier) => (
        <ProgressBar
          value={row.enrichmentPct}
          color={row.enrichmentPct >= 80 ? 'green' : row.enrichmentPct >= 50 ? 'blue' : 'amber'}
          showValue
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-40 text-right',
      render: (row: Carrier) => (
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            loading={enrichingId === row.id}
            onClick={() => handleEnrich(row.id)}
            icon="auto_awesome"
          >
            Enrich
          </Button>
          <a
            href={`https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${row.dotNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-[var(--neu-accent)]/5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-accent)' }}>open_in_new</span>
          </a>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Error Banner ── */}
      {dotError && dotSearch && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
          <span className="material-symbols-outlined text-[18px]">warning</span>
          <span>DOT lookup failed — showing cached data. {dotError}</span>
          <button onClick={dotRefresh} className="ml-auto font-semibold underline">Retry</button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold animate-fade-up" style={{ color: 'var(--neu-text)' }}>
            Carrier Management
          </h2>
          <p className="text-sm mt-1 animate-fade-up stagger-1" style={{ color: 'var(--neu-text-muted)' }}>
            {allCarriers.length} carriers registered
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon="refresh" onClick={dotRefresh} loading={dotLoading}>Refresh</Button>
          <Button variant="primary" size="sm" icon="add_business">Add Carrier</Button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiCard label="Total Carriers" value={String(allCarriers.length)} icon="domain" trend="+3 this week" trendUp className="stagger-1" />
        <KpiCard label="Total Fleet" value={totalFleet.toLocaleString()} icon="directions_bus" trend="+120 units" trendUp className="stagger-2" />
        <KpiCard label="Active Jobs" value={String(totalJobs)} icon="work" trend="+8 today" trendUp className="stagger-3" />
        <KpiCard label="Avg Enrichment" value={`${avgEnrichment}%`} icon="auto_awesome" trend="+5% this week" trendUp className="stagger-4" />
      </div>

      {/* ── Search + Filters ── */}
      <Card elevation="sm" className="flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-up stagger-5">
        <div className="w-full sm:w-80">
          <Input placeholder="Search by name, DOT, or MC..." icon="search" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="secondary" size="sm" icon="search" onClick={handleDotLookup} loading={dotLoading} disabled={!search.match(/^\d{5,8}$/)}>
          DOT Lookup
        </Button>
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <Button key={f} variant={activeFilter === f ? 'primary' : 'secondary'} size="sm" onClick={() => setActiveFilter(f)}>
              {f}
            </Button>
          ))}
        </div>
      </Card>

      {/* ── Data Table ── */}
      <div className="animate-fade-up stagger-6">
        <DataTable columns={columns} data={filtered} loading={dotLoading} emptyMessage="No carriers match your filters" emptyIcon="local_shipping" />
      </div>
    </div>
  );
}
