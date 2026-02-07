/**
 * CARRIER_DQ_TRACKER HTML DOM Tests
 * ====================================
 * Tests for src/public/carrier/CARRIER_DQ_TRACKER.html
 * Verifies HTML component correctly receives messages and updates DOM.
 *
 * **TYPE PROTOCOL** (not action) -- uses { type, data } envelope
 *
 * Inbound: setDQFiles
 * Outbound: dqTrackerReady, getDQFiles, generateAuditReport, navigateTo
 *
 * DOM IDs: driverList, detailView, searchInput, totalDrivers, avgScore,
 *   sidebar, sidebarCarrierName
 *
 * Features: DQ file tracking for drivers, search/filter, detail view with
 *   checklist items (valid/missing/expired), export all as CSV, audit report
 *
 * @see src/public/carrier/CARRIER_DQ_TRACKER.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(__dirname, '..', 'carrier', 'CARRIER_DQ_TRACKER.html');

const INBOUND_MESSAGES = [
    'setDQFiles'
];

const OUTBOUND_MESSAGES = [
    'dqTrackerReady',
    'getDQFiles',
    'generateAuditReport',
    'navigateTo'
];

// =============================================================================
// READ SOURCE FILE
// =============================================================================

const htmlSource = fs.readFileSync(HTML_FILE, 'utf8');

// =============================================================================
// MOCK DOM INFRASTRUCTURE
// =============================================================================

function createMockElement(id) {
    const children = [];
    const element = {
        id,
        textContent: '',
        innerHTML: '',
        innerText: '',
        value: '',
        className: '',
        style: {},
        hidden: false,
        disabled: false,
        children,
        childNodes: children,
        dataset: {},
        classList: {
            _classes: new Set(),
            add: jest.fn(function (...cls) { cls.forEach(c => this._classes.add(c)); }),
            remove: jest.fn(function (...cls) { cls.forEach(c => this._classes.delete(c)); }),
            toggle: jest.fn(),
            contains: jest.fn(function (cls) { return this._classes.has(cls); }),
        },
        appendChild: jest.fn((child) => { children.push(child); return child; }),
        removeChild: jest.fn(),
        remove: jest.fn(),
        setAttribute: jest.fn(),
        getAttribute: jest.fn(() => null),
        addEventListener: jest.fn(),
        querySelector: jest.fn(() => null),
        querySelectorAll: jest.fn(() => []),
    };
    return element;
}

const mockElements = {};

function getMockElement(id) {
    if (!mockElements[id]) {
        mockElements[id] = createMockElement(id);
    }
    return mockElements[id];
}

const capturedOutbound = [];

function mockPostToParent(type, data) {
    capturedOutbound.push({ type, data });
}

// =============================================================================
// REPLICATED CORE LOGIC (type-based protocol)
// =============================================================================

function sendToVelo(action, payload = {}) {
    mockPostToParent(action, payload);
}

const state = {
    dqFiles: [],
    searchTerm: ''
};

function handleSetDQFiles(data) {
    state.dqFiles = data.files || [];
    const summary = data.summary || {};
    getMockElement('totalDrivers').textContent = String(summary.totalDrivers || 0);
    getMockElement('avgScore').textContent = (summary.avgCompleteness || 0) + '%';
    renderList();
}

function renderList() {
    const list = getMockElement('driverList');
    const filtered = state.dqFiles.filter(f =>
        f.driver_name.toLowerCase().includes(state.searchTerm.toLowerCase())
    );

    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-state">No drivers found</div>';
        return;
    }

    list.innerHTML = filtered.map(file => {
        let statusColor = 'bg-green-500';
        if (file.completeness_score < 100) statusColor = 'bg-yellow-500';
        if (file.completeness_score < 80) statusColor = 'bg-red-500';

        return `<div class="driver-item" data-id="${file._id}">` +
            `<span class="driver-name">${file.driver_name}</span>` +
            `<span class="score">${file.completeness_score}%</span>` +
            `<div class="${statusColor}" style="width: ${file.completeness_score}%"></div>` +
            `</div>`;
    }).join('');
}

function renderDetail(file) {
    const detail = getMockElement('detailView');
    const checklist = file.checklist || {};
    const items = Object.entries(checklist);

    let statusBadge = '<span class="badge incomplete">INCOMPLETE</span>';
    if (file.completeness_score === 100) statusBadge = '<span class="badge audit-ready">AUDIT READY</span>';

    let html = `<div class="detail-card">`;
    html += `<h2>${file.driver_name}</h2>`;
    html += `<p>DQ File ID: ${file._id}</p>`;
    html += statusBadge;

    items.forEach(([key, item]) => {
        if (!item.required) return;

        let statusClass = 'missing';
        let icon = 'fa-circle-xmark';
        let color = 'text-red-500';
        if (item.status === 'valid') {
            statusClass = 'valid';
            icon = 'fa-circle-check';
            color = 'text-green-500';
        }

        html += `<div class="checklist-item ${statusClass}">`;
        html += `<i class="fa-solid ${icon} ${color}"></i>`;
        html += `<span>${item.label || key}</span>`;
        html += `<span>${item.status === 'valid' ? 'Document on file' : 'Missing document'}</span>`;
        html += `</div>`;
    });

    html += `</div>`;
    html += `<button class="generate-report" data-id="${file._id}">Generate Audit Report</button>`;

    detail.innerHTML = html;
}

function handleMessage(eventData) {
    const msg = eventData;
    if (!msg || !msg.type) return;

    switch (msg.type) {
        case 'setDQFiles':
            handleSetDQFiles(msg.data);
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('CARRIER_DQ_TRACKER.html DOM Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        capturedOutbound.length = 0;
        Object.keys(mockElements).forEach(id => {
            const el = mockElements[id];
            el.textContent = '';
            el.innerHTML = '';
            el.value = '';
            el.hidden = false;
            el.style = {};
            el.classList._classes.clear();
            el.classList.add.mockClear();
            el.classList.remove.mockClear();
            el.appendChild.mockClear();
            el.children.length = 0;
        });
        state.dqFiles = [];
        state.searchTerm = '';
    });

    // =========================================================================
    // SOURCE HTML STRUCTURAL CHECKS
    // =========================================================================

    describe('HTML source structure', () => {
        test('file exists and is readable', () => {
            expect(htmlSource.length).toBeGreaterThan(0);
        });

        test('contains a message listener', () => {
            const hasListener =
                htmlSource.includes("addEventListener('message'") ||
                htmlSource.includes('addEventListener("message"') ||
                htmlSource.includes('window.onmessage');
            expect(hasListener).toBe(true);
        });

        test('contains parent postMessage calls', () => {
            expect(htmlSource).toContain('window.parent.postMessage');
        });

        test('sends dqTrackerReady signal on init', () => {
            expect(htmlSource).toContain('dqTrackerReady');
            const readyPattern = /postMessage\(\s*\{[^}]*type:\s*['"]dqTrackerReady['"]/;
            expect(readyPattern.test(htmlSource)).toBe(true);
        });

        test('handles all expected inbound message types', () => {
            INBOUND_MESSAGES.forEach(msg => {
                expect(htmlSource).toContain(msg);
            });
        });

        test('references all expected outbound message types', () => {
            OUTBOUND_MESSAGES.forEach(msg => {
                expect(htmlSource).toContain(msg);
            });
        });

        test('uses type-based message protocol (NOT action-only)', () => {
            const hasType =
                htmlSource.includes('msg.type') ||
                htmlSource.includes('.type');
            expect(hasType).toBe(true);
        });

        test('guards against missing type with early return', () => {
            const guardPattern = /if\s*\(\s*!msg\s*\|\|\s*!msg\.type\s*\)\s*return/;
            expect(guardPattern.test(htmlSource)).toBe(true);
        });
    });

    // =========================================================================
    // MESSAGE VALIDATION
    // =========================================================================

    describe('Message validation', () => {
        test('ignores null/undefined messages', () => {
            handleMessage(null);
            handleMessage(undefined);
            expect(getMockElement('driverList').innerHTML).toBe('');
        });

        test('ignores messages without type key', () => {
            handleMessage({ action: 'setDQFiles', data: {} });
            expect(getMockElement('driverList').innerHTML).toBe('');
        });

        test('ignores empty object', () => {
            handleMessage({});
            expect(getMockElement('driverList').innerHTML).toBe('');
        });
    });

    // =========================================================================
    // DOM RENDERING
    // =========================================================================

    describe('DOM rendering', () => {
        test('setDQFiles renders driver list', () => {
            handleMessage({
                type: 'setDQFiles',
                data: {
                    files: [
                        { _id: 'dq1', driver_name: 'John Smith', completeness_score: 95, checklist: {} },
                        { _id: 'dq2', driver_name: 'Jane Doe', completeness_score: 75, checklist: {} }
                    ],
                    summary: { totalDrivers: 2, avgCompleteness: 85 }
                }
            });

            const listHtml = getMockElement('driverList').innerHTML;
            expect(listHtml).toContain('John Smith');
            expect(listHtml).toContain('Jane Doe');
            expect(listHtml).toContain('95%');
            expect(listHtml).toContain('75%');
        });

        test('setDQFiles updates summary stats', () => {
            handleMessage({
                type: 'setDQFiles',
                data: {
                    files: [],
                    summary: { totalDrivers: 15, avgCompleteness: 88 }
                }
            });

            expect(getMockElement('totalDrivers').textContent).toBe('15');
            expect(getMockElement('avgScore').textContent).toBe('88%');
        });

        test('setDQFiles applies color coding based on completeness', () => {
            handleMessage({
                type: 'setDQFiles',
                data: {
                    files: [
                        { _id: 'dq1', driver_name: 'High Score', completeness_score: 100, checklist: {} },
                        { _id: 'dq2', driver_name: 'Mid Score', completeness_score: 85, checklist: {} },
                        { _id: 'dq3', driver_name: 'Low Score', completeness_score: 60, checklist: {} }
                    ],
                    summary: { totalDrivers: 3, avgCompleteness: 82 }
                }
            });

            const listHtml = getMockElement('driverList').innerHTML;
            expect(listHtml).toContain('bg-green-500');  // 100%
            expect(listHtml).toContain('bg-yellow-500'); // 85%
            expect(listHtml).toContain('bg-red-500');    // 60%
        });

        test('renderDetail shows checklist items with valid/missing status', () => {
            const file = {
                _id: 'dq1',
                driver_name: 'John Smith',
                completeness_score: 75,
                checklist: {
                    cdl: { label: 'CDL License', status: 'valid', required: true },
                    medical_card: { label: 'Medical Card', status: 'missing', required: true },
                    mvr: { label: 'Motor Vehicle Record', status: 'valid', required: true }
                }
            };
            renderDetail(file);

            const detailHtml = getMockElement('detailView').innerHTML;
            expect(detailHtml).toContain('John Smith');
            expect(detailHtml).toContain('CDL License');
            expect(detailHtml).toContain('Medical Card');
            expect(detailHtml).toContain('checklist-item valid');
            expect(detailHtml).toContain('checklist-item missing');
            expect(detailHtml).toContain('Document on file');
            expect(detailHtml).toContain('Missing document');
        });

        test('renderDetail shows AUDIT READY for 100% complete files', () => {
            const file = {
                _id: 'dq1',
                driver_name: 'John Smith',
                completeness_score: 100,
                checklist: {
                    cdl: { label: 'CDL', status: 'valid', required: true }
                }
            };
            renderDetail(file);

            expect(getMockElement('detailView').innerHTML).toContain('AUDIT READY');
        });

        test('renderDetail shows INCOMPLETE for partial files', () => {
            const file = {
                _id: 'dq1',
                driver_name: 'Jane Doe',
                completeness_score: 60,
                checklist: {
                    cdl: { label: 'CDL', status: 'missing', required: true }
                }
            };
            renderDetail(file);

            expect(getMockElement('detailView').innerHTML).toContain('INCOMPLETE');
        });

        test('renderDetail includes generate audit report button', () => {
            const file = {
                _id: 'dq1',
                driver_name: 'Test Driver',
                completeness_score: 80,
                checklist: {}
            };
            renderDetail(file);

            expect(getMockElement('detailView').innerHTML).toContain('Generate Audit Report');
        });

        test('search filters driver list', () => {
            handleMessage({
                type: 'setDQFiles',
                data: {
                    files: [
                        { _id: 'dq1', driver_name: 'John Smith', completeness_score: 100, checklist: {} },
                        { _id: 'dq2', driver_name: 'Jane Doe', completeness_score: 80, checklist: {} },
                        { _id: 'dq3', driver_name: 'Bob Johnson', completeness_score: 60, checklist: {} }
                    ],
                    summary: { totalDrivers: 3, avgCompleteness: 80 }
                }
            });

            // Now filter
            state.searchTerm = 'john';
            renderList();

            const listHtml = getMockElement('driverList').innerHTML;
            expect(listHtml).toContain('John Smith');
            expect(listHtml).toContain('Bob Johnson'); // "Johnson" contains "john"
            expect(listHtml).not.toContain('Jane Doe');
        });
    });

    // =========================================================================
    // OUTBOUND MESSAGES
    // =========================================================================

    describe('Outbound messages', () => {
        test('dqTrackerReady signal is sent in HTML source', () => {
            const readyPattern = /type:\s*['"]dqTrackerReady['"]/;
            expect(readyPattern.test(htmlSource)).toBe(true);
        });

        test('getDQFiles is sent via sendToVelo', () => {
            expect(htmlSource).toContain("sendToVelo('getDQFiles'");
        });

        test('generateAuditReport is sent via sendToVelo', () => {
            expect(htmlSource).toContain("sendToVelo('generateAuditReport'");
        });

        test('navigateTo is sent via sidebar links', () => {
            const navPattern = /type:\s*['"]navigateTo['"]/;
            expect(navPattern.test(htmlSource)).toBe(true);
        });
    });

    // =========================================================================
    // DOM ELEMENT COVERAGE
    // =========================================================================

    describe('DOM element coverage', () => {
        test('HTML contains critical element IDs', () => {
            const criticalIds = [
                'driverList', 'detailView', 'searchInput',
                'totalDrivers', 'avgScore',
                'sidebar', 'sidebarCarrierName'
            ];
            criticalIds.forEach(id => {
                const hasId =
                    htmlSource.includes(`id="${id}"`) ||
                    htmlSource.includes(`id='${id}'`);
                expect(hasId).toBe(true);
            });
        });

        test('HTML contains sidebar navigation links', () => {
            const sidebarPages = [
                'dashboard', 'compliance-calendar', 'document-vault',
                'dq-tracker', 'csa-monitor', 'incident-reporting'
            ];
            sidebarPages.forEach(page => {
                expect(htmlSource).toContain(`data-page="${page}"`);
            });
        });

        test('HTML contains checklist CSS classes', () => {
            const classes = ['checklist-item', 'valid', 'missing', 'expired'];
            classes.forEach(cls => {
                expect(htmlSource).toContain(cls);
            });
        });

        test('HTML contains export functionality', () => {
            expect(htmlSource).toContain('exportAll');
            expect(htmlSource).toContain('text/csv');
        });

        test('HTML contains search input', () => {
            expect(htmlSource).toContain('Search drivers');
        });
    });

    // =========================================================================
    // SANITIZATION
    // =========================================================================

    describe('Sanitization', () => {
        test('source uses textContent for safe text rendering', () => {
            expect(htmlSource).toContain('textContent');
        });

        test('source uses toLowerCase for case-insensitive search', () => {
            expect(htmlSource).toContain('toLowerCase');
        });
    });
});
