'use client';

import { Card, KpiCard, Badge, Button, ProgressBar, StatusDot } from '@/components/ui';
import { carrierApi } from '@/lib/api';
import { useApi } from '@/lib/hooks';

const DEMO_CARRIER_ID = 'demo-carrier-001';

/* ── Fallback Mock Data ────────────────────────────────────────── */
const mockKpis = [
  { label: 'Active Drivers', value: '38', icon: 'people', trend: '+4 this month', trendUp: true },
  { label: 'Open Jobs', value: '12', icon: 'work', trend: '+2 this week', trendUp: true },
  { label: 'Fleet Utilization', value: '87%', icon: 'speed', trend: '+3.2% vs last month', trendUp: true },
  { label: 'Safety Score', value: '94.6', icon: 'verified_user', trend: '+1.1 pts', trendUp: true },
];

const mockFleetCapacity = [
  { label: 'OTR Capacity', value: 28, max: 35, color: 'blue' as const },
  { label: 'Regional Capacity', value: 14, max: 18, color: 'green' as const },
  { label: 'Local Capacity', value: 6, max: 10, color: 'amber' as const },
];

const mockRecentApps = [
  { name: 'Marcus Johnson', cdl: 'A', experience: '8 yrs', matchScore: 94, status: 'new' as const },
  { name: 'Sarah Chen', cdl: 'A', experience: '5 yrs', matchScore: 91, status: 'new' as const },
  { name: 'James Williams', cdl: 'B', experience: '3 yrs', matchScore: 82, status: 'reviewed' as const },
  { name: 'Maria Garcia', cdl: 'A', experience: '12 yrs', matchScore: 97, status: 'interview' as const },
  { name: 'David Lee', cdl: 'A', experience: '6 yrs', matchScore: 88, status: 'reviewed' as const },
];

const appStatusMap: Record<string, { variant: 'info' | 'warning' | 'success' | 'accent'; label: string }> = {
  new: { variant: 'info', label: 'New' },
  reviewed: { variant: 'warning', label: 'Reviewed' },
  interview: { variant: 'accent', label: 'Interview' },
};

/* ── Quick Actions ──────────────────────────────────────────── */
const quickActions = [
  { label: 'Post Job', icon: 'add_circle', href: '/carrier/jobs' },
  { label: 'View Fleet', icon: 'local_shipping', href: '/carrier/dispatch' },
  { label: 'Run Report', icon: 'analytics', href: '#' },
  { label: 'Safety Check', icon: 'health_and_safety', href: '#' },
];

const mockCompliance = {
  dotAuditDate: 'Jan 15, 2026',
  insuranceExpiry: 'Sep 30, 2026',
  fmcsaRating: 'Satisfactory',
  nextBiennial: 'Jul 2027',
};

