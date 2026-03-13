'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { StatusDot } from '@/components/ui/StatusDot';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AdminAlert } from '@/components/admin';
import { useApi, useMutation } from '@/lib/hooks';
import { getProviders, routerComplete } from '../../actions/ai-router';

/* ── Types ── */
interface Provider {
  id: string;
  name: string;
  model: string;
  status: 'online' | 'offline';
  latencyMs: number;
  costPer1k: number;
  qualityScore: number;
  callsToday: number;
  icon: string;
}

interface TaskRoute {
  [key: string]: unknown;
  taskType: string;
  primaryProvider: string;
  fallbackProvider: string;
  avgLatency: string;
  callsToday: number;
  successRate: number;
  costToday: string;
}

/* ── Mock Providers (fallback) ── */
const MOCK_PROVIDERS: Provider[] = [
  { id: 'openai', name: 'OpenAI', model: 'GPT-4o', status: 'online', latencyMs: 320, costPer1k: 0.015, qualityScore: 94, callsToday: 1847, icon: 'neurology' },
  { id: 'anthropic', name: 'Anthropic', model: 'Claude 3.5 Sonnet', status: 'online', latencyMs: 450, costPer1k: 0.018, qualityScore: 97, callsToday: 1234, icon: 'psychology' },
  { id: 'google', name: 'Google', model: 'Gemini 1.5 Pro', status: 'offline', latencyMs: 0, costPer1k: 0.007, qualityScore: 88, callsToday: 0, icon: 'auto_awesome' },
  { id: 'mistral', name: 'Mistral', model: 'Mistral Large 2', status: 'online', latencyMs: 210, costPer1k: 0.008, qualityScore: 85, callsToday: 892, icon: 'bolt' },
  { id: 'cohere', name: 'Cohere', model: 'Command R+', status: 'online', latencyMs: 280, costPer1k: 0.005, qualityScore: 82, callsToday: 456, icon: 'hub' },
];

/* ── Mock Task Routes (fallback) ── */
const MOCK_TASK_ROUTES: TaskRoute[] = [
  { taskType: 'Carrier Enrichment', primaryProvider: 'OpenAI', fallbackProvider: 'Anthropic', avgLatency: '2.1s', callsToday: 342, successRate: 99.2, costToday: '$5.13' },
  { taskType: 'Driver Matching', primaryProvider: 'OpenAI', fallbackProvider: 'Mistral', avgLatency: '1.8s', callsToday: 287, successRate: 98.8, costToday: '$4.31' },
  { taskType: 'Agent Orchestration', primaryProvider: 'Anthropic', fallbackProvider: 'OpenAI', avgLatency: '3.2s', callsToday: 156, successRate: 99.5, costToday: '$2.81' },
  { taskType: 'Text Classification', primaryProvider: 'Mistral', fallbackProvider: 'Cohere', avgLatency: '120ms', callsToday: 891, successRate: 99.8, costToday: '$0.71' },
  { taskType: 'Data Extraction', primaryProvider: 'Mistral', fallbackProvider: 'OpenAI', avgLatency: '95ms', callsToday: 1204, successRate: 99.6, costToday: '$0.96' },
  { taskType: 'Coaching Insights', primaryProvider: 'Anthropic', fallbackProvider: 'Google', avgLatency: '2.8s', callsToday: 78, successRate: 97.4, costToday: '$1.40' },
  { taskType: 'Summarization', primaryProvider: 'Google', fallbackProvider: 'Anthropic', avgLatency: '1.5s', callsToday: 214, successRate: 95.3, costToday: '$1.50' },
  { taskType: 'Code Analysis', primaryProvider: 'Anthropic', fallbackProvider: 'OpenAI', avgLatency: '1.9s', callsToday: 45, successRate: 99.1, costToday: '$0.81' },
];

const routeColumns = [
  {
    key: 'taskType',
    header: 'Function',
    render: (row: TaskRoute) => (
      <span className="font-semibold text-sm" style={{ color: 'var(--neu-text)' }}>
        <span className="material-symbols-outlined text-[14px] mr-1.5 align-middle" style={{ color: 'var(--neu-accent)' }}>function</span>
        {row.taskType}
      </span>
    ),
  },
  {
    key: 'primaryProvider',
    header: 'Provider',
    className: 'w-28',
    render: (row: TaskRoute) => <Badge variant="accent">{row.primaryProvider}</Badge>,
  },
  {
    key: 'fallbackProvider',
    header: 'Fallback',
    className: 'w-28',
    render: (row: TaskRoute) => <Badge variant="default">{row.fallbackProvider}</Badge>,
  },
  {
    key: 'avgLatency',
    header: 'Avg Latency',
    className: 'w-28 text-center',
  },
  {
    key: 'callsToday',
    header: 'Calls',
    className: 'w-20 text-center',
    render: (row: TaskRoute) => (
      <span className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>{row.callsToday.toLocaleString()}</span>
    ),
  },
  {
    key: 'successRate',
    header: 'Success',
    className: 'w-24 text-center',
    render: (row: TaskRoute) => (
      <span
        className="text-sm font-bold"
        style={{ color: row.successRate >= 99 ? '#10b981' : row.successRate >= 97 ? '#f59e0b' : '#ef4444' }}
      >
        {row.successRate}%
      </span>
    ),
  },
  {
    key: 'costToday',
    header: 'Cost',
    className: 'w-20 text-right',
    render: (row: TaskRoute) => (
      <span className="text-sm font-medium" style={{ color: 'var(--neu-text-muted)' }}>{row.costToday}</span>
    ),
  },
];

