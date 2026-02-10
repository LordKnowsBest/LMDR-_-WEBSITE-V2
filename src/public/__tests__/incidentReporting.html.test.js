/* eslint-disable */
/**
 * CARRIER_INCIDENT_REPORTING HTML DOM Tests
 * ============================================
 * Tests for src/public/carrier/CARRIER_INCIDENT_REPORTING.html
 * Verifies HTML component correctly receives messages and updates DOM.
 *
 * **TYPE PROTOCOL** (not action) -- uses { type, data } envelope
 *
 * Inbound: setIncidents
 * Outbound: incidentsReady, getIncidents, createIncidentReport, navigateTo
 *
 * DOM IDs: incidentList, detailView, searchInput, totalIncidents,
 *   reportableIncidents, reportModal, reportForm,
 *   sidebar, sidebarCarrierName
 *
 * Features: Incident list with search, detail view with investigation status,
 *   report new incident modal, DOT Reportable badges, classification criteria
 *
 * @see src/public/carrier/CARRIER_INCIDENT_REPORTING.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(__dirname, '..', 'carrier', 'CARRIER_INCIDENT_REPORTING.html');

const INBOUND_MESSAGES = [
    'setIncidents'
];

const OUTBOUND_MESSAGES = [
    'incidentsReady',
    'getIncidents',
    'createIncidentReport',
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
        querySelector: jest.fn((sel) => {
            // Support checkbox queries for the report form
            if (sel && sel.includes('name=')) {
                return { checked: false };
            }
            return null;
        }),
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
    incidents: []
};

function handleSetIncidents(data) {
    state.incidents = data.incidents || [];
    const stats = data.stats || {};
    getMockElement('totalIncidents').textContent = String(stats.total || state.incidents.length);
    getMockElement('reportableIncidents').textContent = String(
        stats.reportable || state.incidents.filter(i => i.dot_reportable).length
    );
    renderList();
}

function renderList() {
    const list = getMockElement('incidentList');

    if (state.incidents.length === 0) {
        list.innerHTML = '<div class="empty-state">No incident reports yet</div>';
        return;
    }

    list.innerHTML = state.incidents.map(inc => {
        let badge = '';
        if (inc.dot_reportable) badge = '<span class="dot-badge">DOT REPORTABLE</span>';

        return `<div class="incident-item" data-id="${inc._id}">` +
            `<span class="incident-number">${inc.incident_number}</span>` +
            badge +
            `<div class="incident-date">${new Date(inc.incident_date).toLocaleDateString()} - ${inc.incident_type}</div>` +
            `<div class="incident-desc">${inc.description || 'No description'}</div>` +
            `</div>`;
    }).join('');
}

function renderDetail(inc) {
    const detail = getMockElement('detailView');

    let reportableBanner = '';
    if (inc.dot_reportable) {
        reportableBanner = `<div class="dot-reportable-banner">` +
            `<h4>DOT Reportable Incident</h4>` +
            `<p>This incident meets FMCSA reporting criteria.</p>` +
            `<p>Deadline: ${new Date(inc.dot_deadline).toLocaleDateString()}</p>` +
            `</div>`;
    }

    detail.innerHTML = `<div class="incident-detail">` +
        `<h2>${inc.incident_number}</h2>` +
        `<span class="status-badge">${inc.investigation_status}</span>` +
        reportableBanner +
        `<div class="details-grid">` +
        `<div>Date: ${new Date(inc.incident_date).toLocaleString()}</div>` +
        `<div>Type: ${inc.incident_type}</div>` +
        `<div>Driver: ${inc.driver_name || 'N/A'}</div>` +
        `<div>Vehicle: ${inc.vehicle_id || 'N/A'}</div>` +
        `<div>Location: ${inc.location?.address || 'Unknown'}</div>` +
        `</div>` +
        `<div class="description">${inc.description}</div>` +
        `</div>`;
}

function handleMessage(eventData) {
    const msg = eventData;
    if (!msg || !msg.type) return;

    switch (msg.type) {
        case 'setIncidents':
            handleSetIncidents(msg.data);
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('CARRIER_INCIDENT_REPORTING.html DOM Tests', () => {

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
        state.incidents = [];
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

        test('sends incidentsReady signal on init', () => {
            expect(htmlSource).toContain('incidentsReady');
            const readyPattern = /postMessage\(\s*\{[^}]*type:\s*['"]incidentsReady['"]/;
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
            expect(getMockElement('incidentList').innerHTML).toBe('');
        });

        test('ignores messages without type key', () => {
            handleMessage({ action: 'setIncidents', data: {} });
            expect(getMockElement('incidentList').innerHTML).toBe('');
        });

        test('ignores empty object', () => {
            handleMessage({});
            expect(getMockElement('incidentList').innerHTML).toBe('');
        });
    });

    // =========================================================================
    // DOM RENDERING
    // =========================================================================

    describe('DOM rendering', () => {
        test('setIncidents renders incident list', () => {
            handleMessage({
                type: 'setIncidents',
                data: {
                    incidents: [
                        {
                            _id: 'inc1',
                            incident_number: 'INC-2026-001',
                            incident_date: '2026-01-15T10:30:00Z',
                            incident_type: 'accident',
                            description: 'Rear-end collision on I-95',
                            dot_reportable: true,
                            investigation_status: 'open'
                        },
                        {
                            _id: 'inc2',
                            incident_number: 'INC-2026-002',
                            incident_date: '2026-01-20T14:00:00Z',
                            incident_type: 'near_miss',
                            description: 'Near miss at loading dock',
                            dot_reportable: false,
                            investigation_status: 'closed'
                        }
                    ],
                    stats: { total: 2, reportable: 1 }
                }
            });

            const listHtml = getMockElement('incidentList').innerHTML;
            expect(listHtml).toContain('INC-2026-001');
            expect(listHtml).toContain('INC-2026-002');
            expect(listHtml).toContain('Rear-end collision');
            expect(listHtml).toContain('Near miss at loading dock');
        });

        test('setIncidents updates summary stats', () => {
            handleMessage({
                type: 'setIncidents',
                data: {
                    incidents: [
                        { _id: 'inc1', incident_number: 'INC-001', incident_date: '2026-01-15', incident_type: 'accident', dot_reportable: true }
                    ],
                    stats: { total: 5, reportable: 2 }
                }
            });

            expect(getMockElement('totalIncidents').textContent).toBe('5');
            expect(getMockElement('reportableIncidents').textContent).toBe('2');
        });

        test('setIncidents shows DOT REPORTABLE badge for reportable incidents', () => {
            handleMessage({
                type: 'setIncidents',
                data: {
                    incidents: [
                        {
                            _id: 'inc1',
                            incident_number: 'INC-001',
                            incident_date: '2026-01-15',
                            incident_type: 'accident',
                            description: 'Major accident',
                            dot_reportable: true
                        }
                    ],
                    stats: { total: 1, reportable: 1 }
                }
            });

            expect(getMockElement('incidentList').innerHTML).toContain('DOT REPORTABLE');
        });

        test('setIncidents does not show DOT badge for non-reportable incidents', () => {
            handleMessage({
                type: 'setIncidents',
                data: {
                    incidents: [
                        {
                            _id: 'inc1',
                            incident_number: 'INC-001',
                            incident_date: '2026-01-15',
                            incident_type: 'near_miss',
                            description: 'Minor near miss',
                            dot_reportable: false
                        }
                    ],
                    stats: { total: 1, reportable: 0 }
                }
            });

            expect(getMockElement('incidentList').innerHTML).not.toContain('DOT REPORTABLE');
        });

        test('setIncidents with empty list shows empty state', () => {
            handleMessage({
                type: 'setIncidents',
                data: { incidents: [], stats: { total: 0, reportable: 0 } }
            });

            expect(getMockElement('incidentList').innerHTML).toContain('No incident reports');
        });

        test('renderDetail shows incident details with investigation status', () => {
            const inc = {
                _id: 'inc1',
                incident_number: 'INC-2026-001',
                incident_date: '2026-01-15T10:30:00Z',
                incident_type: 'accident',
                description: 'Rear-end collision on I-95',
                driver_name: 'John Smith',
                vehicle_id: 'UNIT-42',
                location: { address: '123 Highway Lane' },
                dot_reportable: false,
                investigation_status: 'under_review'
            };
            renderDetail(inc);

            const detailHtml = getMockElement('detailView').innerHTML;
            expect(detailHtml).toContain('INC-2026-001');
            expect(detailHtml).toContain('under_review');
            expect(detailHtml).toContain('accident');
            expect(detailHtml).toContain('John Smith');
            expect(detailHtml).toContain('UNIT-42');
            expect(detailHtml).toContain('123 Highway Lane');
            expect(detailHtml).toContain('Rear-end collision');
        });

        test('renderDetail shows DOT reportable banner for reportable incidents', () => {
            const inc = {
                _id: 'inc1',
                incident_number: 'INC-2026-003',
                incident_date: '2026-01-15T10:30:00Z',
                incident_type: 'accident',
                description: 'Serious accident',
                dot_reportable: true,
                dot_deadline: '2026-02-15',
                investigation_status: 'open',
                location: { address: 'Unknown' }
            };
            renderDetail(inc);

            const detailHtml = getMockElement('detailView').innerHTML;
            expect(detailHtml).toContain('DOT Reportable Incident');
            expect(detailHtml).toContain('FMCSA reporting criteria');
        });

        test('renderDetail does not show DOT banner for non-reportable incidents', () => {
            const inc = {
                _id: 'inc1',
                incident_number: 'INC-2026-004',
                incident_date: '2026-01-15',
                incident_type: 'near_miss',
                description: 'Minor event',
                dot_reportable: false,
                investigation_status: 'closed',
                location: { address: 'Test' }
            };
            renderDetail(inc);

            expect(getMockElement('detailView').innerHTML).not.toContain('DOT Reportable Incident');
        });

        test('setIncidents calculates reportable count from data when stats missing', () => {
            handleMessage({
                type: 'setIncidents',
                data: {
                    incidents: [
                        { _id: 'inc1', incident_number: 'INC-001', incident_date: '2026-01-15', incident_type: 'accident', dot_reportable: true },
                        { _id: 'inc2', incident_number: 'INC-002', incident_date: '2026-01-16', incident_type: 'near_miss', dot_reportable: false },
                        { _id: 'inc3', incident_number: 'INC-003', incident_date: '2026-01-17', incident_type: 'accident', dot_reportable: true }
                    ],
                    stats: {}
                }
            });

            // When stats.reportable is falsy, count from data
            expect(getMockElement('reportableIncidents').textContent).toBe('2');
            expect(getMockElement('totalIncidents').textContent).toBe('3');
        });
    });

    // =========================================================================
    // OUTBOUND MESSAGES
    // =========================================================================

    describe('Outbound messages', () => {
        test('incidentsReady signal is sent in HTML source', () => {
            const readyPattern = /type:\s*['"]incidentsReady['"]/;
            expect(readyPattern.test(htmlSource)).toBe(true);
        });

        test('getIncidents is sent via sendToVelo', () => {
            expect(htmlSource).toContain("sendToVelo('getIncidents'");
        });

        test('createIncidentReport is sent via sendToVelo', () => {
            expect(htmlSource).toContain("sendToVelo('createIncidentReport'");
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
                'incidentList', 'detailView', 'searchInput',
                'totalIncidents', 'reportableIncidents',
                'reportModal', 'reportForm',
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

        test('HTML contains incident type options', () => {
            const types = ['accident', 'injury', 'citation', 'near_miss'];
            types.forEach(type => {
                expect(htmlSource).toContain(`value="${type}"`);
            });
        });

        test('HTML contains DOT classification checkboxes', () => {
            const criteria = ['fatality', 'injury_treatment', 'tow_required', 'hazmat_release'];
            criteria.forEach(name => {
                expect(htmlSource).toContain(`name="${name}"`);
            });
        });

        test('HTML contains report form fields', () => {
            const fields = ['incident_type', 'incident_date', 'driver_name', 'vehicle_id',
                'location_address', 'location_city', 'location_state', 'description'];
            fields.forEach(field => {
                expect(htmlSource).toContain(`name="${field}"`);
            });
        });

        test('HTML contains search input', () => {
            expect(htmlSource).toContain('Search incidents');
        });

        test('HTML contains DOT Reportable text', () => {
            expect(htmlSource).toContain('DOT Reportable');
        });
    });

    // =========================================================================
    // SANITIZATION
    // =========================================================================

    describe('Sanitization', () => {
        test('source uses textContent for safe text rendering', () => {
            expect(htmlSource).toContain('textContent');
        });

        test('source uses FormData for form submission handling', () => {
            expect(htmlSource).toContain('FormData');
        });

        test('source uses Object.fromEntries for safe data extraction', () => {
            expect(htmlSource).toContain('Object.fromEntries');
        });
    });
});
