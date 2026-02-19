/* eslint-disable */
/**
 * RECRUITER OS Bridge Tests
 *
 * Tests the 12 Recruiter OS message handlers added to
 * src/pages/Recruiter Console.zriuj.js (lines 547-582, 1452-1620).
 *
 * Verifies: source structure, message routing, backend delegation,
 * error handling, and MESSAGE_REGISTRY entries.
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// SOURCE FILE REFERENCE
// =============================================================================

const PAGE_FILE = path.resolve(
  __dirname, '..', '..', 'pages', 'Recruiter Console.zriuj.js'
);
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

// =============================================================================
// MOCKS
// =============================================================================

function createMockComponent(id) {
  return {
    _id: id || '#html1',
    onMessage: jest.fn(),
    postMessage: jest.fn()
  };
}

const mockWixUsers = {
  currentUser: {
    loggedIn: true,
    id: 'user-123',
    getIdAsync: jest.fn().mockResolvedValue('user-123')
  }
};

const mockWixLocation = { to: jest.fn() };

// Backend service mocks matching the actual imports
const mockBackend = {
  getOrCreateRecruiterProfile: jest.fn().mockResolvedValue({
    success: true,
    profile: { name: 'Test Recruiter', recruiter_id: 'rec-1', subscription_tier: 'Pro' },
    carriers: [{ carrier_dot: '1234567', carrier_name: 'Test Carrier LLC' }],
    defaultCarrierDOT: '1234567'
  }),
  getFunnelMetrics: jest.fn().mockResolvedValue({
    stages: [
      { label: 'Applied', count: 50 },
      { label: 'Screened', count: 30 },
      { label: 'Offered', count: 10 },
      { label: 'Hired', count: 5 }
    ],
    conversionRate: 10
  }),
  calculateCostPerHire: jest.fn().mockResolvedValue({ costPerHire: 2500, trend: '+5%' }),
  getCompetitorComparison: jest.fn().mockResolvedValue({ competitors: [], averagePay: 75000 }),
  generateHiringForecast: jest.fn().mockResolvedValue({ forecast: [], confidence: 0.85 }),
  getTurnoverRiskAnalysis: jest.fn().mockResolvedValue({ riskLevel: 'medium', atRiskCount: 3 }),
  getActiveWorkflows: jest.fn().mockResolvedValue({ workflows: [], total: 0 }),
  updateWorkflowStatus: jest.fn().mockResolvedValue({ success: true }),
  getCarrierRetentionDashboard: jest.fn().mockResolvedValue({
    retentionRate: 85,
    atRiskDrivers: [{ id: 'd1', name: 'Driver 1', risk: 'high' }]
  }),
  getLeaderboard: jest.fn().mockResolvedValue({ entries: [], period: 'monthly' }),
  getUserLeaderboardPosition: jest.fn().mockResolvedValue({ rank: 5, badges: ['top_recruiter'] })
};

// =============================================================================
// REPLICATED CORE LOGIC (mirrors page code for testability)
// =============================================================================

let cachedRecruiterProfile = null;
let cachedCarriers = [];
let currentCarrierDOT = null;

function sendToHtml(component, type, data) {
  component.postMessage({ type, data, timestamp: Date.now() });
}

async function handleRecruiterOSReady(component, wixUsers = mockWixUsers, backend = mockBackend) {
  if (!wixUsers || !wixUsers.currentUser.loggedIn) {
    return;
  }
  const result = await backend.getOrCreateRecruiterProfile();
  if (!result.success) {
    sendToHtml(component, 'error', { message: result.error });
    return;
  }
  cachedRecruiterProfile = result.profile;
  cachedCarriers = result.carriers || [];
  if (cachedCarriers.length > 0) {
    currentCarrierDOT = result.defaultCarrierDOT || cachedCarriers[0].carrier_dot;
  }
  sendToHtml(component, 'recruiterOSInit', {
    profile: {
      name: result.profile.name || result.profile.recruiter_name || '',
      tier: result.profile.subscription_tier || 'Free',
      currentCarrierDOT
    },
    carriers: cachedCarriers.map(c => ({
      dot: c.carrier_dot,
      name: c.carrier_name || c.legal_name || ''
    })),
    memberId: wixUsers?.currentUser?.id || null
  });
}

async function handleGetFunnelData(data, component, backend = mockBackend) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'funnelDataLoaded', { stages: [] });
    return;
  }
  try {
    const result = await backend.getFunnelMetrics(currentCarrierDOT, data?.dateRange);
    sendToHtml(component, 'funnelDataLoaded', result);
  } catch (error) {
    sendToHtml(component, 'funnelDataLoaded', { error: error.message, stages: [] });
  }
}

async function handleGetCostData(data, component, backend = mockBackend) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'costDataLoaded', {});
    return;
  }
  try {
    const result = await backend.calculateCostPerHire(currentCarrierDOT, data?.dateRange);
    sendToHtml(component, 'costDataLoaded', result);
  } catch (error) {
    sendToHtml(component, 'costDataLoaded', { error: error.message });
  }
}

async function handleGetCompetitorData(data, component, backend = mockBackend) {
  try {
    const region = data?.region || 'national';
    const jobType = data?.jobType || 'CDL-A OTR';
    const result = await backend.getCompetitorComparison(region, jobType);
    sendToHtml(component, 'competitorDataLoaded', result);
  } catch (error) {
    sendToHtml(component, 'competitorDataLoaded', { error: error.message });
  }
}

async function handleGetPredictionsData(data, component, backend = mockBackend) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'predictionsLoaded', {});
    return;
  }
  try {
    const [forecast, risk] = await Promise.all([
      backend.generateHiringForecast(currentCarrierDOT, data?.monthsAhead || 3),
      backend.getTurnoverRiskAnalysis(currentCarrierDOT)
    ]);
    sendToHtml(component, 'predictionsLoaded', { forecast, risk });
  } catch (error) {
    sendToHtml(component, 'predictionsLoaded', { error: error.message });
  }
}

async function handleGetWorkflows(data, component, backend = mockBackend) {
  try {
    const filters = data?.filters || {};
    if (currentCarrierDOT) filters.carrierId = currentCarrierDOT;
    const result = await backend.getActiveWorkflows(filters);
    sendToHtml(component, 'workflowsLoaded', result);
  } catch (error) {
    sendToHtml(component, 'workflowsLoaded', { error: error.message, workflows: [] });
  }
}

async function handleUpdateWorkflowStep(data, component, backend = mockBackend) {
  try {
    const result = await backend.updateWorkflowStatus(data.workflowId, data.status, data.metadata || {});
    sendToHtml(component, 'workflowUpdated', result);
  } catch (error) {
    sendToHtml(component, 'workflowUpdated', { success: false, error: error.message });
  }
}

async function handleGetRetentionData(data, component, backend = mockBackend) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'retentionDataLoaded', {});
    return;
  }
  try {
    const result = await backend.getCarrierRetentionDashboard(currentCarrierDOT);
    sendToHtml(component, 'retentionDataLoaded', result);
  } catch (error) {
    sendToHtml(component, 'retentionDataLoaded', { error: error.message });
  }
}

async function handleGetAtRiskDrivers(data, component, backend = mockBackend) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'atRiskDriversLoaded', { drivers: [] });
    return;
  }
  try {
    const result = await backend.getCarrierRetentionDashboard(currentCarrierDOT);
    sendToHtml(component, 'atRiskDriversLoaded', {
      drivers: result.atRiskDrivers || result.at_risk_drivers || []
    });
  } catch (error) {
    sendToHtml(component, 'atRiskDriversLoaded', { error: error.message, drivers: [] });
  }
}

async function handleGetLeaderboardData(data, component, backend = mockBackend) {
  try {
    const type = data?.type || 'overall';
    const period = data?.period || 'monthly';
    const result = await backend.getLeaderboard(type, period);
    sendToHtml(component, 'leaderboardLoaded', result);
  } catch (error) {
    sendToHtml(component, 'leaderboardLoaded', { error: error.message, entries: [] });
  }
}

async function handleGetBadges(data, component, backend = mockBackend) {
  try {
    const recruiterId = cachedRecruiterProfile?.recruiter_id || cachedRecruiterProfile?._id;
    if (!recruiterId) {
      sendToHtml(component, 'badgesLoaded', { badges: [] });
      return;
    }
    const result = await backend.getUserLeaderboardPosition(recruiterId);
    sendToHtml(component, 'badgesLoaded', result);
  } catch (error) {
    sendToHtml(component, 'badgesLoaded', { error: error.message, badges: [] });
  }
}

async function handleGetSettingsData(component) {
  sendToHtml(component, 'settingsDataLoaded', {
    profile: cachedRecruiterProfile,
    carriers: cachedCarriers,
    currentCarrierDOT
  });
}

// Message router for OS-specific actions
async function routeOSMessage(component, action, data, backend = mockBackend, wixUsers = mockWixUsers) {
  switch (action) {
    case 'recruiterOSReady':
      await handleRecruiterOSReady(component, wixUsers, backend);
      break;
    case 'getFunnelData':
      await handleGetFunnelData(data, component, backend);
      break;
    case 'getCostData':
      await handleGetCostData(data, component, backend);
      break;
    case 'getCompetitorData':
      await handleGetCompetitorData(data, component, backend);
      break;
    case 'getPredictionsData':
      await handleGetPredictionsData(data, component, backend);
      break;
    case 'getWorkflows':
      await handleGetWorkflows(data, component, backend);
      break;
    case 'updateWorkflowStep':
      await handleUpdateWorkflowStep(data, component, backend);
      break;
    case 'getRetentionData':
      await handleGetRetentionData(data, component, backend);
      break;
    case 'getAtRiskDrivers':
      await handleGetAtRiskDrivers(data, component, backend);
      break;
    case 'getLeaderboard':
      await handleGetLeaderboardData(data, component, backend);
      break;
    case 'getBadges':
      await handleGetBadges(data, component, backend);
      break;
    case 'getSettingsData':
      await handleGetSettingsData(component);
      break;
    default:
      return false;
  }
  return true;
}

// =============================================================================
// TESTS
// =============================================================================

describe('Recruiter OS Bridge Tests (Recruiter Console Page Code)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    cachedRecruiterProfile = null;
    cachedCarriers = [];
    currentCarrierDOT = null;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Source File Structure
  // ─────────────────────────────────────────────────────────────────────────
  describe('Source file structure', () => {

    test('imports recruiterAnalyticsService functions', () => {
      expect(sourceCode).toContain("from 'backend/recruiterAnalyticsService.jsw'");
      expect(sourceCode).toContain('getFunnelMetrics');
      expect(sourceCode).toContain('calculateCostPerHire');
      expect(sourceCode).toContain('getCompetitorComparison');
      expect(sourceCode).toContain('generateHiringForecast');
      expect(sourceCode).toContain('getTurnoverRiskAnalysis');
    });

    test('imports onboardingWorkflowService functions', () => {
      expect(sourceCode).toContain("from 'backend/onboardingWorkflowService.jsw'");
      expect(sourceCode).toContain('getActiveWorkflows');
      expect(sourceCode).toContain('updateWorkflowStatus');
    });

    test('imports retentionService functions', () => {
      expect(sourceCode).toContain("from 'backend/retentionService.jsw'");
      expect(sourceCode).toContain('getCarrierRetentionDashboard');
    });

    test('imports leaderboardService functions', () => {
      expect(sourceCode).toContain("from 'backend/leaderboardService.jsw'");
      expect(sourceCode).toContain('getLeaderboard');
      expect(sourceCode).toContain('getUserLeaderboardPosition');
    });

    test('defines all 12 OS handler functions', () => {
      const handlers = [
        'handleRecruiterOSReady',
        'handleGetFunnelData',
        'handleGetCostData',
        'handleGetCompetitorData',
        'handleGetPredictionsData',
        'handleGetWorkflows',
        'handleUpdateWorkflowStep',
        'handleGetRetentionData',
        'handleGetAtRiskDrivers',
        'handleGetLeaderboardData',
        'handleGetBadges',
        'handleGetSettingsData'
      ];
      handlers.forEach(h => {
        expect(sourceCode).toContain(`async function ${h}(`);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // MESSAGE_REGISTRY Validation
  // ─────────────────────────────────────────────────────────────────────────
  describe('MESSAGE_REGISTRY entries', () => {

    const OS_INBOUND = [
      'recruiterOSReady', 'getFunnelData', 'getCostData',
      'getCompetitorData', 'getPredictionsData', 'getWorkflows',
      'updateWorkflowStep', 'getRetentionData', 'getAtRiskDrivers',
      'getLeaderboard', 'getBadges', 'getSettingsData'
    ];

    const OS_OUTBOUND = [
      'recruiterOSInit', 'funnelDataLoaded', 'costDataLoaded',
      'competitorDataLoaded', 'predictionsLoaded', 'workflowsLoaded',
      'workflowUpdated', 'retentionDataLoaded', 'atRiskDriversLoaded',
      'leaderboardLoaded', 'badgesLoaded', 'settingsDataLoaded'
    ];

    test.each(OS_INBOUND)('inbound message "%s" is registered', (msg) => {
      expect(sourceCode).toContain(`'${msg}'`);
    });

    test.each(OS_OUTBOUND)('outbound message "%s" is registered', (msg) => {
      expect(sourceCode).toContain(`'${msg}'`);
    });

    test('all 12 OS inbound messages are in MESSAGE_REGISTRY.inbound section', () => {
      // Extract inbound array content
      const inboundMatch = sourceCode.match(/inbound:\s*\[([\s\S]*?)\]/);
      expect(inboundMatch).toBeTruthy();
      const inboundBlock = inboundMatch[1];
      OS_INBOUND.forEach(msg => {
        expect(inboundBlock).toContain(`'${msg}'`);
      });
    });

    test('all 12 OS outbound messages are in MESSAGE_REGISTRY.outbound section', () => {
      const outboundMatch = sourceCode.match(/outbound:\s*\[([\s\S]*?)\]/);
      expect(outboundMatch).toBeTruthy();
      const outboundBlock = outboundMatch[1];
      OS_OUTBOUND.forEach(msg => {
        expect(outboundBlock).toContain(`'${msg}'`);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Switch Cases
  // ─────────────────────────────────────────────────────────────────────────
  describe('Switch case routing', () => {

    const OS_CASES = [
      'recruiterOSReady', 'getFunnelData', 'getCostData',
      'getCompetitorData', 'getPredictionsData', 'getWorkflows',
      'updateWorkflowStep', 'getRetentionData', 'getAtRiskDrivers',
      'getLeaderboard', 'getBadges', 'getSettingsData'
    ];

    test.each(OS_CASES)('switch has case for "%s"', (action) => {
      expect(sourceCode).toContain(`case '${action}':`);
    });
  });

  describe('Phase 2 paid media bridge wiring', () => {
    const PAID_MEDIA_INBOUND = [
      'getPaidMediaState',
      'createPaidMediaDraft',
      'updatePaidMediaAdSet',
      'createPaidMediaCreative',
      'launchPaidMediaCampaign'
    ];
    const PAID_MEDIA_OUTBOUND = [
      'paidMediaStateLoaded',
      'paidMediaDraftCreated',
      'paidMediaAdSetUpdated',
      'paidMediaCreativeCreated',
      'paidMediaLaunchResult'
    ];

    test('imports executeTool for paid media router dispatch', () => {
      expect(sourceCode).toContain("executeTool } from 'backend/agentService'");
      expect(sourceCode).toContain("executeTool(");
      expect(sourceCode).toContain("'recruiter_paid_media'");
    });

    test.each(PAID_MEDIA_INBOUND)('inbound paid media message "%s" is registered', (msg) => {
      expect(sourceCode).toContain(`'${msg}'`);
      expect(sourceCode).toContain(`case '${msg}':`);
    });

    test.each(PAID_MEDIA_OUTBOUND)('outbound paid media message "%s" is registered', (msg) => {
      expect(sourceCode).toContain(`'${msg}'`);
    });

    test('defines paid media handlers', () => {
      expect(sourceCode).toContain('async function handleGetPaidMediaState(');
      expect(sourceCode).toContain('async function handleCreatePaidMediaDraft(');
      expect(sourceCode).toContain('async function handleUpdatePaidMediaAdSet(');
      expect(sourceCode).toContain('async function handleCreatePaidMediaCreative(');
      expect(sourceCode).toContain('async function handleLaunchPaidMediaCampaign(');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Handler: recruiterOSReady
  // ─────────────────────────────────────────────────────────────────────────
  describe('handleRecruiterOSReady', () => {

    test('sends recruiterOSInit with profile and carriers on success', async () => {
      const comp = createMockComponent();
      await handleRecruiterOSReady(comp);

      expect(mockBackend.getOrCreateRecruiterProfile).toHaveBeenCalledTimes(1);
      expect(comp.postMessage).toHaveBeenCalledTimes(1);

      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('recruiterOSInit');
      expect(sent.data.profile).toBeDefined();
      expect(sent.data.profile.name).toBe('Test Recruiter');
      expect(sent.data.profile.tier).toBe('Pro');
      expect(sent.data.carriers).toHaveLength(1);
      expect(sent.data.carriers[0].dot).toBe('1234567');
      expect(sent.data.memberId).toBe('user-123');
    });

    test('sets currentCarrierDOT from profile result', async () => {
      const comp = createMockComponent();
      await handleRecruiterOSReady(comp);

      expect(currentCarrierDOT).toBe('1234567');
      expect(cachedRecruiterProfile).not.toBeNull();
      expect(cachedCarriers).toHaveLength(1);
    });

    test('sends error when profile creation fails', async () => {
      const failBackend = {
        ...mockBackend,
        getOrCreateRecruiterProfile: jest.fn().mockResolvedValue({
          success: false,
          error: 'Profile creation failed'
        })
      };
      const comp = createMockComponent();
      await handleRecruiterOSReady(comp, mockWixUsers, failBackend);

      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('error');
      expect(sent.data.message).toBe('Profile creation failed');
    });

    test('does not send if user not logged in', async () => {
      const comp = createMockComponent();
      const noAuth = { currentUser: { loggedIn: false } };
      await handleRecruiterOSReady(comp, noAuth);

      expect(comp.postMessage).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Handler: getFunnelData
  // ─────────────────────────────────────────────────────────────────────────
  describe('handleGetFunnelData', () => {

    test('returns empty stages when no carrier selected', async () => {
      const comp = createMockComponent();
      currentCarrierDOT = null;
      await handleGetFunnelData({}, comp);

      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('funnelDataLoaded');
      expect(sent.data.stages).toEqual([]);
    });

    test('calls getFunnelMetrics with carrier DOT', async () => {
      const comp = createMockComponent();
      currentCarrierDOT = '1234567';
      await handleGetFunnelData({ dateRange: '30d' }, comp);

      expect(mockBackend.getFunnelMetrics).toHaveBeenCalledWith('1234567', '30d');
      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('funnelDataLoaded');
      expect(sent.data.stages).toHaveLength(4);
    });

    test('handles backend error gracefully', async () => {
      const failBackend = {
        ...mockBackend,
        getFunnelMetrics: jest.fn().mockRejectedValue(new Error('Airtable timeout'))
      };
      const comp = createMockComponent();
      currentCarrierDOT = '1234567';
      await handleGetFunnelData({}, comp, failBackend);

      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('funnelDataLoaded');
      expect(sent.data.error).toBe('Airtable timeout');
      expect(sent.data.stages).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Handler: getCostData
  // ─────────────────────────────────────────────────────────────────────────
  describe('handleGetCostData', () => {

    test('returns empty object when no carrier selected', async () => {
      const comp = createMockComponent();
      currentCarrierDOT = null;
      await handleGetCostData({}, comp);

      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('costDataLoaded');
      expect(sent.data).toEqual({});
    });

    test('calls calculateCostPerHire with carrier DOT', async () => {
      const comp = createMockComponent();
      currentCarrierDOT = '7654321';
      await handleGetCostData({ dateRange: '90d' }, comp);

      expect(mockBackend.calculateCostPerHire).toHaveBeenCalledWith('7654321', '90d');
      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('costDataLoaded');
      expect(sent.data.costPerHire).toBe(2500);
    });

    test('handles error gracefully', async () => {
      const failBackend = {
        ...mockBackend,
        calculateCostPerHire: jest.fn().mockRejectedValue(new Error('Calc error'))
      };
      const comp = createMockComponent();
      currentCarrierDOT = '1234567';
      await handleGetCostData({}, comp, failBackend);

      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('costDataLoaded');
      expect(sent.data.error).toBe('Calc error');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Handler: getCompetitorData
  // ─────────────────────────────────────────────────────────────────────────
  describe('handleGetCompetitorData', () => {

    test('uses default region and jobType when not provided', async () => {
      const comp = createMockComponent();
      await handleGetCompetitorData({}, comp);

      expect(mockBackend.getCompetitorComparison).toHaveBeenCalledWith('national', 'CDL-A OTR');
    });

    test('passes custom region and jobType', async () => {
      const comp = createMockComponent();
      await handleGetCompetitorData({ region: 'southeast', jobType: 'CDL-B Local' }, comp);

      expect(mockBackend.getCompetitorComparison).toHaveBeenCalledWith('southeast', 'CDL-B Local');
      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('competitorDataLoaded');
    });

    test('handles error gracefully', async () => {
      const failBackend = {
        ...mockBackend,
        getCompetitorComparison: jest.fn().mockRejectedValue(new Error('No data'))
      };
      const comp = createMockComponent();
      await handleGetCompetitorData({}, comp, failBackend);

      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('competitorDataLoaded');
      expect(sent.data.error).toBe('No data');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Handler: getPredictionsData
  // ─────────────────────────────────────────────────────────────────────────
  describe('handleGetPredictionsData', () => {

    test('returns empty when no carrier selected', async () => {
      const comp = createMockComponent();
      currentCarrierDOT = null;
      await handleGetPredictionsData({}, comp);

      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('predictionsLoaded');
      expect(sent.data).toEqual({});
    });

    test('makes parallel calls to forecast + risk', async () => {
      const comp = createMockComponent();
      currentCarrierDOT = '1234567';
      await handleGetPredictionsData({ monthsAhead: 6 }, comp);

      expect(mockBackend.generateHiringForecast).toHaveBeenCalledWith('1234567', 6);
      expect(mockBackend.getTurnoverRiskAnalysis).toHaveBeenCalledWith('1234567');

      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('predictionsLoaded');
      expect(sent.data.forecast).toBeDefined();
      expect(sent.data.risk).toBeDefined();
    });

    test('defaults monthsAhead to 3', async () => {
      const comp = createMockComponent();
      currentCarrierDOT = '1234567';
      await handleGetPredictionsData({}, comp);

      expect(mockBackend.generateHiringForecast).toHaveBeenCalledWith('1234567', 3);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Handler: getWorkflows
  // ─────────────────────────────────────────────────────────────────────────
  describe('handleGetWorkflows', () => {

    test('injects currentCarrierDOT into filters', async () => {
      const comp = createMockComponent();
      currentCarrierDOT = '1234567';
      await handleGetWorkflows({ filters: { status: 'active' } }, comp);

      expect(mockBackend.getActiveWorkflows).toHaveBeenCalledWith({
        status: 'active',
        carrierId: '1234567'
      });
    });

    test('works without filters', async () => {
      const comp = createMockComponent();
      currentCarrierDOT = '1234567';
      await handleGetWorkflows({}, comp);

      expect(mockBackend.getActiveWorkflows).toHaveBeenCalledWith({ carrierId: '1234567' });
      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('workflowsLoaded');
    });

    test('handles error with empty workflows array', async () => {
      const failBackend = {
        ...mockBackend,
        getActiveWorkflows: jest.fn().mockRejectedValue(new Error('DB error'))
      };
      const comp = createMockComponent();
      currentCarrierDOT = '1234567';
      await handleGetWorkflows({}, comp, failBackend);

      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('workflowsLoaded');
      expect(sent.data.error).toBe('DB error');
      expect(sent.data.workflows).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Handler: updateWorkflowStep
  // ─────────────────────────────────────────────────────────────────────────
  describe('handleUpdateWorkflowStep', () => {

    test('calls updateWorkflowStatus with correct params', async () => {
      const comp = createMockComponent();
      await handleUpdateWorkflowStep({
        workflowId: 'wf-1',
        status: 'documents_submitted',
        metadata: { note: 'All docs received' }
      }, comp);

      expect(mockBackend.updateWorkflowStatus).toHaveBeenCalledWith(
        'wf-1', 'documents_submitted', { note: 'All docs received' }
      );
      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('workflowUpdated');
      expect(sent.data.success).toBe(true);
    });

    test('defaults metadata to empty object', async () => {
      const comp = createMockComponent();
      await handleUpdateWorkflowStep({ workflowId: 'wf-2', status: 'hired' }, comp);

      expect(mockBackend.updateWorkflowStatus).toHaveBeenCalledWith('wf-2', 'hired', {});
    });

    test('sends success: false on error', async () => {
      const failBackend = {
        ...mockBackend,
        updateWorkflowStatus: jest.fn().mockRejectedValue(new Error('Not found'))
      };
      const comp = createMockComponent();
      await handleUpdateWorkflowStep({ workflowId: 'wf-x', status: 'hired' }, comp, failBackend);

      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('workflowUpdated');
      expect(sent.data.success).toBe(false);
      expect(sent.data.error).toBe('Not found');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Handler: getRetentionData
  // ─────────────────────────────────────────────────────────────────────────
  describe('handleGetRetentionData', () => {

    test('returns empty when no carrier selected', async () => {
      const comp = createMockComponent();
      currentCarrierDOT = null;
      await handleGetRetentionData({}, comp);

      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('retentionDataLoaded');
      expect(sent.data).toEqual({});
    });

    test('calls getCarrierRetentionDashboard', async () => {
      const comp = createMockComponent();
      currentCarrierDOT = '1234567';
      await handleGetRetentionData({}, comp);

      expect(mockBackend.getCarrierRetentionDashboard).toHaveBeenCalledWith('1234567');
      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('retentionDataLoaded');
      expect(sent.data.retentionRate).toBe(85);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Handler: getAtRiskDrivers
  // ─────────────────────────────────────────────────────────────────────────
  describe('handleGetAtRiskDrivers', () => {

    test('returns empty drivers array when no carrier selected', async () => {
      const comp = createMockComponent();
      currentCarrierDOT = null;
      await handleGetAtRiskDrivers({}, comp);

      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('atRiskDriversLoaded');
      expect(sent.data.drivers).toEqual([]);
    });

    test('extracts atRiskDrivers from retention dashboard', async () => {
      const comp = createMockComponent();
      currentCarrierDOT = '1234567';
      await handleGetAtRiskDrivers({}, comp);

      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('atRiskDriversLoaded');
      expect(sent.data.drivers).toHaveLength(1);
      expect(sent.data.drivers[0].name).toBe('Driver 1');
    });

    test('handles at_risk_drivers key (snake_case fallback)', async () => {
      const snakeBackend = {
        ...mockBackend,
        getCarrierRetentionDashboard: jest.fn().mockResolvedValue({
          at_risk_drivers: [{ id: 'd2', name: 'Driver 2' }]
        })
      };
      const comp = createMockComponent();
      currentCarrierDOT = '1234567';
      await handleGetAtRiskDrivers({}, comp, snakeBackend);

      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.data.drivers).toHaveLength(1);
      expect(sent.data.drivers[0].name).toBe('Driver 2');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Handler: getLeaderboard
  // ─────────────────────────────────────────────────────────────────────────
  describe('handleGetLeaderboardData', () => {

    test('uses default type and period', async () => {
      const comp = createMockComponent();
      await handleGetLeaderboardData({}, comp);

      expect(mockBackend.getLeaderboard).toHaveBeenCalledWith('overall', 'monthly');
    });

    test('passes custom type and period', async () => {
      const comp = createMockComponent();
      await handleGetLeaderboardData({ type: 'hires', period: 'weekly' }, comp);

      expect(mockBackend.getLeaderboard).toHaveBeenCalledWith('hires', 'weekly');
      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('leaderboardLoaded');
    });

    test('handles error with empty entries', async () => {
      const failBackend = {
        ...mockBackend,
        getLeaderboard: jest.fn().mockRejectedValue(new Error('Service down'))
      };
      const comp = createMockComponent();
      await handleGetLeaderboardData({}, comp, failBackend);

      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('leaderboardLoaded');
      expect(sent.data.entries).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Handler: getBadges
  // ─────────────────────────────────────────────────────────────────────────
  describe('handleGetBadges', () => {

    test('returns empty badges when no recruiter profile cached', async () => {
      const comp = createMockComponent();
      cachedRecruiterProfile = null;
      await handleGetBadges({}, comp);

      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('badgesLoaded');
      expect(sent.data.badges).toEqual([]);
      expect(mockBackend.getUserLeaderboardPosition).not.toHaveBeenCalled();
    });

    test('calls getUserLeaderboardPosition with recruiter_id', async () => {
      const comp = createMockComponent();
      cachedRecruiterProfile = { recruiter_id: 'rec-1' };
      await handleGetBadges({}, comp);

      expect(mockBackend.getUserLeaderboardPosition).toHaveBeenCalledWith('rec-1');
      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('badgesLoaded');
      expect(sent.data.rank).toBe(5);
    });

    test('falls back to _id when recruiter_id missing', async () => {
      const comp = createMockComponent();
      cachedRecruiterProfile = { _id: 'fallback-id' };
      await handleGetBadges({}, comp);

      expect(mockBackend.getUserLeaderboardPosition).toHaveBeenCalledWith('fallback-id');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Handler: getSettingsData
  // ─────────────────────────────────────────────────────────────────────────
  describe('handleGetSettingsData', () => {

    test('returns cached profile, carriers, and currentCarrierDOT', async () => {
      cachedRecruiterProfile = { name: 'Cached Recruiter' };
      cachedCarriers = [{ carrier_dot: '111' }];
      currentCarrierDOT = '111';

      const comp = createMockComponent();
      await handleGetSettingsData(comp);

      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('settingsDataLoaded');
      expect(sent.data.profile.name).toBe('Cached Recruiter');
      expect(sent.data.carriers).toHaveLength(1);
      expect(sent.data.currentCarrierDOT).toBe('111');
    });

    test('returns null values when nothing is cached', async () => {
      const comp = createMockComponent();
      await handleGetSettingsData(comp);

      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent.type).toBe('settingsDataLoaded');
      expect(sent.data.profile).toBeNull();
      expect(sent.data.carriers).toEqual([]);
      expect(sent.data.currentCarrierDOT).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Message Router Integration
  // ─────────────────────────────────────────────────────────────────────────
  describe('OS message router', () => {

    const OS_ACTIONS = [
      'recruiterOSReady', 'getFunnelData', 'getCostData',
      'getCompetitorData', 'getPredictionsData', 'getWorkflows',
      'updateWorkflowStep', 'getRetentionData', 'getAtRiskDrivers',
      'getLeaderboard', 'getBadges', 'getSettingsData'
    ];

    test.each(OS_ACTIONS)('routes "%s" action successfully', async (action) => {
      const comp = createMockComponent();
      currentCarrierDOT = '1234567';
      cachedRecruiterProfile = { recruiter_id: 'rec-1' };
      const result = await routeOSMessage(comp, action, {});
      expect(result).toBe(true);
    });

    test('returns false for unknown actions', async () => {
      const comp = createMockComponent();
      const result = await routeOSMessage(comp, 'unknownAction', {});
      expect(result).toBe(false);
    });

    test('all 12 OS actions produce postMessage responses', async () => {
      // Init first to populate cached state
      const comp = createMockComponent();
      await handleRecruiterOSReady(comp);

      for (const action of OS_ACTIONS) {
        const c = createMockComponent();
        await routeOSMessage(c, action, {});
        expect(c.postMessage).toHaveBeenCalled();
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // sendToHtml envelope format
  // ─────────────────────────────────────────────────────────────────────────
  describe('sendToHtml envelope format', () => {

    test('sends { type, data, timestamp } envelope', async () => {
      const comp = createMockComponent();
      currentCarrierDOT = '1234567';
      await handleGetFunnelData({}, comp);

      const sent = comp.postMessage.mock.calls[0][0];
      expect(sent).toHaveProperty('type');
      expect(sent).toHaveProperty('data');
      expect(sent).toHaveProperty('timestamp');
      expect(typeof sent.timestamp).toBe('number');
    });

    test('source code uses type/data/timestamp pattern', () => {
      expect(sourceCode).toContain("component.postMessage({ type, data, timestamp: Date.now() })");
    });
  });
});
