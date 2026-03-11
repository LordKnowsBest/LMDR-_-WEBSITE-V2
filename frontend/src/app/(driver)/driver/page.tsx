'use client';

import { Card, Badge, KpiCard, ProgressBar, Button } from '@/components/ui';
import Link from 'next/link';
import { getProfile } from '../actions/profile';
import { getDashboard } from '../actions/cockpit';
import { getProgression } from '../actions/gamification';
import { getDocumentStatus } from '../actions/documents';
import { findJobs } from '../actions/matching';
import { useApi } from '@/lib/hooks';

/* ── Constants ── */
const DEMO_DRIVER_ID = 'demo-driver-001';

/* ── Mock Fallback Data ── */
const mockDriver = {
  firstName: 'Marcus',
  lastName: 'Thompson',
  memberSince: 'Jan 2026',
  profileCompletion: 72,
};

const mockKpis = [
  { label: 'Match Score', value: '87', icon: 'auto_awesome', trend: '+5 this week', trendUp: true },
  { label: 'Apps Sent', value: '12', icon: 'send', trend: '+3 this week', trendUp: true },
  { label: 'Profile Views', value: '48', icon: 'visibility', trend: '+14%', trendUp: true },
];

const quickActions = [
  { label: 'Find Matches', href: '/driver/matches', icon: 'work', desc: 'AI matching' },
  { label: 'My Applications', href: '/driver/applications', icon: 'description', desc: 'Track status' },
  { label: 'Update Profile', href: '/driver/profile', icon: 'person', desc: 'Keep current' },
  { label: 'Check Status', href: '/driver/onboarding', icon: 'fact_check', desc: 'Onboarding' },
];

const mockRecentMatches = [
  { id: '1', carrier: 'Swift Transportation', score: 94, location: 'Phoenix, AZ', truckType: 'Dry Van' },
  { id: '2', carrier: 'Werner Enterprises', score: 87, location: 'Omaha, NE', truckType: 'Reefer' },
  { id: '3', carrier: 'Schneider National', score: 79, location: 'Green Bay, WI', truckType: 'Intermodal' },
];

const mockOnboardingSteps = [
  { name: 'Create Account', done: true },
  { name: 'Personal Info', done: true },
  { name: 'CDL Details', done: true },
  { name: 'Upload Documents', done: false },
  { name: 'Background Check', done: false },
  { name: 'Profile Review', done: false },
  { name: 'Go Active', done: false },
];

/* ── Gamification Fallback ── */
const gamificationFallback = {
  level: 3,
  title: 'Mile Maker',
  xp: 310,
  xpNext: 600,
  streak: 5,
};

