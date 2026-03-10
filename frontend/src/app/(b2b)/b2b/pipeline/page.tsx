'use client';

import { Card, Badge, Button, ProgressBar } from '@/components/ui';

/* ── Types & Data ──────────────────────────────────────────────── */

interface Deal {
  company: string;
  contact: string;
  value: number;
  daysInStage: number;
  nextAction: string;
  probability: number;
}

interface Stage {
  key: string;
  label: string;
  icon: string;
  gradient: string;
  muted?: boolean;
  deals: Deal[];
}

const stages: Stage[] = [
  {
    key: 'prospect',
    label: 'Prospect',
    icon: 'person_search',
    gradient: 'from-slate-400 to-slate-500',
    deals: [
      { company: 'Saia Inc.', contact: 'Marcus Chen', value: 95000, daysInStage: 3, nextAction: 'Initial outreach call', probability: 10 },
      { company: 'Estes Express Lines', contact: 'Diana Reeves', value: 120000, daysInStage: 7, nextAction: 'Send intro deck', probability: 15 },
      { company: 'Averitt Express', contact: 'Tom Hartley', value: 68000, daysInStage: 1, nextAction: 'LinkedIn connect', probability: 5 },
    ],
  },
  {
    key: 'demo',
    label: 'Demo Scheduled',
    icon: 'videocam',
    gradient: 'from-blue-400 to-blue-600',
    deals: [
      { company: 'J.B. Hunt Transport', contact: 'Sarah Mitchell', value: 320000, daysInStage: 2, nextAction: 'Platform demo Thu 2pm', probability: 30 },
      { company: 'ABF Freight System', contact: 'Carlos Ruiz', value: 80000, daysInStage: 5, nextAction: 'Tech deep-dive call', probability: 25 },
      { company: 'Covenant Logistics', contact: 'Brenda Niles', value: 145000, daysInStage: 4, nextAction: 'ROI walkthrough Fri', probability: 35 },
    ],
  },
  {
    key: 'proposal',
    label: 'Proposal Sent',
    icon: 'description',
    gradient: 'from-amber-400 to-amber-600',
    deals: [
      { company: 'Schneider National', contact: 'Jake Morrison', value: 185000, daysInStage: 8, nextAction: 'Follow up on pricing', probability: 50 },
      { company: 'Ryder System', contact: 'Lisa Park', value: 145000, daysInStage: 4, nextAction: 'Address security Qs', probability: 55 },
      { company: 'TQL Logistics', contact: 'David Kim', value: 110000, daysInStage: 12, nextAction: 'Revised proposal v2', probability: 40 },
    ],
  },
  {
    key: 'negotiation',
    label: 'Negotiation',
    icon: 'handshake',
    gradient: 'from-orange-400 to-orange-600',
    deals: [
      { company: 'Werner Enterprises', contact: 'Amanda Cole', value: 240000, daysInStage: 6, nextAction: 'Legal redline review', probability: 75 },
      { company: 'XPO Logistics', contact: 'Ryan Torres', value: 210000, daysInStage: 11, nextAction: 'Final pricing call', probability: 70 },
      { company: 'Landstar System', contact: 'Greg Ward', value: 165000, daysInStage: 3, nextAction: 'MSA signature pending', probability: 80 },
    ],
  },
  {
    key: 'won',
    label: 'Closed Won',
    icon: 'emoji_events',
    gradient: 'from-emerald-400 to-emerald-600',
    deals: [
      { company: 'Old Dominion Freight', contact: 'Paula Jensen', value: 175000, daysInStage: 0, nextAction: 'Onboarding kickoff', probability: 100 },
      { company: 'Knight-Swift Holdings', contact: 'Mike Shaw', value: 310000, daysInStage: 0, nextAction: 'Implementation start', probability: 100 },
      { company: 'Heartland Express', contact: 'Nina Gomez', value: 92000, daysInStage: 0, nextAction: 'Welcome package sent', probability: 100 },
    ],
  },
  {
    key: 'lost',
    label: 'Closed Lost',
    icon: 'cancel',
    gradient: 'from-red-300 to-red-400',
    muted: true,
    deals: [
      { company: 'USA Truck', contact: 'Ben Foster', value: 78000, daysInStage: 0, nextAction: 'Lost: budget freeze', probability: 0 },
      { company: 'Marten Transport', contact: 'Kelly Dunn', value: 65000, daysInStage: 0, nextAction: 'Lost: chose competitor', probability: 0 },
      { company: 'Celadon Group', contact: 'Ian Cross', value: 42000, daysInStage: 0, nextAction: 'Lost: timing', probability: 0 },
    ],
  },
];

