/**
 * RECRUITER_COST_ANALYSIS Bridge Tests
 *
 * Tests for src/pages/RECRUITER_COST_ANALYSIS.hc0dz.js
 * Verifies message routing, backend calls, error handling, and safety checks.
 * Uses TYPE key protocol (not action).
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'RECRUITER_COST_ANALYSIS.hc0dz.js');
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

function createMockComponent() {
    return { onMessage: jest.fn(), postMessage: jest.fn() };
}

const mockBackend = {
    recordRecruitingSpend: jest.fn().mockResolvedValue({ success: true, recordId: 'rec123' }),
    bulkImportSpend: jest.fn().mockResolvedValue({ success: true, imported: 5, failed: 0 }),
    calculateCostPerHire: jest.fn().mockResolvedValue({
        success: true,
        metrics: { avgCost: 5000, totalSpend: 50000, totalHires: 10 }
    }),
    getChannelROI: jest.fn().mockResolvedValue({
        success: true,
        channels: [{ channel: 'Indeed', roi: 1.5, spend: 10000, hires: 5 }]
    }),
    getSpendTrend: jest.fn().mockResolvedValue({
        success: true,
        trend: [{ month: '2026-01', spend: 8000, hires: 3 }]
    }),
    updateSpendHires: jest.fn().mockResolvedValue({ success: true, recordId: 'rec456' })
};

function sendToHtml(component, type, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage({ type, data, timestamp: Date.now() });
        }
    } catch (error) { /* silent */ }
}

function getHtmlComponent($w, configId = 'html1') {
    const possibleIds = [configId, 'html1', 'html2', 'html3', 'html4', 'html5', 'htmlEmbed1'];
    for (const id of possibleIds) {
        try {
            const el = $w(`#${id}`);
            if (el && typeof el.onMessage === 'function') {
                return el;
            }
        } catch (e) { /* skip */ }
    }
    return null;
}

// Global state tracker
let globalCarrierDot = null;

async function routeMessage(component, msg, backend = mockBackend) {
    if (!msg || !msg.type) return;

    const { type, data } = msg;

    try {
        switch (type) {
            case 'costAnalysisReady':
                if (globalCarrierDot) {
                    sendToHtml(component, 'carrierContext', { carrierDot: globalCarrierDot });
                }
                break;

            case 'getCostData': {
                const dot = data?.carrierDot || globalCarrierDot;
                if (!dot) {
                    sendToHtml(component, 'costError', { error: 'No carrier context' });
                    return;
                }
                globalCarrierDot = dot;

                const dateRange = data?.dateRange || { start: null, end: null };

                const [costResult, roiResult, trendResult] = await Promise.all([
                    backend.calculateCostPerHire(dot, dateRange),
                    backend.getChannelROI(dot, dateRange),
                    backend.getSpendTrend(dot, 6)
                ]);

                if (!costResult.success) {
                    sendToHtml(component, 'costError', { error: costResult.error || 'Failed to fetch cost data' });
                    return;
                }

                sendToHtml(component, 'costData', {
                    success: true,
                    metrics: costResult.metrics || {},
                    channelROI: roiResult.success ? roiResult.channels : [],
                    trend: trendResult.success ? trendResult.trend : []
                });
                break;
            }

            case 'recordSpend': {
                const dot = data?.carrierDot || globalCarrierDot;
                if (!dot) {
                    sendToHtml(component, 'spendResult', { success: false, error: 'No carrier context' });
                    return;
                }

                const spendData = {
                    carrier_dot: dot,
                    ...data
                };

                const result = await backend.recordRecruitingSpend(spendData);
                sendToHtml(component, 'spendResult', result);
                break;
            }

            case 'bulkImportSpend': {
                const dot = data?.carrierDot || globalCarrierDot;
                if (!dot || !Array.isArray(data?.records)) {
                    sendToHtml(component, 'bulkImportResult', { success: false, error: 'Invalid import data' });
                    return;
                }

                const result = await backend.bulkImportSpend(dot, data.records);
                sendToHtml(component, 'bulkImportResult', result);
                break;
            }

            case 'updateSpendHires': {
                const { spendId, hires } = data || {};

                if (!spendId || hires === undefined) {
                    sendToHtml(component, 'spendResult', { success: false, error: 'Missing required fields' });
                    return;
                }

                const result = await backend.updateSpendHires(spendId, hires);
                sendToHtml(component, 'spendResult', result);
                break;
            }

            case 'getChannelROI': {
                const dot = data?.carrierDot || globalCarrierDot;
                if (!dot) {
                    sendToHtml(component, 'channelROIData', { success: false, error: 'No carrier context' });
                    return;
                }

                const dateRange = data?.dateRange || { start: null, end: null };
                const result = await backend.getChannelROI(dot, dateRange);
                sendToHtml(component, 'channelROIData', result);
                break;
            }

            case 'getSpendTrend': {
                const dot = data?.carrierDot || globalCarrierDot;
                if (!dot) {
                    sendToHtml(component, 'spendTrendData', { success: false, error: 'No carrier context' });
                    return;
                }

                const months = data?.months || 6;
                const result = await backend.getSpendTrend(dot, months);
                sendToHtml(component, 'spendTrendData', result);
                break;
            }

            default:
                // Unknown type - do nothing
                break;
        }
    } catch (error) {
        // Error responses vary by message type
        const errorType = type === 'getCostData' ? 'costError' :
                         type === 'getChannelROI' ? 'channelROIData' :
                         type === 'getSpendTrend' ? 'spendTrendData' :
                         type === 'bulkImportSpend' ? 'bulkImportResult' :
                         'spendResult';
        sendToHtml(component, errorType, { success: false, error: error.message });
    }
}

