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
  getPipelineCandidates: jest.fn(),
  updateCandidateStatus: jest.fn()
}));

jest.mock('backend/crossRoleIntelService', () => ({
  getMarketIntel: jest.fn()
}));

jest.mock('backend/compendiumService', () => ({
  createCompendiumEntry: jest.fn()
}));

jest.mock('backend/agentRunLedgerService', () => ({
  logAgentAction: jest.fn()
}));

jest.mock('backend/utils/arrayUtils', () => ({
  chunkArray: jest.fn((arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  })
}));

const dataAccess = require('backend/dataAccess');
const { findMatchingDrivers } = require('backend/driverMatching');
const { getPipelineCandidates } = require('backend/recruiter_service');
const { getMarketIntel } = require('backend/crossRoleIntelService');
const { createCompendiumEntry } = require('backend/compendiumService');
const { logAgentAction } = require('backend/agentRunLedgerService');
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
      // First insertRecord call is the campaign, subsequent ones are steps
      dataAccess.insertRecord
        .mockResolvedValueOnce({ _id: 'camp-1' })
        .mockResolvedValue({ _id: 'step-id' });

      const result = await createAutopilotCampaign('rec-1', {
        carrierDot: '1234567',
        objective: 'outreach',
        cadence: 'standard',
        maxContacts: 20
      });

      expect(result.success).toBe(true);
      expect(result.campaignId).toBe('camp-1');
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
      dataAccess.insertRecord
        .mockResolvedValueOnce({ _id: 'camp-2' })
        .mockResolvedValue({ _id: 'step-id' });

      const result = await createAutopilotCampaign('rec-1', {
        carrierDot: '1234567',
        objective: 'pipeline_advancement',
        cadence: 'gentle',
        maxContacts: 10
      });

      expect(result.success).toBe(true);
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
      dataAccess.insertRecord
        .mockResolvedValueOnce({ _id: 'camp-3' })
        .mockResolvedValue({ _id: 'step-id' });

      const result = await createAutopilotCampaign('rec-1', {
        carrierDot: '1234567',
        objective: 'outreach',
        cadence: 'standard',
        maxContacts: 5
      });

      expect(result.success).toBe(true);
      expect(result.contactCount).toBe(5);
      expect(result.steps).toHaveLength(5);
    });

    it('returns success with zero contacts when no matching candidates found', async () => {
      findMatchingDrivers.mockResolvedValue({ matches: [] });
      getMarketIntel.mockResolvedValue({ summary: 'Data' });
      dataAccess.insertRecord.mockResolvedValue({ _id: 'camp-empty' });

      const result = await createAutopilotCampaign('rec-1', {
        carrierDot: '1234567',
        objective: 'outreach',
        maxContacts: 10
      });

      expect(result.success).toBe(true);
      expect(result.contactCount).toBe(0);
      expect(result.steps).toEqual([]);
    });
  });

  // ── executeAutopilotStep ──────────────────────────────────────────────

  describe('executeAutopilotStep', () => {
    it('executes a read-only step directly without approval gate', async () => {
      // First query: fetch step by campaign_id and _id
      dataAccess.queryRecords
        .mockResolvedValueOnce({
          items: [{
            _id: 'step-1',
            campaign_id: 'camp-1',
            step_type: 'search_candidates',
            contact_id: 'd1',
            status: 'pending'
          }]
        })
        // Second query: find next pending step
        .mockResolvedValueOnce({ items: [] });

      dataAccess.updateRecord.mockResolvedValue({});
      logAgentAction.mockResolvedValue({});

      const result = await executeAutopilotStep('camp-1', 'step-1');

      expect(result.success).toBe(true);
      expect(result.stepId).toBe('step-1');
      expect(result.status).toBe('completed');
      expect(result.result).toBe('Candidates already loaded at campaign creation');
      // Approval gate uses dataAccess.insertRecord on approvalGates collection - should NOT be called for search_candidates
      expect(dataAccess.insertRecord).not.toHaveBeenCalled();
    });

    it('creates approval gate for send_message step type', async () => {
      dataAccess.queryRecords.mockResolvedValue({
        items: [{
          _id: 'step-2',
          campaign_id: 'camp-1',
          step_type: 'send_message',
          contact_id: 'd1',
          contact_name: 'Driver One',
          status: 'pending'
        }]
      });
      dataAccess.insertRecord.mockResolvedValue({});
      dataAccess.updateRecord.mockResolvedValue({});

      const result = await executeAutopilotStep('camp-1', 'step-2');

      expect(result.success).toBe(true);
      expect(result.status).toBe('awaiting_approval');
      // The service inserts an approval gate record via dataAccess.insertRecord
      expect(dataAccess.insertRecord).toHaveBeenCalledWith(
        'approvalGates',
        expect.objectContaining({
          campaign_id: 'camp-1',
          step_id: 'step-2',
          step_type: 'send_message',
          status: 'pending_approval'
        }),
        { suppressAuth: true }
      );
    });

    it('creates approval gate for voice_call step type', async () => {
      dataAccess.queryRecords.mockResolvedValue({
        items: [{
          _id: 'step-3',
          campaign_id: 'camp-1',
          step_type: 'voice_call',
          contact_id: 'd1',
          contact_name: 'Driver Two',
          status: 'pending'
        }]
      });
      dataAccess.insertRecord.mockResolvedValue({});
      dataAccess.updateRecord.mockResolvedValue({});

      const result = await executeAutopilotStep('camp-1', 'step-3');

      expect(result.success).toBe(true);
      expect(result.status).toBe('awaiting_approval');
      expect(dataAccess.insertRecord).toHaveBeenCalledWith(
        'approvalGates',
        expect.objectContaining({
          step_type: 'voice_call',
          status: 'pending_approval'
        }),
        { suppressAuth: true }
      );
    });
  });

  // ── advanceCampaign ───────────────────────────────────────────────────

  describe('advanceCampaign', () => {
    it('processes pending steps in sequence and updates campaign metrics', async () => {
      // advanceCampaign first queries pending steps
      dataAccess.queryRecords
        // 1st call: advanceCampaign fetches pending steps
        .mockResolvedValueOnce({
          items: [
            { _id: 's1', campaign_id: 'camp-1', step_type: 'search_candidates', status: 'pending', contact_id: 'd1' },
            { _id: 's2', campaign_id: 'camp-1', step_type: 'log_outcome', status: 'pending', contact_id: 'd1' }
          ]
        })
        // 2nd call: executeAutopilotStep('camp-1','s1') queries step record
        .mockResolvedValueOnce({
          items: [{ _id: 's1', campaign_id: 'camp-1', step_type: 'search_candidates', status: 'pending', contact_id: 'd1' }]
        })
        // 3rd call: executeAutopilotStep('camp-1','s1') queries next pending step
        .mockResolvedValueOnce({
          items: [{ _id: 's2', step_type: 'log_outcome' }]
        })
        // 4th call: executeAutopilotStep('camp-1','s2') queries step record
        .mockResolvedValueOnce({
          items: [{ _id: 's2', campaign_id: 'camp-1', step_type: 'log_outcome', status: 'pending', contact_id: 'd1' }]
        })
        // 5th call: executeAutopilotStep('camp-1','s2') queries next pending step
        .mockResolvedValueOnce({ items: [] })
        // 6th call: advanceCampaign queries all steps for metrics
        .mockResolvedValueOnce({
          items: [
            { _id: 's1', status: 'completed', step_type: 'search_candidates' },
            { _id: 's2', status: 'completed', step_type: 'log_outcome' }
          ]
        });

      dataAccess.updateRecord.mockResolvedValue({});
      logAgentAction.mockResolvedValue({});

      const result = await advanceCampaign('camp-1');

      expect(result.success).toBe(true);
      expect(result.stepsProcessed).toBe(2);
      expect(result.pausedAtApproval).toBe(false);
      expect(dataAccess.updateRecord).toHaveBeenCalled();
    });

    it('pauses at approval-gated steps and returns pending approval info', async () => {
      // advanceCampaign first queries pending steps
      dataAccess.queryRecords
        // 1st call: advanceCampaign fetches pending steps
        .mockResolvedValueOnce({
          items: [
            { _id: 's1', campaign_id: 'camp-1', step_type: 'send_message', status: 'pending', contact_id: 'd1', contact_name: 'Driver One' }
          ]
        })
        // 2nd call: executeAutopilotStep('camp-1','s1') queries step record
        .mockResolvedValueOnce({
          items: [{ _id: 's1', campaign_id: 'camp-1', step_type: 'send_message', status: 'pending', contact_id: 'd1', contact_name: 'Driver One' }]
        })
        // 3rd call: advanceCampaign queries all steps for metrics
        .mockResolvedValueOnce({
          items: [
            { _id: 's1', status: 'awaiting_approval', step_type: 'send_message' }
          ]
        });

      dataAccess.insertRecord.mockResolvedValue({});
      dataAccess.updateRecord.mockResolvedValue({});

      const result = await advanceCampaign('camp-1');

      expect(result.success).toBe(true);
      expect(result.pausedAtApproval).toBe(true);
      expect(result.pendingApproval).toBeDefined();
      expect(result.pendingApproval.status).toBe('awaiting_approval');
    });
  });

  // ── getAutopilotStatus ────────────────────────────────────────────────

  describe('getAutopilotStatus', () => {
    it('returns progress metrics for a campaign', async () => {
      dataAccess.queryRecords
        .mockResolvedValueOnce({
          items: [{
            _id: 'camp-1',
            recruiter_id: 'rec-1',
            status: 'active',
            contacts_reached: 5,
            responses: 2,
            conversions: 1,
            objective: 'outreach',
            cadence: 'standard'
          }]
        })
        .mockResolvedValueOnce({
          items: [
            { _id: 's1', status: 'completed' },
            { _id: 's2', status: 'completed' },
            { _id: 's3', status: 'pending' },
            { _id: 's4', status: 'awaiting_approval' }
          ]
        });

      const result = await getAutopilotStatus('camp-1');

      expect(result.success).toBe(true);
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

    it('returns error when campaign not found', async () => {
      dataAccess.queryRecords.mockResolvedValue({ items: [] });

      const result = await getAutopilotStatus('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Campaign not found');
    });
  });

  // ── pauseCampaign / resumeCampaign ────────────────────────────────────

  describe('pauseCampaign', () => {
    it('sets campaign status to paused', async () => {
      dataAccess.updateRecord.mockResolvedValue({});

      const result = await pauseCampaign('camp-1');

      expect(result.success).toBe(true);
      expect(result.status).toBe('paused');
      expect(result.campaignId).toBe('camp-1');
      // Service calls updateRecord with (collection, {_id, status, paused_at}, opts)
      expect(dataAccess.updateRecord).toHaveBeenCalledWith(
        'autopilotCampaigns',
        expect.objectContaining({ _id: 'camp-1', status: 'paused' }),
        { suppressAuth: true }
      );
    });
  });

  describe('resumeCampaign', () => {
    it('sets campaign status back to active', async () => {
      dataAccess.updateRecord.mockResolvedValue({});

      const result = await resumeCampaign('camp-1');

      expect(result.success).toBe(true);
      expect(result.status).toBe('active');
      expect(result.campaignId).toBe('camp-1');
      // Service calls updateRecord with (collection, {_id, status, resumed_at}, opts)
      expect(dataAccess.updateRecord).toHaveBeenCalledWith(
        'autopilotCampaigns',
        expect.objectContaining({ _id: 'camp-1', status: 'active' }),
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
            _id: 'camp-1',
            recruiter_id: 'rec-1',
            carrier_dot: '1234567',
            objective: 'outreach',
            cadence: 'standard',
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
            { _id: 's1', step_type: 'send_message', status: 'completed', completed_at: '2026-02-02', result: 'responded' },
            { _id: 's2', step_type: 'send_message', status: 'completed', completed_at: '2026-02-03', result: 'no_response' },
            { _id: 's3', step_type: 'voice_call', status: 'completed', completed_at: '2026-02-04', result: 'responded' },
            { _id: 's4', step_type: 'update_pipeline', status: 'completed', completed_at: '2026-02-05', result: 'advanced' }
          ]
        });

      createCompendiumEntry.mockResolvedValue({ created: true, entry_id: 'comp_123' });

      const result = await generateCampaignPostmortem('camp-1');

      expect(result.success).toBe(true);
      expect(result.postmortem).toBeDefined();
      expect(result.postmortem.response_rate).toBe('33.3%');  // 5/15 * 100 = 33.3
      expect(result.postmortem.conversion_rate).toBe('13.3%'); // 2/15 * 100 = 13.3
      expect(result.postmortem.completion_rate).toBe('100.0%');
      expect(createCompendiumEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          department: 'recruiter',
          category: 'postmortems',
          title: expect.stringContaining('camp-1'),
          tags: expect.arrayContaining(['autopilot', 'outreach'])
        })
      );
    });

    it('returns error when campaign not found', async () => {
      dataAccess.queryRecords.mockResolvedValue({ items: [] });

      const result = await generateCampaignPostmortem('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Campaign not found');
      expect(createCompendiumEntry).not.toHaveBeenCalled();
    });

    it('calculates correct response and conversion rates', async () => {
      dataAccess.queryRecords
        .mockResolvedValueOnce({
          items: [{
            _id: 'camp-2',
            contacts_reached: 10,
            responses: 4,
            conversions: 1,
            status: 'completed',
            objective: 'outreach',
            cadence: 'standard',
            created_at: '2026-02-01',
            completed_at: '2026-02-05'
          }]
        })
        .mockResolvedValueOnce({
          items: [
            { _id: 's1', step_type: 'send_message', status: 'completed', completed_at: '2026-02-02' }
          ]
        });

      createCompendiumEntry.mockResolvedValue({ created: true });

      const result = await generateCampaignPostmortem('camp-2');

      expect(result.success).toBe(true);
      expect(result.postmortem.response_rate).toBe('40.0%'); // 4/10 * 100 = 40.0
      expect(result.postmortem.conversion_rate).toBe('10.0%'); // 1/10 * 100 = 10.0
    });
  });
});
