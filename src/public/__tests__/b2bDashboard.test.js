/* eslint-disable */
/**
 * B2B Dashboard Page Code Tests
 *
 * Tests the Velo page code that wires B2B_DASHBOARD.html to the
 * b2bBridgeService backend via PostMessage. Covers:
 *   - HTML component discovery safety (try-catch per selector)
 *   - Message routing for all dashboard actions
 *   - Navigation handling (viewAccount -> wixLocation)
 *   - Bridge service delegation
 *   - Error handling and unknown action logging
 *
 * Strategy: Since Wix Velo page files use ESM imports ($w, wixLocation,
 * backend/*) that Jest cannot parse, we replicate the page logic here
 * with mocks and verify the routing contract.
 */

/* eslint-env jest */

// ============================================================================
// MOCKS
// ============================================================================

const mockWixLocation = {
  to: jest.fn()
};

const mockHandleB2BAction = jest.fn();

/**
 * Creates a mock HTML component with onMessage / postMessage stubs.
 */
function createMockComponent(id) {
  return {
    _id: id,
    onMessage: jest.fn(),
    postMessage: jest.fn()
  };
}

// ============================================================================
// Replicate page constants and logic (mirrors B2B_DASHBOARD.i5csc.js)
// ============================================================================

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

const BRIDGE_ACTIONS = [
  'getDashboardKPIs',
  'getTopProspects',
  'getAlerts',
  'getTopOpportunities',
  'getNextActions',
  'quickAction',
  'getSignalSpikes'
];

/**
 * Replicate getHtmlComponents - safe discovery with try-catch.
 * @param {Function} $w - mock selector function
 */
function getHtmlComponents($w) {
  const found = [];
  for (const id of HTML_COMPONENT_IDS) {
    try {
      const component = $w(id);
      if (component && typeof component.onMessage === 'function') {
        found.push(component);
      }
    } catch (_error) {
      // Element does not exist on this page variant - skip
    }
  }
  return found;
}

/**
 * Replicate routeMessage - routes incoming PostMessage to correct handler.
 * @param {object} component - mock HTML component
 * @param {object} message - incoming message payload
 */
async function routeMessage(component, message) {
  if (!message || !message.action) return;

  const { action } = message;

  // Navigation: viewAccount -> wixLocation
  if (action === 'viewAccount') {
    const accountId = message.accountId;
    if (accountId) {
      mockWixLocation.to(`/b2b-account-detail?accountId=${encodeURIComponent(accountId)}`);
    }
    return;
  }

  // Bridge-routed actions
  if (BRIDGE_ACTIONS.includes(action)) {
    try {
      const response = await mockHandleB2BAction(action, message);
      if (response && typeof component.postMessage === 'function') {
        component.postMessage(response);
      }
    } catch (error) {
      console.error(`[B2B Dashboard] Error handling "${action}":`, error);
      if (typeof component.postMessage === 'function') {
        component.postMessage({
          action: 'actionError',
          message: error.message || 'An unexpected error occurred'
        });
      }
    }
    return;
  }

  // Unknown action
  console.warn(`[B2B Dashboard] Unknown action received: ${action}`);
}

/**
 * Replicate $w.onReady body - discovers components, wires onMessage, sends init.
 * @param {Function} $w - mock selector function
 */
function simulateOnReady($w) {
  const components = getHtmlComponents($w);

  if (!components.length) {
    console.warn('[B2B Dashboard] No HTML component found on page');
    return components;
  }

  for (const component of components) {
    component.onMessage(async (event) => {
      await routeMessage(component, event?.data);
    });
    component.postMessage({ action: 'init' });
  }

  return components;
}

// ============================================================================
// TESTS
// ============================================================================

