'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';

interface Provider {
  id: string;
  name: string;
  model: string;
  status: 'online' | 'offline';
  latency: string;
  costPer1k: string;
  tasks: string[];
}

interface TaskRoute {
  [key: string]: unknown;
  taskType: string;
  primaryProvider: string;
  fallbackProvider: string;
  avgLatency: string;
  callsToday: number;
}

const providers: Provider[] = [
  { id: 'openai', name: 'OpenAI', model: 'GPT-4o', status: 'online', latency: '320ms', costPer1k: '$0.015', tasks: ['enrichment', 'matching'] },
  { id: 'claude', name: 'Claude', model: 'Claude 3.5 Sonnet', status: 'online', latency: '450ms', costPer1k: '$0.018', tasks: ['agent_orchestration', 'coaching'] },
  { id: 'groq', name: 'Groq', model: 'Llama 3.1 70B', status: 'online', latency: '85ms', costPer1k: '$0.001', tasks: ['classification', 'extraction'] },
  { id: 'gemini', name: 'Gemini', model: 'Gemini 1.5 Pro', status: 'offline', latency: '—', costPer1k: '$0.007', tasks: ['summarization'] },
  { id: 'deepseek', name: 'DeepSeek', model: 'DeepSeek V3', status: 'online', latency: '210ms', costPer1k: '$0.002', tasks: ['coding', 'analysis'] },
];

const taskRoutes: TaskRoute[] = [
  { taskType: 'Carrier Enrichment', primaryProvider: 'OpenAI', fallbackProvider: 'Claude', avgLatency: '2.1s', callsToday: 342 },
  { taskType: 'Driver Matching', primaryProvider: 'OpenAI', fallbackProvider: 'Groq', avgLatency: '1.8s', callsToday: 287 },
  { taskType: 'Agent Orchestration', primaryProvider: 'Claude', fallbackProvider: 'OpenAI', avgLatency: '3.2s', callsToday: 156 },
  { taskType: 'Text Classification', primaryProvider: 'Groq', fallbackProvider: 'DeepSeek', avgLatency: '120ms', callsToday: 891 },
  { taskType: 'Data Extraction', primaryProvider: 'Groq', fallbackProvider: 'OpenAI', avgLatency: '95ms', callsToday: 1204 },
  { taskType: 'Coaching Insights', primaryProvider: 'Claude', fallbackProvider: 'Gemini', avgLatency: '2.8s', callsToday: 78 },
  { taskType: 'Summarization', primaryProvider: 'Gemini', fallbackProvider: 'Claude', avgLatency: '1.5s', callsToday: 214 },
  { taskType: 'Code Analysis', primaryProvider: 'DeepSeek', fallbackProvider: 'Claude', avgLatency: '1.9s', callsToday: 45 },
];

const routeColumns = [
  { key: 'taskType', header: 'Task Type' },
  { key: 'primaryProvider', header: 'Primary', render: (row: TaskRoute) => <span className="font-medium text-lmdr-dark">{row.primaryProvider}</span> },
  { key: 'fallbackProvider', header: 'Fallback', render: (row: TaskRoute) => <span className="text-tan">{row.fallbackProvider}</span> },
  { key: 'avgLatency', header: 'Avg Latency', className: 'w-28 text-center' },
  { key: 'callsToday', header: 'Calls Today', className: 'w-28 text-center', render: (row: TaskRoute) => row.callsToday.toLocaleString() },
];

export default function AdminAIRouterPage() {
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleTest = (id: string) => {
    setTestingId(id);
    setTimeout(() => setTestingId(null), 2000);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-lmdr-dark">AI Router Configuration</h2>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {providers.map((p) => (
          <Card key={p.id} elevation="sm" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lmdr-dark">{p.name}</h3>
              <span className={`inline-block w-3 h-3 rounded-full ${p.status === 'online' ? 'bg-sg' : 'bg-status-suspended'}`} />
            </div>
            <p className="text-xs text-tan">{p.model}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-tan">Latency</span>
              <span className="font-medium text-lmdr-dark">{p.latency}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-tan">Cost/1K</span>
              <span className="font-medium text-lmdr-dark">{p.costPer1k}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {p.tasks.map((t) => (
                <Badge key={t} variant="info">{t}</Badge>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              loading={testingId === p.id}
              onClick={() => handleTest(p.id)}
              className="mt-auto"
            >
              <span className="material-symbols-outlined text-base mr-1">science</span>
              Test
            </Button>
          </Card>
        ))}
      </div>

      {/* Task Routing Table */}
      <div>
        <h3 className="text-lg font-semibold text-lmdr-dark mb-4">Task Routing</h3>
        <DataTable columns={routeColumns} data={taskRoutes} />
      </div>
    </div>
  );
}
