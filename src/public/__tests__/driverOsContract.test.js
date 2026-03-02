/**
 * driverOsContract.test.js
 * ═══════════════════════════════════════════════════════════════════
 * Tests for the DriverOS message contract registry.
 * Validates schema completeness, validate() function behavior,
 * and protocol consistency.
 * ═══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load the contract into a minimal simulated browser context (no jsdom needed)
function loadContract() {
  const contractSource = fs.readFileSync(
    path.resolve(__dirname, '../driver/os/js/driver-os-contract.js'),
    'utf8'
  );

  // Create a minimal window mock — the contract IIFE only needs window.DOS
  const sandbox = { window: {}, Object, Array };
  vm.createContext(sandbox);
  vm.runInContext(contractSource, sandbox, { filename: 'driver-os-contract.js' });

  return sandbox.window.DOS.CONTRACT;
}

describe('DriverOS Contract', () => {
  let CONTRACT;

  beforeAll(() => {
    CONTRACT = loadContract();
  });

  // ═══ Schema Completeness ═══

  describe('Schema Completeness', () => {
    test('CONTRACT object exists with expected shape', () => {
      expect(CONTRACT).toBeDefined();
      expect(CONTRACT.inbound).toBeDefined();
      expect(CONTRACT.outbound).toBeDefined();
      expect(typeof CONTRACT.validate).toBe('function');
      expect(typeof CONTRACT.getActions).toBe('function');
      expect(typeof CONTRACT.findDuplicates).toBe('function');
      expect(typeof CONTRACT.translateLegacy).toBe('function');
      expect(CONTRACT.VERSION).toBeDefined();
    });

    test('has at least 100 inbound actions registered', () => {
      const inboundCount = CONTRACT.getActions('inbound').length;
      expect(inboundCount).toBeGreaterThanOrEqual(100);
    });

    test('has at least 80 outbound actions registered', () => {
      const outboundCount = CONTRACT.getActions('outbound').length;
      expect(outboundCount).toBeGreaterThanOrEqual(80);
    });

    test('every action has required and optional arrays', () => {
      const allActions = [
        ...Object.entries(CONTRACT.inbound),
        ...Object.entries(CONTRACT.outbound)
      ];

      for (const [name, schema] of allActions) {
        expect(Array.isArray(schema.required)).toBe(true);
        expect(Array.isArray(schema.optional)).toBe(true);
      }
    });

    test('no duplicate action names within inbound', () => {
      const actions = CONTRACT.getActions('inbound');
      const unique = new Set(actions);
      expect(unique.size).toBe(actions.length);
    });

    test('no duplicate action names within outbound', () => {
      const actions = CONTRACT.getActions('outbound');
      const unique = new Set(actions);
      expect(unique.size).toBe(actions.length);
    });
  });

  // ═══ Critical Actions Present ═══

  describe('Critical Actions Registered', () => {
    const criticalInbound = [
      'findMatches', 'getDriverProfile', 'agentMessage',
      'getMarketSignals', 'getProactiveInsights',
      'getGamificationState', 'getBadges', 'getChallenges',
      'getForumThreads', 'getAnnouncements', 'getSurveys',
      'searchParking', 'getHealthResources', 'searchPetFriendly',
      'getDriverPolicies', 'getMentors', 'viewChanged',
      'getVoiceConfig', 'refreshDashboard', 'searchJobs'
    ];

    const criticalOutbound = [
      'pageReady', 'matchResults', 'matchError',
      'agentResponse', 'agentTyping', 'voiceReady',
      'marketSignalsLoaded', 'proactiveInsightsLoaded',
      'gamificationStateLoaded', 'badgesLoaded',
      'forumThreadsLoaded', 'announcementsLoaded',
      'healthResourcesLoaded', 'driverPoliciesLoaded',
      'mentorsLoaded', 'dashboardData', 'actionError'
    ];

    test.each(criticalInbound)('inbound action "%s" is registered', (action) => {
      expect(CONTRACT.inbound[action]).toBeDefined();
    });

    test.each(criticalOutbound)('outbound action "%s" is registered', (action) => {
      expect(CONTRACT.outbound[action]).toBeDefined();
    });
  });

  // ═══ All 19 View Ready Actions ═══

  describe('View Ready Actions', () => {
    const viewReadyActions = [
      'carrierMatchingReady', 'dashboardReady', 'driverMyCareerReady',
      'documentUploadReady', 'surveysReady', 'roadUtilitiesReady',
      'announcementsReady', 'policiesReady', 'retentionReady',
      'gamificationReady', 'badgesReady', 'challengesReady',
      'forumsReady', 'healthReady', 'petFriendlyReady',
      'mentorsReady', 'mentorProfileReady'
    ];

    test.each(viewReadyActions)('ready action "%s" is registered as inbound', (action) => {
      expect(CONTRACT.inbound[action]).toBeDefined();
    });

    test('pageReady outbound response exists', () => {
      expect(CONTRACT.outbound.pageReady).toBeDefined();
      expect(CONTRACT.outbound.pageReady.required).toContain('userStatus');
    });
  });

  // ═══ validate() Function ═══

  describe('validate()', () => {
    test('returns valid:true for correct inbound payload', () => {
      const result = CONTRACT.validate('inbound', 'findMatches', {
        cdlClass: 'A',
        yearsExp: 5
      });
      expect(result.valid).toBe(true);
    });

    test('returns valid:true for inbound with no required fields', () => {
      const result = CONTRACT.validate('inbound', 'ping', {});
      expect(result.valid).toBe(true);
    });

    test('returns valid:true for inbound with null payload', () => {
      const result = CONTRACT.validate('inbound', 'refreshDashboard', null);
      expect(result.valid).toBe(true);
    });

    test('returns valid:false for unknown inbound action', () => {
      const result = CONTRACT.validate('inbound', 'nonExistentAction', {});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unknown inbound action');
    });

    test('returns valid:false for unknown outbound action', () => {
      const result = CONTRACT.validate('outbound', 'nonExistentAction', {});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unknown outbound action');
    });

    test('returns valid:false for missing required field on outbound', () => {
      const result = CONTRACT.validate('outbound', 'actionError', {});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing required field "message"');
    });

    test('returns valid:true for outbound with all required fields', () => {
      const result = CONTRACT.validate('outbound', 'actionError', {
        message: 'Something went wrong'
      });
      expect(result.valid).toBe(true);
    });

    test('returns valid:false for missing required inbound field', () => {
      const result = CONTRACT.validate('inbound', 'viewChanged', {});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing required field "viewId"');
    });

    test('returns valid:true when required fields present', () => {
      const result = CONTRACT.validate('inbound', 'viewChanged', {
        viewId: 'dashboard'
      });
      expect(result.valid).toBe(true);
    });

    test('returns valid:true for agentMessage with text', () => {
      const result = CONTRACT.validate('inbound', 'agentMessage', {
        text: 'What carriers match my CDL?',
        context: { currentView: 'matching' }
      });
      expect(result.valid).toBe(true);
    });

    test('returns valid:false for agentMessage without text', () => {
      const result = CONTRACT.validate('inbound', 'agentMessage', {
        context: { currentView: 'matching' }
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('text');
    });
  });

  // ═══ Legacy Translation ═══

  describe('translateLegacy()', () => {
    test('passes through action-key messages unchanged', () => {
      const result = CONTRACT.translateLegacy({
        action: 'findMatches',
        payload: { cdlClass: 'A' }
      });
      expect(result.action).toBe('findMatches');
      expect(result.payload.cdlClass).toBe('A');
    });

    test('translates type-key messages to action-key', () => {
      const result = CONTRACT.translateLegacy({
        type: 'dashboardReady',
        data: {}
      });
      expect(result.action).toBe('dashboardReady');
      expect(result.payload).toEqual({});
    });

    test('unwraps carrierMatching envelope', () => {
      const result = CONTRACT.translateLegacy({
        type: 'carrierMatching',
        action: 'findMatches',
        data: { cdlClass: 'A' }
      });
      expect(result.action).toBe('findMatches');
      expect(result.payload.cdlClass).toBe('A');
    });

    test('returns null for null input', () => {
      expect(CONTRACT.translateLegacy(null)).toBeNull();
    });

    test('returns null for empty object', () => {
      expect(CONTRACT.translateLegacy({})).toBeNull();
    });

    test('handles hybrid messages (both action and type)', () => {
      const result = CONTRACT.translateLegacy({
        action: 'findMatches',
        type: 'carrierMatching',
        data: { cdlClass: 'A' }
      });
      // carrierMatching envelope is matched first
      expect(result.action).toBe('findMatches');
    });

    test('uses data as payload fallback when payload missing', () => {
      const result = CONTRACT.translateLegacy({
        action: 'getReviews',
        data: { locationId: '123' }
      });
      expect(result.payload.locationId).toBe('123');
    });
  });

  // ═══ getActions() ═══

  describe('getActions()', () => {
    test('returns array of strings for inbound', () => {
      const actions = CONTRACT.getActions('inbound');
      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
      actions.forEach(a => expect(typeof a).toBe('string'));
    });

    test('returns array of strings for outbound', () => {
      const actions = CONTRACT.getActions('outbound');
      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
      actions.forEach(a => expect(typeof a).toBe('string'));
    });
  });

  // ═══ findDuplicates() ═══

  describe('findDuplicates()', () => {
    test('returns array', () => {
      const dupes = CONTRACT.findDuplicates();
      expect(Array.isArray(dupes)).toBe(true);
    });

    test('any duplicates are intentional shared names (max 5 allowed)', () => {
      const dupes = CONTRACT.findDuplicates();
      if (dupes.length > 0) {
        console.log('Actions found in both inbound and outbound:', dupes);
      }
      expect(dupes.length).toBeLessThanOrEqual(5);
    });
  });
});
