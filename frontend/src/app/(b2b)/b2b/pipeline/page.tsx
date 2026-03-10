'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface Deal {
  id: string;
  company: string;
  value: number;
  daysInStage: number;
  owner: string;
}

const stages: { key: string; label: string; color: string }[] = [
  { key: 'prospect', label: 'Prospect', color: 'bg-neutral-light' },
  { key: 'qualified', label: 'Qualified', color: 'bg-blue-50' },
  { key: 'demo', label: 'Demo', color: 'bg-blue-100' },
  { key: 'proposal', label: 'Proposal', color: 'bg-amber-50' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-amber-100' },
  { key: 'won', label: 'Closed Won', color: 'bg-green-50' },
  { key: 'lost', label: 'Closed Lost', color: 'bg-red-50' },
];

const deals: Record<string, Deal[]> = {
  prospect: [
    { id: 'D-101', company: 'Saia Inc.', value: 95000, daysInStage: 3, owner: 'SK' },
    { id: 'D-102', company: 'Estes Express', value: 120000, daysInStage: 7, owner: 'AR' },
  ],
  qualified: [
    { id: 'D-103', company: 'Knight-Swift', value: 150000, daysInStage: 5, owner: 'SK' },
    { id: 'D-104', company: 'ABF Freight', value: 80000, daysInStage: 12, owner: 'JM' },
  ],
  demo: [
    { id: 'D-105', company: 'J.B. Hunt', value: 320000, daysInStage: 2, owner: 'AR' },
  ],
  proposal: [
    { id: 'D-106', company: 'Schneider National', value: 185000, daysInStage: 8, owner: 'JM' },
    { id: 'D-107', company: 'Ryder System', value: 145000, daysInStage: 4, owner: 'AR' },
  ],
  negotiation: [
    { id: 'D-108', company: 'Werner Enterprises', value: 240000, daysInStage: 6, owner: 'AR' },
    { id: 'D-109', company: 'XPO Logistics', value: 210000, daysInStage: 11, owner: 'JM' },
  ],
  won: [
    { id: 'D-110', company: 'Old Dominion', value: 175000, daysInStage: 0, owner: 'JM' },
  ],
  lost: [
    { id: 'D-111', company: 'Heartland Express', value: 90000, daysInStage: 0, owner: 'AR' },
  ],
};

function formatCurrency(val: number) {
  return val >= 1000 ? `$${(val / 1000).toFixed(0)}K` : `$${val}`;
}

function stageTotal(stageDeals: Deal[]) {
  return stageDeals.reduce((sum, d) => sum + d.value, 0);
}

export default function B2BPipelinePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-lmdr-dark">Sales Pipeline</h2>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageDeals = deals[stage.key] ?? [];
          return (
            <div key={stage.key} className="flex-shrink-0 w-64">
              {/* Column Header */}
              <Card elevation="sm" className="mb-3 py-3 px-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-lmdr-dark">{stage.label}</h4>
                  <span className="text-xs text-tan">{stageDeals.length}</span>
                </div>
                <p className="text-xs text-tan mt-0.5">{formatCurrency(stageTotal(stageDeals))}</p>
              </Card>

              {/* Deal Cards */}
              <div className="space-y-3">
                {stageDeals.map((deal) => (
                  <Card key={deal.id} elevation="sm" className="p-4 cursor-pointer hover:shadow-[4px_4px_8px_#C8B896,-4px_-4px_8px_#FFFFF5] transition-shadow">
                    <p className="text-sm font-medium text-lmdr-dark mb-1">{deal.company}</p>
                    <p className="text-lg font-bold text-lmdr-dark">{formatCurrency(deal.value)}</p>
                    <div className="flex items-center justify-between mt-2">
                      {deal.daysInStage > 0 ? (
                        <Badge variant={deal.daysInStage > 10 ? 'warning' : 'default'}>
                          {deal.daysInStage}d in stage
                        </Badge>
                      ) : (
                        <span />
                      )}
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-lmdr-blue/10 text-xs font-semibold text-lmdr-blue">
                        {deal.owner}
                      </span>
                    </div>
                  </Card>
                ))}
                {stageDeals.length === 0 && (
                  <div className="text-center py-6 text-xs text-tan">No deals</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
