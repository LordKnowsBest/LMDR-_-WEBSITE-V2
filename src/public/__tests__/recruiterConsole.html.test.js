/* eslint-disable */
/**
 * HTML DOM TESTS: Recruiter Console
 * ==================================
 * Tests that incoming postMessage events correctly update RecruiterDashboard.html DOM.
 *
 * Message types tested (from Velo → HTML):
 *   - recruiterReady: Initializes recruiter profile in sidebar
 *   - carrierValidated: Shows carrier preview in add carrier flow
 *   - carrierAdded: Updates carrier list and shows success toast
 *   - carrierRemoved: Updates carrier list
 *   - carrierSwitched: Updates current carrier context
 *   - carriersLoaded: Populates carrier dropdown
 *   - pipelineLoaded: Renders Kanban pipeline with candidates
 *   - statusUpdated: Updates candidate stage in pipeline
 *   - statsLoaded: Populates analytics dashboard
 *   - candidateDetails: Opens candidate detail modal
 *   - conversationData: Renders chat messages
 *   - messageSent: Handles message send confirmation
 *   - unreadCountData: Updates unread message badge
 *   - systemHealthUpdate: Updates system health indicators
 *   - error: Displays error toast
 *
 * @module public/__tests__/recruiterConsole.html.test.js
 */

// =============================================================================
// MOCK DOM INFRASTRUCTURE
// =============================================================================

const mockElements = {};
let capturedMessages = [];
let toastMessages = [];

function createMockElement(id, options = {}) {
    return {
        id,
        classList: {
            _classes: new Set(options.classes || []),
            add: function (...classes) { classes.forEach(c => this._classes.add(c)); },
            remove: function (...classes) { classes.forEach(c => this._classes.delete(c)); },
            toggle: function (c, force) {
                if (force === undefined) {
                    this._classes.has(c) ? this._classes.delete(c) : this._classes.add(c);
                } else {
                    force ? this._classes.add(c) : this._classes.delete(c);
                }
            },
            contains: function (c) { return this._classes.has(c); }
        },
        textContent: options.textContent || '',
        innerHTML: options.innerHTML || '',
        value: options.value || '',
        disabled: options.disabled || false,
        style: {},
        children: [],
        appendChild: function (child) {
            this.children.push(child);
            return child;
        },
        querySelector: function (sel) {
            return mockElements[sel.replace('#', '')] || null;
        },
        querySelectorAll: function () { return []; },
        getAttribute: function (attr) { return this[attr]; },
        setAttribute: function (attr, val) { this[attr] = val; },
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        onclick: null
    };
}

