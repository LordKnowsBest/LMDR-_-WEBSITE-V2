/**
 * Autopilot Service Tests
 * Tests campaign creation, step execution, campaign advancement, status, and postmortem generation
 */

jest.mock('backend/dataAccess', () => ({
  queryRecords: jest.fn(),
  insertRecord: jest.fn(),
  updateRecord: jest.fn()
}));

jest.mock('backend/driverMatching', () => ({
  findMatchingDrivers: jest.fn()
}));

jest.mock('backend/recruiter_service', () => ({
  getPipelineCandidates: jest.fn()
}));

jest.mock('backend/crossRoleIntelService', () => ({
  getMarketIntel: jest.fn()
}));

jest.mock('backend/compendiumService', () => ({
  createCompendiumEntry: jest.fn()
}));

jest.mock('backend/agentRunLedgerService', () => ({
  logStep: jest.fn(),
  createGate: jest.fn()
}));

const dataAccess = require('backend/dataAccess');
const { findMatchingDrivers } = require('backend/driverMatching');
const { getPipelineCandidates } = require('backend/recruiter_service');
const { getMarketIntel } = require('backend/crossRoleIntelService');
const { createCompendiumEntry } = require('backend/compendiumService');
const { logStep, createGate } = require('backend/agentRunLedgerService');
const {
  createAutopilotCampaign,
  executeAutopilotStep,
  advanceCampaign,
  getAutopilotStatus,
  pauseCampaign,
  resumeCampaign,
  generateCampaignPostmortem
} = require('backend/autopilotService');

