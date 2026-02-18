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
  runAnomalyDetection: jest.fn()
}));

jest.mock('backend/compendiumService', () => ({
  getCompendiumIndex: jest.fn(),
  createCompendiumEntry: jest.fn(),
  updateCompendiumEntry: jest.fn()
}));

jest.mock('backend/agentRunLedgerService', () => ({
  logStep: jest.fn(),
  createGate: jest.fn()
}));

jest.mock('backend/aiRouterService', () => ({
  updateProviderConfig: jest.fn()
}));

const dataAccess = require('backend/dataAccess');
const { runAnomalyDetection } = require('backend/observabilityService');
const { getCompendiumIndex, createCompendiumEntry, updateCompendiumEntry } = require('backend/compendiumService');
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
      runAnomalyDetection.mockResolvedValue({
        anomalies: [
          { anomaly_id: 'a1', metric: 'error_rate', severity: 'critical', value: 15.2 },
          { anomaly_id: 'a2', metric: 'response_time', severity: 'warning', value: 3200 }
        ]
      });
      getCompendiumIndex.mockResolvedValue({
        entries: [
          { topic: 'high-error-rate-playbook', type: 'playbook', confidence: 90 },
          { topic: 'slow-response-playbook', type: 'playbook', confidence: 85 }
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
      runAnomalyDetection.mockResolvedValue({ anomalies: [] });

      const result = await detectAndTriage();

      expect(result.incidents).toEqual([]);
      expect(result.critical_count).toBe(0);
      expect(result.warning_count).toBe(0);
      expect(dataAccess.insertRecord).not.toHaveBeenCalled();
    });

    it('classifies severity correctly for each anomaly', async () => {
      runAnomalyDetection.mockResolvedValue({
        anomalies: [
          { anomaly_id: 'a1', metric: 'error_rate', severity: 'critical', value: 20 },
          { anomaly_id: 'a2', metric: 'latency', severity: 'info', value: 500 }
        ]
      });
      getCompendiumIndex.mockResolvedValue({ entries: [] });
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
      createGate.mockResolvedValue({ gateId: 'gate-1' });

      const result = await proposeRemediation('inc-1');

      expect(result.planId).toBeDefined();
      expect(result.gateId).toBe('gate-1');
      expect(result.actions).toEqual(expect.arrayContaining([
        expect.stringContaining('cache')
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
      createGate.mockResolvedValue({ gateId: 'gate-2' });

      const result = await proposeRemediation('inc-2');

      expect(result.actions).toEqual(expect.arrayContaining([
        expect.stringMatching(/failover|circuit.breaker|backup/i)
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
          incident_id: 'inc-3',
          severity: 'warning',
          probable_cause: 'slow_response',
          status: 'open'
        }]
      });
      dataAccess.insertRecord.mockResolvedValue({});
      createGate.mockResolvedValue({ gateId: 'gate-3' });

      const result = await proposeRemediation('inc-3');

      expect(createGate).toHaveBeenCalledWith(
        expect.objectContaining({
          incident_id: 'inc-3'
        })
      );
      expect(result.gateId).toBe('gate-3');
    });
  });

  // ── executeRemediation ────────────────────────────────────────────────

  describe('executeRemediation', () => {
    it('executes approved plan actions and updates status', async () => {
      dataAccess.queryRecords.mockResolvedValue({
        items: [{
          _id: 'rec-plan1',
          plan_id: 'plan-1',
          incident_id: 'inc-1',
          actions: JSON.stringify(['clear_cache', 'retry_jobs']),
          status: 'approved'
        }]
      });
      dataAccess.updateRecord.mockResolvedValue({});
      logStep.mockResolvedValue({});

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
          status: 'proposed'
        }]
      });

      const result = await executeRemediation('plan-2', 'admin-user-1');

      expect(result.error).toBeDefined();
      expect(result.error).toContain('approved');
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
        .mockResolvedValueOnce({
          items: [{
            _id: 'rec-plan1',
            plan_id: 'plan-1',
            incident_id: 'inc-1',
            status: 'executed'
          }]
        })
        .mockResolvedValueOnce({
          items: [{
            incident_id: 'inc-1',
            anomaly_id: 'a1',
            severity: 'critical'
          }]
        });

      runAnomalyDetection.mockResolvedValue({ anomalies: [] });
      dataAccess.updateRecord.mockResolvedValue({});
      createCompendiumEntry.mockResolvedValue({ created: true });

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
        .mockResolvedValueOnce({
          items: [{
            _id: 'rec-plan2',
            plan_id: 'plan-2',
            incident_id: 'inc-2',
            status: 'executed'
          }]
        })
        .mockResolvedValueOnce({
          items: [{
            incident_id: 'inc-2',
            anomaly_id: 'a2',
            severity: 'critical'
          }]
        });

      runAnomalyDetection.mockResolvedValue({
        anomalies: [{ anomaly_id: 'a2', metric: 'error_rate', severity: 'critical' }]
      });
      dataAccess.updateRecord.mockResolvedValue({});

      const result = await verifyRemediation('plan-2');

      expect(result.verified).toBe(false);
      expect(dataAccess.updateRecord).toHaveBeenCalledWith(
        'remediationPlans',
        'rec-plan2',
        expect.objectContaining({ status: 'failed' }),
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

    it('excludes resolved and false_positive incidents', async () => {
      dataAccess.queryRecords.mockResolvedValue({
        items: [
          { incident_id: 'inc-1', severity: 'critical', status: 'open' }
        ]
      });

      await getActiveIncidents();

      expect(dataAccess.queryRecords).toHaveBeenCalledWith(
        'incidentLog',
        expect.objectContaining({
          filters: expect.objectContaining({
            status: expect.objectContaining({ nin: ['resolved', 'false_positive'] })
          }),
          suppressAuth: true
        })
      );
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
            severity: 'critical',
            probable_cause: 'high_error_rate',
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
            actions: JSON.stringify(['clear_cache']),
            executed_at: '2026-02-10',
            verified_at: '2026-02-10'
          }]
        });

      const result = await getIncidentTimeline('inc-1');

      expect(result.incident).toBeDefined();
      expect(result.incident.incident_id).toBe('inc-1');
      expect(result.remediation_plan).toBeDefined();
      expect(result.remediation_plan.plan_id).toBe('plan-1');
    });

    it('returns null when incident not found', async () => {
      dataAccess.queryRecords.mockResolvedValue({ items: [] });

      const result = await getIncidentTimeline('nonexistent');

      expect(result).toBeNull();
    });
  });
});
