'use client';

import { useState, useCallback } from 'react';
import { Card, Badge, Button } from '@/components/ui';

/* ── Types ────────────────────────────────────────────────────── */
interface PipelineCard {
  id: string;
  driverName: string;
  carrier: string;
  score: number;
  daysInStage: number;
  nextAction: string;
  nextActionIcon: string;
}

interface PipelineColumn {
  id: string;
  label: string;
  borderColor: string;
  bgAccent: string;
  icon: string;
  cards: PipelineCard[];
}

/* ── Initial Mock Data (3 per column = 15 total) ─────────────── */
const initialColumns: PipelineColumn[] = [
  {
    id: 'new-lead',
    label: 'New Lead',
    borderColor: 'border-t-blue-500',
    bgAccent: 'bg-blue-500',
    icon: 'fiber_new',
    cards: [
      { id: 'p1', driverName: 'Ahmed R.', carrier: 'Werner Enterprises', score: 88, daysInStage: 1, nextAction: 'Review Profile', nextActionIcon: 'visibility' },
      { id: 'p2', driverName: 'Linda K.', carrier: 'Heartland Express', score: 79, daysInStage: 2, nextAction: 'Send Intro', nextActionIcon: 'send' },
      { id: 'p3', driverName: 'Mike T.', carrier: 'XPO Logistics', score: 92, daysInStage: 0, nextAction: 'Qualify Lead', nextActionIcon: 'fact_check' },
    ],
  },
  {
    id: 'contacted',
    label: 'Contacted',
    borderColor: 'border-t-amber-500',
    bgAccent: 'bg-amber-500',
    icon: 'chat',
    cards: [
      { id: 'p4', driverName: 'Sarah C.', carrier: 'Schneider National', score: 88, daysInStage: 3, nextAction: 'Follow Up', nextActionIcon: 'reply' },
      { id: 'p5', driverName: 'James O.', carrier: 'JB Hunt', score: 85, daysInStage: 5, nextAction: 'Schedule Call', nextActionIcon: 'call' },
      { id: 'p6', driverName: 'Fatima N.', carrier: 'Werner Enterprises', score: 81, daysInStage: 1, nextAction: 'Send Info Pack', nextActionIcon: 'attach_email' },
    ],
  },
  {
    id: 'interview',
    label: 'Interview',
    borderColor: 'border-t-purple-500',
    bgAccent: 'bg-purple-500',
    icon: 'event',
    cards: [
      { id: 'p7', driverName: 'Marcus J.', carrier: 'XPO Logistics', score: 94, daysInStage: 2, nextAction: 'Prep Notes', nextActionIcon: 'edit_note' },
      { id: 'p8', driverName: 'Priya P.', carrier: 'FedEx Freight', score: 76, daysInStage: 1, nextAction: 'Confirm Time', nextActionIcon: 'schedule' },
      { id: 'p9', driverName: 'Robert W.', carrier: 'Old Dominion', score: 91, daysInStage: 4, nextAction: 'Collect Feedback', nextActionIcon: 'rate_review' },
    ],
  },
  {
    id: 'offer',
    label: 'Offer',
    borderColor: 'border-t-emerald-500',
    bgAccent: 'bg-emerald-500',
    icon: 'description',
    cards: [
      { id: 'p10', driverName: 'Aisha M.', carrier: 'Heartland Express', score: 82, daysInStage: 2, nextAction: 'Send Offer', nextActionIcon: 'send' },
      { id: 'p11', driverName: 'David L.', carrier: 'Schneider National', score: 90, daysInStage: 1, nextAction: 'Negotiate Terms', nextActionIcon: 'handshake' },
      { id: 'p12', driverName: 'Wei Z.', carrier: 'JB Hunt', score: 87, daysInStage: 3, nextAction: 'Await Response', nextActionIcon: 'hourglass_top' },
    ],
  },
  {
    id: 'placed',
    label: 'Placed',
    borderColor: 'border-t-green-600',
    bgAccent: 'bg-green-600',
    icon: 'check_circle',
    cards: [
      { id: 'p13', driverName: 'Carlos M.', carrier: 'XPO Logistics', score: 90, daysInStage: 0, nextAction: 'Onboarding', nextActionIcon: 'school' },
      { id: 'p14', driverName: 'Tamika L.', carrier: 'Werner Enterprises', score: 87, daysInStage: 3, nextAction: 'Day 30 Check', nextActionIcon: 'event_available' },
      { id: 'p15', driverName: 'Jorge R.', carrier: 'Old Dominion', score: 93, daysInStage: 7, nextAction: 'Retention Call', nextActionIcon: 'support_agent' },
    ],
  },
];

/* ── Helpers ──────────────────────────────────────────────────── */
function getDaysVariant(days: number) {
  if (days <= 1) return 'success' as const;
  if (days <= 4) return 'warning' as const;
  return 'error' as const;
}

function getScoreVariant(score: number) {
  if (score >= 90) return 'success' as const;
  if (score >= 80) return 'info' as const;
  return 'warning' as const;
}

