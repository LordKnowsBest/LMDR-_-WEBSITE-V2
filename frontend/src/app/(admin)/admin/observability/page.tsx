'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

type ServiceHealth = 'healthy' | 'degraded' | 'down';

interface Service {
  name: string;
  status: ServiceHealth;
  uptime: string;
  errorRate: string;
  latencyP99: string;
  lastCheck: string;
}

const services: Service[] = [
  { name: 'api-gateway', status: 'healthy', uptime: '99.98%', errorRate: '0.02%', latencyP99: '120ms', lastCheck: '30s ago' },
  { name: 'ai-intelligence', status: 'healthy', uptime: '99.95%', errorRate: '0.05%', latencyP99: '450ms', lastCheck: '30s ago' },
  { name: 'matching-engine', status: 'healthy', uptime: '99.99%', errorRate: '0.01%', latencyP99: '200ms', lastCheck: '30s ago' },
  { name: 'enrichment-worker', status: 'degraded', uptime: '98.50%', errorRate: '1.50%', latencyP99: '2.1s', lastCheck: '30s ago' },
  { name: 'notification-service', status: 'healthy', uptime: '99.97%', errorRate: '0.03%', latencyP99: '80ms', lastCheck: '30s ago' },
  { name: 'voice-service', status: 'healthy', uptime: '99.90%', errorRate: '0.10%', latencyP99: '350ms', lastCheck: '30s ago' },
  { name: 'analytics-pipeline', status: 'healthy', uptime: '99.92%', errorRate: '0.08%', latencyP99: '180ms', lastCheck: '30s ago' },
  { name: 'scheduler', status: 'down', uptime: '95.20%', errorRate: '4.80%', latencyP99: '—', lastCheck: '2 min ago' },
];

const alerts = [
  { id: 1, severity: 'critical', message: 'scheduler service unreachable — 3 consecutive health check failures', time: '2 min ago' },
  { id: 2, severity: 'warning', message: 'enrichment-worker error rate above 1% threshold (currently 1.5%)', time: '15 min ago' },
  { id: 3, severity: 'info', message: 'ai-intelligence auto-scaled to 4 instances (load spike)', time: '45 min ago' },
  { id: 4, severity: 'warning', message: 'Airtable API rate limit approaching — 78% of quota used', time: '1 hr ago' },
  { id: 5, severity: 'info', message: 'Scheduled maintenance: Cloud SQL failover test completed successfully', time: '3 hrs ago' },
];

const statusColor: Record<ServiceHealth, string> = {
  healthy: 'bg-sg',
  degraded: 'bg-status-pending',
  down: 'bg-status-suspended',
};

const statusBadge: Record<ServiceHealth, 'success' | 'warning' | 'error'> = {
  healthy: 'success',
  degraded: 'warning',
  down: 'error',
};

const alertBadge: Record<string, 'error' | 'warning' | 'info'> = {
  critical: 'error',
  warning: 'warning',
  info: 'info',
};

export default function AdminObservabilityPage() {
  const healthyCount = services.filter((s) => s.status === 'healthy').length;
  const degradedCount = services.filter((s) => s.status === 'degraded').length;
  const downCount = services.filter((s) => s.status === 'down').length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-lmdr-dark">System Observability</h2>
        <div className="flex items-center gap-3">
          <Badge variant="success">{healthyCount} healthy</Badge>
          {degradedCount > 0 && <Badge variant="warning">{degradedCount} degraded</Badge>}
          {downCount > 0 && <Badge variant="error">{downCount} down</Badge>}
        </div>
      </div>

      {/* Service Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((svc) => (
          <Card key={svc.name} elevation="sm" className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${statusColor[svc.status]}`} />
                <h3 className="text-sm font-semibold text-lmdr-dark">{svc.name}</h3>
              </div>
              <Badge variant={statusBadge[svc.status]}>{svc.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-1">
              <span className="text-tan">Uptime</span>
              <span className="text-lmdr-dark font-medium text-right">{svc.uptime}</span>
              <span className="text-tan">Error Rate</span>
              <span className={`font-medium text-right ${parseFloat(svc.errorRate) > 1 ? 'text-status-suspended' : 'text-lmdr-dark'}`}>
                {svc.errorRate}
              </span>
              <span className="text-tan">P99 Latency</span>
              <span className="text-lmdr-dark font-medium text-right">{svc.latencyP99}</span>
              <span className="text-tan">Last Check</span>
              <span className="text-lmdr-dark font-medium text-right">{svc.lastCheck}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Error Rate Trends Placeholder */}
      <Card elevation="md">
        <h3 className="font-semibold text-lmdr-dark mb-4">Error Rate Trends (24h)</h3>
        <div className="h-48 rounded-lg bg-beige-d/50 flex items-center justify-center border border-tan/10">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl text-tan/40">show_chart</span>
            <p className="text-sm text-tan mt-2">Time-series chart renders here when API is connected</p>
          </div>
        </div>
      </Card>

      {/* Recent Alerts */}
      <Card elevation="md">
        <h3 className="font-semibold text-lmdr-dark mb-4">Recent Alerts</h3>
        <div className="divide-y divide-tan/10">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-3 py-3">
              <span className={`material-symbols-outlined text-lg mt-0.5 ${
                alert.severity === 'critical' ? 'text-status-suspended' :
                alert.severity === 'warning' ? 'text-status-pending' : 'text-lmdr-blue'
              }`}>
                {alert.severity === 'critical' ? 'error' : alert.severity === 'warning' ? 'warning' : 'info'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant={alertBadge[alert.severity]}>{alert.severity}</Badge>
                  <span className="text-xs text-tan">{alert.time}</span>
                </div>
                <p className="text-sm text-lmdr-dark mt-1">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
