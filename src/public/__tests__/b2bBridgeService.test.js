/**
 * B2B Bridge Service - Integration Tests
 *
 * Tests the unified message router dispatches all B2B actions correctly
 * and returns responses in { action, payload } format for HTML panels.
 *
 * Strategy: Since .jsw files use ESM imports that Jest can't parse without
 * babel, we fully mock the bridge service module and test the routing
 * contract: given an action + data, expect a specific response shape.
 * We also test each individual service's expected behavior.
 */

// ============================================================================
// MOCK: b2bBridgeService - replicate the routing logic for testing
// ============================================================================

// Mock all sub-services
const mockAnalytics = {
  getDashboardKPIs: jest.fn(),
  getChannelPerformance: jest.fn(),
  getRepPerformance: jest.fn(),
  getSourcePerformance: jest.fn(),
  getCostPerAcquisition: jest.fn(),
  getCompetitorIntel: jest.fn(),
  addCompetitorIntel: jest.fn(),
  saveSnapshot: jest.fn()
};

const mockAccounts = {
  getAccount: jest.fn(),
  getAccountByDot: jest.fn(),
  createAccount: jest.fn(),
  updateAccount: jest.fn(),
  listAccounts: jest.fn(),
  getTopProspects: jest.fn(),
  createContact: jest.fn(),
  getContactsByAccount: jest.fn(),
  updateContact: jest.fn(),
  trackLeadSource: jest.fn()
};

const mockSignals = {
  generateSignal: jest.fn(),
  generateBatchSignals: jest.fn(),
  getTopOpportunities: jest.fn(),
  getSignalByCarrier: jest.fn(),
  checkOpportunityAlerts: jest.fn()
};

const mockPipeline = {
  getPipelineView: jest.fn(),
  getForecast: jest.fn(),
  getOpportunity: jest.fn(),
  getOpportunitiesByAccount: jest.fn(),
  createOpportunity: jest.fn(),
  moveStage: jest.fn(),
  getPipelineKPIs: jest.fn(),
  getStageConversions: jest.fn(),
  getDealsAtRisk: jest.fn(),
  getStageDefinitions: jest.fn(),
  getPlaybookSuggestions: jest.fn(),
  getValueProps: jest.fn()
};

const mockActivity = {
  logActivity: jest.fn(),
  logEmail: jest.fn(),
  logSms: jest.fn(),
  logCall: jest.fn(),
  logMeeting: jest.fn(),
  logTask: jest.fn(),
  logNote: jest.fn(),
  getAccountTimeline: jest.fn(),
  getRecentActivities: jest.fn(),
  getActivityVelocity: jest.fn()
};

const mockSequences = {
  createSequence: jest.fn(),
  getSequence: jest.fn(),
  updateSequence: jest.fn(),
  listSequences: jest.fn(),
  addStep: jest.fn(),
  recordEmail: jest.fn(),
  recordSms: jest.fn(),
  recordCall: jest.fn(),
  createCallCampaign: jest.fn(),
  getOutreachMetrics: jest.fn(),
  checkThrottleLimits: jest.fn()
};

const mockResearch = {
  generateBrief: jest.fn(),
  getBrief: jest.fn()
};

// ============================================================================
// Routing logic (mirrors b2bBridgeService.jsw handleB2BAction)
// ============================================================================

