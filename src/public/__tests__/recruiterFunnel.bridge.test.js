/**
 * Bridge Test: RECRUITER_FUNNEL.c87yk.js
 *
 * Tests the postMessage bridge between Wix page code and HTML iframe component.
 * This page uses the TYPE PROTOCOL ({ type, data, timestamp } envelope).
 *
 * Page imports:
 * - getFunnelMetrics, getBottleneckAnalysis, recordStageChange from backend/recruiterAnalyticsService.jsw
 * - wixUsers from wix-users
 *
 * Message registry:
 * - Inbound: funnelReady, getFunnelData, recordStageChange
 * - Outbound: funnelData, funnelError, stageChangeResult
 */

const fs = require('fs');
const path = require('path');

// Read the actual source file
const sourceFilePath = path.join(__dirname, '../../pages/RECRUITER_FUNNEL.c87yk.js');
let sourceCode = '';

try {
  sourceCode = fs.readFileSync(sourceFilePath, 'utf8');
} catch (error) {
  console.warn(`Could not read source file: ${sourceFilePath}`);
}

// Mock backend service
const mockRecruiterAnalyticsService = {
  getFunnelMetrics: jest.fn(),
  getBottleneckAnalysis: jest.fn(),
  recordStageChange: jest.fn()
};

// Mock wixUsers
const mockWixUsers = {
  currentUser: {
    loggedIn: jest.fn()
  }
};

// Mock HTML component
const createMockComponent = () => ({
  postMessage: jest.fn(),
  onMessage: jest.fn(),
  rendered: true
});

// Mock $w
const create$w = (componentMap = {}) => {
  return (selector) => {
    if (componentMap[selector]) {
      return componentMap[selector];
    }
    // Return null for unregistered selectors
    return null;
  };
};

// Replicated core logic from RECRUITER_FUNNEL.c87yk.js
class RecruiterFunnelBridge {
  constructor(component) {
    this.component = component;
    this.carrierDot = null;
    this.CONFIG = {
      htmlComponentId: 'html1',
      debugMessages: true
    };
    this.MESSAGE_REGISTRY = {
      inbound: ['funnelReady', 'getFunnelData', 'recordStageChange'],
      outbound: ['funnelData', 'funnelError', 'stageChangeResult']
    };
  }

  getHtmlComponent($w) {
    // Try CONFIG.htmlComponentId first
    try {
      const configComponent = $w(`#${this.CONFIG.htmlComponentId}`);
      if (configComponent && typeof configComponent.onMessage === 'function') {
        return configComponent;
      }
    } catch (e) {
      // Element doesn't exist, continue
    }

    // Try html1-5, htmlEmbed1
    const componentIds = ['html1', 'html2', 'html3', 'html4', 'html5', 'htmlEmbed1'];
    for (const id of componentIds) {
      try {
        const el = $w(`#${id}`);
        if (el && typeof el.onMessage === 'function') {
          return el;
        }
      } catch (e) {
        // Element doesn't exist, continue
      }
    }
    return null;
  }

  async handleMessage(msg) {
    // Guard: null or missing type
    if (!msg || !msg.type) {
      return;
    }

    const { type, data } = msg;

    switch (type) {
      case 'funnelReady':
        await this.handleFunnelReady(data);
        break;

      case 'getFunnelData':
        await this.handleGetFunnelData(data);
        break;

      case 'recordStageChange':
        await this.handleRecordStageChange(data);
        break;

      default:
        // Unknown message type - no action
        break;
    }
  }

  async handleFunnelReady(data) {
    // Send carrier context if carrierDot is set
    if (this.carrierDot) {
      this.sendToHtml('carrierContext', { carrierDot: this.carrierDot });
    }
  }

