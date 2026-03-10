'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { StatusDot } from '@/components/ui/StatusDot';
import { ProgressBar } from '@/components/ui/ProgressBar';

/* ── Types ── */
type ServiceHealth = 'healthy' | 'degraded' | 'down';
type AlertSeverity = 'critical' | 'warning' | 'info';

interface Service {
  name: string;
  status: ServiceHealth;
  uptime: number;
  latencyP99: string;
  errorRate: number;
  instances: number;
  icon: string;
}

interface Alert {
  id: number;
  severity: AlertSeverity;
  message: string;
  service: string;
  time: string;
}

interface RecentError {
  [key: string]: unknown;
  timestamp: string;
  service: string;
  message: string;
  count: number;
}

/* ── Service URLs for health checks ── */
const SERVICE_URLS: Record<string, string> = {
  'api-gateway': process.env.NEXT_PUBLIC_LMDR_DRIVER_SERVICE_URL || 'https://lmdr-driver-service-140035137711.us-central1.run.app',
  'ai-intelligence': process.env.NEXT_PUBLIC_LMDR_AI_SERVICE_URL || 'https://lmdr-ai-service-140035137711.us-central1.run.app',
  'matching-engine': process.env.NEXT_PUBLIC_LMDR_MATCHING_SERVICE_URL || 'https://lmdr-matching-engine-140035137711.us-central1.run.app',
  'notification-svc': process.env.NEXT_PUBLIC_LMDR_NOTIFICATION_SERVICE_URL || 'https://lmdr-notifications-service-140035137711.us-central1.run.app',
  'analytics-pipe': process.env.NEXT_PUBLIC_LMDR_ANALYTICS_SERVICE_URL || 'https://lmdr-analytics-service-140035137711.us-central1.run.app',
};

/* ── Mock Services (fallback) ── */
const MOCK_SERVICES: Service[] = [
  { name: 'api-gateway', status: 'healthy', uptime: 99.98, latencyP99: '120ms', errorRate: 0.02, instances: 3, icon: 'dns' },
  { name: 'ai-intelligence', status: 'healthy', uptime: 99.95, latencyP99: '450ms', errorRate: 0.05, instances: 4, icon: 'psychology' },
  { name: 'matching-engine', status: 'healthy', uptime: 99.99, latencyP99: '200ms', errorRate: 0.01, instances: 2, icon: 'handshake' },
  { name: 'enrichment-worker', status: 'degraded', uptime: 98.50, latencyP99: '2.1s', errorRate: 1.50, instances: 2, icon: 'auto_awesome' },
  { name: 'notification-svc', status: 'healthy', uptime: 99.97, latencyP99: '80ms', errorRate: 0.03, instances: 1, icon: 'notifications' },
  { name: 'voice-service', status: 'healthy', uptime: 99.90, latencyP99: '350ms', errorRate: 0.10, instances: 2, icon: 'mic' },
  { name: 'analytics-pipe', status: 'healthy', uptime: 99.92, latencyP99: '180ms', errorRate: 0.08, instances: 1, icon: 'analytics' },
  { name: 'scheduler', status: 'down', uptime: 95.20, latencyP99: '--', errorRate: 4.80, instances: 0, icon: 'schedule' },
];

const statusDotVariant: Record<ServiceHealth, 'active' | 'warning' | 'error'> = {
  healthy: 'active',
  degraded: 'warning',
  down: 'error',
};

const statusBadgeVariant: Record<ServiceHealth, 'success' | 'warning' | 'error'> = {
  healthy: 'success',
  degraded: 'warning',
  down: 'error',
};

/* ── Mock Alerts (fallback) ── */
const MOCK_ALERTS: Alert[] = [
  { id: 1, severity: 'critical', message: 'scheduler service unreachable — 3 consecutive health check failures', service: 'scheduler', time: '2 min ago' },
  { id: 2, severity: 'warning', message: 'enrichment-worker error rate above 1% threshold (currently 1.5%)', service: 'enrichment-worker', time: '15 min ago' },
  { id: 3, severity: 'info', message: 'ai-intelligence auto-scaled to 4 instances (load spike detected)', service: 'ai-intelligence', time: '45 min ago' },
  { id: 4, severity: 'warning', message: 'Airtable API rate limit approaching — 78% of quota used', service: 'api-gateway', time: '1 hr ago' },
  { id: 5, severity: 'info', message: 'Scheduled maintenance: Cloud SQL failover test completed successfully', service: 'api-gateway', time: '3 hrs ago' },
];

const alertBadgeVariant: Record<AlertSeverity, 'error' | 'warning' | 'info'> = {
  critical: 'error',
  warning: 'warning',
  info: 'info',
};

