'use client';

import { Card, Badge, KpiCard, ProgressBar, Button } from '@/components/ui';
import Link from 'next/link';

/* ── Mock Data ── */
const driver = { firstName: 'Marcus', lastName: 'Thompson', memberSince: 'Jan 2026', profileCompletion: 72 };

const kpis = [
  { label: 'Match Score', value: '87', icon: 'auto_awesome', trend: '+5 this week', trendUp: true },
  { label: 'Applications Sent', value: '12', icon: 'send', trend: '+3 this week', trendUp: true },
  { label: 'Profile Views', value: '48', icon: 'visibility', trend: '+14% vs last week', trendUp: true },
];

const quickActions = [
  { label: 'Find Matches', href: '/driver/matches', icon: 'work', desc: 'AI-powered carrier matching' },
  { label: 'Upload Docs', href: '/driver/documents', icon: 'upload_file', desc: 'CDL, medical, MVR' },
  { label: 'Update Profile', href: '/driver/profile', icon: 'person', desc: 'Keep info current' },
  { label: 'Check Status', href: '/driver/onboarding', icon: 'fact_check', desc: 'Onboarding progress' },
];

const recentMatches = [
  { id: '1', carrier: 'Swift Transportation', score: 94, location: 'Phoenix, AZ', truckType: 'Dry Van', scoreColor: 'text-green-600' },
  { id: '2', carrier: 'Werner Enterprises', score: 87, location: 'Omaha, NE', truckType: 'Reefer', scoreColor: 'text-blue-600' },
  { id: '3', carrier: 'Schneider National', score: 79, location: 'Green Bay, WI', truckType: 'Intermodal', scoreColor: 'text-amber-600' },
];

const onboardingSteps = [
  { name: 'Create Account', done: true },
  { name: 'Personal Info', done: true },
  { name: 'CDL Details', done: true },
  { name: 'Upload Documents', done: false },
  { name: 'Background Check', done: false },
  { name: 'Profile Review', done: false },
  { name: 'Go Active', done: false },
];

export default function DriverDashboard() {
  const completedSteps = onboardingSteps.filter(s => s.done).length;

  return (
    <div className="space-y-8">
      {/* ── Welcome Banner ── */}
      <Card elevation="lg" className="animate-fade-up bg-gradient-to-br from-[var(--neu-bg)] to-[var(--neu-border)]/30">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="neu-x w-14 h-14 rounded-2xl flex items-center justify-center shrink-0">
                <span className="text-xl font-black" style={{ color: 'var(--neu-accent)' }}>LM</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>
                  Welcome back, {driver.firstName}!
                </h1>
                <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>
                  Member since {driver.memberSince} &middot; CDL-A Driver
                </p>
              </div>
            </div>
          </div>
          <div className="md:w-64">
            <ProgressBar
              value={driver.profileCompletion}
              color="blue"
              label="Profile Completion"
              showValue
            />
          </div>
        </div>
      </Card>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi, i) => (
          <div key={kpi.label} className={`stagger-${i + 1}`}>
            <KpiCard {...kpi} />
          </div>
        ))}
      </div>

      {/* ── Quick Actions (tool orbs) ── */}
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--neu-text)' }}>Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <Link key={action.href} href={action.href} className={`stagger-${i + 1}`}>
              <Card elevation="sm" hover className="text-center group">
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="neu-x w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[28px]" style={{ color: 'var(--neu-accent)' }}>
                      {action.icon}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>{action.label}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>{action.desc}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Bottom Grid: Recent Matches + Onboarding ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Matches */}
        <Card className="animate-fade-up stagger-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold" style={{ color: 'var(--neu-text)' }}>Recent Matches</h3>
            <Link href="/driver/matches">
              <Button variant="ghost" size="sm" icon="arrow_forward">View All</Button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentMatches.map((match) => (
              <Card key={match.id} elevation="xs" className="!p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="neu-ins w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                      <span className={`text-lg font-black ${match.scoreColor}`}>{match.score}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>{match.carrier}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>
                          <span className="material-symbols-outlined text-[13px]">location_on</span>
                          {match.location}
                        </span>
                        <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>
                          <span className="material-symbols-outlined text-[13px]">local_shipping</span>
                          {match.truckType}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={match.score >= 90 ? 'success' : match.score >= 80 ? 'info' : 'warning'}>
                    {match.score}%
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Onboarding Progress Checklist */}
        <Card className="animate-fade-up stagger-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold" style={{ color: 'var(--neu-text)' }}>Onboarding Progress</h3>
            <Badge variant="accent" icon="checklist">
              {completedSteps}/{onboardingSteps.length}
            </Badge>
          </div>
          <ProgressBar
            value={completedSteps}
            max={onboardingSteps.length}
            color="green"
            label={`${completedSteps} of ${onboardingSteps.length} steps complete`}
            showValue
            className="mb-4"
          />
          <div className="space-y-2.5">
            {onboardingSteps.map((step, i) => (
              <div key={step.name} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  step.done
                    ? 'bg-green-100 dark:bg-green-500/15'
                    : 'neu-ins'
                }`}>
                  <span className={`material-symbols-outlined text-[16px] ${
                    step.done ? 'text-green-600' : ''
                  }`} style={!step.done ? { color: 'var(--neu-text-muted)' } : undefined}>
                    {step.done ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                </div>
                <span className={`text-sm font-medium ${step.done ? 'line-through' : ''}`}
                  style={{ color: step.done ? 'var(--neu-text-muted)' : 'var(--neu-text)' }}>
                  {i + 1}. {step.name}
                </span>
                {step.done && <Badge variant="success" className="ml-auto">Done</Badge>}
              </div>
            ))}
          </div>
          <div className="mt-5">
            <Link href="/driver/onboarding">
              <Button variant="primary" size="sm" icon="arrow_forward" className="w-full">
                Continue Onboarding
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