  async handleGetFunnelData(data) {
    try {
      // Get dot from data or global state
      const dot = data?.carrierDot || this.carrierDot;

      if (!dot) {
        this.sendToHtml('funnelError', { message: 'No carrier DOT number provided' });
        return;
      }

      const dateRange = data?.dateRange || { days: 30 };

      // Call both services in parallel
      const [metricsResult, bottlenecksResult] = await Promise.all([
        mockRecruiterAnalyticsService.getFunnelMetrics(dot, dateRange),
        mockRecruiterAnalyticsService.getBottleneckAnalysis(dot, dateRange)
      ]);

      // Send success response
      this.sendToHtml('funnelData', {
        stages: metricsResult.stages,
        totals: metricsResult.totals,
        bottlenecks: bottlenecksResult.bottlenecks
      });

    } catch (error) {
      this.sendToHtml('funnelError', {
        message: error.message || 'Failed to load funnel data'
      });
    }
  }

  async handleRecordStageChange(data) {
    try {
      const { driverId, toStage, dropReason } = data || {};
      const dot = data?.carrierDot || this.carrierDot;

      // Validate required fields
      if (!driverId || !toStage || !dot) {
        this.sendToHtml('funnelError', {
          message: 'Missing required fields: driverId, toStage, carrierDot'
        });
        return;
      }

      // Call backend service
      const result = await mockRecruiterAnalyticsService.recordStageChange(
        driverId,
        dot,
        toStage,
        dropReason
      );

      // Send success response
      this.sendToHtml('stageChangeResult', {
        success: true,
        driverId,
        toStage,
        result
      });

    } catch (error) {
      this.sendToHtml('funnelError', {
        message: error.message || 'Failed to record stage change'
      });
    }
  }