describe('B2B Dashboard Page Code', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // HTML Component Discovery Safety
  // ==========================================================================

  describe('HTML Component Discovery Safety', () => {
    test('discovers all existing HTML components', () => {
      const comp1 = createMockComponent('#html1');
      const comp2 = createMockComponent('#html2');

      const $w = jest.fn((id) => {
        if (id === '#html1') return comp1;
        if (id === '#html2') return comp2;
        throw new Error(`Element ${id} not found`);
      });

      const found = getHtmlComponents($w);
      expect(found).toHaveLength(2);
      expect(found).toContain(comp1);
      expect(found).toContain(comp2);
    });

    test('skips components that throw on $w() lookup', () => {
      const comp1 = createMockComponent('#html1');

      const $w = jest.fn((id) => {
        if (id === '#html1') return comp1;
        throw new Error(`Element ${id} not found`);
      });

      const found = getHtmlComponents($w);
      expect(found).toHaveLength(1);
      expect(found[0]).toBe(comp1);
    });

    test('skips components missing onMessage method', () => {
      const brokenComp = { _id: '#html1', postMessage: jest.fn() }; // no onMessage

      const $w = jest.fn((id) => {
        if (id === '#html1') return brokenComp;
        throw new Error('not found');
      });

      const found = getHtmlComponents($w);
      expect(found).toHaveLength(0);
    });

    test('skips null/undefined returned from $w()', () => {
      const $w = jest.fn(() => null);

      const found = getHtmlComponents($w);
      expect(found).toHaveLength(0);
    });

    test('returns empty array when no components exist on page', () => {
      const $w = jest.fn(() => { throw new Error('not found'); });
      const found = getHtmlComponents($w);
      expect(found).toHaveLength(0);
    });

    test('queries all six known HTML component IDs', () => {
      const $w = jest.fn(() => { throw new Error('not found'); });
      getHtmlComponents($w);

      expect($w).toHaveBeenCalledTimes(6);
      expect($w).toHaveBeenCalledWith('#html1');
      expect($w).toHaveBeenCalledWith('#html2');
      expect($w).toHaveBeenCalledWith('#html3');
      expect($w).toHaveBeenCalledWith('#html4');
      expect($w).toHaveBeenCalledWith('#html5');
      expect($w).toHaveBeenCalledWith('#htmlEmbed1');
    });
  });

  // ==========================================================================
  // onReady Initialization
  // ==========================================================================

  describe('onReady Initialization', () => {
    test('sends init message to each discovered component', () => {
      const comp1 = createMockComponent('#html1');
      const comp2 = createMockComponent('#html3');

      const $w = jest.fn((id) => {
        if (id === '#html1') return comp1;
        if (id === '#html3') return comp2;
        throw new Error('not found');
      });

      simulateOnReady($w);

      expect(comp1.postMessage).toHaveBeenCalledWith({ action: 'init' });
      expect(comp2.postMessage).toHaveBeenCalledWith({ action: 'init' });
    });

    test('registers onMessage handler on each discovered component', () => {
      const comp1 = createMockComponent('#html1');

      const $w = jest.fn((id) => {
        if (id === '#html1') return comp1;
        throw new Error('not found');
      });

      simulateOnReady($w);

      expect(comp1.onMessage).toHaveBeenCalledTimes(1);
      expect(typeof comp1.onMessage.mock.calls[0][0]).toBe('function');
    });

    test('logs warning and returns early when no components found', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const $w = jest.fn(() => { throw new Error('not found'); });
      const result = simulateOnReady($w);

      expect(result).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalledWith('[B2B Dashboard] No HTML component found on page');

      warnSpy.mockRestore();
    });
  });

  // ==========================================================================
  // Message Routing - Bridge Actions
  // ==========================================================================

  describe('Message Routing - Bridge Actions', () => {
    test.each(BRIDGE_ACTIONS)('routes "%s" through handleB2BAction', async (action) => {
      const component = createMockComponent('#html1');
      const mockResponse = { action: `${action}Loaded`, payload: { test: true } };
      mockHandleB2BAction.mockResolvedValue(mockResponse);

      const message = { action };
      await routeMessage(component, message);

      expect(mockHandleB2BAction).toHaveBeenCalledWith(action, message);
      expect(component.postMessage).toHaveBeenCalledWith(mockResponse);
    });

    test('getDashboardKPIs passes days parameter to bridge', async () => {
      const component = createMockComponent('#html1');
      mockHandleB2BAction.mockResolvedValue({ action: 'kpisLoaded', payload: {} });

      const message = { action: 'getDashboardKPIs', days: 60 };
      await routeMessage(component, message);

      expect(mockHandleB2BAction).toHaveBeenCalledWith('getDashboardKPIs', message);
    });

    test('getTopProspects passes limit parameter to bridge', async () => {
      const component = createMockComponent('#html1');
      mockHandleB2BAction.mockResolvedValue({ action: 'topProspectsLoaded', payload: [] });

      const message = { action: 'getTopProspects', limit: 15 };
      await routeMessage(component, message);

      expect(mockHandleB2BAction).toHaveBeenCalledWith('getTopProspects', message);
    });

    test('getAlerts passes full message to bridge', async () => {
      const component = createMockComponent('#html1');
      mockHandleB2BAction.mockResolvedValue({ action: 'alertsLoaded', payload: [] });

      const message = { action: 'getAlerts' };
      await routeMessage(component, message);

      expect(mockHandleB2BAction).toHaveBeenCalledWith('getAlerts', message);
    });

    test('getTopOpportunities passes limit parameter to bridge', async () => {
      const component = createMockComponent('#html1');
      mockHandleB2BAction.mockResolvedValue({ action: 'topOpportunitiesLoaded', payload: [] });

      const message = { action: 'getTopOpportunities', limit: 5 };
      await routeMessage(component, message);

      expect(mockHandleB2BAction).toHaveBeenCalledWith('getTopOpportunities', message);
    });

    test('getNextActions passes limit parameter to bridge', async () => {
      const component = createMockComponent('#html1');
      mockHandleB2BAction.mockResolvedValue({ action: 'nextActionsLoaded', payload: [] });

      const message = { action: 'getNextActions', limit: 10 };
      await routeMessage(component, message);

      expect(mockHandleB2BAction).toHaveBeenCalledWith('getNextActions', message);
    });

    test('quickAction passes type and carrierDot to bridge', async () => {
      const component = createMockComponent('#html1');
      mockHandleB2BAction.mockResolvedValue({ action: 'actionSuccess', message: 'Done' });

      const message = { action: 'quickAction', type: 'call', carrierDot: '1234567' };
      await routeMessage(component, message);

      expect(mockHandleB2BAction).toHaveBeenCalledWith('quickAction', message);
    });

    test('getSignalSpikes passes full message to bridge', async () => {
      const component = createMockComponent('#html1');
      mockHandleB2BAction.mockResolvedValue({ action: 'signalSpikesLoaded', payload: [] });

      const message = { action: 'getSignalSpikes' };
      await routeMessage(component, message);

      expect(mockHandleB2BAction).toHaveBeenCalledWith('getSignalSpikes', message);
    });

    test('posts bridge response back to the component', async () => {
      const component = createMockComponent('#html1');
      const payload = { pipeline_coverage: 3.2, win_rate: 28 };
      mockHandleB2BAction.mockResolvedValue({ action: 'kpisLoaded', payload });

      await routeMessage(component, { action: 'getDashboardKPIs', days: 30 });

      expect(component.postMessage).toHaveBeenCalledWith({ action: 'kpisLoaded', payload });
    });

    test('does not postMessage when bridge returns null', async () => {
      const component = createMockComponent('#html1');
      mockHandleB2BAction.mockResolvedValue(null);

      await routeMessage(component, { action: 'getDashboardKPIs' });

      expect(component.postMessage).not.toHaveBeenCalled();
    });

    test('does not postMessage when bridge returns undefined', async () => {
      const component = createMockComponent('#html1');
      mockHandleB2BAction.mockResolvedValue(undefined);

      await routeMessage(component, { action: 'getAlerts' });

      expect(component.postMessage).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Navigation Handling - viewAccount
  // ==========================================================================

  describe('Navigation Handling - viewAccount', () => {
    test('navigates to b2b-account-detail with accountId', async () => {
      const component = createMockComponent('#html1');

      await routeMessage(component, { action: 'viewAccount', accountId: 'acc_001' });

      expect(mockWixLocation.to).toHaveBeenCalledWith(
        '/b2b-account-detail?accountId=acc_001'
      );
    });

    test('encodes special characters in accountId', async () => {
      const component = createMockComponent('#html1');

      await routeMessage(component, { action: 'viewAccount', accountId: 'acc with spaces&chars' });

      expect(mockWixLocation.to).toHaveBeenCalledWith(
        '/b2b-account-detail?accountId=acc%20with%20spaces%26chars'
      );
    });

    test('does not navigate when accountId is missing', async () => {
      const component = createMockComponent('#html1');

      await routeMessage(component, { action: 'viewAccount' });

      expect(mockWixLocation.to).not.toHaveBeenCalled();
    });

    test('does not navigate when accountId is empty string', async () => {
      const component = createMockComponent('#html1');

      await routeMessage(component, { action: 'viewAccount', accountId: '' });

      expect(mockWixLocation.to).not.toHaveBeenCalled();
    });

    test('does not route viewAccount through the bridge service', async () => {
      const component = createMockComponent('#html1');

      await routeMessage(component, { action: 'viewAccount', accountId: 'acc_001' });

      expect(mockHandleB2BAction).not.toHaveBeenCalled();
    });

    test('does not postMessage back to the component on viewAccount', async () => {
      const component = createMockComponent('#html1');

      await routeMessage(component, { action: 'viewAccount', accountId: 'acc_001' });

      expect(component.postMessage).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe('Error Handling', () => {
    test('posts actionError when bridge throws an error', async () => {
      const component = createMockComponent('#html1');
      mockHandleB2BAction.mockRejectedValue(new Error('Network timeout'));

      await routeMessage(component, { action: 'getDashboardKPIs', days: 30 });

      expect(component.postMessage).toHaveBeenCalledWith({
        action: 'actionError',
        message: 'Network timeout'
      });
    });

    test('posts generic error message when error has no message', async () => {
      const component = createMockComponent('#html1');
      mockHandleB2BAction.mockRejectedValue({});

      await routeMessage(component, { action: 'getAlerts' });

      expect(component.postMessage).toHaveBeenCalledWith({
        action: 'actionError',
        message: 'An unexpected error occurred'
      });
    });

    test('logs error to console when bridge throws', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const component = createMockComponent('#html1');
      const testError = new Error('Service unavailable');
      mockHandleB2BAction.mockRejectedValue(testError);

      await routeMessage(component, { action: 'getTopProspects', limit: 5 });

      expect(errorSpy).toHaveBeenCalledWith(
        '[B2B Dashboard] Error handling "getTopProspects":',
        testError
      );

      errorSpy.mockRestore();
    });

    test('handles error gracefully even if postMessage is not a function', async () => {
      const component = { _id: '#html1', onMessage: jest.fn(), postMessage: 'not a function' };
      mockHandleB2BAction.mockRejectedValue(new Error('fail'));

      // Should not throw
      await expect(routeMessage(component, { action: 'getDashboardKPIs' })).resolves.not.toThrow();
    });

    test.each(BRIDGE_ACTIONS)('error handling works for bridge action "%s"', async (action) => {
      const component = createMockComponent('#html1');
      mockHandleB2BAction.mockRejectedValue(new Error(`${action} failed`));

      await routeMessage(component, { action });

      expect(component.postMessage).toHaveBeenCalledWith({
        action: 'actionError',
        message: `${action} failed`
      });
    });
  });

  // ==========================================================================
  // Message Validation & Guard Clauses
  // ==========================================================================

  describe('Message Validation & Guard Clauses', () => {
    test('returns immediately for null message', async () => {
      const component = createMockComponent('#html1');

      await routeMessage(component, null);

      expect(mockHandleB2BAction).not.toHaveBeenCalled();
      expect(mockWixLocation.to).not.toHaveBeenCalled();
      expect(component.postMessage).not.toHaveBeenCalled();
    });

    test('returns immediately for undefined message', async () => {
      const component = createMockComponent('#html1');

      await routeMessage(component, undefined);

      expect(mockHandleB2BAction).not.toHaveBeenCalled();
      expect(mockWixLocation.to).not.toHaveBeenCalled();
    });

    test('returns immediately for message without action property', async () => {
      const component = createMockComponent('#html1');

      await routeMessage(component, { data: 'something' });

      expect(mockHandleB2BAction).not.toHaveBeenCalled();
      expect(mockWixLocation.to).not.toHaveBeenCalled();
    });

    test('logs warning for unknown action', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const component = createMockComponent('#html1');

      await routeMessage(component, { action: 'unknownAction' });

      expect(warnSpy).toHaveBeenCalledWith(
        '[B2B Dashboard] Unknown action received: unknownAction'
      );

      warnSpy.mockRestore();
    });

    test('does not call bridge for unknown action', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      const component = createMockComponent('#html1');

      await routeMessage(component, { action: 'totallyFakeAction' });

      expect(mockHandleB2BAction).not.toHaveBeenCalled();

      console.warn.mockRestore();
    });

    test('does not navigate for unknown action', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      const component = createMockComponent('#html1');

      await routeMessage(component, { action: 'randomAction' });

      expect(mockWixLocation.to).not.toHaveBeenCalled();

      console.warn.mockRestore();
    });
  });

  // ==========================================================================
  // Bridge Service Delegation (full contract)
  // ==========================================================================

  describe('Bridge Service Delegation', () => {
    test('passes the entire message object to handleB2BAction', async () => {
      const component = createMockComponent('#html1');
      mockHandleB2BAction.mockResolvedValue({ action: 'kpisLoaded', payload: {} });

      const fullMessage = { action: 'getDashboardKPIs', days: 90, ownerId: 'rep_001', extra: 'data' };
      await routeMessage(component, fullMessage);

      expect(mockHandleB2BAction).toHaveBeenCalledWith('getDashboardKPIs', fullMessage);
    });

    test('BRIDGE_ACTIONS list matches the expected actions', () => {
      expect(BRIDGE_ACTIONS).toEqual([
        'getDashboardKPIs',
        'getTopProspects',
        'getAlerts',
        'getTopOpportunities',
        'getNextActions',
        'quickAction',
        'getSignalSpikes'
      ]);
    });

    test('BRIDGE_ACTIONS has exactly 7 entries', () => {
      expect(BRIDGE_ACTIONS).toHaveLength(7);
    });

    test('viewAccount is NOT in BRIDGE_ACTIONS (handled locally)', () => {
      expect(BRIDGE_ACTIONS).not.toContain('viewAccount');
    });

    test('HTML_COMPONENT_IDS has exactly 6 entries', () => {
      expect(HTML_COMPONENT_IDS).toHaveLength(6);
    });

    test('HTML_COMPONENT_IDS includes htmlEmbed1', () => {
      expect(HTML_COMPONENT_IDS).toContain('#htmlEmbed1');
    });
  });

  // ==========================================================================
  // Integration: onReady + routeMessage flow
  // ==========================================================================

  describe('Integration: onReady -> onMessage -> routeMessage', () => {
    test('end-to-end: component receives message and routes to bridge', async () => {
      const comp = createMockComponent('#html1');
      mockHandleB2BAction.mockResolvedValue({ action: 'kpisLoaded', payload: { win_rate: 30 } });

      const $w = jest.fn((id) => {
        if (id === '#html1') return comp;
        throw new Error('not found');
      });

      simulateOnReady($w);

      // Extract the registered handler
      const handler = comp.onMessage.mock.calls[0][0];

      // Simulate HTML component sending a message
      await handler({ data: { action: 'getDashboardKPIs', days: 30 } });

      expect(mockHandleB2BAction).toHaveBeenCalledWith('getDashboardKPIs', { action: 'getDashboardKPIs', days: 30 });
      expect(comp.postMessage).toHaveBeenCalledWith({ action: 'kpisLoaded', payload: { win_rate: 30 } });
    });

    test('end-to-end: viewAccount triggers navigation without bridge call', async () => {
      const comp = createMockComponent('#html1');

      const $w = jest.fn((id) => {
        if (id === '#html1') return comp;
        throw new Error('not found');
      });

      simulateOnReady($w);

      const handler = comp.onMessage.mock.calls[0][0];
      await handler({ data: { action: 'viewAccount', accountId: 'acc_999' } });

      expect(mockWixLocation.to).toHaveBeenCalledWith('/b2b-account-detail?accountId=acc_999');
      expect(mockHandleB2BAction).not.toHaveBeenCalled();
    });

    test('end-to-end: error in bridge sends actionError back to component', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const comp = createMockComponent('#html1');
      mockHandleB2BAction.mockRejectedValue(new Error('DB connection lost'));

      const $w = jest.fn((id) => {
        if (id === '#html1') return comp;
        throw new Error('not found');
      });

      simulateOnReady($w);

      const handler = comp.onMessage.mock.calls[0][0];
      await handler({ data: { action: 'getAlerts' } });

      // init + actionError
      expect(comp.postMessage).toHaveBeenCalledWith({
        action: 'actionError',
        message: 'DB connection lost'
      });

      errorSpy.mockRestore();
    });

    test('end-to-end: null event.data is handled gracefully', async () => {
      const comp = createMockComponent('#html1');

      const $w = jest.fn((id) => {
        if (id === '#html1') return comp;
        throw new Error('not found');
      });

      simulateOnReady($w);

      const handler = comp.onMessage.mock.calls[0][0];

      // Should not throw
      await expect(handler({ data: null })).resolves.not.toThrow();
      // Only the init call should be present
      expect(comp.postMessage).toHaveBeenCalledTimes(1); // just init
    });

    test('multiple components each get their own onMessage handler', () => {
      const comp1 = createMockComponent('#html1');
      const comp2 = createMockComponent('#html3');

      const $w = jest.fn((id) => {
        if (id === '#html1') return comp1;
        if (id === '#html3') return comp2;
        throw new Error('not found');
      });

      simulateOnReady($w);

      expect(comp1.onMessage).toHaveBeenCalledTimes(1);
      expect(comp2.onMessage).toHaveBeenCalledTimes(1);

      // They should be independent handler references
      const handler1 = comp1.onMessage.mock.calls[0][0];
      const handler2 = comp2.onMessage.mock.calls[0][0];
      expect(typeof handler1).toBe('function');
      expect(typeof handler2).toBe('function');
    });
  });
});