const alertIcon: Record<AlertSeverity, string> = {
  critical: 'error',
  warning: 'warning',
  info: 'info',
};

/* ── Mock System Resources (fallback) ── */
const MOCK_RESOURCES = [
  { name: 'CPU Usage', value: 42, color: 'blue' as const, icon: 'memory' },
  { name: 'Memory', value: 67, color: 'purple' as const, icon: 'storage' },
  { name: 'Disk I/O', value: 23, color: 'green' as const, icon: 'hard_drive' },
];

/* ── Mock Recent Errors (fallback) ── */
const MOCK_RECENT_ERRORS: RecentError[] = [
  { timestamp: '14:23:07', service: 'scheduler', message: 'Connection refused: Cloud SQL primary endpoint', count: 12 },
  { timestamp: '14:18:45', service: 'enrichment-worker', message: 'Timeout: FMCSA API response exceeded 10s', count: 8 },
  { timestamp: '13:55:12', service: 'ai-intelligence', message: 'Rate limit: OpenAI 429 Too Many Requests', count: 3 },
  { timestamp: '13:42:30', service: 'api-gateway', message: 'Airtable 422: Invalid field name "status_type"', count: 5 },
  { timestamp: '12:18:55', service: 'voice-service', message: 'VAPI webhook: assistant-request timeout (5s)', count: 2 },
];

const errorColumns = [
  {
    key: 'timestamp',
    header: 'Time',
    className: 'w-24',
    render: (row: RecentError) => (
      <span className="font-mono text-[11px] font-bold" style={{ color: 'var(--neu-text-muted)' }}>{row.timestamp}</span>
    ),
  },
  {
    key: 'service',
    header: 'Service',
    className: 'w-36',
    render: (row: RecentError) => <Badge variant="accent">{row.service}</Badge>,
  },
  {
    key: 'message',
    header: 'Error Message',
    render: (row: RecentError) => (
      <span className="text-sm font-mono" style={{ color: 'var(--neu-text)' }}>{row.message}</span>
    ),
  },
  {
    key: 'count',
    header: 'Count',
    className: 'w-20 text-center',
    render: (row: RecentError) => (
      <Badge variant={row.count > 5 ? 'error' : 'warning'}>{row.count}x</Badge>
    ),
  },
];