export default function DriverDashboard() {
  /* ── API Data (via Cloud Run server actions) ── */
  const {
    data: profileData,
    loading: profileLoading,
    error: profileError,
    refresh: refreshProfile,
  } = useApi<Record<string, unknown>>(
    () => getProfile(DEMO_DRIVER_ID).then(d => ({ data: d as Record<string, unknown> })),
    [DEMO_DRIVER_ID]
  );

  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
    refresh: refreshDashboard,
  } = useApi<Record<string, unknown>>(
    () => getDashboard(DEMO_DRIVER_ID).then(d => ({ data: d as unknown as Record<string, unknown> })),
    [DEMO_DRIVER_ID]
  );

  const {
    data: gamificationData,
    loading: gamLoading,
  } = useApi<Record<string, unknown>>(
    () => getProgression(DEMO_DRIVER_ID).then(d => ({ data: d as unknown as Record<string, unknown> })),
    [DEMO_DRIVER_ID]
  );

  const {
    data: docStatusData,
  } = useApi<Record<string, unknown>>(
    () => getDocumentStatus(DEMO_DRIVER_ID).then(d => ({ data: d as unknown as Record<string, unknown> })),
    [DEMO_DRIVER_ID]
  );

  const {
    data: matchesData,
  } = useApi<Record<string, unknown>>(
    () => findJobs(DEMO_DRIVER_ID).then(d => ({ data: d as unknown as Record<string, unknown> })),
    [DEMO_DRIVER_ID]
  );

  /* ── Derive display values ── */
  const driver = profileData
    ? {
      firstName: (profileData.first_name as string) || (profileData.firstName as string) || mockDriver.firstName,
      lastName: (profileData.last_name as string) || (profileData.lastName as string) || mockDriver.lastName,
      memberSince: (profileData.memberSince as string) || mockDriver.memberSince,
      profileCompletion: (profileData.completeness_score as number) ?? mockDriver.profileCompletion,
    }
    : mockDriver;

  const kpis = dashboardData
    ? [
      {
        label: 'Matches',
        value: String((dashboardData.matchCount as number) ?? 0),
        icon: 'auto_awesome',
        trend: '',
        trendUp: true,
      },
      {
        label: 'Apps Sent',
        value: String((dashboardData.applicationCount as number) ?? 0),
        icon: 'send',
        trend: '',
        trendUp: true,
      },
      {
        label: 'Saved Jobs',
        value: String((dashboardData.savedCount as number) ?? 0),
        icon: 'bookmark',
        trend: '',
        trendUp: true,
      },
    ]
    : mockKpis;

  const recentMatches = matchesData?.matches
    ? (matchesData.matches as Array<Record<string, unknown>>).slice(0, 3).map((m, i) => ({
        id: String(i + 1),
        carrier: (m.carrier_name as string) || (m.company_name as string) || 'Unknown',
        score: (m.match_score as number) || (m.score as number) || 0,
        location: `${(m.city as string) || ''}, ${(m.state as string) || ''}`.trim().replace(/^,\s*/, ''),
        truckType: (m.equipment_types as string) || (m.truck_type as string) || 'Dry Van',
      }))
    : mockRecentMatches;

  // Build onboarding steps from doc status + profile completeness
  const docStatus = docStatusData as { complete?: string[]; missing?: string[]; pendingReview?: string[] } | null;
  const hasName = !!(profileData?.first_name || profileData?.firstName);
  const hasCdl = !!(profileData?.cdl_class || profileData?.cdlClass);
  const hasDocs = (docStatus?.complete?.length ?? 0) > 0;
  const onboardingSteps = [
    { name: 'Create Account', done: true },
    { name: 'Personal Info', done: hasName },
    { name: 'CDL Details', done: hasCdl },
    { name: 'Upload Documents', done: hasDocs },
    { name: 'Background Check', done: false },
    { name: 'Profile Review', done: driver.profileCompletion >= 80 },
    { name: 'Go Active', done: !!(profileData?.is_discoverable === 'Yes') },
  ];

  const completedSteps = onboardingSteps.filter((s) => s.done).length;

  const gamification = gamificationData
    ? {
        level: (gamificationData.level as number) ?? gamificationFallback.level,
        title: (gamificationData.title as string) || (gamificationData.level_title as string) || gamificationFallback.title,
        xp: (gamificationData.xp as number) ?? (gamificationData.total_xp as number) ?? gamificationFallback.xp,
        xpNext: (gamificationData.xp_next as number) ?? (gamificationData.xp_to_next_level as number) ?? gamificationFallback.xpNext,
        streak: (gamificationData.streak as number) ?? (gamificationData.login_streak as number) ?? gamificationFallback.streak,
      }
    : gamificationFallback;

  const isLoading = profileLoading || dashboardLoading;
  const hasError = profileError || dashboardError;

  return (
    <div className="space-y-5">
      {/* ── Error Banner ── */}
      {hasError && (
        <div
          className="neu-x rounded-xl px-3 py-2.5 flex items-center gap-2 text-[12px]"
          style={{ color: 'var(--neu-danger)' }}
        >
          <span className="material-symbols-outlined text-[16px]">warning</span>
          <span className="flex-1">Offline — showing cached data</span>
          <button
            onClick={() => {
              refreshProfile();
              refreshDashboard();
            }}
            className="font-bold underline"
            style={{ color: 'var(--neu-accent)' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════
           1. WELCOME CARD
           ════════════════════════════════════════ */}
      <Card elevation="lg" className="animate-fade-up">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1
              className="text-xl font-extrabold leading-tight"
              style={{ color: 'var(--neu-text)' }}
            >
              {isLoading ? (
                <span className="inline-block w-48 h-6 rounded-lg animate-pulse" style={{ background: 'var(--neu-border)' }} />
              ) : (
                <>Welcome, {driver.firstName}</>
              )}
            </h1>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>
              Ready to hit the road?
            </p>
          </div>
          <Link
            href="/driver/profile"
            className="text-[12px] font-bold"
            style={{ color: 'var(--neu-accent)' }}
          >
            Edit
          </Link>
        </div>

        {/* Profile Completion */}
        <ProgressBar
          value={driver.profileCompletion}
          color="blue"
          label="Profile Completion"
          showValue
        />

        {/* CTA */}
        <Link href="/driver/profile" className="mt-3 block">
          <div
            className="neu-x rounded-xl py-2.5 text-center text-[13px] font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ color: 'var(--neu-accent)' }}
          >
            Complete Profile →
          </div>
        </Link>
      </Card>

      {/* ════════════════════════════════════════
           2. KPI HORIZONTAL SCROLL ROW
           ════════════════════════════════════════ */}
      <div className="overflow-x-auto -mx-4 px-4 pb-2 no-scrollbar">
        <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
          {kpis.map((kpi) => (
            <div key={kpi.label} className="w-[140px] shrink-0">
              <Card elevation="sm" className="!p-4 animate-fade-up">
                <div className="flex items-center gap-2 mb-2">
                  <div className="neu-x w-8 h-8 rounded-lg flex items-center justify-center">
                    <span
                      className="material-symbols-outlined text-[16px]"
                      style={{ color: 'var(--neu-accent)' }}
                    >
                      {kpi.icon}
                    </span>
                  </div>
                </div>
                <p
                  className="text-[11px] font-semibold mb-0.5"
                  style={{ color: 'var(--neu-text-muted)' }}
                >
                  {kpi.label}
                </p>
                <p
                  className="text-2xl font-black leading-none"
                  style={{ color: 'var(--neu-text)' }}
                >
                  {kpi.value}
                </p>
                {kpi.trend && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <span
                      className={`material-symbols-outlined text-[12px] ${kpi.trendUp ? 'text-green-500' : 'text-red-400'
                        }`}
                    >
                      {kpi.trendUp ? 'trending_up' : 'trending_down'}
                    </span>
                    <span
                      className={`text-[10px] font-semibold ${kpi.trendUp ? 'text-green-500' : 'text-red-400'
                        }`}
                    >
                      {kpi.trend}
                    </span>
                  </div>
                )}
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════
           3. QUICK ACTIONS — 2×2 Grid of Orbs
           ════════════════════════════════════════ */}
      <div>
        <h2
          className="text-[15px] font-bold mb-3"
          style={{ color: 'var(--neu-text)' }}
        >
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, i) => (
            <Link key={action.href} href={action.href}>
              <Card
                elevation="sm"
                hover
                className={`text-center group animate-fade-up`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex flex-col items-center gap-2.5 py-1">
                  <div className="neu-x w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <span
                      className="material-symbols-outlined text-[24px]"
                      style={{ color: 'var(--neu-accent)' }}
                    >
                      {action.icon}
                    </span>
                  </div>
                  <div>
                    <p
                      className="text-[13px] font-bold"
                      style={{ color: 'var(--neu-text)' }}
                    >
                      {action.label}
                    </p>
                    <p
                      className="text-[10px] mt-0.5"
                      style={{ color: 'var(--neu-text-muted)' }}
                    >
                      {action.desc}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════
           4. RECENT MATCHES
           ════════════════════════════════════════ */}
      <Card elevation="md" className="animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-[15px] font-bold"
            style={{ color: 'var(--neu-text)' }}
          >
            Recent Matches
          </h3>
          <Link href="/driver/matches">
            <span
              className="text-[11px] font-bold"
              style={{ color: 'var(--neu-accent)' }}
            >
              View All →
            </span>
          </Link>
        </div>
        <div className="space-y-2.5">
          {recentMatches.map((match) => (
            <div
              key={match.id}
              className="neu-x rounded-xl p-3 flex items-center gap-3"
            >
              {/* Score Orb */}
              <div className="neu-ins w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
                <span
                  className={`text-[15px] font-black ${match.score >= 90
                    ? 'text-green-600'
                    : match.score >= 80
                      ? 'text-blue-600'
                      : 'text-amber-600'
                    }`}
                >
                  {match.score}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-[13px] font-bold truncate"
                  style={{ color: 'var(--neu-text)' }}
                >
                  {match.carrier}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="flex items-center gap-0.5 text-[10px]"
                    style={{ color: 'var(--neu-text-muted)' }}
                  >
                    <span className="material-symbols-outlined text-[11px]">
                      location_on
                    </span>
                    {match.location}
                  </span>
                  <span
                    className="flex items-center gap-0.5 text-[10px]"
                    style={{ color: 'var(--neu-text-muted)' }}
                  >
                    <span className="material-symbols-outlined text-[11px]">
                      local_shipping
                    </span>
                    {match.truckType}
                  </span>
                </div>
              </div>

              {/* Badge */}
              <Badge
                variant={
                  match.score >= 90
                    ? 'success'
                    : match.score >= 80
                      ? 'info'
                      : 'warning'
                }
              >
                {match.score}%
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* ════════════════════════════════════════
           5. ONBOARDING PROGRESS
           ════════════════════════════════════════ */}
      <Card elevation="md" className="animate-fade-up">
        <div className="flex items-center justify-between mb-3">
          <h3
            className="text-[15px] font-bold"
            style={{ color: 'var(--neu-text)' }}
          >
            Onboarding
          </h3>
          <Badge variant="accent">
            {completedSteps}/{onboardingSteps.length}
          </Badge>
        </div>

        <ProgressBar
          value={completedSteps}
          max={onboardingSteps.length}
          color="green"
          showValue
          className="mb-3"
        />

        <div className="space-y-2">
          {onboardingSteps.map((step, i) => (
            <div key={step.name} className="flex items-center gap-2.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-green-100' : 'neu-ins'
                  }`}
              >
                <span
                  className={`material-symbols-outlined text-[14px] ${step.done ? 'text-green-600' : ''
                    }`}
                  style={!step.done ? { color: 'var(--neu-text-muted)' } : undefined}
                >
                  {step.done ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </div>
              <span
                className={`text-[12px] font-medium ${step.done ? 'line-through' : ''}`}
                style={{
                  color: step.done ? 'var(--neu-text-muted)' : 'var(--neu-text)',
                }}
              >
                {i + 1}. {step.name}
              </span>
            </div>
          ))}
        </div>

        <Link href="/driver/onboarding" className="block mt-4">
          <Button variant="primary" size="sm" icon="arrow_forward" className="w-full">
            Continue Onboarding
          </Button>
        </Link>
      </Card>

      {/* ════════════════════════════════════════
           6. GAMIFICATION STRIP
           ════════════════════════════════════════ */}
      <Card elevation="sm" className="animate-fade-up">
        <div className="flex items-center gap-3">
          {/* Level Badge */}
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)',
            }}
          >
            <span className="text-white text-[14px] font-black">
              L{gamification.level}
            </span>
          </div>

          {/* XP Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-[12px] font-bold"
                style={{ color: 'var(--neu-text)' }}
              >
                {gamification.title}
              </span>
              <span
                className="text-[10px] font-semibold"
                style={{ color: 'var(--neu-text-muted)' }}
              >
                {gamification.xp}/{gamification.xpNext} XP
              </span>
            </div>
            <ProgressBar
              value={gamification.xp}
              max={gamification.xpNext}
              color="blue"
            />
          </div>

          {/* Streak */}
          <div className="neu-x rounded-xl px-2.5 py-1.5 text-center shrink-0">
            <span className="text-[14px]">🔥</span>
            <p
              className="text-[10px] font-bold"
              style={{ color: 'var(--neu-text)' }}
            >
              {gamification.streak}d
            </p>
          </div>
        </div>
      </Card>

      {/* ── Bottom Spacer for safe area ── */}
      <div className="h-4" />
    </div>
  );
}