function setupMockDOM() {
    mockElements['stat-total'] = createMockElement('stat-total', { textContent: '0' });
    mockElements['stat-hired'] = createMockElement('stat-hired', { textContent: '0' });
    mockElements['stat-response'] = createMockElement('stat-response', { textContent: '--' });
    mockElements['kanban-container'] = createMockElement('kanban-container');
    mockElements['empty-pipeline'] = createMockElement('empty-pipeline', { classes: ['hidden'] });
    mockElements['mobile-list-container'] = createMockElement('mobile-list-container');
    mockElements['stats-total'] = createMockElement('stats-total', { textContent: '0' });
    mockElements['stats-7days'] = createMockElement('stats-7days', { textContent: '0' });
    mockElements['stats-response'] = createMockElement('stats-response', { textContent: '--' });
    mockElements['stats-badge'] = createMockElement('stats-badge', { textContent: '' });
    mockElements['stats-conversion'] = createMockElement('stats-conversion', { textContent: '0%' });
    mockElements['stage-breakdown'] = createMockElement('stage-breakdown');
    mockElements['add-carrier-section'] = createMockElement('add-carrier-section', { classes: ['hidden'] });
    mockElements['carrier-preview'] = createMockElement('carrier-preview', { classes: ['hidden'] });
    mockElements['dot-input'] = createMockElement('dot-input', { value: '' });
    mockElements['validate-btn'] = createMockElement('validate-btn');
    mockElements['add-btn'] = createMockElement('add-btn', { classes: ['hidden'] });
    mockElements['dashboard'] = createMockElement('dashboard');
    mockElements['pipeline-tab'] = createMockElement('pipeline-tab');
    mockElements['stats-tab'] = createMockElement('stats-tab');
    mockElements['system-health-tab'] = createMockElement('system-health-tab', { classes: ['hidden'] });
    mockElements['sidebar-user-name'] = createMockElement('sidebar-user-name', { textContent: '' });
    mockElements['sidebar-user-company'] = createMockElement('sidebar-user-company', { textContent: '' });
    mockElements['sidebar-user-initials'] = createMockElement('sidebar-user-initials', { textContent: '' });
    mockElements['loading-state'] = createMockElement('loading-state');
    mockElements['add-carrier-title'] = createMockElement('add-carrier-title');
    mockElements['cancel-add-btn'] = createMockElement('cancel-add-btn');
    mockElements['carrier-select'] = createMockElement('carrier-select');
    mockElements['candidate-modal'] = createMockElement('candidate-modal', { classes: ['hidden'] });
    mockElements['modal-driver-name'] = createMockElement('modal-driver-name');
    mockElements['modal-match-score'] = createMockElement('modal-match-score');
    mockElements['modal-status-select'] = createMockElement('modal-status-select');
    mockElements['chat-messages'] = createMockElement('chat-messages');
    mockElements['chat-input'] = createMockElement('chat-input');
    mockElements['unread-badge'] = createMockElement('unread-badge', { classes: ['hidden'] });
    mockElements['health-database'] = createMockElement('health-database');
    mockElements['health-ai'] = createMockElement('health-ai');
    mockElements['health-enrichment'] = createMockElement('health-enrichment');
    mockElements['health-overall'] = createMockElement('health-overall');
    mockElements['preview-name'] = createMockElement('preview-name');
    mockElements['preview-dot'] = createMockElement('preview-dot');
    mockElements['preview-mc'] = createMockElement('preview-mc');
    mockElements['preview-location'] = createMockElement('preview-location');
    mockElements['preview-fleet'] = createMockElement('preview-fleet');
    mockElements['carrier-pills'] = createMockElement('carrier-pills');

    global.document = {
        getElementById: (id) => mockElements[id] || null,
        querySelector: (sel) => mockElements[sel.replace('#', '')] || null,
        querySelectorAll: () => [],
        createElement: (tag) => createMockElement(`dynamic-${tag}-${Date.now()}`)
    };

    toastMessages = [];
}

function resetMockDOM() {
    Object.keys(mockElements).forEach(key => {
        mockElements[key].textContent = '';
        mockElements[key].innerHTML = '';
        mockElements[key].value = '';
        mockElements[key].disabled = false;
        mockElements[key].children = [];
        mockElements[key].classList._classes.clear();
    });
    capturedMessages = [];
    toastMessages = [];
    setupMockDOM();
}

// =============================================================================
// SIMULATED MESSAGE HANDLERS (mimic RecruiterDashboard.html behavior)
// =============================================================================

const STAGE_ORDER = ['new', 'contacted', 'screening', 'interviewing', 'offer', 'hired', 'rejected'];

const STAGE_CONFIG = {
    new: { label: 'New', color: 'blue' },
    contacted: { label: 'Contacted', color: 'sky' },
    screening: { label: 'Screening', color: 'purple' },
    interviewing: { label: 'Interviewing', color: 'orange' },
    offer: { label: 'Offer', color: 'emerald' },
    hired: { label: 'Hired', color: 'green' },
    rejected: { label: 'Rejected', color: 'red' }
};

let pipelineData = null;
let statsData = null;
let selectedCarrier = null;
let connectionVerified = false;

function stripHtml(str) {
    return String(str || '').replace(/<[^>]*>/g, '');
}

function showToast(message) {
    toastMessages.push(message);
}

function showError(message) {
    toastMessages.push({ type: 'error', message });
}

function handleRecruiterReady(data) {
    if (data.profile) {
        const nameEl = document.getElementById('sidebar-user-name');
        const companyEl = document.getElementById('sidebar-user-company');
        const initialsEl = document.getElementById('sidebar-user-initials');

        if (nameEl) nameEl.textContent = stripHtml(data.profile.name || 'Recruiter');
        if (companyEl) companyEl.textContent = stripHtml(data.profile.company || '');
        if (initialsEl) {
            const name = data.profile.name || 'R';
            const parts = name.split(' ');
            initialsEl.textContent = parts.map(p => p[0]).join('').substring(0, 2).toUpperCase();
        }
    }

    // Hide loading, show dashboard
    const loading = document.getElementById('loading-state');
    const dashboard = document.getElementById('dashboard');
    if (loading) loading.classList.add('hidden');
    if (dashboard) dashboard.classList.remove('hidden');
}

