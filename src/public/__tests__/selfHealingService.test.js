/**
 * Self-Healing Service Tests
 * Tests anomaly detection, triage, remediation proposals, execution, verification, and incident queries
 */

jest.mock('backend/dataAccess', () => ({
  queryRecords: jest.fn(),
  insertRecord: jest.fn(),
  updateRecord: jest.fn()
}));

jest.mock('backend/observabilityService', () => ({
  runAnomalyDetection: jest.fn(),
  getHealthMetrics: jest.fn(),
  recordMetric: jest.fn(),
  createAnomalyRule: jest.fn()
}));

jest.mock('backend/compendiumService', () => ({
  getCompendiumIndex: jest.fn(),
  getCompendiumEntry: jest.fn(),
  createCompendiumEntry: jest.fn(),
  updateCompendiumEntry: jest.fn()
}));

jest.mock('backend/agentRunLedgerService', () => ({
  logStep: jest.fn(),
  createGate: jest.fn()
}));

jest.mock('backend/aiRouterService', () => ({
  updateProviderConfig: jest.fn(),
  updateCostOptimizerConfig: jest.fn()
}));

jest.mock('backend/admin_jobs_service', () => ({
  triggerJob: jest.fn()
}));

const dataAccess = require('backend/dataAccess');
const { runAnomalyDetection, getHealthMetrics } = require('backend/observabilityService');
const { getCompendiumIndex, getCompendiumEntry, createCompendiumEntry, updateCompendiumEntry } = require('backend/compendiumService');
const { logStep, createGate } = require('backend/agentRunLedgerService');
const { updateProviderConfig } = require('backend/aiRouterService');
const {
  detectAndTriage,
  proposeRemediation,
  executeRemediation,
  verifyRemediation,
  getIncidentTimeline,
  getActiveIncidents
} = require('backend/selfHealingService');