export default function CarrierDashboardPage() {
  const { data: carrierData, loading, error, refresh } = useApi<Record<string, unknown>>(
    () => carrierApi.getCarrier(DEMO_CARRIER_ID) as Promise<{ data: Record<string, unknown> }>,
    [DEMO_CARRIER_ID]
  );

  // Use API data if available, fallback to mock
  const carrier = carrierData as Record<string, unknown> | null;
  const kpis = carrier?.kpis ? (carrier.kpis as typeof mockKpis) : mockKpis;
  const fleetCapacity = carrier?.fleetCapacity ? (carrier.fleetCapacity as typeof mockFleetCapacity) : mockFleetCapacity;
  const recentApps = carrier?.recentApplications ? (carrier.recentApplications as typeof mockRecentApps) : mockRecentApps;
  const compliance = carrier?.compliance ? (carrier.compliance as typeof mockCompliance) : mockCompliance;

  return (
    <div className="space-y-8">
      {/* ═══ Page Header ═══ */}
      <div className="animate-fade-up flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>
            Carrier Dashboard
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--neu-text-muted)' }}>
            Fleet overview and operational snapshot
          </p>
        </div>
        <div className="flex items-center gap-3">
          {loading && (
            <span className="text-xs font-semibold animate-pulse" style={{ color: 'var(--neu-text-muted)' }}>
              Loading...
            </span>
          )}
          {error && (
            <Badge variant="warning" icon="cloud_off">Using cached data</Badge>
          )}
          <Button variant="ghost" icon="refresh" size="sm" onClick={refresh}>
            Refresh
          </Button>
        </div>
      </div>

      {/* ═══ KPI Row ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, i) => (
          <div key={kpi.label} className={`stagger-${i + 1}`}>
            <KpiCard
              label={kpi.label}
              value={kpi.value}
              icon={kpi.icon}
              trend={kpi.trend}
              trendUp={kpi.trendUp}
            />
          </div>
        ))}
      </div>

      {/* ═══ Middle Row: Fleet + Applications ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Fleet Overview */}
        <Card elevation="md" className="lg:col-span-2 animate-fade-up stagger-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="neu-x w-9 h-9 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>
                local_shipping
              </span>
            </div>
            <h3 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>
              Fleet Overview
            </h3>
          </div>
          <div className="space-y-5">
            {fleetCapacity.map((fc) => (
              <ProgressBar
                key={fc.label}
                label={fc.label}
                value={fc.value}
                max={fc.max}
                color={fc.color}
                showValue
              />
            ))}
          </div>
          <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--neu-border)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: 'var(--neu-text-muted)' }}>
                Total Active Units
              </span>
              <span className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                {fleetCapacity.reduce((s, f) => s + f.value, 0)} / {fleetCapacity.reduce((s, f) => s + f.max, 0)}
              </span>
            </div>
          </div>
        </Card>

        {/* Recent Applications */}
        <Card elevation="md" className="lg:col-span-3 animate-fade-up stagger-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="neu-x w-9 h-9 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>
                  description
                </span>
              </div>
              <h3 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>
                Recent Applications
              </h3>
            </div>
            <Badge variant="accent" icon="fiber_new">{recentApps.filter(a => a.status === 'new').length} new</Badge>
          </div>

          <div className="space-y-0.5">
            {recentApps.map((app, i) => (
              <div
                key={app.name}
                className="flex items-center gap-4 py-3 px-3 rounded-xl transition-colors duration-150 hover:bg-[var(--neu-shadow-d)]/5 animate-fade-up"
                style={{ animationDelay: `${0.3 + i * 0.06}s` }}
              >
                <div className="neu-x w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>
                    person
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--neu-text)' }}>
                    {app.name}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>
                    CDL-{app.cdl} &middot; {app.experience}
                  </p>
                </div>
                <div className="text-center shrink-0">
                  <p className="text-xs font-bold" style={{ color: 'var(--neu-accent)' }}>
                    {app.matchScore}%
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>match</p>
                </div>
                <Badge variant={appStatusMap[app.status].variant} dot>
                  {appStatusMap[app.status].label}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ═══ Quick Actions ═══ */}
      <div className="animate-fade-up stagger-7">
        <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--neu-text-muted)' }}>
          QUICK ACTIONS
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Card key={action.label} elevation="xs" hover className="flex flex-col items-center gap-2 py-5">
              <div className="neu-x w-12 h-12 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]" style={{ color: 'var(--neu-accent)' }}>
                  {action.icon}
                </span>
              </div>
              <span className="text-xs font-bold" style={{ color: 'var(--neu-text)' }}>
                {action.label}
              </span>
            </Card>
          ))}
        </div>
      </div>

      {/* ═══ Compliance Status ═══ */}
      <Card elevation="md" className="animate-fade-up stagger-8">
        <div className="flex items-center gap-2 mb-5">
          <div className="neu-x w-9 h-9 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>
              gavel
            </span>
          </div>
          <h3 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>
            Compliance Status
          </h3>
          <StatusDot status="active" label="All Clear" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p className="kpi-label">DOT Audit Date</p>
            <p className="text-sm font-bold mt-1" style={{ color: 'var(--neu-text)' }}>
              {compliance.dotAuditDate}
            </p>
          </div>
          <div>
            <p className="kpi-label">Insurance Expiry</p>
            <p className="text-sm font-bold mt-1" style={{ color: 'var(--neu-text)' }}>
              {compliance.insuranceExpiry}
            </p>
          </div>
          <div>
            <p className="kpi-label">FMCSA Rating</p>
            <Badge variant="success" icon="verified" className="mt-1">
              {compliance.fmcsaRating}
            </Badge>
          </div>
          <div>
            <p className="kpi-label">Next Biennial Update</p>
            <p className="text-sm font-bold mt-1" style={{ color: 'var(--neu-text)' }}>
              {compliance.nextBiennial}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