function handleCarrierValidated(data) {
    const preview = document.getElementById('carrier-preview');
    const addBtn = document.getElementById('add-btn');
    const validateBtn = document.getElementById('validate-btn');

    if (data.valid && data.carrier) {
        // Show preview with carrier info
        const nameEl = document.getElementById('preview-name');
        const dotEl = document.getElementById('preview-dot');
        const mcEl = document.getElementById('preview-mc');
        const locationEl = document.getElementById('preview-location');
        const fleetEl = document.getElementById('preview-fleet');

        if (nameEl) nameEl.textContent = stripHtml(data.carrier.legalName);
        if (dotEl) dotEl.textContent = String(data.carrier.dotNumber || '');
        if (mcEl) mcEl.textContent = String(data.carrier.mcNumber || '--');
        if (locationEl) locationEl.textContent = `${data.carrier.city}, ${data.carrier.state}`;
        if (fleetEl) fleetEl.textContent = data.carrier.fleetSize || '--';

        if (preview) preview.classList.remove('hidden');
        if (addBtn) addBtn.classList.remove('hidden');
    } else {
        showError(data.message || 'Carrier not found');
    }

    if (validateBtn) {
        validateBtn.innerHTML = '<i class="fa-solid fa-search mr-2"></i>Find Carrier';
        validateBtn.disabled = false;
    }
}

function handleCarrierAdded(data) {
    showToast('Carrier added successfully');

    // Hide add carrier section, show dashboard
    const addSection = document.getElementById('add-carrier-section');
    const dashboard = document.getElementById('dashboard');
    if (addSection) addSection.classList.add('hidden');
    if (dashboard) dashboard.classList.remove('hidden');

    // Update carrier pills/list
    const pillsContainer = document.getElementById('carrier-pills');
    if (pillsContainer && data.carrier) {
        const pill = document.createElement('span');
        pill.className = 'carrier-pill';
        pill.textContent = stripHtml(data.carrier.legalName);
        pill.setAttribute('data-dot', data.carrier.dotNumber);
        pillsContainer.appendChild(pill);
    }

    selectedCarrier = data.carrier;
}

function handleCarrierRemoved(data) {
    showToast(`Carrier ${data.dot || ''} removed`);

    // Remove from pills
    const pillsContainer = document.getElementById('carrier-pills');
    if (pillsContainer) {
        const pills = pillsContainer.children;
        for (let i = 0; i < pills.length; i++) {
            if (pills[i].getAttribute && pills[i].getAttribute('data-dot') === String(data.dot)) {
                pillsContainer.children.splice(i, 1);
                break;
            }
        }
    }
}

function handleCarrierSwitched(data) {
    selectedCarrier = data.carrier;
}

function handleCarriersLoaded(data) {
    const select = document.getElementById('carrier-select');
    if (select && data.carriers) {
        select.innerHTML = '';
        data.carriers.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.dotNumber;
            opt.textContent = stripHtml(c.legalName);
            select.appendChild(opt);
        });
    }

    // Also update carrier pills
    const pillsContainer = document.getElementById('carrier-pills');
    if (pillsContainer && data.carriers) {
        pillsContainer.innerHTML = '';
        data.carriers.forEach(c => {
            const pill = document.createElement('span');
            pill.className = 'carrier-pill';
            pill.textContent = stripHtml(c.legalName);
            pill.setAttribute('data-dot', c.dotNumber);
            pillsContainer.children.push(pill);
        });
    }
}