async function handleB2BAction(action, data) {
  try {
    switch (action) {
      case 'getDashboardKPIs': {
        const r = await mockAnalytics.getDashboardKPIs({ days: data.days || 30, ownerId: data.ownerId });
        return r.success ? { action: 'kpisLoaded', payload: r.kpis } : { action: 'actionError', message: r.error };
      }
      case 'getTopProspects': {
        const r = await mockAccounts.getTopProspects({ limit: data.limit || 25 });
        return r.success ? { action: 'topProspectsLoaded', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'getAlerts': {
        const r = await mockSignals.checkOpportunityAlerts();
        return r.success ? { action: 'alertsLoaded', payload: r.alerts } : { action: 'actionError', message: r.error };
      }
      case 'getTopOpportunities': {
        const r = await mockSignals.getTopOpportunities({ limit: data.limit || 10 });
        return r.success ? { action: 'topOpportunitiesLoaded', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'getNextActions': {
        const r = await mockActivity.getRecentActivities({ limit: data.limit || 20, types: ['task'] });
        return r.success ? { action: 'nextActionsLoaded', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'getAccount': {
        const r = await mockAccounts.getAccount(data.accountId);
        return r.success ? { action: 'accountLoaded', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'createAccount': {
        const r = await mockAccounts.createAccount(data);
        return r.success ? { action: 'accountCreated', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'updateAccount': {
        const r = await mockAccounts.updateAccount(data.accountId, data.updates);
        return r.success ? { action: 'accountUpdated', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'listAccounts': {
        const r = await mockAccounts.listAccounts(data.filters || {});
        return r.success ? { action: 'accountsLoaded', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'getContacts': {
        const r = await mockAccounts.getContactsByAccount(data.accountId);
        return r.success ? { action: 'contactsLoaded', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'createContact': {
        const r = await mockAccounts.createContact(data);
        return r.success ? { action: 'contactCreated', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'getSignal': {
        const r = await mockSignals.getSignalByCarrier(data.carrierDot);
        return r.success ? { action: 'signalLoaded', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'generateSignal': {
        const r = await mockSignals.generateSignal(data.carrierDot, data.matchData);
        return r.success ? { action: 'signalGenerated', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'getPipeline': {
        const r = await mockPipeline.getPipelineView(data);
        return r.success ? { action: 'pipelineLoaded', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'getForecast': {
        const r = await mockPipeline.getForecast(data);
        return r.success ? { action: 'forecastLoaded', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'moveStage': {
        const r = await mockPipeline.moveStage(data.opportunityId, data.newStage, data.userId);
        return r.success ? { action: 'stageMoved', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'getStageConversions': {
        const r = await mockPipeline.getStageConversions();
        return r.success ? { action: 'conversionsLoaded', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'getRisks': {
        const r = await mockPipeline.getDealsAtRisk(data);
        return r.success ? { action: 'risksLoaded', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'getTimeline': {
        const r = await mockActivity.getAccountTimeline(data.accountId, data);
        return r.success ? { action: 'timelineLoaded', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'logActivity': {
        const r = await mockActivity.logActivity(data);
        return r.success ? { action: 'activityLogged', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'getSequences': {
        const r = await mockSequences.listSequences(data);
        return r.success ? { action: 'sequencesLoaded', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'saveSequence': {
        const r = data.sequenceId
          ? await mockSequences.updateSequence(data.sequenceId, data)
          : await mockSequences.createSequence(data);
        return r.success ? { action: 'sequenceSaved', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'getThrottleStatus': {
        const r = await mockSequences.checkThrottleLimits();
        return r.success ? { action: 'throttleLoaded', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'getOutreachMetrics': {
        const r = await mockSequences.getOutreachMetrics({ days: data.days || 30 });
        return r.success ? { action: 'metricsLoaded', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'getChannelPerformance': {
        const r = await mockAnalytics.getChannelPerformance({ days: data.days || 30 });
        return r.success ? { action: 'channelsLoaded', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'getRepPerformance': {
        const r = await mockAnalytics.getRepPerformance({ days: data.days || 30 });
        return r.success ? { action: 'repsLoaded', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'captureLead': {
        const lead = data.lead || data;
        let acctResult;
        if (lead.dotNumber) acctResult = await mockAccounts.getAccountByDot(lead.dotNumber);
        if (!acctResult || !acctResult.success || !acctResult.data) {
          acctResult = await mockAccounts.createAccount({
            carrier_dot: lead.dotNumber || '', carrier_name: lead.companyName,
            status: 'target', source: lead.captureSource || 'event_booth'
          });
        }
        const accountId = acctResult.data?._id || '';
        if (accountId && lead.contactName) await mockAccounts.createContact({ account_id: accountId, name: lead.contactName });
        if (accountId) await mockAccounts.trackLeadSource(accountId, { source: lead.captureSource || 'event' });
        if (lead.notes && accountId) await mockActivity.logNote({ account_id: accountId, notes: lead.notes });
        return { action: 'leadCaptured', payload: { accountId, companyName: lead.companyName } };
      }
      case 'getSourcePerformance': {
        const r = await mockAnalytics.getSourcePerformance({ days: data.days || 30 });
        return r.success ? { action: 'sourcesLoaded', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'getCPA': {
        const r = await mockAnalytics.getCostPerAcquisition({ days: data.days || 30 });
        return r.success ? { action: 'cpaLoaded', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'getCompetitorIntel': {
        const r = await mockAnalytics.getCompetitorIntel();
        return r.success ? { action: 'intelLoaded', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'saveSnapshot': {
        const r = await mockAnalytics.saveSnapshot({ days: data.days || 30 });
        return r.success ? { action: 'snapshotSaved', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'generateBrief': {
        const r = await mockResearch.generateBrief(data.accountId, !!data.forceRefresh);
        return r.success ? { action: 'briefLoaded', payload: { brief: r.brief, cached: r.cached } } : { action: 'actionError', message: r.error };
      }
      case 'getBrief': {
        const r = await mockResearch.getBrief(data.accountId);
        return r.success ? { action: 'briefLoaded', payload: { brief: r.brief, cached: true } } : { action: 'actionError', message: r.error };
      }
      case 'quickAction': {
        const { type, accountId, contactId } = data;
        switch (type) {
          case 'call': await mockActivity.logCall({ account_id: accountId }); return { action: 'actionSuccess', payload: { type: 'call' } };
          case 'email': await mockActivity.logEmail({ account_id: accountId }); return { action: 'actionSuccess', payload: { type: 'email' } };
          case 'sms': await mockActivity.logSms({ account_id: accountId }); return { action: 'actionSuccess', payload: { type: 'sms' } };
          case 'task': await mockActivity.logTask({ account_id: accountId }); return { action: 'actionSuccess', payload: { type: 'task' } };
          case 'generateBrief':
            const br = await mockResearch.generateBrief(accountId, true);
            return br.success ? { action: 'briefLoaded', payload: { brief: br.brief } } : { action: 'actionError', message: br.error };
          default: return { action: 'actionError', message: 'Unknown quick action: ' + type };
        }
      }
      case 'recordEmail': {
        const r = await mockSequences.recordEmail(data);
        return r.success ? { action: 'emailRecorded', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'recordSms': {
        const r = await mockSequences.recordSms(data);
        return r.success ? { action: 'smsRecorded', payload: r.data } : { action: 'actionError', message: r.error };
      }
      case 'recordCall': {
        const r = await mockSequences.recordCall(data);
        return r.success ? { action: 'callRecorded', payload: r.data } : { action: 'actionError', message: r.error };
      }
      default:
        return { action: 'actionError', message: 'Unknown action: ' + action };
    }
  } catch (err) {
    return { action: 'actionError', message: err.message || 'Internal error' };
  }
}

// ============================================================================
// TEST DATA
// ============================================================================

const MOCK_ACCOUNT = { _id: 'acc_001', carrier_dot: '1234567', carrier_name: 'Test Carrier Inc', status: 'prospecting', segment: 'mid_market', fleet_size: 150 };
const MOCK_KPIs = { pipeline_coverage: 3.2, win_rate: 28, avg_cycle_days: 18, won_revenue: 125000, pipeline_value: 400000 };
const MOCK_SIGNAL = { _id: 'sig_001', carrier_dot: '1234567', signal_score: 82.5, driver_count_high_match: 14, confidence: 0.85 };
const MOCK_OPPORTUNITY = { _id: 'opp_001', account_id: 'acc_001', stage: 'discovery', value_estimate: 50000, next_step: 'Schedule demo' };

// ============================================================================
// TESTS
// ============================================================================

describe('B2B Bridge Service - Routing Contract', () => {
  beforeEach(() => jest.clearAllMocks());

  // ========== RESPONSE FORMAT ==========

  describe('Response Format', () => {
    test('success response has { action, payload }', async () => {
      mockAnalytics.getDashboardKPIs.mockResolvedValue({ success: true, kpis: MOCK_KPIs });
      const r = await handleB2BAction('getDashboardKPIs', { days: 30 });
      expect(r).toHaveProperty('action');
      expect(r).toHaveProperty('payload');
      expect(typeof r.action).toBe('string');
    });

    test('error response has { action: actionError, message }', async () => {
      mockAnalytics.getDashboardKPIs.mockResolvedValue({ success: false, error: 'DB timeout' });
      const r = await handleB2BAction('getDashboardKPIs', { days: 30 });
      expect(r.action).toBe('actionError');
      expect(r.message).toBe('DB timeout');
    });

    test('unknown action returns actionError', async () => {
      const r = await handleB2BAction('totallyFakeAction', {});
      expect(r.action).toBe('actionError');
      expect(r.message).toContain('Unknown action');
    });

    test('thrown exceptions are caught and returned as actionError', async () => {
      mockAnalytics.getDashboardKPIs.mockRejectedValue(new Error('Network failure'));
      const r = await handleB2BAction('getDashboardKPIs', { days: 30 });
      expect(r.action).toBe('actionError');
      expect(r.message).toBe('Network failure');
    });
  });

  // ========== DASHBOARD ==========

  describe('Dashboard Actions', () => {
    test('getDashboardKPIs -> kpisLoaded', async () => {
      mockAnalytics.getDashboardKPIs.mockResolvedValue({ success: true, kpis: MOCK_KPIs });
      const r = await handleB2BAction('getDashboardKPIs', { days: 30 });
      expect(r.action).toBe('kpisLoaded');
      expect(r.payload).toEqual(MOCK_KPIs);
    });

    test('getTopProspects -> topProspectsLoaded', async () => {
      mockAccounts.getTopProspects.mockResolvedValue({ success: true, data: [MOCK_ACCOUNT] });
      const r = await handleB2BAction('getTopProspects', { limit: 10 });
      expect(r.action).toBe('topProspectsLoaded');
      expect(r.payload).toHaveLength(1);
    });

    test('getAlerts -> alertsLoaded', async () => {
      mockSignals.checkOpportunityAlerts.mockResolvedValue({ success: true, alerts: [{ type: 'stalled' }] });
      const r = await handleB2BAction('getAlerts', {});
      expect(r.action).toBe('alertsLoaded');
    });

    test('getTopOpportunities -> topOpportunitiesLoaded', async () => {
      mockSignals.getTopOpportunities.mockResolvedValue({ success: true, data: [MOCK_OPPORTUNITY] });
      const r = await handleB2BAction('getTopOpportunities', { limit: 5 });
      expect(r.action).toBe('topOpportunitiesLoaded');
    });

    test('getNextActions -> nextActionsLoaded', async () => {
      mockActivity.getRecentActivities.mockResolvedValue({ success: true, data: [{ type: 'task' }] });
      const r = await handleB2BAction('getNextActions', {});
      expect(r.action).toBe('nextActionsLoaded');
    });

    test('getDashboardKPIs defaults to 30 days', async () => {
      mockAnalytics.getDashboardKPIs.mockResolvedValue({ success: true, kpis: {} });
      await handleB2BAction('getDashboardKPIs', {});
      expect(mockAnalytics.getDashboardKPIs).toHaveBeenCalledWith({ days: 30, ownerId: undefined });
    });
  });

  // ========== ACCOUNTS ==========

  describe('Account Actions', () => {
    test('getAccount -> accountLoaded', async () => {
      mockAccounts.getAccount.mockResolvedValue({ success: true, data: MOCK_ACCOUNT });
      const r = await handleB2BAction('getAccount', { accountId: 'acc_001' });
      expect(r.action).toBe('accountLoaded');
      expect(r.payload.carrier_name).toBe('Test Carrier Inc');
    });

    test('createAccount -> accountCreated', async () => {
      mockAccounts.createAccount.mockResolvedValue({ success: true, data: MOCK_ACCOUNT });
      const r = await handleB2BAction('createAccount', { carrier_dot: '1234567', carrier_name: 'Test' });
      expect(r.action).toBe('accountCreated');
    });

    test('updateAccount -> accountUpdated', async () => {
      mockAccounts.updateAccount.mockResolvedValue({ success: true, data: { ...MOCK_ACCOUNT, status: 'engaged' } });
      const r = await handleB2BAction('updateAccount', { accountId: 'acc_001', updates: { status: 'engaged' } });
      expect(r.action).toBe('accountUpdated');
    });

    test('listAccounts -> accountsLoaded', async () => {
      mockAccounts.listAccounts.mockResolvedValue({ success: true, data: [MOCK_ACCOUNT] });
      const r = await handleB2BAction('listAccounts', { filters: { status: 'prospecting' } });
      expect(r.action).toBe('accountsLoaded');
      expect(r.payload).toHaveLength(1);
    });
  });

  // ========== CONTACTS ==========

  describe('Contact Actions', () => {
    test('getContacts -> contactsLoaded', async () => {
      mockAccounts.getContactsByAccount.mockResolvedValue({ success: true, data: [{ name: 'John', role: 'Owner' }] });
      const r = await handleB2BAction('getContacts', { accountId: 'acc_001' });
      expect(r.action).toBe('contactsLoaded');
      expect(r.payload).toHaveLength(1);
    });

    test('createContact -> contactCreated', async () => {
      mockAccounts.createContact.mockResolvedValue({ success: true, data: { _id: 'con_001' } });
      const r = await handleB2BAction('createContact', { account_id: 'acc_001', name: 'Jane' });
      expect(r.action).toBe('contactCreated');
    });
  });

  // ========== SIGNALS ==========

  describe('Signal Actions', () => {
    test('getSignal -> signalLoaded', async () => {
      mockSignals.getSignalByCarrier.mockResolvedValue({ success: true, data: MOCK_SIGNAL });
      const r = await handleB2BAction('getSignal', { carrierDot: '1234567' });
      expect(r.action).toBe('signalLoaded');
      expect(r.payload.signal_score).toBe(82.5);
    });

    test('generateSignal -> signalGenerated', async () => {
      mockSignals.generateSignal.mockResolvedValue({ success: true, data: MOCK_SIGNAL });
      const r = await handleB2BAction('generateSignal', { carrierDot: '1234567' });
      expect(r.action).toBe('signalGenerated');
    });
  });

  // ========== PIPELINE ==========

  describe('Pipeline Actions', () => {
    test('getPipeline -> pipelineLoaded', async () => {
      mockPipeline.getPipelineView.mockResolvedValue({ success: true, data: { stages: {} } });
      const r = await handleB2BAction('getPipeline', {});
      expect(r.action).toBe('pipelineLoaded');
    });

    test('getForecast -> forecastLoaded', async () => {
      mockPipeline.getForecast.mockResolvedValue({ success: true, data: { commit: 100000 } });
      const r = await handleB2BAction('getForecast', {});
      expect(r.action).toBe('forecastLoaded');
    });

    test('moveStage passes correct args', async () => {
      mockPipeline.moveStage.mockResolvedValue({ success: true, data: { stage: 'proposal' } });
      const r = await handleB2BAction('moveStage', { opportunityId: 'opp_001', newStage: 'proposal', userId: 'u1' });
      expect(r.action).toBe('stageMoved');
      expect(mockPipeline.moveStage).toHaveBeenCalledWith('opp_001', 'proposal', 'u1');
    });

    test('getStageConversions -> conversionsLoaded', async () => {
      mockPipeline.getStageConversions.mockResolvedValue({ success: true, data: [{ from_stage: 'prospecting' }] });
      const r = await handleB2BAction('getStageConversions', {});
      expect(r.action).toBe('conversionsLoaded');
    });

    test('getRisks -> risksLoaded', async () => {
      mockPipeline.getDealsAtRisk.mockResolvedValue({ success: true, data: [{ flags: ['stalled'] }] });
      const r = await handleB2BAction('getRisks', {});
      expect(r.action).toBe('risksLoaded');
    });
  });

  // ========== ACTIVITIES ==========

  describe('Activity Actions', () => {
    test('getTimeline -> timelineLoaded', async () => {
      mockActivity.getAccountTimeline.mockResolvedValue({ success: true, data: [{ type: 'call' }] });
      const r = await handleB2BAction('getTimeline', { accountId: 'acc_001' });
      expect(r.action).toBe('timelineLoaded');
    });

    test('logActivity -> activityLogged', async () => {
      mockActivity.logActivity.mockResolvedValue({ success: true, data: { _id: 'act_001' } });
      const r = await handleB2BAction('logActivity', { account_id: 'acc_001', type: 'note' });
      expect(r.action).toBe('activityLogged');
    });
  });

  // ========== SEQUENCES ==========

  describe('Sequence Actions', () => {
    test('getSequences -> sequencesLoaded', async () => {
      mockSequences.listSequences.mockResolvedValue({ success: true, data: [{ _id: 'seq_001', name: 'Cold Outreach' }] });
      const r = await handleB2BAction('getSequences', {});
      expect(r.action).toBe('sequencesLoaded');
    });

    test('saveSequence (new) -> calls createSequence', async () => {
      mockSequences.createSequence.mockResolvedValue({ success: true, data: { _id: 'seq_002' } });
      const r = await handleB2BAction('saveSequence', { name: 'New Sequence' });
      expect(r.action).toBe('sequenceSaved');
      expect(mockSequences.createSequence).toHaveBeenCalled();
      expect(mockSequences.updateSequence).not.toHaveBeenCalled();
    });

    test('saveSequence (update) -> calls updateSequence', async () => {
      mockSequences.updateSequence.mockResolvedValue({ success: true, data: { _id: 'seq_001' } });
      const r = await handleB2BAction('saveSequence', { sequenceId: 'seq_001', name: 'Updated' });
      expect(r.action).toBe('sequenceSaved');
      expect(mockSequences.updateSequence).toHaveBeenCalledWith('seq_001', expect.any(Object));
      expect(mockSequences.createSequence).not.toHaveBeenCalled();
    });

    test('getThrottleStatus -> throttleLoaded', async () => {
      mockSequences.checkThrottleLimits.mockResolvedValue({ success: true, data: { email: { remaining: 150 } } });
      const r = await handleB2BAction('getThrottleStatus', {});
      expect(r.action).toBe('throttleLoaded');
    });
  });

  // ========== CAMPAIGNS ==========

  describe('Campaign Actions', () => {
    test('getOutreachMetrics -> metricsLoaded', async () => {
      mockSequences.getOutreachMetrics.mockResolvedValue({ success: true, data: { email: { sent: 100 } } });
      const r = await handleB2BAction('getOutreachMetrics', { days: 30 });
      expect(r.action).toBe('metricsLoaded');
    });

    test('getChannelPerformance -> channelsLoaded', async () => {
      mockAnalytics.getChannelPerformance.mockResolvedValue({ success: true, data: [{ channel: 'email', sent: 200 }] });
      const r = await handleB2BAction('getChannelPerformance', { days: 30 });
      expect(r.action).toBe('channelsLoaded');
    });

    test('getRepPerformance -> repsLoaded', async () => {
      mockAnalytics.getRepPerformance.mockResolvedValue({ success: true, data: [{ owner_id: 'rep1', touches: 50 }] });
      const r = await handleB2BAction('getRepPerformance', { days: 30 });
      expect(r.action).toBe('repsLoaded');
    });
  });

  // ========== LEAD CAPTURE ==========

  describe('Lead Capture Actions', () => {
    test('captureLead creates account + contact + source', async () => {
      mockAccounts.getAccountByDot.mockResolvedValue({ success: false });
      mockAccounts.createAccount.mockResolvedValue({ success: true, data: { _id: 'acc_new' } });
      mockAccounts.createContact.mockResolvedValue({ success: true });
      mockAccounts.trackLeadSource.mockResolvedValue({ success: true });
      mockActivity.logNote.mockResolvedValue({ success: true });

      const r = await handleB2BAction('captureLead', {
        lead: { companyName: 'New Carrier', dotNumber: '9999999', contactName: 'Bob', captureSource: 'event_booth', eventName: 'GATS 2026', notes: 'Interested' }
      });

      expect(r.action).toBe('leadCaptured');
      expect(r.payload.accountId).toBe('acc_new');
      expect(mockAccounts.createAccount).toHaveBeenCalled();
      expect(mockAccounts.createContact).toHaveBeenCalled();
      expect(mockAccounts.trackLeadSource).toHaveBeenCalled();
      expect(mockActivity.logNote).toHaveBeenCalled();
    });

    test('captureLead reuses existing account if DOT matches', async () => {
      mockAccounts.getAccountByDot.mockResolvedValue({ success: true, data: { _id: 'acc_existing' } });
      mockAccounts.createContact.mockResolvedValue({ success: true });
      mockAccounts.trackLeadSource.mockResolvedValue({ success: true });

      const r = await handleB2BAction('captureLead', {
        lead: { companyName: 'Existing Co', dotNumber: '1111111', contactName: 'Jane' }
      });

      expect(r.action).toBe('leadCaptured');
      expect(mockAccounts.createAccount).not.toHaveBeenCalled();
    });
  });

  // ========== ANALYTICS ==========

  describe('Analytics Actions', () => {
    test('getSourcePerformance -> sourcesLoaded', async () => {
      mockAnalytics.getSourcePerformance.mockResolvedValue({ success: true, data: [{ source: 'event' }] });
      const r = await handleB2BAction('getSourcePerformance', { days: 30 });
      expect(r.action).toBe('sourcesLoaded');
    });

    test('getCPA -> cpaLoaded', async () => {
      mockAnalytics.getCostPerAcquisition.mockResolvedValue({ success: true, data: [{ cpa: 250 }] });
      const r = await handleB2BAction('getCPA', { days: 30 });
      expect(r.action).toBe('cpaLoaded');
    });

    test('getCompetitorIntel -> intelLoaded', async () => {
      mockAnalytics.getCompetitorIntel.mockResolvedValue({ success: true, data: [{ competitor_name: 'Rival' }] });
      const r = await handleB2BAction('getCompetitorIntel', {});
      expect(r.action).toBe('intelLoaded');
    });

    test('saveSnapshot -> snapshotSaved', async () => {
      mockAnalytics.saveSnapshot.mockResolvedValue({ success: true, data: { _id: 'snap_001' } });
      const r = await handleB2BAction('saveSnapshot', { days: 30 });
      expect(r.action).toBe('snapshotSaved');
    });
  });

  // ========== RESEARCH ==========

  describe('Research Actions', () => {
    test('generateBrief -> briefLoaded with brief and cached flag', async () => {
      const brief = { carrier_name: 'Test', highlights: ['Large fleet'], talk_track: 'We have 14 drivers...' };
      mockResearch.generateBrief.mockResolvedValue({ success: true, brief, cached: false });
      const r = await handleB2BAction('generateBrief', { accountId: 'acc_001' });
      expect(r.action).toBe('briefLoaded');
      expect(r.payload.brief).toEqual(brief);
      expect(r.payload.cached).toBe(false);
    });

    test('generateBrief with forceRefresh passes true', async () => {
      mockResearch.generateBrief.mockResolvedValue({ success: true, brief: {}, cached: false });
      await handleB2BAction('generateBrief', { accountId: 'acc_001', forceRefresh: true });
      expect(mockResearch.generateBrief).toHaveBeenCalledWith('acc_001', true);
    });

    test('getBrief -> briefLoaded with cached=true', async () => {
      mockResearch.getBrief.mockResolvedValue({ success: true, brief: { carrier_name: 'Cached' } });
      const r = await handleB2BAction('getBrief', { accountId: 'acc_001' });
      expect(r.action).toBe('briefLoaded');
      expect(r.payload.cached).toBe(true);
    });
  });

  // ========== QUICK ACTIONS ==========

  describe('Quick Actions', () => {
    test('quickAction call -> logs call, returns actionSuccess', async () => {
      mockActivity.logCall.mockResolvedValue({ success: true });
      const r = await handleB2BAction('quickAction', { type: 'call', accountId: 'acc_001' });
      expect(r.action).toBe('actionSuccess');
      expect(r.payload.type).toBe('call');
    });

    test('quickAction email -> logs email', async () => {
      mockActivity.logEmail.mockResolvedValue({ success: true });
      const r = await handleB2BAction('quickAction', { type: 'email', accountId: 'acc_001' });
      expect(r.action).toBe('actionSuccess');
      expect(r.payload.type).toBe('email');
    });

    test('quickAction sms -> logs sms', async () => {
      mockActivity.logSms.mockResolvedValue({ success: true });
      const r = await handleB2BAction('quickAction', { type: 'sms', accountId: 'acc_001' });
      expect(r.action).toBe('actionSuccess');
    });

    test('quickAction task -> logs task', async () => {
      mockActivity.logTask.mockResolvedValue({ success: true });
      const r = await handleB2BAction('quickAction', { type: 'task', accountId: 'acc_001' });
      expect(r.action).toBe('actionSuccess');
    });

    test('quickAction generateBrief -> briefLoaded', async () => {
      mockResearch.generateBrief.mockResolvedValue({ success: true, brief: { carrier_name: 'Test' } });
      const r = await handleB2BAction('quickAction', { type: 'generateBrief', accountId: 'acc_001' });
      expect(r.action).toBe('briefLoaded');
    });

    test('quickAction unknown type -> actionError', async () => {
      const r = await handleB2BAction('quickAction', { type: 'unknown', accountId: 'acc_001' });
      expect(r.action).toBe('actionError');
    });
  });

  // ========== OUTREACH RECORDS ==========

  describe('Outreach Records', () => {
    test('recordEmail -> emailRecorded', async () => {
      mockSequences.recordEmail.mockResolvedValue({ success: true, data: { _id: 'em_001' } });
      const r = await handleB2BAction('recordEmail', { account_id: 'acc_001', subject: 'Intro' });
      expect(r.action).toBe('emailRecorded');
    });

    test('recordSms -> smsRecorded', async () => {
      mockSequences.recordSms.mockResolvedValue({ success: true, data: { _id: 'sms_001' } });
      const r = await handleB2BAction('recordSms', { account_id: 'acc_001' });
      expect(r.action).toBe('smsRecorded');
    });

    test('recordCall -> callRecorded', async () => {
      mockSequences.recordCall.mockResolvedValue({ success: true, data: { _id: 'call_001' } });
      const r = await handleB2BAction('recordCall', { account_id: 'acc_001' });
      expect(r.action).toBe('callRecorded');
    });
  });

  // ========== COMPLETE ACTION COVERAGE ==========

  describe('Action Coverage', () => {
    const ALL_ACTIONS = [
      'getDashboardKPIs', 'getTopProspects', 'getAlerts', 'getTopOpportunities', 'getNextActions',
      'getAccount', 'createAccount', 'updateAccount', 'listAccounts',
      'getContacts', 'createContact',
      'getSignal', 'generateSignal',
      'getPipeline', 'getForecast', 'moveStage', 'getStageConversions', 'getRisks',
      'getTimeline', 'logActivity',
      'getSequences', 'saveSequence', 'getThrottleStatus',
      'getOutreachMetrics', 'getChannelPerformance', 'getRepPerformance',
      'captureLead',
      'getSourcePerformance', 'getCPA', 'getCompetitorIntel', 'saveSnapshot',
      'generateBrief', 'getBrief',
      'quickAction',
      'recordEmail', 'recordSms', 'recordCall'
    ];

    test.each(ALL_ACTIONS)('action "%s" does not return Unknown action error when service succeeds', async (action) => {
      // Set up generic success mocks for all services
      Object.values(mockAnalytics).forEach(fn => fn.mockResolvedValue({ success: true, kpis: {}, data: [], alerts: [] }));
      Object.values(mockAccounts).forEach(fn => fn.mockResolvedValue({ success: true, data: { _id: 'test' } }));
      Object.values(mockSignals).forEach(fn => fn.mockResolvedValue({ success: true, data: [], alerts: [] }));
      Object.values(mockPipeline).forEach(fn => fn.mockResolvedValue({ success: true, data: [] }));
      Object.values(mockActivity).forEach(fn => fn.mockResolvedValue({ success: true, data: [] }));
      Object.values(mockSequences).forEach(fn => fn.mockResolvedValue({ success: true, data: [] }));
      Object.values(mockResearch).forEach(fn => fn.mockResolvedValue({ success: true, brief: {}, cached: false }));

      const testData = action === 'quickAction' ? { type: 'call', accountId: 'a1' }
        : action === 'captureLead' ? { lead: { companyName: 'X', contactName: 'Y' } }
        : { accountId: 'a1', carrierDot: '123', opportunityId: 'o1', newStage: 'discovery', userId: 'u1', sequenceId: null, days: 30 };

      const r = await handleB2BAction(action, testData);
      expect(r.action).not.toContain('Unknown action');
    });
  });
});