describe('RECRUITER_COST_ANALYSIS Bridge', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
        globalCarrierDot = null;
    });

    describe('Source file structure', () => {
        test('imports from backend/recruiterAnalyticsService', () => {
            expect(sourceCode).toContain("from 'backend/recruiterAnalyticsService.jsw'");
        });

        test('imports recordRecruitingSpend', () => {
            expect(sourceCode).toContain('recordRecruitingSpend');
        });

        test('imports bulkImportSpend', () => {
            expect(sourceCode).toContain('bulkImportSpend');
        });

        test('imports calculateCostPerHire', () => {
            expect(sourceCode).toContain('calculateCostPerHire');
        });

        test('imports getChannelROI', () => {
            expect(sourceCode).toContain('getChannelROI');
        });

        test('imports getSpendTrend', () => {
            expect(sourceCode).toContain('getSpendTrend');
        });

        test('imports updateSpendHires', () => {
            expect(sourceCode).toContain('updateSpendHires');
        });

        test('imports wix-users', () => {
            expect(sourceCode).toContain("from 'wix-users'");
        });

        test('defines CONFIG object', () => {
            expect(sourceCode).toContain('const CONFIG');
            expect(sourceCode).toContain('htmlComponentId');
        });

        test('defines MESSAGE_REGISTRY', () => {
            expect(sourceCode).toContain('MESSAGE_REGISTRY');
            expect(sourceCode).toContain('inbound');
            expect(sourceCode).toContain('outbound');
        });

        test('MESSAGE_REGISTRY has all 7 inbound types', () => {
            expect(sourceCode).toContain("'costAnalysisReady'");
            expect(sourceCode).toContain("'getCostData'");
            expect(sourceCode).toContain("'recordSpend'");
            expect(sourceCode).toContain("'bulkImportSpend'");
            expect(sourceCode).toContain("'updateSpendHires'");
            expect(sourceCode).toContain("'getChannelROI'");
            expect(sourceCode).toContain("'getSpendTrend'");
        });

        test('MESSAGE_REGISTRY has all 6 outbound types', () => {
            expect(sourceCode).toContain("'costData'");
            expect(sourceCode).toContain("'costError'");
            expect(sourceCode).toContain("'spendResult'");
            expect(sourceCode).toContain("'bulkImportResult'");
            expect(sourceCode).toContain("'channelROIData'");
            expect(sourceCode).toContain("'spendTrendData'");
        });

        test('defines carrierDot global state', () => {
            expect(sourceCode).toMatch(/let carrierDot\s*=\s*null/);
        });

        test('defines $w.onReady', () => {
            expect(sourceCode).toMatch(/\$w\.onReady/);
        });

        test('uses type key protocol', () => {
            expect(sourceCode).toContain('msg.type');
            expect(sourceCode).not.toMatch(/msg\.action\b/);
        });

        test('defines sendToHtml function', () => {
            expect(sourceCode).toContain('function sendToHtml');
            expect(sourceCode).toMatch(/sendToHtml\(type,\s*data\)/);
        });

        test('defines getHtmlComponent function', () => {
            expect(sourceCode).toContain('function getHtmlComponent');
        });

        test('defines handleMessage function', () => {
            expect(sourceCode).toContain('function handleMessage');
        });
    });

    describe('Safety checks', () => {
        test('$w calls are wrapped in try-catch', () => {
            expect(sourceCode).toMatch(/try\s*\{[\s\S]*?\$w\(`#\$\{id\}`\)[\s\S]*?\}\s*catch/);
        });

        test('sendToHtml wraps postMessage in try-catch', () => {
            const sendToHtmlFn = sourceCode.match(/function sendToHtml[\s\S]*?^}/m);
            expect(sendToHtmlFn).toBeTruthy();
            expect(sendToHtmlFn[0]).toContain('try');
            expect(sendToHtmlFn[0]).toContain('catch');
        });

        test('handleMessage guards for missing msg', () => {
            expect(sourceCode).toMatch(/if\s*\(\s*!msg/);
        });

        test('handleMessage guards for missing type', () => {
            expect(sourceCode).toMatch(/!msg\.type/);
        });
    });

    describe('HTML component discovery', () => {
        test('finds component with onMessage', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html1') return createMockComponent();
                throw new Error('not found');
            });
            const result = getHtmlComponent(mock$w);
            expect(result).toBeTruthy();
            expect(typeof result.onMessage).toBe('function');
        });

        test('returns null if no component found', () => {
            const mock$w = jest.fn(() => { throw new Error('skip'); });
            expect(getHtmlComponent(mock$w)).toBeNull();
        });

        test('tries multiple IDs in order', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html3') return createMockComponent();
                throw new Error('not found');
            });
            const result = getHtmlComponent(mock$w);
            expect(result).toBeTruthy();
            expect(mock$w).toHaveBeenCalledWith('#html1');
            expect(mock$w).toHaveBeenCalledWith('#html3');
        });

        test('checks CONFIG.htmlComponentId first', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#htmlEmbed1') return createMockComponent();
                throw new Error('not found');
            });
            const result = getHtmlComponent(mock$w, 'htmlEmbed1');
            expect(result).toBeTruthy();
            expect(mock$w.mock.calls[0][0]).toBe('#htmlEmbed1');
        });
    });

    describe('Message routing - costAnalysisReady', () => {
        test('sends carrierContext if carrierDot is set', async () => {
            globalCarrierDot = '1234567';
            await routeMessage(component, { type: 'costAnalysisReady' });
            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'carrierContext',
                data: { carrierDot: '1234567' }
            }));
        });

        test('does nothing if carrierDot is null', async () => {
            globalCarrierDot = null;
            await routeMessage(component, { type: 'costAnalysisReady' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });
    });

    describe('Message routing - getCostData', () => {
        test('fetches cost data with carrier dot from data', async () => {
            await routeMessage(component, {
                type: 'getCostData',
                data: { carrierDot: '7654321' }
            });

            expect(mockBackend.calculateCostPerHire).toHaveBeenCalledWith('7654321', { start: null, end: null });
            expect(mockBackend.getChannelROI).toHaveBeenCalledWith('7654321', { start: null, end: null });
            expect(mockBackend.getSpendTrend).toHaveBeenCalledWith('7654321', 6);
        });

        test('uses global carrierDot if not in data', async () => {
            globalCarrierDot = '9999999';
            await routeMessage(component, { type: 'getCostData', data: {} });

            expect(mockBackend.calculateCostPerHire).toHaveBeenCalledWith('9999999', { start: null, end: null });
        });

        test('sends costError if no carrier context', async () => {
            globalCarrierDot = null;
            await routeMessage(component, { type: 'getCostData', data: {} });

            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'costError',
                data: { error: 'No carrier context' }
            }));
        });

        test('sends costData on success', async () => {
            await routeMessage(component, {
                type: 'getCostData',
                data: { carrierDot: '1111111' }
            });

            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'costData',
                data: expect.objectContaining({
                    success: true,
                    metrics: { avgCost: 5000, totalSpend: 50000, totalHires: 10 },
                    channelROI: [{ channel: 'Indeed', roi: 1.5, spend: 10000, hires: 5 }],
                    trend: [{ month: '2026-01', spend: 8000, hires: 3 }]
                })
            }));
        });

        test('passes custom dateRange to backend', async () => {
            const dateRange = { start: '2026-01-01', end: '2026-01-31' };
            await routeMessage(component, {
                type: 'getCostData',
                data: { carrierDot: '2222222', dateRange }
            });

            expect(mockBackend.calculateCostPerHire).toHaveBeenCalledWith('2222222', dateRange);
            expect(mockBackend.getChannelROI).toHaveBeenCalledWith('2222222', dateRange);
        });

        test('sends costError if calculateCostPerHire fails', async () => {
            const failBackend = {
                ...mockBackend,
                calculateCostPerHire: jest.fn().mockResolvedValue({ success: false, error: 'DB error' })
            };

            await routeMessage(component, {
                type: 'getCostData',
                data: { carrierDot: '3333333' }
            }, failBackend);

            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'costError',
                data: { error: 'DB error' }
            }));
        });

        test('updates global carrierDot state', async () => {
            expect(globalCarrierDot).toBeNull();
            await routeMessage(component, {
                type: 'getCostData',
                data: { carrierDot: '4444444' }
            });
            expect(globalCarrierDot).toBe('4444444');
        });
    });

    describe('Message routing - recordSpend', () => {
        test('records spend with carrier dot', async () => {
            globalCarrierDot = '5555555';
            await routeMessage(component, {
                type: 'recordSpend',
                data: { channel: 'LinkedIn', amount: 1000, date: '2026-02-01' }
            });

            expect(mockBackend.recordRecruitingSpend).toHaveBeenCalledWith({
                carrier_dot: '5555555',
                channel: 'LinkedIn',
                amount: 1000,
                date: '2026-02-01'
            });
        });

        test('sends spendResult on success', async () => {
            globalCarrierDot = '6666666';
            await routeMessage(component, {
                type: 'recordSpend',
                data: { channel: 'Indeed', amount: 500 }
            });

            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'spendResult',
                data: { success: true, recordId: 'rec123' }
            }));
        });

        test('sends error if no carrier context', async () => {
            globalCarrierDot = null;
            await routeMessage(component, {
                type: 'recordSpend',
                data: { channel: 'Test', amount: 100 }
            });

            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'spendResult',
                data: { success: false, error: 'No carrier context' }
            }));
        });

        test('uses carrierDot from data over global', async () => {
            globalCarrierDot = '7777777';
            await routeMessage(component, {
                type: 'recordSpend',
                data: { carrierDot: '8888888', channel: 'Test', amount: 200 }
            });

            expect(mockBackend.recordRecruitingSpend).toHaveBeenCalledWith(
                expect.objectContaining({ carrier_dot: '8888888' })
            );
        });
    });

    describe('Message routing - bulkImportSpend', () => {
        test('imports bulk spend records', async () => {
            globalCarrierDot = '1010101';
            const records = [
                { channel: 'Indeed', amount: 1000, date: '2026-01-15' },
                { channel: 'LinkedIn', amount: 2000, date: '2026-01-20' }
            ];

            await routeMessage(component, {
                type: 'bulkImportSpend',
                data: { records }
            });

            expect(mockBackend.bulkImportSpend).toHaveBeenCalledWith('1010101', records);
        });

        test('sends bulkImportResult on success', async () => {
            globalCarrierDot = '2020202';
            await routeMessage(component, {
                type: 'bulkImportSpend',
                data: { records: [] }
            });

            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'bulkImportResult',
                data: { success: true, imported: 5, failed: 0 }
            }));
        });

        test('sends error if no carrier context', async () => {
            globalCarrierDot = null;
            await routeMessage(component, {
                type: 'bulkImportSpend',
                data: { records: [] }
            });

            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'bulkImportResult',
                data: { success: false, error: 'Invalid import data' }
            }));
        });

        test('sends error if records is not array', async () => {
            globalCarrierDot = '3030303';
            await routeMessage(component, {
                type: 'bulkImportSpend',
                data: { records: 'not-array' }
            });

            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'bulkImportResult',
                data: { success: false, error: 'Invalid import data' }
            }));
        });

        test('sends error if records is missing', async () => {
            globalCarrierDot = '4040404';
            await routeMessage(component, {
                type: 'bulkImportSpend',
                data: {}
            });

            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'bulkImportResult',
                data: { success: false, error: 'Invalid import data' }
            }));
        });
    });

    describe('Message routing - updateSpendHires', () => {
        test('updates spend record with hires', async () => {
            await routeMessage(component, {
                type: 'updateSpendHires',
                data: { spendId: 'rec789', hires: 3 }
            });

            expect(mockBackend.updateSpendHires).toHaveBeenCalledWith('rec789', 3);
        });

        test('sends spendResult on success', async () => {
            await routeMessage(component, {
                type: 'updateSpendHires',
                data: { spendId: 'rec999', hires: 5 }
            });

            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'spendResult',
                data: { success: true, recordId: 'rec456' }
            }));
        });

        test('sends error if spendId missing', async () => {
            await routeMessage(component, {
                type: 'updateSpendHires',
                data: { hires: 2 }
            });

            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'spendResult',
                data: { success: false, error: 'Missing required fields' }
            }));
        });

        test('sends error if hires undefined', async () => {
            await routeMessage(component, {
                type: 'updateSpendHires',
                data: { spendId: 'rec123' }
            });

            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'spendResult',
                data: { success: false, error: 'Missing required fields' }
            }));
        });

        test('accepts hires = 0', async () => {
            await routeMessage(component, {
                type: 'updateSpendHires',
                data: { spendId: 'rec000', hires: 0 }
            });

            expect(mockBackend.updateSpendHires).toHaveBeenCalledWith('rec000', 0);
        });
    });

    describe('Message routing - getChannelROI', () => {
        test('fetches channel ROI data', async () => {
            globalCarrierDot = '5050505';
            await routeMessage(component, {
                type: 'getChannelROI',
                data: {}
            });

            expect(mockBackend.getChannelROI).toHaveBeenCalledWith('5050505', { start: null, end: null });
        });

        test('sends channelROIData on success', async () => {
            globalCarrierDot = '6060606';
            await routeMessage(component, {
                type: 'getChannelROI',
                data: {}
            });

            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'channelROIData',
                data: {
                    success: true,
                    channels: [{ channel: 'Indeed', roi: 1.5, spend: 10000, hires: 5 }]
                }
            }));
        });

        test('passes custom dateRange', async () => {
            globalCarrierDot = '7070707';
            const dateRange = { start: '2026-01-01', end: '2026-02-01' };
            await routeMessage(component, {
                type: 'getChannelROI',
                data: { dateRange }
            });

            expect(mockBackend.getChannelROI).toHaveBeenCalledWith('7070707', dateRange);
        });

        test('sends error if no carrier context', async () => {
            globalCarrierDot = null;
            await routeMessage(component, {
                type: 'getChannelROI',
                data: {}
            });

            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'channelROIData',
                data: { success: false, error: 'No carrier context' }
            }));
        });
    });

    describe('Message routing - getSpendTrend', () => {
        test('fetches spend trend with default 6 months', async () => {
            globalCarrierDot = '8080808';
            await routeMessage(component, {
                type: 'getSpendTrend',
                data: {}
            });

            expect(mockBackend.getSpendTrend).toHaveBeenCalledWith('8080808', 6);
        });

        test('sends spendTrendData on success', async () => {
            globalCarrierDot = '9090909';
            await routeMessage(component, {
                type: 'getSpendTrend',
                data: {}
            });

            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'spendTrendData',
                data: {
                    success: true,
                    trend: [{ month: '2026-01', spend: 8000, hires: 3 }]
                }
            }));
        });

        test('passes custom months parameter', async () => {
            globalCarrierDot = '1212121';
            await routeMessage(component, {
                type: 'getSpendTrend',
                data: { months: 12 }
            });

            expect(mockBackend.getSpendTrend).toHaveBeenCalledWith('1212121', 12);
        });

        test('sends error if no carrier context', async () => {
            globalCarrierDot = null;
            await routeMessage(component, {
                type: 'getSpendTrend',
                data: {}
            });

            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'spendTrendData',
                data: { success: false, error: 'No carrier context' }
            }));
        });
    });

    describe('Message routing - unknown types', () => {
        test('ignores messages with no type', async () => {
            await routeMessage(component, {});
            await routeMessage(component, null);
            await routeMessage(component, { data: 'test' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('ignores unknown message type', async () => {
            await routeMessage(component, { type: 'unknownType', data: {} });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('does not throw on unknown type', async () => {
            await expect(routeMessage(component, { type: 'unknown' })).resolves.not.toThrow();
        });
    });

    describe('Error handling', () => {
        test('getCostData handles Promise.all rejection', async () => {
            const failBackend = {
                ...mockBackend,
                calculateCostPerHire: jest.fn().mockRejectedValue(new Error('Network error'))
            };

            await routeMessage(component, {
                type: 'getCostData',
                data: { carrierDot: '1111111' }
            }, failBackend);

            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'costError',
                data: { success: false, error: 'Network error' }
            }));
        });

        test('recordSpend handles backend error', async () => {
            const failBackend = {
                ...mockBackend,
                recordRecruitingSpend: jest.fn().mockRejectedValue(new Error('Save failed'))
            };

            globalCarrierDot = '2222222';
            await routeMessage(component, {
                type: 'recordSpend',
                data: { channel: 'Test', amount: 100 }
            }, failBackend);

            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'spendResult',
                data: { success: false, error: 'Save failed' }
            }));
        });

        test('bulkImportSpend handles backend error', async () => {
            const failBackend = {
                ...mockBackend,
                bulkImportSpend: jest.fn().mockRejectedValue(new Error('Import failed'))
            };

            globalCarrierDot = '3333333';
            await routeMessage(component, {
                type: 'bulkImportSpend',
                data: { records: [] }
            }, failBackend);

            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'bulkImportResult',
                data: { success: false, error: 'Import failed' }
            }));
        });

        test('updateSpendHires handles backend error', async () => {
            const failBackend = {
                ...mockBackend,
                updateSpendHires: jest.fn().mockRejectedValue(new Error('Update error'))
            };

            await routeMessage(component, {
                type: 'updateSpendHires',
                data: { spendId: 'rec123', hires: 5 }
            }, failBackend);

            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'spendResult',
                data: { success: false, error: 'Update error' }
            }));
        });

        test('getChannelROI handles backend error', async () => {
            const failBackend = {
                ...mockBackend,
                getChannelROI: jest.fn().mockRejectedValue(new Error('ROI calc failed'))
            };

            globalCarrierDot = '4444444';
            await routeMessage(component, {
                type: 'getChannelROI',
                data: {}
            }, failBackend);

            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'channelROIData',
                data: { success: false, error: 'ROI calc failed' }
            }));
        });

        test('getSpendTrend handles backend error', async () => {
            const failBackend = {
                ...mockBackend,
                getSpendTrend: jest.fn().mockRejectedValue(new Error('Trend calc failed'))
            };

            globalCarrierDot = '5555555';
            await routeMessage(component, {
                type: 'getSpendTrend',
                data: {}
            }, failBackend);

            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'spendTrendData',
                data: { success: false, error: 'Trend calc failed' }
            }));
        });
    });

    describe('sendToHtml utility', () => {
        test('sends message with type and data', () => {
            sendToHtml(component, 'testType', { key: 'value' });
            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'testType',
                data: { key: 'value' }
            }));
        });

        test('includes timestamp', () => {
            const before = Date.now();
            sendToHtml(component, 'test', {});
            const after = Date.now();

            const call = component.postMessage.mock.calls[0][0];
            expect(call.timestamp).toBeGreaterThanOrEqual(before);
            expect(call.timestamp).toBeLessThanOrEqual(after);
        });

        test('does nothing if component is null', () => {
            expect(() => sendToHtml(null, 'test', {})).not.toThrow();
        });

        test('does nothing if postMessage not a function', () => {
            expect(() => sendToHtml({}, 'test', {})).not.toThrow();
        });

        test('does not throw if postMessage throws', () => {
            const bad = { postMessage: jest.fn(() => { throw new Error('Detached'); }) };
            expect(() => sendToHtml(bad, 'test', {})).not.toThrow();
        });
    });
});