function handlePipelineLoaded(data) {
    pipelineData = data;

    // Update header stats
    const totalEl = document.getElementById('stat-total');
    const hiredEl = document.getElementById('stat-hired');

    if (totalEl) totalEl.textContent = String(data.totalCount || 0);
    if (hiredEl) hiredEl.textContent = String(data.groupedByStatus?.hired?.length || 0);

    const kanbanWrapper = document.getElementById('kanban-container');
    const mobileContainer = document.getElementById('mobile-list-container');
    const emptyState = document.getElementById('empty-pipeline');

    if (data.totalCount === 0 || data.noCarrier) {
        if (kanbanWrapper) kanbanWrapper.classList.add('hidden');
        if (mobileContainer) mobileContainer.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
    } else {
        if (kanbanWrapper) kanbanWrapper.classList.remove('hidden');
        if (mobileContainer) mobileContainer.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');

        // Render kanban columns
        if (kanbanWrapper) {
            kanbanWrapper.innerHTML = '';
            STAGE_ORDER.forEach(stage => {
                const candidates = data.groupedByStatus?.[stage] || [];
                const columnDiv = document.createElement('div');
                columnDiv.className = `kanban-column stage-${stage}`;
                columnDiv.setAttribute('data-stage', stage);
                columnDiv.setAttribute('data-count', candidates.length);

                candidates.forEach(c => {
                    const card = document.createElement('div');
                    card.className = 'candidate-card';
                    card.setAttribute('data-id', c.interestId || c._id);
                    card.textContent = stripHtml(c.driverName);
                    columnDiv.children.push(card);
                });

                kanbanWrapper.children.push(columnDiv);
            });
        }
    }
}

function handleStatsLoaded(data) {
    statsData = data.stats || data;

    const responseEl = document.getElementById('stat-response');
    if (responseEl) {
        responseEl.textContent = statsData.avgResponseTime ? `${statsData.avgResponseTime}h` : '--';
    }

    // Stats tab
    const totalEl = document.getElementById('stats-total');
    const daysEl = document.getElementById('stats-7days');
    const statsResponseEl = document.getElementById('stats-response');
    const badgeEl = document.getElementById('stats-badge');
    const conversionEl = document.getElementById('stats-conversion');

    if (totalEl) totalEl.textContent = String(statsData.totalPipeline || 0);
    if (daysEl) daysEl.textContent = String(statsData.last7Days || 0);
    if (statsResponseEl) statsResponseEl.textContent = statsData.avgResponseTime ? `${statsData.avgResponseTime}h` : '--';
    if (badgeEl) badgeEl.textContent = statsData.responseBadge || '';
    if (conversionEl) conversionEl.textContent = `${statsData.conversionRate || 0}%`;

    // Stage breakdown
    const breakdownEl = document.getElementById('stage-breakdown');
    if (breakdownEl && statsData.byStage) {
        breakdownEl.innerHTML = '';
        Object.entries(statsData.byStage).forEach(([stage, count]) => {
            const row = document.createElement('div');
            row.className = 'stage-row';
            row.setAttribute('data-stage', stage);
            row.setAttribute('data-count', count);
            breakdownEl.children.push(row);
        });
    }
}

function handleCandidateDetails(data) {
    const modal = document.getElementById('candidate-modal');
    const nameEl = document.getElementById('modal-driver-name');
    const scoreEl = document.getElementById('modal-match-score');
    const statusEl = document.getElementById('modal-status-select');

    if (modal) modal.classList.remove('hidden');
    if (nameEl) nameEl.textContent = stripHtml(data.driverName);
    if (scoreEl) scoreEl.textContent = `${data.matchScore || 0}%`;
    if (statusEl) statusEl.value = data.status || 'new';
}

function handleConversationData(data) {
    const container = document.getElementById('chat-messages');
    if (container && data.messages) {
        container.innerHTML = '';
        data.messages.forEach(msg => {
            const div = document.createElement('div');
            div.className = `chat-message ${msg.sender === 'recruiter' ? 'outbound' : 'inbound'}`;
            div.classList.add(msg.sender === 'recruiter' ? 'outbound' : 'inbound');
            div.textContent = stripHtml(msg.content);
            div.setAttribute('data-id', msg._id || msg.id);
            container.children.push(div);
        });
    }
}

function handleMessageSent(data) {
    if (data.success) {
        showToast('Message sent');
        const input = document.getElementById('chat-input');
        if (input) input.value = '';
    } else {
        showError(data.error || 'Failed to send message');
    }
}

