'use client';

import { Card, Badge, Button } from '@/components/ui';

interface PipelineCard {
  id: string;
  driverName: string;
  position: string;
  daysInStage: number;
  matchScore: number;
}

interface PipelineColumn {
  id: string;
  label: string;
  color: string;
  icon: string;
  cards: PipelineCard[];
}

const pipelineColumns: PipelineColumn[] = [
  {
    id: 'new-lead',
    label: 'New Lead',
    color: 'text-lmdr-blue',
    icon: 'fiber_new',
    cards: [
      { id: 'p1', driverName: 'Ahmed R.', position: 'OTR Dry Van', daysInStage: 1, matchScore: 88 },
      { id: 'p2', driverName: 'Linda K.', position: 'Regional Reefer', daysInStage: 2, matchScore: 79 },
      { id: 'p3', driverName: 'Mike T.', position: 'Dedicated Flatbed', daysInStage: 0, matchScore: 92 },
    ],
  },
  {
    id: 'contacted',
    label: 'Contacted',
    color: 'text-status-pending',
    icon: 'chat',
    cards: [
      { id: 'p4', driverName: 'Sarah C.', position: 'Regional Reefer', daysInStage: 3, matchScore: 88 },
      { id: 'p5', driverName: 'James O.', position: 'OTR Dry Van', daysInStage: 5, matchScore: 85 },
    ],
  },
  {
    id: 'interview',
    label: 'Interview',
    color: 'text-sg',
    icon: 'event',
    cards: [
      { id: 'p6', driverName: 'Marcus J.', position: 'OTR Dry Van', daysInStage: 2, matchScore: 94 },
      { id: 'p7', driverName: 'Priya P.', position: 'Local Delivery', daysInStage: 1, matchScore: 76 },
      { id: 'p8', driverName: 'Robert W.', position: 'OTR Flatbed', daysInStage: 4, matchScore: 91 },
    ],
  },
  {
    id: 'offer',
    label: 'Offer',
    color: 'text-carrier-blue',
    icon: 'description',
    cards: [
      { id: 'p9', driverName: 'Aisha M.', position: 'Regional Reefer', daysInStage: 2, matchScore: 82 },
    ],
  },
  {
    id: 'placed',
    label: 'Placed',
    color: 'text-sg',
    icon: 'check_circle',
    cards: [
      { id: 'p10', driverName: 'Carlos M.', position: 'OTR Dry Van', daysInStage: 0, matchScore: 90 },
      { id: 'p11', driverName: 'Tamika L.', position: 'Dedicated Reefer', daysInStage: 3, matchScore: 87 },
    ],
  },
];

function getDaysVariant(days: number) {
  if (days <= 2) return 'success' as const;
  if (days <= 5) return 'warning' as const;
  return 'error' as const;
}

export default function PipelinePage() {
  const totalCandidates = pipelineColumns.reduce((sum, col) => sum + col.cards.length, 0);

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-lmdr-dark">Recruitment Pipeline</h2>
          <p className="text-sm text-tan">{totalCandidates} candidates across {pipelineColumns.length} stages</p>
        </div>
        <Button size="sm">
          <span className="material-symbols-outlined text-base mr-1">person_add</span>
          Add Candidate
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-5 min-w-max">
          {pipelineColumns.map((column) => (
            <div key={column.id} className="w-72 shrink-0">
              {/* Column Header */}
              <Card elevation="sm" className="mb-3 !p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-lg ${column.color}`}>{column.icon}</span>
                    <span className="text-sm font-semibold text-lmdr-dark">{column.label}</span>
                  </div>
                  <Badge variant="default">{column.cards.length}</Badge>
                </div>
              </Card>

              {/* Column Cards */}
              <div className="space-y-3">
                {column.cards.map((card) => (
                  <Card key={card.id} elevation="sm" className="!p-4 cursor-grab active:cursor-grabbing hover:shadow-[8px_8px_16px_#C8B896,-8px_-8px_16px_#FFFFF5] transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-semibold text-lmdr-dark">{card.driverName}</h4>
                      <Badge variant={getDaysVariant(card.daysInStage)}>
                        {card.daysInStage === 0 ? 'Today' : `${card.daysInStage}d`}
                      </Badge>
                    </div>
                    <p className="text-xs text-tan mb-3">{card.position}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-lmdr-blue/60">trending_up</span>
                        <span className="text-xs text-lmdr-dark font-medium">{card.matchScore}%</span>
                      </div>
                      <span className="material-symbols-outlined text-base text-tan/40" title="Drag to move">drag_indicator</span>
                    </div>
                  </Card>
                ))}

                {column.cards.length === 0 && (
                  <div className="border-2 border-dashed border-tan/20 rounded-xl p-6 text-center">
                    <p className="text-xs text-tan">No candidates</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
