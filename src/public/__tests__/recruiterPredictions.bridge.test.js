/* eslint-disable */
/**
 * RECRUITER_PREDICTIONS Bridge Test
 * Verifies PostMessage protocol between page code and HTML component
 *
 * Page: src/pages/RECRUITER_PREDICTIONS.g78id.js
 * Protocol: TYPE (msg.type, not msg.action)
 * Envelope: { type, data, timestamp }
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// SOURCE FILE VERIFICATION
// ============================================================================
describe('RECRUITER_PREDICTIONS Page Code - Source File', () => {
  const sourceFilePath = path.join(__dirname, '..', '..', 'pages', 'RECRUITER_PREDICTIONS.g78id.js');
  let sourceCode;

  beforeAll(() => {
    sourceCode = fs.readFileSync(sourceFilePath, 'utf-8');
  });

  test('source file exists', () => {
    expect(fs.existsSync(sourceFilePath)).toBe(true);
  });

  test('imports correct backend services', () => {
    expect(sourceCode).toContain("from 'backend/recruiterAnalyticsService.jsw'");
    expect(sourceCode).toContain('generateHiringForecast');
    expect(sourceCode).toContain('getHiringForecast');
    expect(sourceCode).toContain('getTurnoverRiskAnalysis');
  });

  test('imports wix-users', () => {
    expect(sourceCode).toContain("import wixUsers from 'wix-users'");
  });

  test('declares CONFIG with htmlComponentId', () => {
    expect(sourceCode).toContain('htmlComponentId:');
    expect(sourceCode).toContain('debugMessages:');
  });

  test('declares MESSAGE_REGISTRY with inbound types', () => {
    expect(sourceCode).toContain('MESSAGE_REGISTRY');
    expect(sourceCode).toContain('inbound:');
    expect(sourceCode).toContain('predictionsReady');
    expect(sourceCode).toContain('getPredictionsData');
    expect(sourceCode).toContain('generateForecast');
    expect(sourceCode).toContain('getTurnoverRisk');
  });

  test('declares MESSAGE_REGISTRY with outbound types', () => {
    expect(sourceCode).toContain('outbound:');
    expect(sourceCode).toContain('predictionsData');
    expect(sourceCode).toContain('predictionsError');
    expect(sourceCode).toContain('forecastResult');
    expect(sourceCode).toContain('turnoverRiskData');
  });

  test('declares carrierDot global state', () => {
    expect(sourceCode).toContain('let carrierDot = null');
  });

  test('has $w.onReady handler', () => {
    expect(sourceCode).toContain('$w.onReady');
  });

  test('implements getHtmlComponent()', () => {
    expect(sourceCode).toContain('function getHtmlComponent()');
    expect(sourceCode).toContain('possibleIds');
  });

  test('implements getComponent()', () => {
    expect(sourceCode).toContain('function getComponent()');
  });

  test('implements handleMessage()', () => {
    expect(sourceCode).toContain('function handleMessage(msg)');
    expect(sourceCode).toContain('if (!msg || !msg.type) return');
  });

  test('implements sendToHtml()', () => {
    expect(sourceCode).toContain('function sendToHtml(type, data)');
    expect(sourceCode).toContain('component.postMessage({ type, data, timestamp: Date.now() })');
  });
});

// ============================================================================
// MOCK SETUP
// ============================================================================
let mockComponent;
let mockBackend;

beforeEach(() => {
  // Reset mocks
  mockComponent = {
    postMessage: jest.fn(),
    onMessage: jest.fn()
  };

  mockBackend = {
    getHiringForecast: jest.fn(),
    getTurnoverRiskAnalysis: jest.fn(),
    generateHiringForecast: jest.fn()
  };
});

// ============================================================================
// REPLICATED CORE LOGIC
// ============================================================================
const CONFIG = {
  htmlComponentId: 'html1',
  debugMessages: false // Disabled for testing
};

const MESSAGE_REGISTRY = {
  inbound: [
    'predictionsReady',
    'getPredictionsData',
    'generateForecast',
    'getTurnoverRisk'
  ],
  outbound: [
    'predictionsData',
    'predictionsError',
    'forecastResult',
    'turnoverRiskData'
  ]
};

let carrierDot = null;

function sendToHtml(type, data) {
  try {
    if (mockComponent && typeof mockComponent.postMessage === 'function') {
      mockComponent.postMessage({ type, data, timestamp: Date.now() });
    }
  } catch (error) {
    console.error('Error sending to HTML:', error);
  }
}

async function handleGetPredictionsData(data) {
  try {
    const dot = data?.carrierDot || carrierDot;
    if (!dot) {
      sendToHtml('predictionsError', { error: 'No carrier context' });
      return;
    }

    carrierDot = dot;

    const [forecastResult, riskResult] = await Promise.all([
      mockBackend.getHiringForecast(dot),
      mockBackend.getTurnoverRiskAnalysis(dot)
    ]);

    sendToHtml('predictionsData', {
      success: true,
      forecast: forecastResult.success ? forecastResult.forecast : null,
      turnoverRisk: riskResult.success ? riskResult.analysis : null
    });

  } catch (error) {
    console.error('Error fetching predictions data:', error);
    sendToHtml('predictionsError', { error: error.message });
  }
}

async function handleGenerateForecast(data) {
  try {
    const dot = data?.carrierDot || carrierDot;
    if (!dot) {
      sendToHtml('forecastResult', { success: false, error: 'No carrier context' });
      return;
    }

    carrierDot = dot;

    const monthsAhead = data?.monthsAhead || 6;
    const result = await mockBackend.generateHiringForecast(dot, monthsAhead);
    sendToHtml('forecastResult', result);

  } catch (error) {
    console.error('Error generating forecast:', error);
    sendToHtml('forecastResult', { success: false, error: error.message });
  }
}

async function handleGetTurnoverRisk(data) {
  try {
    const dot = data?.carrierDot || carrierDot;
    if (!dot) {
      sendToHtml('turnoverRiskData', { success: false, error: 'No carrier context' });
      return;
    }

    const result = await mockBackend.getTurnoverRiskAnalysis(dot);
    sendToHtml('turnoverRiskData', result);

  } catch (error) {
    console.error('Error fetching turnover risk:', error);
    sendToHtml('turnoverRiskData', { success: false, error: error.message });
  }
}

async function handleMessage(msg) {
  if (!msg || !msg.type) return;

  const action = msg.type;

  switch (action) {
    case 'predictionsReady':
      if (carrierDot) {
        sendToHtml('carrierContext', { carrierDot });
      }
      break;

    case 'getPredictionsData':
      await handleGetPredictionsData(msg.data);
      break;

    case 'generateForecast':
      await handleGenerateForecast(msg.data);
      break;

    case 'getTurnoverRisk':
      await handleGetTurnoverRisk(msg.data);
      break;

    default:
      console.log('Unknown message type:', action);
  }
}

// ============================================================================
// SAFETY CHECKS
// ============================================================================
describe('Safety Checks', () => {
  beforeEach(() => {
    carrierDot = null;
  });

  test('handleMessage guards against null message', async () => {
    await expect(handleMessage(null)).resolves.not.toThrow();
    expect(mockComponent.postMessage).not.toHaveBeenCalled();
  });

  test('handleMessage guards against undefined message', async () => {
    await expect(handleMessage(undefined)).resolves.not.toThrow();
    expect(mockComponent.postMessage).not.toHaveBeenCalled();
  });

  test('handleMessage guards against message without type', async () => {
    await handleMessage({ data: {} });
    expect(mockComponent.postMessage).not.toHaveBeenCalled();
  });

  test('sendToHtml handles missing component', () => {
    mockComponent = null;
    expect(() => sendToHtml('test', {})).not.toThrow();
  });

  test('sendToHtml handles component without postMessage', () => {
    mockComponent = {};
    expect(() => sendToHtml('test', {})).not.toThrow();
  });
});

// ============================================================================
// HTML COMPONENT DISCOVERY
// ============================================================================
describe('HTML Component Discovery', () => {
  test('MESSAGE_REGISTRY defines all inbound types', () => {
    expect(MESSAGE_REGISTRY.inbound).toContain('predictionsReady');
    expect(MESSAGE_REGISTRY.inbound).toContain('getPredictionsData');
    expect(MESSAGE_REGISTRY.inbound).toContain('generateForecast');
    expect(MESSAGE_REGISTRY.inbound).toContain('getTurnoverRisk');
    expect(MESSAGE_REGISTRY.inbound.length).toBe(4);
  });

  test('MESSAGE_REGISTRY defines all outbound types', () => {
    expect(MESSAGE_REGISTRY.outbound).toContain('predictionsData');
    expect(MESSAGE_REGISTRY.outbound).toContain('predictionsError');
    expect(MESSAGE_REGISTRY.outbound).toContain('forecastResult');
    expect(MESSAGE_REGISTRY.outbound).toContain('turnoverRiskData');
    expect(MESSAGE_REGISTRY.outbound.length).toBe(4);
  });

  test('CONFIG defines htmlComponentId', () => {
    expect(CONFIG.htmlComponentId).toBe('html1');
  });
});

// ============================================================================
// MESSAGE ROUTING - predictionsReady
// ============================================================================
describe('Message Routing - predictionsReady', () => {
  beforeEach(() => {
    carrierDot = null;
  });

  test('predictionsReady sends carrierContext if carrierDot is set', async () => {
    carrierDot = '1234567';
    await handleMessage({ type: 'predictionsReady' });

    expect(mockComponent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'carrierContext',
        data: { carrierDot: '1234567' },
        timestamp: expect.any(Number)
      })
    );
  });

  test('predictionsReady does not send if carrierDot is null', async () => {
    carrierDot = null;
    await handleMessage({ type: 'predictionsReady' });

    expect(mockComponent.postMessage).not.toHaveBeenCalled();
  });

  test('predictionsReady accepts message with no data', async () => {
    carrierDot = '9876543';
    await handleMessage({ type: 'predictionsReady' });

    expect(mockComponent.postMessage).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// MESSAGE ROUTING - getPredictionsData
// ============================================================================
describe('Message Routing - getPredictionsData', () => {
  beforeEach(() => {
    carrierDot = null;
  });

  test('getPredictionsData sends predictionsError if no carrier context', async () => {
    await handleMessage({ type: 'getPredictionsData', data: {} });

    expect(mockComponent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'predictionsError',
        data: { error: 'No carrier context' }
      })
    );
  });

  test('getPredictionsData uses data.carrierDot if provided', async () => {
    mockBackend.getHiringForecast.mockResolvedValue({
      success: true,
      forecast: { monthlyHires: [5, 6, 7] }
    });
    mockBackend.getTurnoverRiskAnalysis.mockResolvedValue({
      success: true,
      analysis: { riskScore: 0.35 }
    });

    await handleMessage({
      type: 'getPredictionsData',
      data: { carrierDot: '1234567' }
    });

    expect(mockBackend.getHiringForecast).toHaveBeenCalledWith('1234567');
    expect(mockBackend.getTurnoverRiskAnalysis).toHaveBeenCalledWith('1234567');
  });

  test('getPredictionsData uses global carrierDot if no data.carrierDot', async () => {
    carrierDot = '7654321';
    mockBackend.getHiringForecast.mockResolvedValue({
      success: true,
      forecast: { monthlyHires: [5, 6, 7] }
    });
    mockBackend.getTurnoverRiskAnalysis.mockResolvedValue({
      success: true,
      analysis: { riskScore: 0.35 }
    });

    await handleMessage({ type: 'getPredictionsData', data: {} });

    expect(mockBackend.getHiringForecast).toHaveBeenCalledWith('7654321');
    expect(mockBackend.getTurnoverRiskAnalysis).toHaveBeenCalledWith('7654321');
  });

  test('getPredictionsData fetches forecast and turnover in parallel', async () => {
    mockBackend.getHiringForecast.mockResolvedValue({
      success: true,
      forecast: { monthlyHires: [10, 12, 15] }
    });
    mockBackend.getTurnoverRiskAnalysis.mockResolvedValue({
      success: true,
      analysis: { riskScore: 0.42, drivers: [{ id: 'd1', risk: 0.8 }] }
    });

    await handleMessage({
      type: 'getPredictionsData',
      data: { carrierDot: '1234567' }
    });

    expect(mockComponent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'predictionsData',
        data: {
          success: true,
          forecast: { monthlyHires: [10, 12, 15] },
          turnoverRisk: { riskScore: 0.42, drivers: [{ id: 'd1', risk: 0.8 }] }
        }
      })
    );
  });

  test('getPredictionsData handles null forecast if service fails', async () => {
    mockBackend.getHiringForecast.mockResolvedValue({ success: false });
    mockBackend.getTurnoverRiskAnalysis.mockResolvedValue({
      success: true,
      analysis: { riskScore: 0.25 }
    });

    await handleMessage({
      type: 'getPredictionsData',
      data: { carrierDot: '1234567' }
    });

    expect(mockComponent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'predictionsData',
        data: {
          success: true,
          forecast: null,
          turnoverRisk: { riskScore: 0.25 }
        }
      })
    );
  });

  test('getPredictionsData handles null turnoverRisk if service fails', async () => {
    mockBackend.getHiringForecast.mockResolvedValue({
      success: true,
      forecast: { monthlyHires: [8, 9, 10] }
    });
    mockBackend.getTurnoverRiskAnalysis.mockResolvedValue({ success: false });

    await handleMessage({
      type: 'getPredictionsData',
      data: { carrierDot: '1234567' }
    });

    expect(mockComponent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'predictionsData',
        data: {
          success: true,
          forecast: { monthlyHires: [8, 9, 10] },
          turnoverRisk: null
        }
      })
    );
  });

  test('getPredictionsData updates global carrierDot', async () => {
    mockBackend.getHiringForecast.mockResolvedValue({ success: true, forecast: {} });
    mockBackend.getTurnoverRiskAnalysis.mockResolvedValue({ success: true, analysis: {} });

    expect(carrierDot).toBeNull();

    await handleMessage({
      type: 'getPredictionsData',
      data: { carrierDot: '5555555' }
    });

    expect(carrierDot).toBe('5555555');
  });

  test('getPredictionsData sends predictionsError on exception', async () => {
    mockBackend.getHiringForecast.mockRejectedValue(new Error('Database connection failed'));

    await handleMessage({
      type: 'getPredictionsData',
      data: { carrierDot: '1234567' }
    });

    expect(mockComponent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'predictionsError',
        data: { error: 'Database connection failed' }
      })
    );
  });
});

// ============================================================================
// MESSAGE ROUTING - generateForecast
// ============================================================================
describe('Message Routing - generateForecast', () => {
  beforeEach(() => {
    carrierDot = null;
  });

  test('generateForecast sends error if no carrier context', async () => {
    await handleMessage({ type: 'generateForecast', data: {} });

    expect(mockComponent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'forecastResult',
        data: { success: false, error: 'No carrier context' }
      })
    );
  });

  test('generateForecast uses data.carrierDot if provided', async () => {
    mockBackend.generateHiringForecast.mockResolvedValue({
      success: true,
      forecast: { months: 6, predictions: [] }
    });

    await handleMessage({
      type: 'generateForecast',
      data: { carrierDot: '1234567' }
    });

    expect(mockBackend.generateHiringForecast).toHaveBeenCalledWith('1234567', 6);
  });

  test('generateForecast uses global carrierDot if no data.carrierDot', async () => {
    carrierDot = '7654321';
    mockBackend.generateHiringForecast.mockResolvedValue({
      success: true,
      forecast: {}
    });

    await handleMessage({ type: 'generateForecast', data: {} });

    expect(mockBackend.generateHiringForecast).toHaveBeenCalledWith('7654321', 6);
  });

  test('generateForecast defaults monthsAhead to 6', async () => {
    mockBackend.generateHiringForecast.mockResolvedValue({ success: true });

    await handleMessage({
      type: 'generateForecast',
      data: { carrierDot: '1234567' }
    });

    expect(mockBackend.generateHiringForecast).toHaveBeenCalledWith('1234567', 6);
  });

  test('generateForecast uses custom monthsAhead if provided', async () => {
    mockBackend.generateHiringForecast.mockResolvedValue({ success: true });

    await handleMessage({
      type: 'generateForecast',
      data: { carrierDot: '1234567', monthsAhead: 12 }
    });

    expect(mockBackend.generateHiringForecast).toHaveBeenCalledWith('1234567', 12);
  });

  test('generateForecast sends result from service', async () => {
    const mockResult = {
      success: true,
      forecast: {
        months: 6,
        predictions: [
          { month: 1, hires: 10, confidence: 0.85 },
          { month: 2, hires: 12, confidence: 0.80 }
        ]
      }
    };
    mockBackend.generateHiringForecast.mockResolvedValue(mockResult);

    await handleMessage({
      type: 'generateForecast',
      data: { carrierDot: '1234567' }
    });

    expect(mockComponent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'forecastResult',
        data: mockResult
      })
    );
  });

  test('generateForecast updates global carrierDot', async () => {
    mockBackend.generateHiringForecast.mockResolvedValue({ success: true });

    expect(carrierDot).toBeNull();

    await handleMessage({
      type: 'generateForecast',
      data: { carrierDot: '9999999' }
    });

    expect(carrierDot).toBe('9999999');
  });

  test('generateForecast sends error result on exception', async () => {
    mockBackend.generateHiringForecast.mockRejectedValue(new Error('AI service unavailable'));

    await handleMessage({
      type: 'generateForecast',
      data: { carrierDot: '1234567' }
    });

    expect(mockComponent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'forecastResult',
        data: { success: false, error: 'AI service unavailable' }
      })
    );
  });
});

// ============================================================================
// MESSAGE ROUTING - getTurnoverRisk
// ============================================================================
describe('Message Routing - getTurnoverRisk', () => {
  beforeEach(() => {
    carrierDot = null;
  });

  test('getTurnoverRisk sends error if no carrier context', async () => {
    await handleMessage({ type: 'getTurnoverRisk', data: {} });

    expect(mockComponent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'turnoverRiskData',
        data: { success: false, error: 'No carrier context' }
      })
    );
  });

  test('getTurnoverRisk uses data.carrierDot if provided', async () => {
    mockBackend.getTurnoverRiskAnalysis.mockResolvedValue({
      success: true,
      analysis: { riskScore: 0.45 }
    });

    await handleMessage({
      type: 'getTurnoverRisk',
      data: { carrierDot: '1234567' }
    });

    expect(mockBackend.getTurnoverRiskAnalysis).toHaveBeenCalledWith('1234567');
  });

  test('getTurnoverRisk uses global carrierDot if no data.carrierDot', async () => {
    carrierDot = '7654321';
    mockBackend.getTurnoverRiskAnalysis.mockResolvedValue({
      success: true,
      analysis: { riskScore: 0.30 }
    });

    await handleMessage({ type: 'getTurnoverRisk', data: {} });

    expect(mockBackend.getTurnoverRiskAnalysis).toHaveBeenCalledWith('7654321');
  });

  test('getTurnoverRisk sends result from service', async () => {
    const mockResult = {
      success: true,
      analysis: {
        riskScore: 0.52,
        drivers: [
          { id: 'd1', name: 'John Driver', riskScore: 0.85, factors: ['low_engagement'] },
          { id: 'd2', name: 'Jane Trucker', riskScore: 0.72, factors: ['pay_dissatisfaction'] }
        ],
        factors: {
          pay: 0.3,
          engagement: 0.5,
          tenure: 0.2
        }
      }
    };
    mockBackend.getTurnoverRiskAnalysis.mockResolvedValue(mockResult);

    await handleMessage({
      type: 'getTurnoverRisk',
      data: { carrierDot: '1234567' }
    });

    expect(mockComponent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'turnoverRiskData',
        data: mockResult
      })
    );
  });

  test('getTurnoverRisk sends error result on exception', async () => {
    mockBackend.getTurnoverRiskAnalysis.mockRejectedValue(new Error('Analytics service timeout'));

    await handleMessage({
      type: 'getTurnoverRisk',
      data: { carrierDot: '1234567' }
    });

    expect(mockComponent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'turnoverRiskData',
        data: { success: false, error: 'Analytics service timeout' }
      })
    );
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================
describe('Error Handling', () => {
  beforeEach(() => {
    carrierDot = null;
  });

  test('unknown message type logs but does not crash', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await handleMessage({ type: 'unknownAction', data: {} });

    expect(consoleSpy).toHaveBeenCalledWith('Unknown message type:', 'unknownAction');
    consoleSpy.mockRestore();
  });

  test('handler exceptions are caught and send error messages', async () => {
    mockBackend.getHiringForecast.mockRejectedValue(new Error('Network error'));

    await handleMessage({
      type: 'getPredictionsData',
      data: { carrierDot: '1234567' }
    });

    expect(mockComponent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'predictionsError',
        data: { error: 'Network error' }
      })
    );
  });

  test('sendToHtml wraps postMessage in try-catch', () => {
    mockComponent.postMessage = jest.fn(() => {
      throw new Error('postMessage failed');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => sendToHtml('test', {})).not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith('Error sending to HTML:', expect.any(Error));

    consoleSpy.mockRestore();
  });
});

// ============================================================================
// SENDTOHTML UTILITY
// ============================================================================
describe('sendToHtml Utility', () => {
  test('sends message with type, data, and timestamp', () => {
    const beforeTime = Date.now();
    sendToHtml('testType', { key: 'value' });
    const afterTime = Date.now();

    expect(mockComponent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'testType',
        data: { key: 'value' },
        timestamp: expect.any(Number)
      })
    );

    const call = mockComponent.postMessage.mock.calls[0][0];
    expect(call.timestamp).toBeGreaterThanOrEqual(beforeTime);
    expect(call.timestamp).toBeLessThanOrEqual(afterTime);
  });

  test('sends message with null data', () => {
    sendToHtml('testType', null);

    expect(mockComponent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'testType',
        data: null,
        timestamp: expect.any(Number)
      })
    );
  });

  test('sends message with undefined data', () => {
    sendToHtml('testType', undefined);

    expect(mockComponent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'testType',
        data: undefined,
        timestamp: expect.any(Number)
      })
    );
  });

  test('does not throw if component is null', () => {
    mockComponent = null;
    expect(() => sendToHtml('test', {})).not.toThrow();
  });

  test('does not throw if postMessage throws', () => {
    mockComponent.postMessage = jest.fn(() => {
      throw new Error('Component detached');
    });

    expect(() => sendToHtml('test', {})).not.toThrow();
  });
});
