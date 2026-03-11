import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import dashboardRouter from './dashboard.js';
import driversRouter from './drivers.js';
import carriersRouter from './carriers.js';
import matchesRouter from './matches.js';
import configRouter from './config.js';
import observabilityRouter from './observability.js';
import aiRouterRouter from './ai-router.js';
import auditRouter from './audit.js';
import billingRouter from './billing.js';

const router = Router();

// All admin routes require admin role
router.use(requireAdmin());

// Mount sub-routers
router.use('/dashboard', dashboardRouter);
router.use('/drivers', driversRouter);
router.use('/carriers', carriersRouter);
router.use('/matches', matchesRouter);
router.use('/config', configRouter);
router.use('/observability', observabilityRouter);
router.use('/ai-router', aiRouterRouter);
router.use('/audit', auditRouter);
router.use('/billing', billingRouter);

// ── GET /admin/manifest — AI tool definitions ──
const TOOL_DEFINITIONS = [
  { name: 'admin_get_dashboard_overview', description: 'Get dashboard overview with driver, carrier, match stats', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/admin/dashboard/overview' } },
  { name: 'admin_get_quick_stats', description: 'Get 4-stat quick snapshot (drivers, carriers, pending, flagged)', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/admin/dashboard/quick-stats' } },
  { name: 'admin_get_ai_usage', description: 'Get AI usage stats by provider', input_schema: { type: 'object', properties: { period: { type: 'string', default: '7d' } } }, endpoint: { method: 'GET', path: '/v1/admin/dashboard/ai-usage' } },
  { name: 'admin_list_drivers', description: 'List drivers with filters (status, verification, search text)', input_schema: { type: 'object', properties: { filters: { type: 'array' }, search: { type: 'string' }, limit: { type: 'number', default: 50 }, skip: { type: 'number', default: 0 } } }, endpoint: { method: 'POST', path: '/v1/admin/drivers/query' } },
  { name: 'admin_get_driver', description: 'Get full driver detail by ID (profile + applications + match history)', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/admin/drivers/:id' } },
  { name: 'admin_get_driver_stats', description: 'Get driver counts (total, active, pending, expired, new this week)', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/admin/drivers/stats' } },
  { name: 'admin_verify_driver', description: 'Verify a driver (sets status to active + verified)', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'POST', path: '/v1/admin/drivers/:id/verify' } },
  { name: 'admin_suspend_driver', description: 'Suspend a driver with reason', input_schema: { type: 'object', properties: { driverId: { type: 'string' }, reason: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'POST', path: '/v1/admin/drivers/:id/suspend' } },
  { name: 'admin_list_carriers', description: 'List carriers with filters', input_schema: { type: 'object', properties: { filters: { type: 'array' }, search: { type: 'string' }, limit: { type: 'number', default: 50 } } }, endpoint: { method: 'POST', path: '/v1/admin/carriers/query' } },
  { name: 'admin_get_carrier', description: 'Get full carrier detail (safety, enrichment, matches, interests)', input_schema: { type: 'object', properties: { carrierId: { type: 'string' } }, required: ['carrierId'] }, endpoint: { method: 'GET', path: '/v1/admin/carriers/:id' } },
  { name: 'admin_get_carrier_stats', description: 'Get carrier counts and enrichment coverage', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/admin/carriers/stats' } },
  { name: 'admin_list_matches', description: 'List match events with filters', input_schema: { type: 'object', properties: { filters: { type: 'array' }, limit: { type: 'number', default: 50 } } }, endpoint: { method: 'POST', path: '/v1/admin/matches/query' } },
  { name: 'admin_get_match_stats', description: 'Get match statistics (weekly, total, conversion rate)', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/admin/matches/stats' } },
  { name: 'admin_get_config', description: 'Get matching weights (carrier + driver)', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/admin/config/matching-weights' } },
  { name: 'admin_update_config', description: 'Update matching weights', input_schema: { type: 'object', properties: { carrier: { type: 'object' }, driver: { type: 'object' } } }, endpoint: { method: 'PUT', path: '/v1/admin/config/matching-weights' } },
  { name: 'admin_get_anomalies', description: 'Get active anomaly alerts', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/admin/observability/anomalies' } },
  { name: 'admin_ack_anomaly', description: 'Acknowledge an anomaly alert', input_schema: { type: 'object', properties: { anomalyId: { type: 'string' } }, required: ['anomalyId'] }, endpoint: { method: 'POST', path: '/v1/admin/observability/anomalies/:id/ack' } },
  { name: 'admin_get_revenue_snapshot', description: 'Get revenue snapshot (MRR, ARR, ARPU, plan mix)', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/admin/billing/revenue/snapshot' } },
  { name: 'admin_get_audit_stats', description: 'Get audit log statistics (counts, top admins, top actions)', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/admin/audit/stats' } },
  { name: 'admin_query_audit_log', description: 'Query the audit log with filters', input_schema: { type: 'object', properties: { filters: { type: 'array' }, limit: { type: 'number', default: 50 } } }, endpoint: { method: 'POST', path: '/v1/admin/audit/query' } },
  { name: 'admin_get_ai_router_config', description: 'Get AI provider routing configuration', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/admin/ai-router/config' } },
  { name: 'admin_get_ai_costs', description: 'Get AI provider cost metrics (30-day window)', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/admin/ai-router/costs' } },
  { name: 'admin_test_ai_provider', description: 'Test an AI provider health', input_schema: { type: 'object', properties: { providerId: { type: 'string' } }, required: ['providerId'] }, endpoint: { method: 'POST', path: '/v1/admin/ai-router/test' } },
];

router.get('/manifest', (req, res) => {
  return res.json({ tools: TOOL_DEFINITIONS, version: '1.0.0', generatedAt: new Date().toISOString() });
});

export default router;