describe('SelfHealingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── detectAndTriage ───────────────────────────────────────────────────

  describe('detectAndTriage', () => {
    it('detects anomalies, matches playbooks, and creates incident records', async () => {
      runAnomalyDetection.mockResolvedValue();
      getCompendiumIndex.mockResolvedValue({
        entries: [
          { topic: 'high error rate playbook', type: 'playbook', confidence: 90 },
          { topic: 'slow response playbook', type: 'playbook', confidence: 85 }
        ]
      });
      // First queryRecords call: anomalyAlerts query
      dataAccess.queryRecords.mockResolvedValueOnce({
        items: [
          { _id: 'a1', type: 'error_spike', metric: 'error_rate', severity: 'critical', actualValue: 15.2 },
          { _id: 'a2', type: 'latency_drift', metric: 'response_time', severity: 'warning', actualValue: 3200 }
        ]
      });
      dataAccess.insertRecord.mockResolvedValue({});

      const result = await detectAndTriage();

      expect(result.incidents).toHaveLength(2);
      expect(result.critical_count).toBe(1);
      expect(result.warning_count).toBe(1);
      expect(dataAccess.insertRecord).toHaveBeenCalledWith(
        'incidentLog',
        expect.objectContaining({
          severity: 'critical',
          probable_cause: expect.any(String)
        }),
        { suppressAuth: true }
      );
    });

    it('returns empty when no anomalies detected', async () => {
      runAnomalyDetection.mockResolvedValue();
      // anomalyAlerts query returns empty
      dataAccess.queryRecords.mockResolvedValueOnce({ items: [] });

      const result = await detectAndTriage();

      expect(result.incidents).toEqual([]);
      expect(result.critical_count).toBe(0);
      expect(result.warning_count).toBe(0);
      expect(dataAccess.insertRecord).not.toHaveBeenCalled();
    });

    it('classifies severity correctly for each anomaly', async () => {
      runAnomalyDetection.mockResolvedValue();
      getCompendiumIndex.mockResolvedValue({ entries: [] });
      // anomalyAlerts query returns alerts with different severities
      dataAccess.queryRecords.mockResolvedValueOnce({
        items: [
          { _id: 'a1', type: 'error_spike', metric: 'error_rate', severity: 'critical', actualValue: 20 },
          { _id: 'a2', type: 'latency_drift', metric: 'latency', severity: 'info', actualValue: 500 }
        ]
      });
      dataAccess.insertRecord.mockResolvedValue({});

      const result = await detectAndTriage();

      expect(result.critical_count).toBe(1);
      expect(result.warning_count).toBe(0);
      const severities = result.incidents.map(i => i.severity);
      expect(severities).toContain('critical');
      expect(severities).toContain('info');
    });
  });

  // ── proposeRemediation ────────────────────────────────────────────────

  describe('proposeRemediation', () => {
    it('generates remediation plan for high_error_rate incident', async () => {
      dataAccess.queryRecords.mockResolvedValue({
        items: [{
          _id: 'rec-inc1',
          incident_id: 'inc-1',
          severity: 'critical',
          probable_cause: 'high_error_rate',
          matched_playbook: 'high-error-rate-playbook',
          status: 'open'
        }]
      });
      dataAccess.insertRecord.mockResolvedValue({});
      dataAccess.updateRecord.mockResolvedValue({});
      createGate.mockResolvedValue({ gateId: 'gate-1' });

      const result = await proposeRemediation('inc-1');

      expect(result.planId).toBeDefined();
      expect(result.gateId).toBe('gate-1');
      // Actions are objects with type/target/description fields
      expect(result.actions).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'clear_cache' })
      ]));
      expect(result.risk_assessment).toBeDefined();
      expect(dataAccess.insertRecord).toHaveBeenCalledWith(
        'remediationPlans',
        expect.objectContaining({
          incident_id: 'inc-1',
          status: 'proposed'
        }),
        { suppressAuth: true }
      );
    });

    it('generates remediation plan for api_failure incident', async () => {
      dataAccess.queryRecords.mockResolvedValue({
        items: [{
          _id: 'rec-inc2',
          incident_id: 'inc-2',
          severity: 'critical',
          probable_cause: 'api_failure',
          matched_playbook: 'api-failure-playbook',
          status: 'open'
        }]
      });
      dataAccess.insertRecord.mockResolvedValue({});
      dataAccess.updateRecord.mockResolvedValue({});
      createGate.mockResolvedValue({ gateId: 'gate-2' });

      const result = await proposeRemediation('inc-2');

      // Actions are objects; check for switch_provider and enable_circuit_breaker
      expect(result.actions).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'switch_provider' }),
        expect.objectContaining({ type: 'enable_circuit_breaker' })
      ]));
    });

    it('returns error when incident not found', async () => {
      dataAccess.queryRecords.mockResolvedValue({ items: [] });

      const result = await proposeRemediation('nonexistent');

      expect(result.error).toBeDefined();
      expect(createGate).not.toHaveBeenCalled();
    });

    it('creates approval gate for the proposed plan', async () => {
      dataAccess.queryRecords.mockResolvedValue({
        items: [{
          _id: 'rec-inc3',
          incident_id: 'inc-3',
          severity: 'warning',
          probable_cause: 'slow_response',
          status: 'open'
        }]
      });
      dataAccess.insertRecord.mockResolvedValue({});
      dataAccess.updateRecord.mockResolvedValue({});
      createGate.mockResolvedValue({ gateId: 'gate-3' });

      const result = await proposeRemediation('inc-3');

      // createGate is called with 5 positional args: runId, stepName, scope, description, level
      expect(createGate).toHaveBeenCalledWith(
        '',                        // runId
        '',                        // stepName
        'execute_fix',             // scope
        expect.stringContaining('inc-3'),  // description includes incident ID
        'execute_low'              // level (low risk = execute_low)
      );
      expect(result.gateId).toBe('gate-3');
    });
  });

  // ── executeRemediation ────────────────────────────────────────────────

  describe('executeRemediation', () => {
    it('executes approved plan actions and updates status', async () => {
      // Actions stored as JSON array of objects with type/target/description
      const planActions = [
        { type: 'clear_cache', target: 'observability', description: 'Clear error tracking caches' },
        { type: 'retry_jobs', target: 'scheduler', description: 'Re-trigger recently failed jobs' }
      ];
      dataAccess.queryRecords
        .mockResolvedValueOnce({
          items: [{
            _id: 'rec-plan1',
            plan_id: 'plan-1',
            incident_id: 'inc-1',
            actions: JSON.stringify(planActions),
            status: 'approved'
          }]
        })
        // _findRecordId for incident update
        .mockResolvedValueOnce({
          items: [{ _id: 'rec-inc1', incident_id: 'inc-1' }]
        });
      dataAccess.updateRecord.mockResolvedValue({});
      logStep.mockResolvedValue({});
      getHealthMetrics.mockResolvedValue({});

      const result = await executeRemediation('plan-1', 'admin-user-1');

      expect(result.planId).toBe('plan-1');
      expect(result.status).toBe('executed');
      expect(result.actions_completed).toBeGreaterThan(0);
      expect(dataAccess.updateRecord).toHaveBeenCalledWith(
        'remediationPlans',
        'rec-plan1',
        expect.objectContaining({ status: 'executed' }),
        { suppressAuth: true }
      );
    });

    it('rejects execution of non-approved plans', async () => {
      dataAccess.queryRecords.mockResolvedValue({
        items: [{
          plan_id: 'plan-2',
          status: 'executed'
        }]
      });

      const result = await executeRemediation('plan-2', 'admin-user-1');

      expect(result.error).toBeDefined();
      expect(result.error).toContain('executed');
      expect(logStep).not.toHaveBeenCalled();
    });

    it('returns error when plan not found', async () => {
      dataAccess.queryRecords.mockResolvedValue({ items: [] });

      const result = await executeRemediation('nonexistent', 'admin-user-1');

      expect(result.error).toBeDefined();
    });
  });

  // ── verifyRemediation ─────────────────────────────────────────────────

  describe('verifyRemediation', () => {
    it('marks plan as verified when metrics improve', async () => {
      dataAccess.queryRecords
        // 1st call: load plan
        .mockResolvedValueOnce({
          items: [{
            _id: 'rec-plan1',
            plan_id: 'plan-1',
            incident_id: 'inc-1',
            probable_cause: 'high_error_rate',
            actions: JSON.stringify([{ type: 'clear_cache' }]),
            status: 'executed'
          }]
        })
        // 2nd call: load incident
        .mockResolvedValueOnce({
          items: [{
            _id: 'rec-inc1',
            incident_id: 'inc-1',
            anomaly_type: 'error_spike',
            anomaly_id: 'a1',
            severity: 'critical',
            actual_value: 15,
            expected_value: 5
          }]
        })
        // 3rd call: recentAlerts (anomalyAlerts query) — empty = anomaly resolved
        .mockResolvedValueOnce({ items: [] })
        // 4th call: _findRecordId for incident update
        .mockResolvedValueOnce({
          items: [{ _id: 'rec-inc1', incident_id: 'inc-1' }]
        });

      runAnomalyDetection.mockResolvedValue();
      dataAccess.updateRecord.mockResolvedValue({});
      updateCompendiumEntry.mockResolvedValue({ updated: true });

      const result = await verifyRemediation('plan-1');

      expect(result.verified).toBe(true);
      expect(result.compendium_updated).toBe(true);
      expect(dataAccess.updateRecord).toHaveBeenCalledWith(
        'remediationPlans',
        'rec-plan1',
        expect.objectContaining({ status: 'verified' }),
        { suppressAuth: true }
      );
    });

    it('marks plan as failed when anomaly persists', async () => {
      dataAccess.queryRecords
        // 1st call: load plan
        .mockResolvedValueOnce({
          items: [{
            _id: 'rec-plan2',
            plan_id: 'plan-2',
            incident_id: 'inc-2',
            probable_cause: 'high_error_rate',
            status: 'executed'
          }]
        })
        // 2nd call: load incident
        .mockResolvedValueOnce({
          items: [{
            _id: 'rec-inc2',
            incident_id: 'inc-2',
            anomaly_type: 'error_spike',
            anomaly_id: 'a2',
            severity: 'critical',
            actual_value: 20,
            expected_value: 5
          }]
        })
        // 3rd call: recentAlerts (anomalyAlerts query) — still firing
        .mockResolvedValueOnce({
          items: [
            { _id: 'alert-1', type: 'error_spike', acknowledged: false }
          ]
        })
        // 4th call: _findRecordId for incident update
        .mockResolvedValueOnce({
          items: [{ _id: 'rec-inc2', incident_id: 'inc-2' }]
        });

      runAnomalyDetection.mockResolvedValue();
      dataAccess.updateRecord.mockResolvedValue({});

      const result = await verifyRemediation('plan-2');

      expect(result.verified).toBe(false);
      expect(dataAccess.updateRecord).toHaveBeenCalledWith(
        'remediationPlans',
        'rec-plan2',
        expect.objectContaining({ status: 'verification_failed' }),
        { suppressAuth: true }
      );
    });
  });

  // ── getActiveIncidents ────────────────────────────────────────────────

  describe('getActiveIncidents', () => {
    it('returns unresolved incidents grouped by severity', async () => {
      dataAccess.queryRecords.mockResolvedValue({
        items: [
          { incident_id: 'inc-1', severity: 'critical', status: 'open' },
          { incident_id: 'inc-2', severity: 'warning', status: 'investigating' },
          { incident_id: 'inc-3', severity: 'warning', status: 'open' },
          { incident_id: 'inc-4', severity: 'info', status: 'open' }
        ]
      });

      const result = await getActiveIncidents();

      expect(result.incidents).toHaveLength(4);
      expect(result.by_severity.critical).toBe(1);
      expect(result.by_severity.warning).toBe(2);
      expect(result.by_severity.info).toBe(1);
    });

    it('returns empty results when no active incidents', async () => {
      dataAccess.queryRecords.mockResolvedValue({ items: [] });

      const result = await getActiveIncidents();

      expect(result.incidents).toEqual([]);
      expect(result.by_severity.critical).toBe(0);
      expect(result.by_severity.warning).toBe(0);
      expect(result.by_severity.info).toBe(0);
    });

    it('excludes resolved and false_positive incidents via client-side filter', async () => {
      // The service fetches ALL incidents (no server-side status filter) then filters client-side
      dataAccess.queryRecords.mockResolvedValue({
        items: [
          { incident_id: 'inc-1', severity: 'critical', status: 'open' },
          { incident_id: 'inc-2', severity: 'warning', status: 'resolved' },
          { incident_id: 'inc-3', severity: 'info', status: 'false_positive' }
        ]
      });

      const result = await getActiveIncidents();

      // Only inc-1 should remain after client-side filtering
      expect(result.incidents).toHaveLength(1);
      expect(result.incidents[0].incident_id).toBe('inc-1');
      expect(result.by_severity.critical).toBe(1);
      expect(result.by_severity.warning).toBe(0);
      expect(result.by_severity.info).toBe(0);
    });
  });

  // ── getIncidentTimeline ───────────────────────────────────────────────

  describe('getIncidentTimeline', () => {
    it('returns full lifecycle for an incident', async () => {
      dataAccess.queryRecords
        // incident query
        .mockResolvedValueOnce({
          items: [{
            incident_id: 'inc-1',
            anomaly_type: 'error_spike',
            severity: 'critical',
            probable_cause: 'high_error_rate',
            matched_playbook: 'error playbook',
            confidence: 85,
            metric_name: 'error_rate',
            expected_value: 5,
            actual_value: 20,
            deviation: 15,
            status: 'resolved',
            created_at: '2026-02-10',
            resolved_at: '2026-02-10'
          }]
        })
        // remediation plan query
        .mockResolvedValueOnce({
          items: [{
            plan_id: 'plan-1',
            incident_id: 'inc-1',
            status: 'verified',
            risk_assessment: 'low',
            estimated_impact: 'Reduces error backlog',
            actions: JSON.stringify([{ type: 'clear_cache', target: 'observability', description: 'Clear caches' }]),
            approved_by: 'admin-1',
            gate_id: 'gate-1',
            created_at: '2026-02-10',
            executed_at: '2026-02-10',
            verified_at: '2026-02-10'
          }]
        });
      getCompendiumEntry.mockResolvedValue({ topic: 'self_healing_high_error_rate', content_summary: 'Auto-resolved' });

      const result = await getIncidentTimeline('inc-1');

      expect(result.incident).toBeDefined();
      expect(result.incident.incident_id).toBe('inc-1');
      expect(result.remediation_plan).toBeDefined();
      expect(result.remediation_plan.plan_id).toBe('plan-1');
    });

    it('returns error object when incident not found', async () => {
      dataAccess.queryRecords.mockResolvedValue({ items: [] });

      const result = await getIncidentTimeline('nonexistent');

      expect(result.error).toBeDefined();
      expect(result.error).toBe('Incident not found');
    });
  });
});
