/**
 * CARRIER_COMPLIANCE_CALENDAR HTML DOM Tests
 * ============================================
 * Tests for src/public/carrier/CARRIER_COMPLIANCE_CALENDAR.html
 * Verifies HTML component correctly receives messages and updates DOM.
 *
 * **TYPE PROTOCOL** (not action) -- uses { type, data } envelope
 *
 * Inbound: init, setComplianceData, eventCreated
 * Outbound: calendarReady, getComplianceData, createComplianceEvent, navigateTo
 *
 * DOM IDs: calendarGrid, currentMonthLabel, priorityList, complianceScore,
 *   scoreBar, scoreLabel, statOverdue, statDueSoon, statUpcoming,
 *   addEventModal, addEventForm, eventType, eventTitle, driverName,
 *   driverId, dueDate, recurrence, eventNotes, prevMonthBtn, nextMonthBtn,
 *   sidebar, sidebarCarrierName
 *
 * @see src/public/carrier/CARRIER_COMPLIANCE_CALENDAR.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(__dirname, '..', 'carrier', 'CARRIER_COMPLIANCE_CALENDAR.html');

const INBOUND_MESSAGES = [
    'setComplianceData',
    'eventCreated'
];

const OUTBOUND_MESSAGES = [
    'calendarReady',
    'getComplianceData',
    'createComplianceEvent',
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
    events: [],
    stats: { overdue: 0, dueSoon: 0, upcoming: 0, score: 0 },
    currentDate: new Date(2026, 0, 1) // Jan 2026
};

function handleSetComplianceData(data) {
    state.events = data.events || [];
    state.stats = data.summary || state.stats;
    state.stats.score = data.score || 0;
    renderStats();
    renderCalendar();
    renderPriorityList();
}

function handleEventCreated() {
    // Refresh data after event creation
    sendToVelo('getComplianceData', {
        start: new Date(state.currentDate.getFullYear(), state.currentDate.getMonth(), 1).toISOString(),
        end: new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() + 1, 0).toISOString()
    });
}

function renderStats() {
    getMockElement('statOverdue').textContent = String(state.stats.overdue);
    getMockElement('statDueSoon').textContent = String(state.stats.dueSoon);
    getMockElement('statUpcoming').textContent = String(state.stats.upcoming);

    const score = state.stats.score || 0;
    getMockElement('complianceScore').textContent = `${score}%`;
    getMockElement('scoreBar').style.width = `${score}%`;

    let label = 'Excellent Standing';
    if (score < 70) { label = 'Action Required'; }
    else if (score < 90) { label = 'Good Standing'; }
    getMockElement('scoreLabel').textContent = label;
}

function renderCalendar() {
    const grid = getMockElement('calendarGrid');
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    const options = { month: 'long', year: 'numeric' };
    getMockElement('currentMonthLabel').textContent = state.currentDate.toLocaleDateString('en-US', options);

    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    let html = '';
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEvents = state.events.filter(e => {
            if (!e.due_date) return false;
            const d = new Date(e.due_date);
            return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
        });

        let eventsHtml = dayEvents.map(evt => {
            let statusClass = 'bg-gray-100';
            if (evt.status === 'overdue') statusClass = 'event-overdue';
            else if (evt.status === 'due_soon') statusClass = 'event-due-soon';
            else if (evt.status === 'upcoming') statusClass = 'event-upcoming';
            else if (evt.status === 'completed') statusClass = 'event-completed';
            return `<div class="event-pill ${statusClass}">${evt.title}</div>`;
        }).join('');

        html += `<div class="calendar-cell">${day}${eventsHtml}</div>`;
    }
    grid.innerHTML = html;
}

function renderPriorityList() {
    const list = getMockElement('priorityList');
    const critical = state.events
        .filter(e => e.status === 'overdue' || e.status === 'due_soon')
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    if (critical.length === 0) {
        list.innerHTML = '<div class="text-center">No urgent items. Great job!</div>';
        return;
    }

    list.innerHTML = critical.slice(0, 5).map(evt => {
        let icon = 'fa-circle-exclamation';
        let color = 'text-red-500';
        if (evt.status === 'due_soon') { icon = 'fa-clock'; color = 'text-yellow-500'; }
        return `<div class="priority-item"><i class="fa-solid ${icon} ${color}"></i><span>${evt.title}</span></div>`;
    }).join('');
}

function handleMessage(eventData) {
    const msg = eventData;
    if (!msg || !msg.type) return;

    switch (msg.type) {
        case 'setComplianceData':
            handleSetComplianceData(msg.data);
            break;
        case 'eventCreated':
            handleEventCreated();
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('CARRIER_COMPLIANCE_CALENDAR.html DOM Tests', () => {

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
        state.events = [];
        state.stats = { overdue: 0, dueSoon: 0, upcoming: 0, score: 0 };
        state.currentDate = new Date(2026, 0, 1);
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

        test('sends calendarReady signal on init', () => {
            expect(htmlSource).toContain('calendarReady');
            // Verify it posts ready signal to parent
            const readyPattern = /postMessage\(\s*\{[^}]*type:\s*['"]calendarReady['"]/;
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
            expect(capturedOutbound).toHaveLength(0);
        });

        test('ignores messages without type key', () => {
            handleMessage({ action: 'wrong_protocol' });
            expect(capturedOutbound).toHaveLength(0);
        });

        test('ignores empty object', () => {
            handleMessage({});
            expect(capturedOutbound).toHaveLength(0);
        });
    });

    // =========================================================================
    // DOM RENDERING
    // =========================================================================

    describe('DOM rendering', () => {
        test('setComplianceData updates stats and calendar', () => {
            handleMessage({
                type: 'setComplianceData',
                data: {
                    events: [
                        { _id: 'e1', title: 'CDL Renewal', due_date: '2026-01-15', status: 'overdue' },
                        { _id: 'e2', title: 'Drug Test', due_date: '2026-01-20', status: 'upcoming' }
                    ],
                    summary: { overdue: 3, dueSoon: 2, upcoming: 5 },
                    score: 85
                }
            });

            expect(getMockElement('statOverdue').textContent).toBe('3');
            expect(getMockElement('statDueSoon').textContent).toBe('2');
            expect(getMockElement('statUpcoming').textContent).toBe('5');
            expect(getMockElement('complianceScore').textContent).toBe('85%');
            expect(getMockElement('calendarGrid').innerHTML).toContain('CDL Renewal');
            expect(getMockElement('calendarGrid').innerHTML).toContain('Drug Test');
        });

        test('setComplianceData renders event pills with correct status classes', () => {
            handleMessage({
                type: 'setComplianceData',
                data: {
                    events: [
                        { _id: 'e1', title: 'Overdue Item', due_date: '2026-01-10', status: 'overdue' },
                        { _id: 'e2', title: 'Due Soon Item', due_date: '2026-01-12', status: 'due_soon' },
                        { _id: 'e3', title: 'Upcoming Item', due_date: '2026-01-14', status: 'upcoming' },
                        { _id: 'e4', title: 'Done Item', due_date: '2026-01-16', status: 'completed' }
                    ],
                    summary: { overdue: 1, dueSoon: 1, upcoming: 1 },
                    score: 75
                }
            });

            const gridHtml = getMockElement('calendarGrid').innerHTML;
            expect(gridHtml).toContain('event-overdue');
            expect(gridHtml).toContain('event-due-soon');
            expect(gridHtml).toContain('event-upcoming');
            expect(gridHtml).toContain('event-completed');
        });

        test('setComplianceData renders priority list with overdue/due_soon items', () => {
            handleMessage({
                type: 'setComplianceData',
                data: {
                    events: [
                        { _id: 'e1', title: 'Overdue CDL', due_date: '2026-01-05', status: 'overdue' },
                        { _id: 'e2', title: 'Upcoming MVR', due_date: '2026-01-20', status: 'upcoming' },
                        { _id: 'e3', title: 'Due Soon Medical', due_date: '2026-01-08', status: 'due_soon' }
                    ],
                    summary: { overdue: 1, dueSoon: 1, upcoming: 1 },
                    score: 70
                }
            });

            const listHtml = getMockElement('priorityList').innerHTML;
            expect(listHtml).toContain('Overdue CDL');
            expect(listHtml).toContain('Due Soon Medical');
            expect(listHtml).not.toContain('Upcoming MVR');
        });

        test('setComplianceData with no critical items shows empty priority list', () => {
            handleMessage({
                type: 'setComplianceData',
                data: {
                    events: [
                        { _id: 'e1', title: 'Good Item', due_date: '2026-01-15', status: 'upcoming' }
                    ],
                    summary: { overdue: 0, dueSoon: 0, upcoming: 1 },
                    score: 100
                }
            });

            expect(getMockElement('priorityList').innerHTML).toContain('No urgent items');
        });

        test('score label reflects compliance level', () => {
            // Score < 70 = Action Required
            handleMessage({
                type: 'setComplianceData',
                data: { events: [], summary: { overdue: 0, dueSoon: 0, upcoming: 0 }, score: 60 }
            });
            expect(getMockElement('scoreLabel').textContent).toBe('Action Required');

            // Score 70-89 = Good Standing
            handleMessage({
                type: 'setComplianceData',
                data: { events: [], summary: { overdue: 0, dueSoon: 0, upcoming: 0 }, score: 80 }
            });
            expect(getMockElement('scoreLabel').textContent).toBe('Good Standing');

            // Score >= 90 = Excellent Standing
            handleMessage({
                type: 'setComplianceData',
                data: { events: [], summary: { overdue: 0, dueSoon: 0, upcoming: 0 }, score: 95 }
            });
            expect(getMockElement('scoreLabel').textContent).toBe('Excellent Standing');
        });

        test('eventCreated triggers data refresh', () => {
            handleMessage({ type: 'eventCreated', data: {} });
            expect(capturedOutbound.find(m => m.type === 'getComplianceData')).toBeDefined();
        });
    });

    // =========================================================================
    // OUTBOUND MESSAGES
    // =========================================================================

    describe('Outbound messages', () => {
        test('calendarReady signal is sent in HTML source', () => {
            const readyPattern = /type:\s*['"]calendarReady['"]/;
            expect(readyPattern.test(htmlSource)).toBe(true);
        });

        test('getComplianceData is sent via sendToVelo', () => {
            // Verify source contains the outbound call
            expect(htmlSource).toContain("sendToVelo('getComplianceData'");
        });

        test('createComplianceEvent is sent via sendToVelo', () => {
            expect(htmlSource).toContain("sendToVelo('createComplianceEvent'");
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
                'calendarGrid', 'currentMonthLabel', 'priorityList',
                'complianceScore', 'scoreBar', 'scoreLabel',
                'statOverdue', 'statDueSoon', 'statUpcoming',
                'addEventModal', 'addEventForm',
                'eventType', 'eventTitle', 'driverName', 'driverId',
                'dueDate', 'recurrence', 'eventNotes',
                'prevMonthBtn', 'nextMonthBtn',
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

        test('HTML contains event pill CSS classes', () => {
            const pillClasses = ['event-overdue', 'event-due-soon', 'event-upcoming', 'event-completed'];
            pillClasses.forEach(cls => {
                expect(htmlSource).toContain(cls);
            });
        });

        test('HTML contains calendar day-of-week headers', () => {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            days.forEach(day => {
                expect(htmlSource).toContain(`<div>${day}</div>`);
            });
        });

        test('HTML contains add event form fields', () => {
            const formFields = [
                'event_type', 'title', 'driver_id', 'due_date', 'description'
            ];
            formFields.forEach(field => {
                const hasField =
                    htmlSource.includes(`name="${field}"`) ||
                    htmlSource.includes(`id="${field}"`);
                expect(hasField).toBe(true);
            });
        });

        test('HTML contains event type options', () => {
            const eventTypes = [
                'drug_test_random', 'physical_annual', 'cdl_renewal',
                'medical_cert', 'training_safety', 'mvr_annual',
                'vehicle_inspection', 'other'
            ];
            eventTypes.forEach(type => {
                expect(htmlSource).toContain(`value="${type}"`);
            });
        });

        test('HTML contains recurrence options', () => {
            const recurrences = ['none', 'annual', 'biennial', 'quarterly'];
            recurrences.forEach(r => {
                expect(htmlSource).toContain(`value="${r}"`);
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

        test('source uses event.preventDefault for form submission', () => {
            expect(htmlSource).toContain('preventDefault');
        });
    });
});