function formatCurrency(val: number): string {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val}`;
}

function stageTotal(deals: Deal[]): number {
  return deals.reduce((sum, d) => sum + d.value, 0);
}

function weightedTotal(deals: Deal[]): number {
  return deals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0);
}

function daysVariant(days: number): 'default' | 'warning' | 'error' {
  if (days > 10) return 'error';
  if (days > 5) return 'warning';
  return 'default';
}

/* ── Page Component ────────────────────────────────────────────── */

export default function B2BPipelinePage() {
  const allDeals = stages.flatMap((s) => s.deals);
  const totalPipeline = stageTotal(allDeals);
  const totalWeighted = weightedTotal(allDeals);
  const activeDeals = stages.filter((s) => s.key !== 'won' && s.key !== 'lost').flatMap((s) => s.deals);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>Sales Pipeline</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--neu-text-muted)' }}>
            {activeDeals.length} active deals in pipeline
          </p>
        </div>
        <Button variant="primary" icon="add">New Deal</Button>
      </div>

      {/* Pipeline Summary Bar */}
      <Card elevation="sm" className="animate-fade-up stagger-1">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <span className="kpi-label">Total Pipeline</span>
            <p className="text-xl font-black" style={{ color: 'var(--neu-text)' }}>{formatCurrency(totalPipeline)}</p>
          </div>
          <div className="w-px h-10 bg-[var(--neu-border)]" />
          <div>
            <span className="kpi-label">Weighted Value</span>
            <p className="text-xl font-black" style={{ color: 'var(--neu-accent)' }}>{formatCurrency(totalWeighted)}</p>
          </div>
          <div className="w-px h-10 bg-[var(--neu-border)]" />
          <div>
            <span className="kpi-label">Avg Deal Size</span>
            <p className="text-xl font-black" style={{ color: 'var(--neu-text)' }}>{formatCurrency(Math.round(totalPipeline / allDeals.length))}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="success" icon="emoji_events">{stages.find((s) => s.key === 'won')?.deals.length} Won</Badge>
            <Badge variant="error" icon="cancel">{stages.find((s) => s.key === 'lost')?.deals.length} Lost</Badge>
          </div>
        </div>
      </Card>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
        {stages.map((stage, si) => (
          <div
            key={stage.key}
            className={`flex-shrink-0 w-72 animate-fade-up stagger-${Math.min(si + 2, 8)}`}
            style={{ opacity: stage.muted ? 0.6 : 1 }}
          >
            {/* Column Header */}
            <Card elevation="sm" className="mb-3 !p-0 overflow-hidden">
              <div className={`h-1 bg-gradient-to-r ${stage.gradient}`} />
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>{stage.icon}</span>
                    <h4 className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>{stage.label}</h4>
                  </div>
                  <Badge variant="default">{stage.deals.length}</Badge>
                </div>
                <p className="text-xs font-bold mt-1" style={{ color: 'var(--neu-text-muted)' }}>
                  {formatCurrency(stageTotal(stage.deals))}
                </p>
              </div>
            </Card>

            {/* Deal Cards */}
            <div className="space-y-3">
              {stage.deals.map((deal, di) => (
                <Card
                  key={`${stage.key}-${di}`}
                  elevation="sm"
                  hover
                  className="!p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-bold leading-tight" style={{ color: 'var(--neu-text)' }}>{deal.company}</p>
                    {deal.probability > 0 && deal.probability < 100 && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md" style={{
                        color: 'var(--neu-accent)',
                        background: 'var(--neu-accent)',
                        opacity: 0.15,
                      }}>
                        {/* Overlay trick for tinted background */}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                    <span className="material-symbols-outlined text-[12px] align-middle mr-0.5">person</span>
                    {deal.contact}
                  </p>

                  <p className="text-lg font-black mb-2" style={{ color: 'var(--neu-text)' }}>
                    {formatCurrency(deal.value)}
                  </p>

                  {/* Probability bar */}
                  {deal.probability > 0 && deal.probability < 100 && (
                    <ProgressBar
                      value={deal.probability}
                      color={deal.probability >= 70 ? 'green' : deal.probability >= 40 ? 'amber' : 'blue'}
                      label="Probability"
                      showValue
                      className="mb-2"
                    />
                  )}

                  <p className="text-[11px] mb-3" style={{ color: 'var(--neu-text-muted)' }}>
                    <span className="material-symbols-outlined text-[12px] align-middle mr-0.5">task_alt</span>
                    {deal.nextAction}
                  </p>

                  <div className="flex items-center justify-between">
                    {deal.daysInStage > 0 ? (
                      <Badge variant={daysVariant(deal.daysInStage)} icon="schedule">
                        {deal.daysInStage}d
                      </Badge>
                    ) : (
                      <span />
                    )}
                    <div
                      className="neu-x w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black"
                      style={{ color: 'var(--neu-accent)' }}
                    >
                      {deal.contact.split(' ').map((w) => w[0]).join('')}
                    </div>
                  </div>
                </Card>
              ))}

              {stage.deals.length === 0 && (
                <Card inset className="flex items-center justify-center py-8">
                  <span className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>No deals</span>
                </Card>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