export default function PipelinePage() {
  const [columns, setColumns] = useState<PipelineColumn[]>(initialColumns);
  const [movingCard, setMovingCard] = useState<string | null>(null);

  const totalCandidates = columns.reduce((s, c) => s + c.cards.length, 0);

  // Move a card from its current column to the next column
  const moveCardForward = useCallback((cardId: string) => {
    setMovingCard(cardId);
    setColumns((prev) => {
      const newCols = prev.map((col) => ({ ...col, cards: [...col.cards] }));
      // Find which column has this card
      let sourceIdx = -1;
      let cardIdx = -1;
      for (let i = 0; i < newCols.length; i++) {
        const idx = newCols[i].cards.findIndex((c) => c.id === cardId);
        if (idx !== -1) {
          sourceIdx = i;
          cardIdx = idx;
          break;
        }
      }
      if (sourceIdx === -1 || cardIdx === -1 || sourceIdx >= newCols.length - 1) return prev;
      const [card] = newCols[sourceIdx].cards.splice(cardIdx, 1);
      newCols[sourceIdx + 1].cards.unshift({ ...card, daysInStage: 0 });
      return newCols;
    });
    setTimeout(() => setMovingCard(null), 300);
  }, []);

  // Move a card backward to the previous column
  const moveCardBackward = useCallback((cardId: string) => {
    setMovingCard(cardId);
    setColumns((prev) => {
      const newCols = prev.map((col) => ({ ...col, cards: [...col.cards] }));
      let sourceIdx = -1;
      let cardIdx = -1;
      for (let i = 0; i < newCols.length; i++) {
        const idx = newCols[i].cards.findIndex((c) => c.id === cardId);
        if (idx !== -1) {
          sourceIdx = i;
          cardIdx = idx;
          break;
        }
      }
      if (sourceIdx <= 0 || cardIdx === -1) return prev;
      const [card] = newCols[sourceIdx].cards.splice(cardIdx, 1);
      newCols[sourceIdx - 1].cards.unshift({ ...card, daysInStage: 0 });
      return newCols;
    });
    setTimeout(() => setMovingCard(null), 300);
  }, []);

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>Recruitment Pipeline</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>
            {totalCandidates} candidates across {columns.length} stages
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon="refresh" onClick={() => setColumns(initialColumns)}>
            Reset
          </Button>
          <Button variant="secondary" size="sm" icon="filter_list">Filter</Button>
          <Button size="sm" icon="person_add">Add Candidate</Button>
        </div>
      </div>

      {/* ── Pipeline Overview Bar ──────────────────────────────── */}
      <Card elevation="xs" className="!p-3 animate-fade-up stagger-1">
        <div className="flex gap-1 h-2 rounded-full overflow-hidden">
          {columns.map((col) => (
            <div
              key={col.id}
              className={`${col.bgAccent} transition-all duration-500`}
              style={{ width: `${(col.cards.length / Math.max(totalCandidates, 1)) * 100}%` }}
              title={`${col.label}: ${col.cards.length}`}
            />
          ))}
        </div>
      </Card>

      {/* ── Kanban Board ───────────────────────────────────────── */}
      <div className="overflow-x-auto pb-4 -mx-2 px-2">
        <div className="flex gap-5 min-w-max">
          {columns.map((column, colIdx) => (
            <div key={column.id} className={`w-[280px] shrink-0 animate-fade-up stagger-${colIdx + 1}`}>
              {/* Column Header */}
              <div className={`neu-s rounded-2xl mb-4 overflow-hidden border-t-[3px] ${column.borderColor}`}>
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg ${column.bgAccent} flex items-center justify-center`}>
                      <span className="material-symbols-outlined text-white text-[16px]">{column.icon}</span>
                    </div>
                    <span className="text-[13px] font-bold" style={{ color: 'var(--neu-text)' }}>{column.label}</span>
                  </div>
                  <Badge variant="default" className="!text-[12px] !font-bold">{column.cards.length}</Badge>
                </div>
              </div>

              {/* Column Cards */}
              <div className="space-y-3">
                {column.cards.map((card, cardIdx) => (
                  <Card
                    key={card.id}
                    elevation="sm"
                    hover
                    className={`!p-4 animate-fade-up ${movingCard === card.id ? 'opacity-60 scale-95 transition-all' : ''}`}
                    style={{ animationDelay: `${(colIdx * 0.05) + (cardIdx * 0.08)}s` } as React.CSSProperties}
                  >
                    {/* Driver Name + Days Badge */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="neu-x w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-accent)' }}>person</span>
                        </div>
                        <div>
                          <h4 className="text-[13px] font-bold leading-tight" style={{ color: 'var(--neu-text)' }}>{card.driverName}</h4>
                          <p className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>{card.carrier}</p>
                        </div>
                      </div>
                      <Badge variant={getDaysVariant(card.daysInStage)}>
                        {card.daysInStage === 0 ? 'Today' : `${card.daysInStage}d`}
                      </Badge>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 neu-ins rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            card.score >= 90 ? 'bg-green-500' : card.score >= 80 ? 'bg-blue-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${card.score}%` }}
                        />
                      </div>
                      <Badge variant={getScoreVariant(card.score)} className="!text-[10px]">{card.score}%</Badge>
                    </div>

                    {/* Next Action + Move Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--neu-accent)' }}>{card.nextActionIcon}</span>
                        <span className="text-[11px] font-semibold" style={{ color: 'var(--neu-accent)' }}>{card.nextAction}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {colIdx > 0 && (
                          <button
                            onClick={() => moveCardBackward(card.id)}
                            className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/5 transition-colors"
                            title={`Move to ${columns[colIdx - 1].label}`}
                          >
                            <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--neu-text-muted)' }}>chevron_left</span>
                          </button>
                        )}
                        {colIdx < columns.length - 1 && (
                          <button
                            onClick={() => moveCardForward(card.id)}
                            className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/5 transition-colors"
                            title={`Move to ${columns[colIdx + 1].label}`}
                          >
                            <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--neu-accent)' }}>chevron_right</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