  sendToHtml(type, data) {
    if (!this.component) {
      return;
    }

    try {
      this.component.postMessage({
        type,
        data,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to send message to HTML:', error);
    }
  }
}

describe('RECRUITER_FUNNEL.c87yk.js - Bridge Tests', () => {

  describe('Source file structure', () => {
    test('source file exists and is readable', () => {
      expect(sourceCode.length).toBeGreaterThan(0);
    });

    test('imports recruiterAnalyticsService methods', () => {
      expect(sourceCode).toMatch(/getFunnelMetrics/);
      expect(sourceCode).toMatch(/getBottleneckAnalysis/);
      expect(sourceCode).toMatch(/recordStageChange/);
    });

    test('imports wixUsers', () => {
      expect(sourceCode).toMatch(/wix-users/);
    });

    test('defines CONFIG with htmlComponentId', () => {
      expect(sourceCode).toMatch(/CONFIG/);
      expect(sourceCode).toMatch(/htmlComponentId/);
    });

    test('defines MESSAGE_REGISTRY', () => {
      expect(sourceCode).toMatch(/MESSAGE_REGISTRY/);
    });

    test('declares carrierDot global state', () => {
      expect(sourceCode).toMatch(/carrierDot/);
    });

    test('defines getHtmlComponent function', () => {
      expect(sourceCode).toMatch(/getHtmlComponent/);
    });

    test('defines handleMessage function', () => {
      expect(sourceCode).toMatch(/handleMessage/);
    });

    test('defines sendToHtml utility', () => {
      expect(sourceCode).toMatch(/sendToHtml/);
    });
  });

  describe('Safety checks', () => {
    test('handleMessage guards against null message', async () => {
      const component = createMockComponent();
      const bridge = new RecruiterFunnelBridge(component);

      await bridge.handleMessage(null);

      // Should not throw, should not call postMessage
      expect(component.postMessage).not.toHaveBeenCalled();
    });

    test('handleMessage guards against message without type', async () => {
      const component = createMockComponent();
      const bridge = new RecruiterFunnelBridge(component);

      await bridge.handleMessage({ data: { foo: 'bar' } });

      // Should not throw, should not call postMessage
      expect(component.postMessage).not.toHaveBeenCalled();
    });

    test('handleMessage ignores unknown message types', async () => {
      const component = createMockComponent();
      const bridge = new RecruiterFunnelBridge(component);

      await bridge.handleMessage({ type: 'unknownAction', data: {} });

      // Should not throw, should not call postMessage
      expect(component.postMessage).not.toHaveBeenCalled();
    });

    test('sendToHtml handles missing component gracefully', () => {
      const bridge = new RecruiterFunnelBridge(null);

      expect(() => {
        bridge.sendToHtml('testType', { test: true });
      }).not.toThrow();
    });

    test('sendToHtml wraps postMessage in try-catch', () => {
      const component = {
        postMessage: jest.fn(() => {
          throw new Error('postMessage failed');
        })
      };
      const bridge = new RecruiterFunnelBridge(component);

      expect(() => {
        bridge.sendToHtml('testType', { test: true });
      }).not.toThrow();
    });
  });

  describe('HTML component discovery', () => {
    test('getHtmlComponent tries CONFIG.htmlComponentId first', () => {
      const configComponent = createMockComponent();
      const $w = create$w({ '#html1': configComponent });
      const bridge = new RecruiterFunnelBridge(null);

      const result = bridge.getHtmlComponent($w);

      expect(result).toBe(configComponent);
    });

    test('getHtmlComponent falls back to html1-5, htmlEmbed1', () => {
      const html3Component = createMockComponent();
      const $w = create$w({ '#html3': html3Component });
      const bridge = new RecruiterFunnelBridge(null);

      const result = bridge.getHtmlComponent($w);

      expect(result).toBe(html3Component);
    });

    test('getHtmlComponent returns null if no valid component found', () => {
      const $w = create$w({});
      const bridge = new RecruiterFunnelBridge(null);

      const result = bridge.getHtmlComponent($w);

      expect(result).toBeNull();
    });

    test('getHtmlComponent skips components without onMessage', () => {
      const invalidComponent = { postMessage: jest.fn() }; // Missing onMessage
      const validComponent = createMockComponent();
      const $w = create$w({
        '#html1': invalidComponent,
        '#html2': validComponent
      });
      const bridge = new RecruiterFunnelBridge(null);

      const result = bridge.getHtmlComponent($w);

      expect(result).toBe(validComponent);
    });

    test('getHtmlComponent handles exceptions during element access', () => {
      const $w = (selector) => {
        if (selector === '#html1' || selector === '#html2') {
          throw new Error('Element not found');
        }
        if (selector === '#html3') {
          return createMockComponent();
        }
        return null;
      };
      const bridge = new RecruiterFunnelBridge(null);

      const result = bridge.getHtmlComponent($w);

      expect(result).not.toBeNull();
      expect(result.onMessage).toBeDefined();
    });
  });

  describe('Message routing - funnelReady', () => {
    test('funnelReady sends carrierContext if carrierDot is set', async () => {
      const component = createMockComponent();
      const bridge = new RecruiterFunnelBridge(component);
      bridge.carrierDot = '1234567';

      await bridge.handleMessage({ type: 'funnelReady', data: {} });

      expect(component.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'carrierContext',
          data: { carrierDot: '1234567' },
          timestamp: expect.any(Number)
        })
      );
    });

    test('funnelReady does not send carrierContext if carrierDot is null', async () => {
      const component = createMockComponent();
      const bridge = new RecruiterFunnelBridge(component);
      bridge.carrierDot = null;

      await bridge.handleMessage({ type: 'funnelReady', data: {} });

      expect(component.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('Message routing - getFunnelData', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('getFunnelData calls backend services with dot from data', async () => {
      const component = createMockComponent();
      const bridge = new RecruiterFunnelBridge(component);

      mockRecruiterAnalyticsService.getFunnelMetrics.mockResolvedValue({
        stages: [{ stage: 'new', count: 10 }],
        totals: { total: 10 }
      });
      mockRecruiterAnalyticsService.getBottleneckAnalysis.mockResolvedValue({
        bottlenecks: [{ stage: 'interview', dropRate: 0.3 }]
      });

      await bridge.handleMessage({
        type: 'getFunnelData',
        data: { carrierDot: '1234567', dateRange: { days: 30 } }
      });

      expect(mockRecruiterAnalyticsService.getFunnelMetrics).toHaveBeenCalledWith(
        '1234567',
        { days: 30 }
      );
      expect(mockRecruiterAnalyticsService.getBottleneckAnalysis).toHaveBeenCalledWith(
        '1234567',
        { days: 30 }
      );
    });

    test('getFunnelData uses global carrierDot if not in data', async () => {
      const component = createMockComponent();
      const bridge = new RecruiterFunnelBridge(component);
      bridge.carrierDot = '7654321';

      mockRecruiterAnalyticsService.getFunnelMetrics.mockResolvedValue({
        stages: [],
        totals: {}
      });
      mockRecruiterAnalyticsService.getBottleneckAnalysis.mockResolvedValue({
        bottlenecks: []
      });

      await bridge.handleMessage({
        type: 'getFunnelData',
        data: {}
      });

      expect(mockRecruiterAnalyticsService.getFunnelMetrics).toHaveBeenCalledWith(
        '7654321',
        { days: 30 }
      );
    });

    test('getFunnelData sends funnelError if no dot provided', async () => {
      const component = createMockComponent();
      const bridge = new RecruiterFunnelBridge(component);
      bridge.carrierDot = null;

      await bridge.handleMessage({
        type: 'getFunnelData',
        data: {}
      });

      expect(component.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'funnelError',
          data: { message: 'No carrier DOT number provided' }
        })
      );
    });

    test('getFunnelData sends funnelData on success', async () => {
      const component = createMockComponent();
      const bridge = new RecruiterFunnelBridge(component);
      bridge.carrierDot = '1234567';

      const mockMetrics = {
        stages: [
          { stage: 'new', count: 10 },
          { stage: 'screening', count: 8 }
        ],
        totals: { total: 18 }
      };
      const mockBottlenecks = {
        bottlenecks: [{ stage: 'interview', dropRate: 0.25 }]
      };

      mockRecruiterAnalyticsService.getFunnelMetrics.mockResolvedValue(mockMetrics);
      mockRecruiterAnalyticsService.getBottleneckAnalysis.mockResolvedValue(mockBottlenecks);

      await bridge.handleMessage({
        type: 'getFunnelData',
        data: {}
      });

      expect(component.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'funnelData',
          data: {
            stages: mockMetrics.stages,
            totals: mockMetrics.totals,
            bottlenecks: mockBottlenecks.bottlenecks
          },
          timestamp: expect.any(Number)
        })
      );
    });

    test('getFunnelData sends funnelError on backend failure', async () => {
      const component = createMockComponent();
      const bridge = new RecruiterFunnelBridge(component);
      bridge.carrierDot = '1234567';

      mockRecruiterAnalyticsService.getFunnelMetrics.mockRejectedValue(
        new Error('Database connection failed')
      );

      await bridge.handleMessage({
        type: 'getFunnelData',
        data: {}
      });

      expect(component.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'funnelError',
          data: { message: 'Database connection failed' }
        })
      );
    });

    test('getFunnelData uses default dateRange if not provided', async () => {
      const component = createMockComponent();
      const bridge = new RecruiterFunnelBridge(component);
      bridge.carrierDot = '1234567';

      mockRecruiterAnalyticsService.getFunnelMetrics.mockResolvedValue({
        stages: [],
        totals: {}
      });
      mockRecruiterAnalyticsService.getBottleneckAnalysis.mockResolvedValue({
        bottlenecks: []
      });

      await bridge.handleMessage({
        type: 'getFunnelData',
        data: { carrierDot: '1234567' }
      });

      expect(mockRecruiterAnalyticsService.getFunnelMetrics).toHaveBeenCalledWith(
        '1234567',
        { days: 30 }
      );
    });
  });

  describe('Message routing - recordStageChange', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('recordStageChange calls backend service with correct params', async () => {
      const component = createMockComponent();
      const bridge = new RecruiterFunnelBridge(component);
      bridge.carrierDot = '1234567';

      mockRecruiterAnalyticsService.recordStageChange.mockResolvedValue({
        success: true,
        recordId: 'rec123'
      });

      await bridge.handleMessage({
        type: 'recordStageChange',
        data: {
          driverId: 'driver123',
          toStage: 'interview',
          dropReason: null
        }
      });

      expect(mockRecruiterAnalyticsService.recordStageChange).toHaveBeenCalledWith(
        'driver123',
        '1234567',
        'interview',
        null
      );
    });

    test('recordStageChange uses carrierDot from data if provided', async () => {
      const component = createMockComponent();
      const bridge = new RecruiterFunnelBridge(component);
      bridge.carrierDot = '1111111';

      mockRecruiterAnalyticsService.recordStageChange.mockResolvedValue({
        success: true
      });

      await bridge.handleMessage({
        type: 'recordStageChange',
        data: {
          driverId: 'driver123',
          toStage: 'hired',
          carrierDot: '2222222'
        }
      });

      expect(mockRecruiterAnalyticsService.recordStageChange).toHaveBeenCalledWith(
        'driver123',
        '2222222',
        'hired',
        undefined
      );
    });

    test('recordStageChange sends funnelError if driverId missing', async () => {
      const component = createMockComponent();
      const bridge = new RecruiterFunnelBridge(component);
      bridge.carrierDot = '1234567';

      await bridge.handleMessage({
        type: 'recordStageChange',
        data: {
          toStage: 'interview'
        }
      });

      expect(component.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'funnelError',
          data: { message: 'Missing required fields: driverId, toStage, carrierDot' }
        })
      );
    });

    test('recordStageChange sends funnelError if toStage missing', async () => {
      const component = createMockComponent();
      const bridge = new RecruiterFunnelBridge(component);
      bridge.carrierDot = '1234567';

      await bridge.handleMessage({
        type: 'recordStageChange',
        data: {
          driverId: 'driver123'
        }
      });

      expect(component.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'funnelError',
          data: { message: 'Missing required fields: driverId, toStage, carrierDot' }
        })
      );
    });

    test('recordStageChange sends funnelError if carrierDot missing', async () => {
      const component = createMockComponent();
      const bridge = new RecruiterFunnelBridge(component);
      bridge.carrierDot = null;

      await bridge.handleMessage({
        type: 'recordStageChange',
        data: {
          driverId: 'driver123',
          toStage: 'interview'
        }
      });

      expect(component.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'funnelError',
          data: { message: 'Missing required fields: driverId, toStage, carrierDot' }
        })
      );
    });

    test('recordStageChange sends stageChangeResult on success', async () => {
      const component = createMockComponent();
      const bridge = new RecruiterFunnelBridge(component);
      bridge.carrierDot = '1234567';

      const mockResult = {
        success: true,
        recordId: 'rec456'
      };
      mockRecruiterAnalyticsService.recordStageChange.mockResolvedValue(mockResult);

      await bridge.handleMessage({
        type: 'recordStageChange',
        data: {
          driverId: 'driver789',
          toStage: 'hired'
        }
      });

      expect(component.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'stageChangeResult',
          data: {
            success: true,
            driverId: 'driver789',
            toStage: 'hired',
            result: mockResult
          },
          timestamp: expect.any(Number)
        })
      );
    });

    test('recordStageChange sends funnelError on backend failure', async () => {
      const component = createMockComponent();
      const bridge = new RecruiterFunnelBridge(component);
      bridge.carrierDot = '1234567';

      mockRecruiterAnalyticsService.recordStageChange.mockRejectedValue(
        new Error('Update failed')
      );

      await bridge.handleMessage({
        type: 'recordStageChange',
        data: {
          driverId: 'driver123',
          toStage: 'rejected',
          dropReason: 'Failed background check'
        }
      });

      expect(component.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'funnelError',
          data: { message: 'Update failed' }
        })
      );
    });

    test('recordStageChange includes dropReason in backend call', async () => {
      const component = createMockComponent();
      const bridge = new RecruiterFunnelBridge(component);
      bridge.carrierDot = '1234567';

      mockRecruiterAnalyticsService.recordStageChange.mockResolvedValue({
        success: true
      });

      await bridge.handleMessage({
        type: 'recordStageChange',
        data: {
          driverId: 'driver123',
          toStage: 'dropped',
          dropReason: 'Not interested'
        }
      });

      expect(mockRecruiterAnalyticsService.recordStageChange).toHaveBeenCalledWith(
        'driver123',
        '1234567',
        'dropped',
        'Not interested'
      );
    });
  });

  describe('Error handling', () => {
    test('backend errors are caught and sent as funnelError', async () => {
      const component = createMockComponent();
      const bridge = new RecruiterFunnelBridge(component);
      bridge.carrierDot = '1234567';

      mockRecruiterAnalyticsService.getFunnelMetrics.mockRejectedValue(
        new Error('Network timeout')
      );

      await bridge.handleMessage({
        type: 'getFunnelData',
        data: {}
      });

      expect(component.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'funnelError',
          data: { message: 'Network timeout' }
        })
      );
    });

    test('backend errors without message get default error text', async () => {
      const component = createMockComponent();
      const bridge = new RecruiterFunnelBridge(component);
      bridge.carrierDot = '1234567';

      mockRecruiterAnalyticsService.getFunnelMetrics.mockRejectedValue(
        new Error()
      );

      await bridge.handleMessage({
        type: 'getFunnelData',
        data: {}
      });

      expect(component.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'funnelError',
          data: { message: 'Failed to load funnel data' }
        })
      );
    });

    test('recordStageChange errors get default message', async () => {
      const component = createMockComponent();
      const bridge = new RecruiterFunnelBridge(component);
      bridge.carrierDot = '1234567';

      mockRecruiterAnalyticsService.recordStageChange.mockRejectedValue({});

      await bridge.handleMessage({
        type: 'recordStageChange',
        data: {
          driverId: 'driver123',
          toStage: 'interview'
        }
      });

      expect(component.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'funnelError',
          data: { message: 'Failed to record stage change' }
        })
      );
    });
  });

  describe('sendToHtml utility', () => {
    test('sendToHtml wraps message in TYPE PROTOCOL envelope', () => {
      const component = createMockComponent();
      const bridge = new RecruiterFunnelBridge(component);

      bridge.sendToHtml('testType', { foo: 'bar' });

      expect(component.postMessage).toHaveBeenCalledWith({
        type: 'testType',
        data: { foo: 'bar' },
        timestamp: expect.any(Number)
      });
    });

    test('sendToHtml includes current timestamp', () => {
      const component = createMockComponent();
      const bridge = new RecruiterFunnelBridge(component);

      const beforeTime = Date.now();
      bridge.sendToHtml('testType', {});
      const afterTime = Date.now();

      const call = component.postMessage.mock.calls[0][0];
      expect(call.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(call.timestamp).toBeLessThanOrEqual(afterTime);
    });

    test('sendToHtml handles null data gracefully', () => {
      const component = createMockComponent();
      const bridge = new RecruiterFunnelBridge(component);

      bridge.sendToHtml('testType', null);

      expect(component.postMessage).toHaveBeenCalledWith({
        type: 'testType',
        data: null,
        timestamp: expect.any(Number)
      });
    });

    test('sendToHtml does not throw when component is null', () => {
      const bridge = new RecruiterFunnelBridge(null);

      expect(() => {
        bridge.sendToHtml('testType', { data: 'test' });
      }).not.toThrow();
    });
  });
});