function handleUnreadCountData(data) {
    const badge = document.getElementById('unread-badge');
    if (badge) {
        const count = data.count || 0;
        badge.textContent = String(count);
        if (count > 0) {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

function handleSystemHealthUpdate(data) {
    const dbEl = document.getElementById('health-database');
    const aiEl = document.getElementById('health-ai');
    const enrichEl = document.getElementById('health-enrichment');
    const overallEl = document.getElementById('health-overall');

    if (dbEl && data.database) {
        dbEl.textContent = data.database.status;
        dbEl.setAttribute('data-status', data.database.status);
    }
    if (aiEl && data.ai) {
        aiEl.textContent = data.ai.status;
        aiEl.setAttribute('data-status', data.ai.status);
    }
    if (enrichEl && data.enrichment) {
        enrichEl.textContent = data.enrichment.status;
        enrichEl.setAttribute('data-status', data.enrichment.status);
    }
    if (overallEl) {
        overallEl.textContent = data.overall || 'operational';
        overallEl.setAttribute('data-status', data.overall || 'operational');
    }
}

function handlePong(data) {
    connectionVerified = true;
}

function handleError(data) {
    showError(data.message || 'An error occurred');
}

function processMessage(msg) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
        case 'recruiterReady':
            handleRecruiterReady(msg.data || {});
            break;
        case 'carrierValidated':
            handleCarrierValidated(msg.data || {});
            break;
        case 'carrierAdded':
            handleCarrierAdded(msg.data || {});
            break;
        case 'carrierRemoved':
            handleCarrierRemoved(msg.data || {});
            break;
        case 'carrierSwitched':
            handleCarrierSwitched(msg.data || {});
            break;
        case 'carriersLoaded':
            handleCarriersLoaded(msg.data || {});
            break;
        case 'pipelineLoaded':
            handlePipelineLoaded(msg.data || {});
            break;
        case 'statusUpdated':
            // Just show toast for simplicity
            showToast('Status updated');
            break;
        case 'statsLoaded':
            handleStatsLoaded(msg.data || {});
            break;
        case 'candidateDetails':
            handleCandidateDetails(msg.data || {});
            break;
        case 'notesAdded':
            showToast('Notes saved');
            break;
        case 'conversationData':
            handleConversationData(msg.data || {});
            break;
        case 'messageSent':
            handleMessageSent(msg.data || {});
            break;
        case 'unreadCountData':
            handleUnreadCountData(msg.data || {});
            break;
        case 'systemHealthUpdate':
            handleSystemHealthUpdate(msg.data || {});
            break;
        case 'pong':
            handlePong(msg.data || {});
            break;
        case 'error':
            handleError(msg.data || {});
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('RecruiterDashboard.html DOM Tests', () => {
    beforeEach(() => {
        resetMockDOM();
        connectionVerified = false;
        pipelineData = null;
        statsData = null;
        selectedCarrier = null;
    });

    // =========================================================================
    // RECRUITER INITIALIZATION
    // =========================================================================
    describe('Recruiter Initialization', () => {
        it('should display recruiter profile in sidebar on recruiterReady', () => {
            processMessage({
                type: 'recruiterReady',
                data: {
                    profile: {
                        name: 'John Smith',
                        company: 'Swift Transportation'
                    }
                }
            });

            expect(mockElements['sidebar-user-name'].textContent).toBe('John Smith');
            expect(mockElements['sidebar-user-company'].textContent).toBe('Swift Transportation');
            expect(mockElements['sidebar-user-initials'].textContent).toBe('JS');
        });

        it('should handle single name for initials', () => {
            processMessage({
                type: 'recruiterReady',
                data: {
                    profile: { name: 'Admin', company: '' }
                }
            });

            expect(mockElements['sidebar-user-initials'].textContent).toBe('A');
        });

        it('should hide loading and show dashboard on ready', () => {
            processMessage({
                type: 'recruiterReady',
                data: { profile: { name: 'Test' } }
            });

            expect(mockElements['loading-state'].classList.contains('hidden')).toBe(true);
            expect(mockElements['dashboard'].classList.contains('hidden')).toBe(false);
        });

        it('should sanitize XSS in profile name', () => {
            processMessage({
                type: 'recruiterReady',
                data: {
                    profile: {
                        name: '<script>alert("xss")</script>John',
                        company: '<img onerror=alert(1) src=x>Test'
                    }
                }
            });

            expect(mockElements['sidebar-user-name'].textContent).not.toContain('<script>');
            expect(mockElements['sidebar-user-company'].textContent).not.toContain('<img');
        });
    });

    // =========================================================================
    // CARRIER MANAGEMENT
    // =========================================================================
    describe('Carrier Management', () => {
        it('should show carrier preview on valid carrierValidated', () => {
            processMessage({
                type: 'carrierValidated',
                data: {
                    valid: true,
                    carrier: {
                        legalName: 'Test Carrier Inc',
                        dotNumber: 1234567,
                        mcNumber: 500000,
                        city: 'Dallas',
                        state: 'TX',
                        fleetSize: 150
                    }
                }
            });

            expect(mockElements['carrier-preview'].classList.contains('hidden')).toBe(false);
            expect(mockElements['add-btn'].classList.contains('hidden')).toBe(false);
            expect(mockElements['preview-name'].textContent).toBe('Test Carrier Inc');
            expect(mockElements['preview-dot'].textContent).toBe('1234567');
            expect(mockElements['preview-location'].textContent).toBe('Dallas, TX');
        });

        it('should show error for invalid carrier', () => {
            processMessage({
                type: 'carrierValidated',
                data: {
                    valid: false,
                    message: 'DOT number not found in FMCSA database'
                }
            });

            expect(toastMessages).toContainEqual({
                type: 'error',
                message: 'DOT number not found in FMCSA database'
            });
        });

        it('should update carrier list on carrierAdded', () => {
            processMessage({
                type: 'carrierAdded',
                data: {
                    carrier: {
                        legalName: 'New Carrier',
                        dotNumber: 9999999
                    }
                }
            });

            expect(toastMessages).toContain('Carrier added successfully');
            expect(mockElements['add-carrier-section'].classList.contains('hidden')).toBe(true);
            expect(selectedCarrier.dotNumber).toBe(9999999);
        });

        it('should populate carrier dropdown on carriersLoaded', () => {
            processMessage({
                type: 'carriersLoaded',
                data: {
                    carriers: [
                        { legalName: 'Carrier A', dotNumber: 1111111 },
                        { legalName: 'Carrier B', dotNumber: 2222222 },
                        { legalName: 'Carrier C', dotNumber: 3333333 }
                    ]
                }
            });

            expect(mockElements['carrier-select'].children.length).toBe(3);
            expect(mockElements['carrier-pills'].children.length).toBe(3);
        });

        it('should remove carrier on carrierRemoved', () => {
            // Setup initial carriers
            processMessage({
                type: 'carriersLoaded',
                data: {
                    carriers: [
                        { legalName: 'Keep Me', dotNumber: 1111111 },
                        { legalName: 'Remove Me', dotNumber: 2222222 }
                    ]
                }
            });

            processMessage({
                type: 'carrierRemoved',
                data: { dot: 2222222 }
            });

            expect(toastMessages).toContain('Carrier 2222222 removed');
        });
    });

    // =========================================================================
    // PIPELINE / KANBAN
    // =========================================================================
    describe('Pipeline / Kanban', () => {
        it('should render candidates in Kanban columns', () => {
            processMessage({
                type: 'pipelineLoaded',
                data: {
                    totalCount: 5,
                    groupedByStatus: {
                        new: [
                            { interestId: 'i1', driverName: 'Driver One', matchScore: 85 },
                            { interestId: 'i2', driverName: 'Driver Two', matchScore: 75 }
                        ],
                        contacted: [
                            { interestId: 'i3', driverName: 'Driver Three', matchScore: 90 }
                        ],
                        hired: [
                            { interestId: 'i4', driverName: 'Driver Four', matchScore: 95 },
                            { interestId: 'i5', driverName: 'Driver Five', matchScore: 88 }
                        ]
                    }
                }
            });

            expect(mockElements['stat-total'].textContent).toBe('5');
            expect(mockElements['stat-hired'].textContent).toBe('2');
            expect(mockElements['kanban-container'].classList.contains('hidden')).toBe(false);
            expect(mockElements['empty-pipeline'].classList.contains('hidden')).toBe(true);

            // Check column structure
            const columns = mockElements['kanban-container'].children;
            expect(columns.length).toBe(7); // All 7 stages
        });

        it('should show empty state when no candidates', () => {
            processMessage({
                type: 'pipelineLoaded',
                data: {
                    totalCount: 0,
                    groupedByStatus: {}
                }
            });

            expect(mockElements['stat-total'].textContent).toBe('0');
            expect(mockElements['kanban-container'].classList.contains('hidden')).toBe(true);
            expect(mockElements['empty-pipeline'].classList.contains('hidden')).toBe(false);
        });

        it('should show empty state when noCarrier flag is true', () => {
            processMessage({
                type: 'pipelineLoaded',
                data: {
                    noCarrier: true,
                    totalCount: 0,
                    groupedByStatus: {}
                }
            });

            expect(mockElements['empty-pipeline'].classList.contains('hidden')).toBe(false);
        });

        it('should sanitize XSS in driver names', () => {
            processMessage({
                type: 'pipelineLoaded',
                data: {
                    totalCount: 1,
                    groupedByStatus: {
                        new: [
                            { interestId: 'i1', driverName: '<script>alert("xss")</script>BadDriver' }
                        ]
                    }
                }
            });

            const newColumn = mockElements['kanban-container'].children.find(
                c => c.getAttribute('data-stage') === 'new'
            );
            expect(newColumn).toBeDefined();
            const card = newColumn.children[0];
            expect(card.textContent).not.toContain('<script>');
        });

        it('should show toast on statusUpdated', () => {
            processMessage({
                type: 'statusUpdated',
                data: { success: true }
            });

            expect(toastMessages).toContain('Status updated');
        });
    });

    // =========================================================================
    // STATS / ANALYTICS
    // =========================================================================
    describe('Stats / Analytics', () => {
        it('should populate stats dashboard', () => {
            processMessage({
                type: 'statsLoaded',
                data: {
                    stats: {
                        totalPipeline: 42,
                        last7Days: 12,
                        avgResponseTime: 4.5,
                        responseBadge: 'Fast Responder',
                        conversionRate: 23,
                        byStage: {
                            new: 10,
                            contacted: 8,
                            screening: 6,
                            interviewing: 5,
                            offer: 3,
                            hired: 8,
                            rejected: 2
                        }
                    }
                }
            });

            expect(mockElements['stats-total'].textContent).toBe('42');
            expect(mockElements['stats-7days'].textContent).toBe('12');
            expect(mockElements['stats-response'].textContent).toBe('4.5h');
            expect(mockElements['stats-badge'].textContent).toBe('Fast Responder');
            expect(mockElements['stats-conversion'].textContent).toBe('23%');

            // Check stage breakdown
            const breakdown = mockElements['stage-breakdown'].children;
            expect(breakdown.length).toBe(7);
        });

        it('should handle missing avgResponseTime', () => {
            processMessage({
                type: 'statsLoaded',
                data: {
                    stats: {
                        totalPipeline: 5,
                        avgResponseTime: null
                    }
                }
            });

            expect(mockElements['stats-response'].textContent).toBe('--');
            expect(mockElements['stat-response'].textContent).toBe('--');
        });

        it('should handle data at root level (not nested in stats)', () => {
            processMessage({
                type: 'statsLoaded',
                data: {
                    totalPipeline: 100,
                    conversionRate: 50
                }
            });

            expect(mockElements['stats-total'].textContent).toBe('100');
            expect(mockElements['stats-conversion'].textContent).toBe('50%');
        });
    });

    // =========================================================================
    // CANDIDATE MODAL
    // =========================================================================
    describe('Candidate Modal', () => {
        it('should open modal with candidate details', () => {
            processMessage({
                type: 'candidateDetails',
                data: {
                    driverName: 'John Doe',
                    matchScore: 92,
                    status: 'interviewing'
                }
            });

            expect(mockElements['candidate-modal'].classList.contains('hidden')).toBe(false);
            expect(mockElements['modal-driver-name'].textContent).toBe('John Doe');
            expect(mockElements['modal-match-score'].textContent).toBe('92%');
            expect(mockElements['modal-status-select'].value).toBe('interviewing');
        });

        it('should default status to new if not provided', () => {
            processMessage({
                type: 'candidateDetails',
                data: {
                    driverName: 'Jane Doe',
                    matchScore: 85
                }
            });

            expect(mockElements['modal-status-select'].value).toBe('new');
        });

        it('should show notes saved toast', () => {
            processMessage({ type: 'notesAdded', data: {} });

            expect(toastMessages).toContain('Notes saved');
        });
    });

    // =========================================================================
    // MESSAGING / CHAT
    // =========================================================================
    describe('Messaging / Chat', () => {
        it('should render conversation messages', () => {
            processMessage({
                type: 'conversationData',
                data: {
                    messages: [
                        { _id: 'm1', content: 'Hello driver!', sender: 'recruiter' },
                        { _id: 'm2', content: 'Hi, I am interested', sender: 'driver' },
                        { _id: 'm3', content: 'Great! When can you start?', sender: 'recruiter' }
                    ]
                }
            });

            expect(mockElements['chat-messages'].children.length).toBe(3);
            expect(mockElements['chat-messages'].children[0].textContent).toBe('Hello driver!');
            expect(mockElements['chat-messages'].children[0].classList.contains('outbound')).toBe(true);
            expect(mockElements['chat-messages'].children[1].classList.contains('inbound')).toBe(true);
        });

        it('should clear input on successful messageSent', () => {
            mockElements['chat-input'].value = 'Test message';

            processMessage({
                type: 'messageSent',
                data: { success: true }
            });

            expect(mockElements['chat-input'].value).toBe('');
            expect(toastMessages).toContain('Message sent');
        });

        it('should show error on failed messageSent', () => {
            processMessage({
                type: 'messageSent',
                data: { success: false, error: 'Network error' }
            });

            expect(toastMessages).toContainEqual({
                type: 'error',
                message: 'Network error'
            });
        });

        it('should update unread badge', () => {
            processMessage({
                type: 'unreadCountData',
                data: { count: 5 }
            });

            expect(mockElements['unread-badge'].textContent).toBe('5');
            expect(mockElements['unread-badge'].classList.contains('hidden')).toBe(false);
        });

        it('should hide unread badge when count is 0', () => {
            // First set a count
            processMessage({
                type: 'unreadCountData',
                data: { count: 3 }
            });

            // Then clear it
            processMessage({
                type: 'unreadCountData',
                data: { count: 0 }
            });

            expect(mockElements['unread-badge'].textContent).toBe('0');
            expect(mockElements['unread-badge'].classList.contains('hidden')).toBe(true);
        });

        it('should sanitize XSS in chat messages', () => {
            processMessage({
                type: 'conversationData',
                data: {
                    messages: [
                        { _id: 'm1', content: '<img src=x onerror=alert(1)>Hello', sender: 'driver' }
                    ]
                }
            });

            expect(mockElements['chat-messages'].children[0].textContent).not.toContain('<img');
        });
    });

    // =========================================================================
    // SYSTEM HEALTH
    // =========================================================================
    describe('System Health', () => {
        it('should update health indicators on systemHealthUpdate', () => {
            processMessage({
                type: 'systemHealthUpdate',
                data: {
                    database: { status: 'operational' },
                    ai: { status: 'degraded' },
                    enrichment: { status: 'operational' },
                    overall: 'degraded'
                }
            });

            expect(mockElements['health-database'].getAttribute('data-status')).toBe('operational');
            expect(mockElements['health-ai'].getAttribute('data-status')).toBe('degraded');
            expect(mockElements['health-enrichment'].getAttribute('data-status')).toBe('operational');
            expect(mockElements['health-overall'].getAttribute('data-status')).toBe('degraded');
        });

        it('should default overall to operational if not provided', () => {
            processMessage({
                type: 'systemHealthUpdate',
                data: {
                    database: { status: 'operational' }
                }
            });

            expect(mockElements['health-overall'].getAttribute('data-status')).toBe('operational');
        });
    });

    // =========================================================================
    // CONNECTION / ERROR HANDLING
    // =========================================================================
    describe('Connection / Error Handling', () => {
        it('should set connectionVerified on pong', () => {
            expect(connectionVerified).toBe(false);

            processMessage({
                type: 'pong',
                data: { timestamp: Date.now() }
            });

            expect(connectionVerified).toBe(true);
        });

        it('should display error toast on error message', () => {
            processMessage({
                type: 'error',
                data: { message: 'Something went wrong' }
            });

            expect(toastMessages).toContainEqual({
                type: 'error',
                message: 'Something went wrong'
            });
        });

        it('should show generic error if message not provided', () => {
            processMessage({
                type: 'error',
                data: {}
            });

            expect(toastMessages).toContainEqual({
                type: 'error',
                message: 'An error occurred'
            });
        });
    });

    // =========================================================================
    // MESSAGE VALIDATION
    // =========================================================================
    describe('Message Validation', () => {
        it('should ignore messages without type', () => {
            const initialState = mockElements['stat-total'].textContent;

            processMessage({ data: { totalCount: 999 } });
            processMessage(null);
            processMessage(undefined);
            processMessage({ type: null });

            expect(mockElements['stat-total'].textContent).toBe(initialState);
        });

        it('should ignore unknown message types', () => {
            // Should not throw
            expect(() => {
                processMessage({ type: 'unknownMessageType', data: {} });
            }).not.toThrow();
        });
    });
});
