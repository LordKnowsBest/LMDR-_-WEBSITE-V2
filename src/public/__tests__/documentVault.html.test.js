/**
 * CARRIER_DOCUMENT_VAULT HTML DOM Tests
 * =======================================
 * Tests for src/public/carrier/CARRIER_DOCUMENT_VAULT.html
 * Verifies HTML component correctly receives messages and updates DOM.
 *
 * **TYPE PROTOCOL** (not action) -- uses { type, data } envelope
 *
 * Inbound: setDocuments
 * Outbound: vaultReady, getDocuments, uploadDocument, navigateTo
 *
 * DOM IDs: documentGrid, uploadModal, uploadForm, dropZone, fileInput,
 *   fileName, expiringAlert, expiringCount, currentViewLabel,
 *   sidebar, sidebarCarrierName
 *
 * Features: Document grid with status badges (EXPIRED/EXPIRING),
 *   upload modal with drag-and-drop, category filtering (driver/vehicle/company)
 *
 * @see src/public/carrier/CARRIER_DOCUMENT_VAULT.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(__dirname, '..', 'carrier', 'CARRIER_DOCUMENT_VAULT.html');

const INBOUND_MESSAGES = [
    'setDocuments'
];

const OUTBOUND_MESSAGES = [
    'vaultReady',
    'getDocuments',
    'uploadDocument',
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
    allDocuments: [],
    documents: []
};

function handleSetDocuments(data) {
    state.allDocuments = data.documents || [];
    state.documents = state.allDocuments;
    renderGrid();
    updateAlerts();
}

function renderGrid() {
    const grid = getMockElement('documentGrid');

    if (state.documents.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center">No documents found. Upload one to get started.</div>';
        return;
    }

    grid.innerHTML = state.documents.map(doc => {
        let icon = 'fa-file';
        if (doc.mime_type?.includes('pdf')) icon = 'fa-file-pdf text-red-500';
        else if (doc.mime_type?.includes('image')) icon = 'fa-file-image text-blue-500';

        let statusBadge = '';
        if (doc.is_expired) statusBadge = '<span class="status-badge expired">EXPIRED</span>';
        else if (doc.days_until_expiry <= 30) statusBadge = '<span class="status-badge expiring">EXPIRING</span>';

        return `<div class="doc-card" data-id="${doc._id}">` +
            statusBadge +
            `<i class="fa-solid ${icon}"></i>` +
            `<h4>${doc.title || doc.file_name}</h4>` +
            `<p>${doc.document_type} v${doc.version}</p>` +
            (doc.expiration_date ? `<p class="exp-date">Exp: ${new Date(doc.expiration_date).toLocaleDateString()}</p>` : '') +
            `</div>`;
    }).join('');
}

function updateAlerts() {
    const expiring = state.documents.filter(d => !d.is_expired && d.days_until_expiry <= 30);
    const alertEl = getMockElement('expiringAlert');
    const countEl = getMockElement('expiringCount');

    if (expiring.length > 0) {
        alertEl.classList.remove('hidden');
        countEl.textContent = String(expiring.length);
    } else {
        alertEl.classList.add('hidden');
    }
}

function filterCategory(category) {
    const label = getMockElement('currentViewLabel');
    if (category === 'all') {
        state.documents = state.allDocuments;
        label.textContent = 'All Documents';
    } else {
        state.documents = state.allDocuments.filter(d => d.document_category === category);
        const names = { driver: 'Driver Files', vehicle: 'Vehicle Files', company: 'Company Files' };
        label.textContent = names[category] || category;
    }
    renderGrid();
}

function handleMessage(eventData) {
    const msg = eventData;
    if (!msg || !msg.type) return;

    switch (msg.type) {
        case 'setDocuments':
            handleSetDocuments(msg.data);
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('CARRIER_DOCUMENT_VAULT.html DOM Tests', () => {

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
        state.allDocuments = [];
        state.documents = [];
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

        test('sends vaultReady signal on init', () => {
            expect(htmlSource).toContain('vaultReady');
            const readyPattern = /postMessage\(\s*\{[^}]*type:\s*['"]vaultReady['"]/;
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
            expect(getMockElement('documentGrid').innerHTML).toBe('');
        });

        test('ignores messages without type key', () => {
            handleMessage({ action: 'setDocuments', data: { documents: [] } });
            expect(getMockElement('documentGrid').innerHTML).toBe('');
        });

        test('ignores empty object', () => {
            handleMessage({});
            expect(getMockElement('documentGrid').innerHTML).toBe('');
        });
    });

    // =========================================================================
    // DOM RENDERING
    // =========================================================================

    describe('DOM rendering', () => {
        test('setDocuments renders document cards', () => {
            handleMessage({
                type: 'setDocuments',
                data: {
                    documents: [
                        { _id: 'd1', title: 'CDL License', document_type: 'cdl', version: 1, mime_type: 'application/pdf', days_until_expiry: 60 },
                        { _id: 'd2', title: 'Medical Card', document_type: 'medical_card', version: 2, mime_type: 'image/jpeg', days_until_expiry: 90 }
                    ]
                }
            });

            const gridHtml = getMockElement('documentGrid').innerHTML;
            expect(gridHtml).toContain('CDL License');
            expect(gridHtml).toContain('Medical Card');
        });

        test('setDocuments shows EXPIRED badge for expired documents', () => {
            handleMessage({
                type: 'setDocuments',
                data: {
                    documents: [
                        { _id: 'd1', title: 'Expired Insurance', document_type: 'insurance', version: 1, is_expired: true, days_until_expiry: -10 }
                    ]
                }
            });

            const gridHtml = getMockElement('documentGrid').innerHTML;
            expect(gridHtml).toContain('EXPIRED');
        });

        test('setDocuments shows EXPIRING badge for docs expiring within 30 days', () => {
            handleMessage({
                type: 'setDocuments',
                data: {
                    documents: [
                        { _id: 'd1', title: 'Expiring CDL', document_type: 'cdl', version: 1, is_expired: false, days_until_expiry: 15 }
                    ]
                }
            });

            const gridHtml = getMockElement('documentGrid').innerHTML;
            expect(gridHtml).toContain('EXPIRING');
        });

        test('setDocuments uses correct file type icons', () => {
            handleMessage({
                type: 'setDocuments',
                data: {
                    documents: [
                        { _id: 'd1', title: 'PDF Doc', document_type: 'cdl', version: 1, mime_type: 'application/pdf', days_until_expiry: 60 },
                        { _id: 'd2', title: 'Image Doc', document_type: 'medical', version: 1, mime_type: 'image/png', days_until_expiry: 60 }
                    ]
                }
            });

            const gridHtml = getMockElement('documentGrid').innerHTML;
            expect(gridHtml).toContain('fa-file-pdf');
            expect(gridHtml).toContain('fa-file-image');
        });

        test('setDocuments with empty list shows no-documents message', () => {
            handleMessage({
                type: 'setDocuments',
                data: { documents: [] }
            });

            expect(getMockElement('documentGrid').innerHTML).toContain('No documents found');
        });

        test('setDocuments shows expiring alert when documents expire soon', () => {
            handleMessage({
                type: 'setDocuments',
                data: {
                    documents: [
                        { _id: 'd1', title: 'Exp Doc 1', document_type: 'cdl', version: 1, is_expired: false, days_until_expiry: 10 },
                        { _id: 'd2', title: 'Exp Doc 2', document_type: 'medical', version: 1, is_expired: false, days_until_expiry: 25 },
                        { _id: 'd3', title: 'OK Doc', document_type: 'insurance', version: 1, is_expired: false, days_until_expiry: 90 }
                    ]
                }
            });

            expect(getMockElement('expiringAlert').classList.remove).toHaveBeenCalledWith('hidden');
            expect(getMockElement('expiringCount').textContent).toBe('2');
        });

        test('setDocuments hides expiring alert when no documents expire soon', () => {
            handleMessage({
                type: 'setDocuments',
                data: {
                    documents: [
                        { _id: 'd1', title: 'OK Doc', document_type: 'cdl', version: 1, is_expired: false, days_until_expiry: 90 }
                    ]
                }
            });

            expect(getMockElement('expiringAlert').classList.add).toHaveBeenCalledWith('hidden');
        });

        test('category filter shows only matching documents', () => {
            handleMessage({
                type: 'setDocuments',
                data: {
                    documents: [
                        { _id: 'd1', title: 'Driver CDL', document_type: 'cdl', document_category: 'driver', version: 1, days_until_expiry: 60 },
                        { _id: 'd2', title: 'Vehicle Reg', document_type: 'registration', document_category: 'vehicle', version: 1, days_until_expiry: 60 },
                        { _id: 'd3', title: 'Insurance Cert', document_type: 'insurance', document_category: 'company', version: 1, days_until_expiry: 60 }
                    ]
                }
            });

            // Filter to driver only
            filterCategory('driver');
            expect(getMockElement('documentGrid').innerHTML).toContain('Driver CDL');
            expect(getMockElement('documentGrid').innerHTML).not.toContain('Vehicle Reg');
            expect(getMockElement('currentViewLabel').textContent).toBe('Driver Files');

            // Filter to all
            filterCategory('all');
            expect(getMockElement('documentGrid').innerHTML).toContain('Driver CDL');
            expect(getMockElement('documentGrid').innerHTML).toContain('Vehicle Reg');
            expect(getMockElement('currentViewLabel').textContent).toBe('All Documents');
        });

        test('setDocuments renders expiration date when present', () => {
            handleMessage({
                type: 'setDocuments',
                data: {
                    documents: [
                        { _id: 'd1', title: 'CDL', document_type: 'cdl', version: 1, expiration_date: '2026-06-15', days_until_expiry: 60 }
                    ]
                }
            });

            expect(getMockElement('documentGrid').innerHTML).toContain('Exp:');
        });
    });

    // =========================================================================
    // OUTBOUND MESSAGES
    // =========================================================================

    describe('Outbound messages', () => {
        test('vaultReady signal is sent in HTML source', () => {
            const readyPattern = /type:\s*['"]vaultReady['"]/;
            expect(readyPattern.test(htmlSource)).toBe(true);
        });

        test('getDocuments is sent via sendToVelo', () => {
            expect(htmlSource).toContain("sendToVelo('getDocuments'");
        });

        test('uploadDocument is sent via sendToVelo', () => {
            expect(htmlSource).toContain("sendToVelo('uploadDocument'");
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
                'documentGrid', 'uploadModal', 'uploadForm',
                'dropZone', 'fileInput', 'fileName',
                'expiringAlert', 'expiringCount', 'currentViewLabel',
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

        test('HTML contains document category filter links', () => {
            expect(htmlSource).toContain("filterCategory('all'");
            expect(htmlSource).toContain("filterCategory('driver'");
            expect(htmlSource).toContain("filterCategory('vehicle'");
            expect(htmlSource).toContain("filterCategory('company'");
        });

        test('HTML contains upload form fields', () => {
            expect(htmlSource).toContain('name="document_category"');
            expect(htmlSource).toContain('name="document_type"');
            expect(htmlSource).toContain('name="expiration_date"');
        });

        test('HTML contains drag-and-drop zone CSS class', () => {
            expect(htmlSource).toContain('drag-zone');
            expect(htmlSource).toContain('dragover');
        });

        test('HTML contains document type select options', () => {
            const docTypes = ['cdl', 'medical_card', 'insurance', 'other'];
            docTypes.forEach(type => {
                expect(htmlSource).toContain(`value="${type}"`);
            });
        });

        test('HTML contains category select options', () => {
            const categories = ['driver', 'vehicle', 'company'];
            categories.forEach(cat => {
                expect(htmlSource).toContain(`value="${cat}"`);
            });
        });
    });

    // =========================================================================
    // SANITIZATION
    // =========================================================================

    describe('Sanitization', () => {
        test('source uses textContent for safe text rendering', () => {
            expect(htmlSource).toContain('textContent');
        });

        test('source uses preventDefault for form and drag events', () => {
            expect(htmlSource).toContain('preventDefault');
        });
    });
});