describe('AutopilotService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── createAutopilotCampaign ───────────────────────────────────────────

  describe('createAutopilotCampaign', () => {
    it('creates campaign with steps for matched drivers', async () => {
      findMatchingDrivers.mockResolvedValue({
        matches: [
          { driver_id: 'd1', name: 'Driver One' },
          { driver_id: 'd2', name: 'Driver Two' }
        ]
      });
      getMarketIntel.mockResolvedValue({ summary: 'High demand in TX region' });
      dataAccess.insertRecord.mockResolvedValue({});

      const result = await createAutopilotCampaign('rec-1', {
        carrierDot: '1234567',
        objective: 'outreach',
        cadence: 'standard',
        maxContacts: 20
      });

      expect(result.campaignId).toBeDefined();
      expect(result.contactCount).toBe(2);
      expect(result.steps).toHaveLength(2);
      expect(dataAccess.insertRecord).toHaveBeenCalledWith(
        'autopilotCampaigns',
        expect.objectContaining({
          recruiter_id: 'rec-1',
          carrier_dot: '1234567',
          objective: 'outreach',
          status: 'active'
        }),
        { suppressAuth: true }
      );
    });

    it('uses pipeline candidates for pipeline_advancement objective', async () => {
      getPipelineCandidates.mockResolvedValue({
        candidates: [{ driver_id: 'd1' }]
      });
      getMarketIntel.mockResolvedValue({ summary: 'Market data' });
      dataAccess.insertRecord.mockResolvedValue({});

      const result = await createAutopilotCampaign('rec-1', {
        carrierDot: '1234567',
        objective: 'pipeline_advancement',
        cadence: 'gentle',
        maxContacts: 10
      });

      expect(result.contactCount).toBe(1);
      expect(getPipelineCandidates).toHaveBeenCalled();
      expect(findMatchingDrivers).not.toHaveBeenCalled();
    });

    it('limits contacts to maxContacts config', async () => {
      const manyDrivers = Array.from({ length: 50 }, (_, i) => ({
        driver_id: `d${i}`,
        name: `Driver ${i}`
      }));
      findMatchingDrivers.mockResolvedValue({ matches: manyDrivers });
      getMarketIntel.mockResolvedValue({ summary: 'Data' });
      dataAccess.insertRecord.mockResolvedValue({});

      const result = await createAutopilotCampaign('rec-1', {
        carrierDot: '1234567',
        objective: 'outreach',
        cadence: 'standard',
        maxContacts: 5
      });

      expect(result.contactCount).toBe(5);
      expect(result.steps).toHaveLength(5);
    });

    it('returns error when no matching candidates found', async () => {
      findMatchingDrivers.mockResolvedValue({ matches: [] });
      getMarketIntel.mockResolvedValue({ summary: 'Data' });

      const result = await createAutopilotCampaign('rec-1', {
        carrierDot: '1234567',
        objective: 'outreach',
        maxContacts: 10
      });

      expect(result.contactCount).toBe(0);
      expect(result.steps).toEqual([]);
    });
  });

  // ── executeAutopilotStep ──────────────────────────────────────────────

  describe('executeAutopilotStep', () => {
    it('executes a read-only step directly without approval gate', async () => {
      dataAccess.queryRecords.mockResolvedValue({
        items: [{
          step_id: 'step-1',
          campaign_id: 'camp-1',
          step_type: 'search_candidates',
          contact_id: 'd1',
          status: 'pending'
        }]
      });
      dataAccess.updateRecord.mockResolvedValue({});
      logStep.mockResolvedValue({});

      const result = await executeAutopilotStep('camp-1', 'step-1');

      expect(result.stepId).toBe('step-1');
      expect(result.status).toBe('completed');
      expect(createGate).not.toHaveBeenCalled();
      expect(logStep).toHaveBeenCalled();
    });

    it('creates approval gate for send_message step type', async () => {
      dataAccess.queryRecords.mockResolvedValue({
        items: [{
          step_id: 'step-2',
          campaign_id: 'camp-1',
          step_type: 'send_message',
          contact_id: 'd1',
          status: 'pending'
        }]
      });
      dataAccess.updateRecord.mockResolvedValue({});
      createGate.mockResolvedValue({ gateId: 'gate-1' });
      logStep.mockResolvedValue({});

      const result = await executeAutopilotStep('camp-1', 'step-2');

      expect(result.status).toBe('awaiting_approval');
      expect(createGate).toHaveBeenCalledWith(
        expect.objectContaining({
          step_type: 'send_message'
        })
      );
    });

    it('creates approval gate for voice_call step type', async () => {
      dataAccess.queryRecords.mockResolvedValue({
        items: [{
          step_id: 'step-3',
          campaign_id: 'camp-1',
          step_type: 'voice_call',
          contact_id: 'd1',
          status: 'pending'
        }]
      });
      dataAccess.updateRecord.mockResolvedValue({});
      createGate.mockResolvedValue({ gateId: 'gate-2' });
      logStep.mockResolvedValue({});

      const result = await executeAutopilotStep('camp-1', 'step-3');

      expect(result.status).toBe('awaiting_approval');
      expect(createGate).toHaveBeenCalled();
    });
  });

  // ── advanceCampaign ───────────────────────────────────────────────────

  describe('advanceCampaign', () => {
    it('processes pending steps in sequence and updates campaign metrics', async () => {
      dataAccess.queryRecords
        // fetch campaign
        .mockResolvedValueOnce({
          items: [{ campaign_id: 'camp-1', status: 'active', contacts_reached: 0, responses: 0 }]
        })
        // fetch pending steps
        .mockResolvedValueOnce({
          items: [
            { step_id: 's1', campaign_id: 'camp-1', step_type: 'search_candidates', status: 'pending', contact_id: 'd1' },
            { step_id: 's2', campaign_id: 'camp-1', step_type: 'update_pipeline', status: 'pending', contact_id: 'd1' }
          ]
        })
        // executeAutopilotStep internal queries
        .mockResolvedValue({ items: [] });

      dataAccess.updateRecord.mockResolvedValue({});
      logStep.mockResolvedValue({});

      const result = await advanceCampaign('camp-1');

      expect(result.campaignId).toBe('camp-1');
      expect(result.processed).toBeDefined();
      expect(dataAccess.updateRecord).toHaveBeenCalled();
    });

    it('pauses at approval-gated steps and returns pending approval info', async () => {
      dataAccess.queryRecords
        .mockResolvedValueOnce({
          items: [{ campaign_id: 'camp-1', status: 'active' }]
        })
        .mockResolvedValueOnce({
          items: [
            { step_id: 's1', campaign_id: 'camp-1', step_type: 'send_message', status: 'pending', contact_id: 'd1' }
          ]
        })
        .mockResolvedValue({ items: [{ step_id: 's1', step_type: 'send_message', status: 'pending', contact_id: 'd1' }] });

      dataAccess.updateRecord.mockResolvedValue({});
      createGate.mockResolvedValue({ gateId: 'gate-1' });
      logStep.mockResolvedValue({});

      const result = await advanceCampaign('camp-1');

      expect(result.paused_at_approval).toBe(true);
    });
  });

  // ── getAutopilotStatus ────────────────────────────────────────────────

  describe('getAutopilotStatus', () => {
    it('returns progress metrics for a campaign', async () => {
      dataAccess.queryRecords
        .mockResolvedValueOnce({
          items: [{
            campaign_id: 'camp-1',
            recruiter_id: 'rec-1',
            status: 'active',
            contacts_reached: 5,
            responses: 2,
            conversions: 1
          }]
        })
        .mockResolvedValueOnce({
          items: [
            { step_id: 's1', status: 'completed' },
            { step_id: 's2', status: 'completed' },
            { step_id: 's3', status: 'pending' },
            { step_id: 's4', status: 'awaiting_approval' }
          ]
        });

      const result = await getAutopilotStatus('camp-1');

      expect(result.campaignId).toBe('camp-1');
      expect(result.status).toBe('active');
      expect(result.progress.total).toBe(4);
      expect(result.progress.completed).toBe(2);
      expect(result.progress.pending).toBe(1);
      expect(result.progress.awaiting_approval).toBe(1);
      expect(result.metrics.contacts_reached).toBe(5);
      expect(result.metrics.responses).toBe(2);
      expect(result.metrics.conversions).toBe(1);
    });

    it('returns null when campaign not found', async () => {
      dataAccess.queryRecords.mockResolvedValue({ items: [] });

      const result = await getAutopilotStatus('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ── pauseCampaign / resumeCampaign ────────────────────────────────────

  describe('pauseCampaign', () => {
    it('sets campaign status to paused', async () => {
      dataAccess.queryRecords.mockResolvedValue({
        items: [{ _id: 'rec-id', campaign_id: 'camp-1', status: 'active' }]
      });
      dataAccess.updateRecord.mockResolvedValue({});

      const result = await pauseCampaign('camp-1');

      expect(result.status).toBe('paused');
      expect(dataAccess.updateRecord).toHaveBeenCalledWith(
        'autopilotCampaigns',
        'rec-id',
        expect.objectContaining({ status: 'paused' }),
        { suppressAuth: true }
      );
    });
  });

  describe('resumeCampaign', () => {
    it('sets campaign status back to active', async () => {
      dataAccess.queryRecords.mockResolvedValue({
        items: [{ _id: 'rec-id', campaign_id: 'camp-1', status: 'paused' }]
      });
      dataAccess.updateRecord.mockResolvedValue({});

      const result = await resumeCampaign('camp-1');

      expect(result.status).toBe('active');
      expect(dataAccess.updateRecord).toHaveBeenCalledWith(
        'autopilotCampaigns',
        'rec-id',
        expect.objectContaining({ status: 'active' }),
        { suppressAuth: true }
      );
    });
  });

  // ── generateCampaignPostmortem ────────────────────────────────────────

  describe('generateCampaignPostmortem', () => {
    it('generates postmortem with metrics and writes to compendium', async () => {
      dataAccess.queryRecords
        .mockResolvedValueOnce({
          items: [{
            campaign_id: 'camp-1',
            recruiter_id: 'rec-1',
            carrier_dot: '1234567',
            objective: 'outreach',
            status: 'completed',
            max_contacts: 20,
            contacts_reached: 15,
            responses: 5,
            conversions: 2,
            created_at: '2026-02-01',
            completed_at: '2026-02-10'
          }]
        })
        .mockResolvedValueOnce({
          items: [
            { step_id: 's1', step_type: 'send_message', status: 'completed', result: 'responded' },
            { step_id: 's2', step_type: 'send_message', status: 'completed', result: 'no_response' },
            { step_id: 's3', step_type: 'voice_call', status: 'completed', result: 'responded' },
            { step_id: 's4', step_type: 'update_pipeline', status: 'completed', result: 'advanced' }
          ]
        });

      createCompendiumEntry.mockResolvedValue({ created: true, entry_id: 'comp_123' });

      const result = await generateCampaignPostmortem('camp-1');

      expect(result.response_rate).toBeDefined();
      expect(result.conversion_rate).toBeDefined();
      expect(createCompendiumEntry).toHaveBeenCalledWith(
        'recruiter',
        expect.objectContaining({
          topic: expect.stringContaining('camp-1'),
          type: 'postmortem'
        })
      );
    });

    it('returns error when campaign not found', async () => {
      dataAccess.queryRecords.mockResolvedValue({ items: [] });

      const result = await generateCampaignPostmortem('nonexistent');

      expect(result.error).toBeDefined();
      expect(createCompendiumEntry).not.toHaveBeenCalled();
    });

    it('calculates correct response and conversion rates', async () => {
      dataAccess.queryRecords
        .mockResolvedValueOnce({
          items: [{
            campaign_id: 'camp-2',
            contacts_reached: 10,
            responses: 4,
            conversions: 1,
            status: 'completed',
            objective: 'outreach',
            created_at: '2026-02-01',
            completed_at: '2026-02-05'
          }]
        })
        .mockResolvedValueOnce({
          items: [
            { step_id: 's1', step_type: 'send_message', status: 'completed' }
          ]
        });

      createCompendiumEntry.mockResolvedValue({ created: true });

      const result = await generateCampaignPostmortem('camp-2');

      expect(result.response_rate).toBe(40); // 4/10 * 100
      expect(result.conversion_rate).toBe(10); // 1/10 * 100
    });
  });
});