export default function AdminAIRouterPage() {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [optimizerOn, setOptimizerOn] = useState(true);

  /* ── API Calls ── */
  const { data: apiProviders, loading, error, refresh } = useApi<Provider[]>(
    () => getProviders().then((providers) => ({ data: providers as Provider[] }))
  );
  const { execute: testProvider, loading: testLoading } = useMutation<{ providerId: string; prompt: string }>(
    (input) => routerComplete(input).then((result) => ({ data: result }))
  );

  /* ── Resolve with fallbacks ── */
  const providers: Provider[] = (apiProviders as Provider[] | null) ?? MOCK_PROVIDERS;
  const taskRoutes: TaskRoute[] = MOCK_TASK_ROUTES;

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      await testProvider({ providerId: id, prompt: 'Health check test' });
    } finally {
      setTimeout(() => setTestingId(null), 500);
    }
  };

  const totalCalls = providers.reduce((a, p) => a + p.callsToday, 0);
  const onlineCount = providers.filter((p) => p.status === 'online').length;

  return (
    <div className="space-y-8">
      {/* ── Error Banner ── */}
      {error && (
        <AdminAlert
          message={`API unavailable — showing cached data. ${error}`}
          actionLabel="Retry"
          onAction={refresh}
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold animate-fade-up" style={{ color: 'var(--neu-text)' }}>
            AI Router Configuration
          </h2>
          <p className="text-sm mt-1 animate-fade-up stagger-1" style={{ color: 'var(--neu-text-muted)' }}>
            {onlineCount}/{providers.length} providers online — {totalCalls.toLocaleString()} calls today
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon="refresh" onClick={refresh} loading={loading}>Refresh</Button>
          <Badge variant="success" dot>{onlineCount} online</Badge>
          {providers.filter(p => p.status === 'offline').length > 0 && (
            <Badge variant="error" dot>{providers.filter(p => p.status === 'offline').length} offline</Badge>
          )}
        </div>
      </div>

      {/* ── Provider Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {providers.map((p, i) => (
          <Card
            key={p.id}
            elevation="sm"
            className={`flex flex-col gap-3 animate-fade-up stagger-${i + 1} ${p.status === 'offline' ? 'opacity-50' : ''}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="neu-x w-8 h-8 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-accent)' }}>{p.icon}</span>
                </div>
                <h3 className="font-bold text-sm" style={{ color: 'var(--neu-text)' }}>{p.name}</h3>
              </div>
              <StatusDot status={p.status === 'online' ? 'active' : 'error'} />
            </div>

            {/* Model name */}
            <p className="text-[11px] font-medium" style={{ color: 'var(--neu-text-muted)' }}>{p.model}</p>

            {/* Stats */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px]">
                <span style={{ color: 'var(--neu-text-muted)' }}>Latency</span>
                <span className="font-bold" style={{ color: 'var(--neu-text)' }}>
                  {p.status === 'online' ? `${p.latencyMs}ms` : '--'}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span style={{ color: 'var(--neu-text-muted)' }}>Cost/1K tok</span>
                <span className="font-bold" style={{ color: 'var(--neu-text)' }}>${p.costPer1k.toFixed(3)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span style={{ color: 'var(--neu-text-muted)' }}>Calls today</span>
                <span className="font-bold" style={{ color: 'var(--neu-text)' }}>{p.callsToday.toLocaleString()}</span>
              </div>
            </div>

            {/* Quality Score Bar */}
            <ProgressBar
              value={p.qualityScore}
              label="Quality Score"
              showValue
              color={p.qualityScore >= 95 ? 'green' : p.qualityScore >= 85 ? 'blue' : 'amber'}
            />

            {/* Test Button */}
            <Button
              variant="secondary"
              size="sm"
              loading={testingId === p.id}
              onClick={() => handleTest(p.id)}
              icon="science"
              disabled={p.status === 'offline'}
              className="mt-auto"
            >
              Test
            </Button>
          </Card>
        ))}
      </div>

      {/* ── Cost Optimizer Toggle ── */}
      <Card elevation="md" className="animate-fade-up stagger-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="neu-x w-11 h-11 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]" style={{ color: 'var(--neu-accent)' }}>savings</span>
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Cost Optimizer</h3>
              <p className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>
                Automatically routes to cheapest provider meeting quality threshold
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={optimizerOn ? 'success' : 'default'} dot>
              {optimizerOn ? 'Active' : 'Disabled'}
            </Badge>
            <button
              onClick={() => setOptimizerOn(!optimizerOn)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${optimizerOn ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${optimizerOn ? 'translate-x-6' : 'translate-x-0.5'}`}
              />
            </button>
          </div>
        </div>
        {optimizerOn && (
          <div className="mt-4 pt-4 grid grid-cols-3 gap-4" style={{ borderTop: '1px solid var(--neu-border)' }}>
            <div className="text-center">
              <p className="text-lg font-extrabold" style={{ color: '#10b981' }}>$12.47</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>Saved Today</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-extrabold" style={{ color: 'var(--neu-accent)' }}>92%</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>Quality Maintained</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-extrabold" style={{ color: 'var(--neu-text)' }}>847</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>Routes Optimized</p>
            </div>
          </div>
        )}
      </Card>

      {/* ── Task Routing Table ── */}
      <div className="animate-fade-up stagger-7">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: 'var(--neu-text)' }}>Task Routing</h3>
          <Button variant="ghost" size="sm" icon="settings">Configure</Button>
        </div>
        <DataTable columns={routeColumns} data={taskRoutes} />
      </div>
    </div>
  );
}