export default function AdminObservabilityPage() {
  const [services, setServices] = useState<Service[]>(MOCK_SERVICES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const alerts = MOCK_ALERTS;
  const resources = MOCK_RESOURCES;
  const recentErrors = MOCK_RECENT_ERRORS;

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        MOCK_SERVICES.map(async (svc) => {
          const url = SERVICE_URLS[svc.name];
          if (!url) return svc;
          try {
            const start = Date.now();
            const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(5000) });
            const latency = Date.now() - start;
            if (res.ok) {
              return { ...svc, status: 'healthy' as ServiceHealth, latencyP99: `${latency}ms`, instances: svc.instances || 1 };
            }
            return { ...svc, status: 'degraded' as ServiceHealth, latencyP99: `${latency}ms` };
          } catch {
            return { ...svc, status: 'down' as ServiceHealth, latencyP99: '--', errorRate: 100, instances: 0 };
          }
        })
      );
      setServices(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkHealth(); }, [checkHealth]);

  const healthyCount = services.filter((s) => s.status === 'healthy').length;
  const degradedCount = services.filter((s) => s.status === 'degraded').length;
  const downCount = services.filter((s) => s.status === 'down').length;

  return (
    <div className="space-y-8">
      {/* ── Error Banner ── */}
      {error && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
          <span className="material-symbols-outlined text-[18px]">warning</span>
          <span>Health check failed — showing cached data. {error}</span>
          <button onClick={checkHealth} className="ml-auto font-semibold underline">Retry</button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold animate-fade-up" style={{ color: 'var(--neu-text)' }}>
            System Observability
          </h2>
          <p className="text-sm mt-1 animate-fade-up stagger-1" style={{ color: 'var(--neu-text-muted)' }}>
            Real-time infrastructure health monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" dot>{healthyCount} healthy</Badge>
          {degradedCount > 0 && <Badge variant="warning" dot>{degradedCount} degraded</Badge>}
          {downCount > 0 && <Badge variant="error" dot>{downCount} down</Badge>}
          <Button variant="ghost" size="sm" icon="refresh" onClick={checkHealth} loading={loading}>Refresh</Button>
        </div>
      </div>

      {/* ── Service Cards Grid (2x4) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((svc, i) => (
          <Card
            key={svc.name}
            elevation="sm"
            hover
            className={`flex flex-col gap-2 animate-fade-up stagger-${Math.min(i + 1, 8)} ${svc.status === 'down' ? 'ring-1 ring-red-400/30' : ''}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="neu-x w-8 h-8 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-accent)' }}>{svc.icon}</span>
                </div>
                <div>
                  <h3 className="text-[12px] font-bold" style={{ color: 'var(--neu-text)' }}>{svc.name}</h3>
                  <span className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>{svc.instances} instance{svc.instances !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <StatusDot status={statusDotVariant[svc.status]} />
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] mt-1">
              <span style={{ color: 'var(--neu-text-muted)' }}>Uptime</span>
              <span className="font-bold text-right" style={{ color: svc.uptime >= 99.9 ? '#10b981' : svc.uptime >= 98 ? '#f59e0b' : '#ef4444' }}>
                {svc.uptime.toFixed(2)}%
              </span>

              <span style={{ color: 'var(--neu-text-muted)' }}>P99 Latency</span>
              <span className="font-bold text-right" style={{ color: 'var(--neu-text)' }}>{svc.latencyP99}</span>

              <span style={{ color: 'var(--neu-text-muted)' }}>Error Rate</span>
              <span className="font-bold text-right" style={{ color: svc.errorRate > 1 ? '#ef4444' : svc.errorRate > 0.1 ? '#f59e0b' : '#10b981' }}>
                {svc.errorRate.toFixed(2)}%
              </span>
            </div>

            {/* Status badge */}
            <div className="mt-auto pt-2" style={{ borderTop: '1px solid var(--neu-border)' }}>
              <Badge variant={statusBadgeVariant[svc.status]} dot>{svc.status}</Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Alerts + System Resources row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Alerts (2/3) */}
        <Card elevation="md" className="lg:col-span-2 animate-fade-up stagger-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Active Alerts</h3>
            <Badge variant="error">{alerts.filter(a => a.severity === 'critical').length} critical</Badge>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--neu-border)' }}>
            {alerts.map((alert, i) => (
              <div key={alert.id} className={`flex items-start gap-3 py-3 animate-fade-up stagger-${Math.min(i + 1, 8)}`}>
                <div
                  className="neu-x w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                >
                  <span
                    className="material-symbols-outlined text-[16px]"
                    style={{
                      color: alert.severity === 'critical' ? '#ef4444' : alert.severity === 'warning' ? '#f59e0b' : '#3b82f6',
                    }}
                  >
                    {alertIcon[alert.severity]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant={alertBadgeVariant[alert.severity]}>{alert.severity}</Badge>
                    <Badge variant="default">{alert.service}</Badge>
                    <span className="text-[10px] ml-auto" style={{ color: 'var(--neu-text-muted)' }}>{alert.time}</span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--neu-text)' }}>{alert.message}</p>
                </div>
                <Button variant="ghost" size="sm" icon="check" className="shrink-0">ACK</Button>
              </div>
            ))}
          </div>
        </Card>

        {/* System Resources (1/3) */}
        <Card elevation="md" className="animate-fade-up stagger-6">
          <h3 className="text-base font-bold mb-5" style={{ color: 'var(--neu-text)' }}>System Resources</h3>
          <div className="space-y-5">
            {resources.map((r) => (
              <div key={r.name}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>{r.icon}</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>{r.name}</span>
                </div>
                <ProgressBar
                  value={r.value}
                  color={r.value > 80 ? 'red' : r.value > 60 ? 'amber' : r.color}
                  showValue
                />
              </div>
            ))}
          </div>

          {/* Extra metrics */}
          <div className="mt-6 pt-4 space-y-3" style={{ borderTop: '1px solid var(--neu-border)' }}>
            <div className="flex justify-between text-[11px]">
              <span style={{ color: 'var(--neu-text-muted)' }}>Active Connections</span>
              <span className="font-bold" style={{ color: 'var(--neu-text)' }}>1,247</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span style={{ color: 'var(--neu-text-muted)' }}>Requests/min</span>
              <span className="font-bold" style={{ color: 'var(--neu-text)' }}>8,421</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span style={{ color: 'var(--neu-text-muted)' }}>Avg Response</span>
              <span className="font-bold" style={{ color: '#10b981' }}>142ms</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span style={{ color: 'var(--neu-text-muted)' }}>Error Budget Left</span>
              <span className="font-bold" style={{ color: 'var(--neu-text)' }}>87.3%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Recent Errors Table ── */}
      <div className="animate-fade-up stagger-7">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: 'var(--neu-text)' }}>Recent Errors</h3>
          <Button variant="ghost" size="sm" icon="open_in_new">View All Logs</Button>
        </div>
        <DataTable columns={errorColumns} data={recentErrors} loading={loading} emptyMessage="No errors in the last 24 hours" emptyIcon="check_circle" />
      </div>
    </div>
  );
}
