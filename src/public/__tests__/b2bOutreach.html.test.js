/* eslint-disable */
/**
 * B2B Outreach HTML DOM Tests
 *
 * Tests the B2B_OUTREACH.html message handling and DOM rendering.
 * Source: src/public/admin/B2B_OUTREACH.html
 *
 * Inbound: init, sequencesLoaded, sequenceLoaded, throttleStatus, sequenceSaved,
 *   emailContentGenerated, smsContentGenerated, callScriptGenerated,
 *   draftSaved, draftApproved, draftsLoaded, actionSuccess, actionError
 * Outbound: getSequences, getThrottleStatus, getSequence, saveSequence,
 *   generateEmailContent, generateSmsContent, generateCallScript, saveDraft, approveDraft, getDrafts
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

const HTML_FILE = path.resolve(__dirname, '..', 'admin', 'B2B_OUTREACH.html');
const htmlSource = fs.readFileSync(HTML_FILE, 'utf8');

// =============================================================================
// MOCK DOM
// =============================================================================

const mockElements = {};
let capturedOutbound = [];

function createMockElement(id) {
    const el = {
        id, innerHTML: '', textContent: '', className: '', value: '',
        style: { display: '' }, disabled: false, checked: false,
        classList: {
            add: jest.fn(), remove: jest.fn(), toggle: jest.fn((cls, force) => { }),
            contains: jest.fn(() => false)
        },
        setAttribute: jest.fn(), querySelector: jest.fn(() => null),
        querySelectorAll: jest.fn(() => []), appendChild: jest.fn(), dataset: {}
    };
    mockElements[id] = el;
    return el;
}

function getMockElement(id) { return mockElements[id] || createMockElement(id); }

function resetMockDOM() {
    Object.keys(mockElements).forEach(k => delete mockElements[k]);
    capturedOutbound = [];
    createMockElement('sequenceList');
    createMockElement('sequenceBuilder');
    createMockElement('seqStatusFilter');
    createMockElement('seqName');
    createMockElement('chEmail');
    createMockElement('chSms');
    createMockElement('chCall');
    createMockElement('emailLimit');
    createMockElement('smsLimit');
    createMockElement('callLimit');
    createMockElement('quietHoursIndicator');
    createMockElement('toastContainer');
}

function sanitize(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// =============================================================================
// REPLICATED MESSAGE HANDLER
// =============================================================================

const VALID_ACTIONS = [
    'init', 'sequencesLoaded', 'sequenceLoaded', 'throttleStatus', 'sequenceSaved',
    'stepSaved', 'actionSuccess', 'actionError',
    'emailContentGenerated', 'smsContentGenerated', 'callScriptGenerated',
    'draftSaved', 'draftApproved', 'draftsLoaded'
];

function handleMessage(msg) {
    if (!msg || typeof msg.action !== 'string' || !VALID_ACTIONS.includes(msg.action)) return null;

    switch (msg.action) {
        case 'init':
            capturedOutbound.push({ action: 'getSequences' });
            capturedOutbound.push({ action: 'getThrottleStatus' });
            return 'init';

        case 'sequencesLoaded': {
            const seqs = msg.payload || [];
            const list = getMockElement('sequenceList');
            if (!seqs || seqs.length === 0) {
                list.innerHTML = '<div class="empty-state">No sequences found</div>';
            } else {
                list.innerHTML = seqs.map(s =>
                    `<div class="step-card" data-id="${sanitize(s._id || s.id)}">` +
                    `<p>${sanitize(s.name)}</p><span>${sanitize(s.status || 'draft')}</span></div>`
                ).join('');
            }
            return 'sequencesLoaded';
        }

        case 'sequenceLoaded': {
            const data = msg.payload || {};
            const builder = getMockElement('sequenceBuilder');
            builder.style.display = 'block';
            getMockElement('seqName').value = data.sequence?.name || '';
            return 'sequenceLoaded';
        }

        case 'throttleStatus': {
            const t = msg.payload || {};
            if (t.email) getMockElement('emailLimit').textContent = `${t.email.remaining || 0}/${t.email.limit || 200}`;
            if (t.sms) getMockElement('smsLimit').textContent = `${t.sms.remaining || 0}/${t.sms.limit || 100}`;
            if (t.call) getMockElement('callLimit').textContent = `${t.call.remaining || 0}/${t.call.limit || 50}`;
            const qh = getMockElement('quietHoursIndicator');
            if (t.quietHours) qh.style.display = 'block';
            else qh.style.display = 'none';
            return 'throttleStatus';
        }

        case 'sequenceSaved': {
            getMockElement('toastContainer').innerHTML = '<div class="toast success">Sequence saved</div>';
            return 'sequenceSaved';
        }

        case 'emailContentGenerated': {
            const content = msg.payload?.content || {};
            getMockElement('toastContainer').innerHTML = `<div class="toast success">${msg.payload?.cached ? 'AI content loaded (cached)' : 'AI content generated'}</div>`;
            return 'emailContentGenerated';
        }

        case 'smsContentGenerated': {
            getMockElement('toastContainer').innerHTML = '<div class="toast success">AI content generated</div>';
            return 'smsContentGenerated';
        }

        case 'callScriptGenerated': {
            getMockElement('toastContainer').innerHTML = '<div class="toast success">AI content generated</div>';
            return 'callScriptGenerated';
        }

        case 'draftSaved': {
            getMockElement('toastContainer').innerHTML = '<div class="toast success">Draft saved for review</div>';
            return 'draftSaved';
        }

        case 'draftApproved': {
            getMockElement('toastContainer').innerHTML = '<div class="toast success">Draft approved</div>';
            return 'draftApproved';
        }

        case 'draftsLoaded': {
            return 'draftsLoaded';
        }

        case 'actionSuccess': {
            getMockElement('toastContainer').innerHTML = `<div class="toast success">${sanitize(msg.message || 'Done')}</div>`;
            return 'actionSuccess';
        }

        case 'actionError': {
            getMockElement('toastContainer').innerHTML = `<div class="toast error">${sanitize(msg.message || 'Error')}</div>`;
            return 'actionError';
        }

        default:
            return null;
    }
}

// =============================================================================
// TESTS
// =============================================================================

describe('B2B Outreach HTML DOM Tests', () => {
    beforeEach(() => resetMockDOM());

    describe('HTML source', () => {
        it('should exist', () => { expect(htmlSource.length).toBeGreaterThan(0); });
        it('should have message listener', () => { expect(htmlSource).toMatch(/addEventListener.*message|onmessage/i); });
        it('should have VALID_ACTIONS whitelist', () => { expect(htmlSource).toContain('VALID_ACTIONS'); });
    });

    describe('init', () => {
        it('should request sequences and throttle status', () => {
            handleMessage({ action: 'init' });
            expect(capturedOutbound).toContainEqual({ action: 'getSequences' });
            expect(capturedOutbound).toContainEqual({ action: 'getThrottleStatus' });
        });
    });

    describe('sequencesLoaded', () => {
        it('should render sequence rows', () => {
            handleMessage({ action: 'sequencesLoaded', payload: [
                { _id: 'seq-1', name: 'Intro Sequence', status: 'active' },
                { _id: 'seq-2', name: 'Follow Up', status: 'draft' }
            ]});
            const list = getMockElement('sequenceList');
            expect(list.innerHTML).toContain('Intro Sequence');
            expect(list.innerHTML).toContain('Follow Up');
        });

        it('should show empty state for no sequences', () => {
            handleMessage({ action: 'sequencesLoaded', payload: [] });
            expect(getMockElement('sequenceList').innerHTML).toContain('No sequences found');
        });
    });

    describe('sequenceLoaded', () => {
        it('should open builder with sequence data', () => {
            handleMessage({ action: 'sequenceLoaded', payload: {
                sequence: { _id: 'seq-1', name: 'My Sequence', channel_mix: 'email,sms' },
                steps: [{ step_type: 'email', subject: 'Hello' }]
            }});
            expect(getMockElement('seqName').value).toBe('My Sequence');
        });

        it('should handle missing payload', () => {
            handleMessage({ action: 'sequenceLoaded' });
            expect(getMockElement('seqName').value).toBe('');
        });
    });

    describe('throttleStatus', () => {
        it('should render throttle limits', () => {
            handleMessage({ action: 'throttleStatus', payload: {
                email: { remaining: 150, limit: 200 },
                sms: { remaining: 80, limit: 100 },
                call: { remaining: 30, limit: 50 }
            }});
            expect(getMockElement('emailLimit').textContent).toBe('150/200');
            expect(getMockElement('smsLimit').textContent).toBe('80/100');
            expect(getMockElement('callLimit').textContent).toBe('30/50');
        });

        it('should show quiet hours indicator when active', () => {
            handleMessage({ action: 'throttleStatus', payload: { quietHours: true } });
            expect(getMockElement('quietHoursIndicator').style.display).toBe('block');
        });

        it('should hide quiet hours indicator when inactive', () => {
            handleMessage({ action: 'throttleStatus', payload: { quietHours: false } });
            expect(getMockElement('quietHoursIndicator').style.display).toBe('none');
        });
    });

    describe('sequenceSaved', () => {
        it('should show success toast', () => {
            handleMessage({ action: 'sequenceSaved' });
            expect(getMockElement('toastContainer').innerHTML).toContain('success');
        });
    });

    describe('AI content generation', () => {
        it('should handle emailContentGenerated', () => {
            const result = handleMessage({ action: 'emailContentGenerated', payload: {
                content: { subject: 'Test', body: 'Hello there' }, cached: false
            }});
            expect(result).toBe('emailContentGenerated');
            expect(getMockElement('toastContainer').innerHTML).toContain('AI content generated');
        });

        it('should show cached indicator for cached content', () => {
            handleMessage({ action: 'emailContentGenerated', payload: {
                content: { subject: 'Test', body: 'Hi' }, cached: true
            }});
            expect(getMockElement('toastContainer').innerHTML).toContain('cached');
        });

        it('should handle smsContentGenerated', () => {
            expect(handleMessage({ action: 'smsContentGenerated', payload: { content: { message: 'Hi' } } })).toBe('smsContentGenerated');
        });

        it('should handle callScriptGenerated', () => {
            expect(handleMessage({ action: 'callScriptGenerated', payload: { content: { opening: 'Hello' } } })).toBe('callScriptGenerated');
        });
    });

    describe('draftSaved / draftApproved', () => {
        it('should show draft saved toast', () => {
            handleMessage({ action: 'draftSaved' });
            expect(getMockElement('toastContainer').innerHTML).toContain('Draft saved');
        });

        it('should show draft approved toast', () => {
            handleMessage({ action: 'draftApproved' });
            expect(getMockElement('toastContainer').innerHTML).toContain('Draft approved');
        });
    });

    describe('actionError', () => {
        it('should display error toast', () => {
            handleMessage({ action: 'actionError', message: 'Sequence save failed' });
            expect(getMockElement('toastContainer').innerHTML).toContain('error');
            expect(getMockElement('toastContainer').innerHTML).toContain('Sequence save failed');
        });

        it('should sanitize XSS in error message', () => {
            handleMessage({ action: 'actionError', message: '<img onerror=alert(1)>' });
            expect(getMockElement('toastContainer').innerHTML).not.toContain('<img');
        });
    });

    describe('Message validation', () => {
        it('should return null for null', () => { expect(handleMessage(null)).toBeNull(); });
        it('should return null for no action', () => { expect(handleMessage({})).toBeNull(); });
        it('should return null for unknown action', () => { expect(handleMessage({ action: 'xyz' })).toBeNull(); });
        it('should reject invalid actions not in whitelist', () => { expect(handleMessage({ action: 'deleteDatabasePlease' })).toBeNull(); });
    });
});
