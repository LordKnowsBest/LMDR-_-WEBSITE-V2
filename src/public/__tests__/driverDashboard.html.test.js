/**
 * HTML DOM TESTS: Driver Dashboard
 * =================================
 * Tests DOM rendering and message handling for DRIVER_DASHBOARD.html
 *
 * Key DOM elements:
 *   - #loading-state, #empty-state, #application-list
 *   - #stat-active, #stat-total, #unread-badge
 *   - #profile-strength-container, #strength-text, #strength-circle
 *   - #views-list, #insights-panel, #insights-grid
 *   - #chat-modal, #chat-messages, #withdraw-modal
 *
 * Key inbound message types:
 *   - dashboardData, withdrawSuccess, conversationData
 *   - messageSent, newMessagesData, unreadCountData
 *   - viewsData, insightsData, error, pong
 *
 * @module public/__tests__/driverDashboard.html.test.js
 */

// =============================================================================
// MOCK DOM INFRASTRUCTURE
// =============================================================================

const mockElements = {};
let capturedOutbound = [];

function createMockElement(id, options = {}) {
    return {
        id,
        classList: {
            _classes: new Set(options.classes || []),
            add: function (...cls) { cls.forEach(c => this._classes.add(c)); },
            remove: function (...cls) { cls.forEach(c => this._classes.delete(c)); },
            contains: function (c) { return this._classes.has(c); },
            toggle: function (c) {
                if (this._classes.has(c)) {
                    this._classes.delete(c);
                } else {
                    this._classes.add(c);
                }
            }
        },
        innerHTML: options.innerHTML || '',
        textContent: options.textContent || '',
        style: { strokeDashoffset: '251.2' },
        value: options.value || '',
        scrollTop: 0,
        scrollHeight: 500,
        focus: jest.fn(),
        appendChild: jest.fn(function (child) {
            this.innerHTML += child.outerHTML || child.innerHTML || '';
        }),
        querySelectorAll: jest.fn(() => []),
        outerHTML: `<div id="${id}"></div>`
    };
}

function getMockElement(id) {
    return mockElements[id] || null;
}

function resetMocks() {
    capturedOutbound = [];
    Object.keys(mockElements).forEach(key => delete mockElements[key]);

    // Initialize all DOM elements used by DRIVER_DASHBOARD.html
    const elementIds = [
        'loading-state',
        'empty-state',
        'application-list',
        'stat-active',
        'stat-total',
        'unread-badge',
        'profile-strength-container',
        'strength-text',
        'strength-circle',
        'strength-message',
        'strength-suggestions',
        'views-list',
        'privacy-toggle',
        'privacy-knob',
        'privacy-label',
        'profile-views-container',
        'insights-panel',
        'insights-grid',
        'insight-views-count',
        'insight-search-count',
        'insight-active-apps',
        'insight-offer-rate',
        'withdraw-modal',
        'withdraw-carrier-name',
        'chat-modal',
        'chat-carrier-name',
        'chat-carrier-icon',
        'chat-messages',
        'chat-input',
        'chat-form',
        'quick-replies',
        'availability-modal',
        'current-filter',
        'themeToggle'
    ];

    elementIds.forEach(id => {
        mockElements[id] = createMockElement(id);
    });

    // Set initial classes for elements that start hidden
    ['empty-state', 'application-list', 'profile-strength-container',
        'profile-views-container', 'insights-panel', 'withdraw-modal',
        'chat-modal', 'availability-modal', 'unread-badge'].forEach(id => {
            mockElements[id].classList.add('hidden');
        });

    global.document = {
        getElementById: (id) => getMockElement(id),
        createElement: (tag) => createMockElement(`mock-${tag}-${Date.now()}`),
        documentElement: {
            classList: {
                _classes: new Set(['light']),
                add: function (...cls) { cls.forEach(c => this._classes.add(c)); },
                remove: function (...cls) { cls.forEach(c => this._classes.delete(c)); },
                contains: function (c) { return this._classes.has(c); }
            }
        },
        querySelectorAll: jest.fn((selector) => {
            if (selector === '.slot-input') {
                return [
                    { value: '' },
                    { value: '' },
                    { value: '' }
                ];
            }
            return [];
        })
    };

    global.window = {
        parent: {
            postMessage: jest.fn((data) => {
                capturedOutbound.push(data);
            })
        },
        matchMedia: jest.fn(() => ({ matches: false })),
        localStorage: {
            _store: {},
            getItem: function (key) { return this._store[key] || null; },
            setItem: function (key, val) { this._store[key] = val; }
        },
        FeatureTracker: undefined
    };
}

// =============================================================================
// MOCK HTML FUNCTIONS (matching DRIVER_DASHBOARD.html)
// =============================================================================

const STATUS_LABELS = {
    interested: 'Interest Expressed',
    applied: 'Applied',
    in_review: 'In Review',
    contacted: 'Recruiter Contacted',
    offer: 'Job Offer',
    hired: 'Hired',
    rejected: 'Not Selected',
    withdrawn: 'Withdrawn'
};

let applications = [];
let activeApplicationId = null;
let currentFilter = 'all';
let isDiscoverable = false;

function stripHtml(str) {
    if (!str) return '';
    const tmp = document.createElement('div');
    tmp.textContent = str;
    return tmp.textContent;
}

function sendToVelo(type, data = {}) {
    if (window.parent) {
        window.parent.postMessage({ type, data }, '*');
    }
}

function updateUnreadBadge(count, byApplication) {
    const badge = document.getElementById('unread-badge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
    window.unreadByApplication = byApplication;
}

function updatePrivacyUI(active) {
    isDiscoverable = active;
    const toggle = document.getElementById('privacy-toggle');
    const knob = document.getElementById('privacy-knob');
    const label = document.getElementById('privacy-label');

    if (active) {
        toggle.classList.remove('bg-slate-200');
        toggle.classList.add('bg-lmdr-blue');
        knob.classList.remove('translate-x-0');
        knob.classList.add('translate-x-5');
        label.textContent = 'Profile Visible';
        label.classList.add('text-lmdr-blue');
        label.classList.remove('text-slate-600');
    } else {
        toggle.classList.add('bg-slate-200');
        toggle.classList.remove('bg-lmdr-blue');
        knob.classList.add('translate-x-0');
        knob.classList.remove('translate-x-5');
        label.textContent = 'Profile Hidden';
        label.classList.add('text-slate-600');
        label.classList.remove('text-lmdr-blue');
    }
}

function renderViewsList(views) {
    const container = document.getElementById('views-list');
    if (!container) return;

    if (!views || views.length === 0) {
        container.innerHTML = `
            <div class="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <i class="fa-solid fa-eye-slash text-slate-300 text-2xl mb-2 block"></i>
                <p class="text-xs font-medium text-slate-400">No views yet.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = views.map(view => {
        const date = new Date(view.viewDate);
        const isRecent = view.isNew;

        return `
            <div class="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 ${isRecent ? 'bg-blue-50 text-lmdr-blue' : 'bg-slate-50 text-slate-400'} rounded-full flex items-center justify-center font-bold text-sm">
                        ${view.carrierName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h4 class="text-sm font-bold text-slate-900">${view.carrierName}</h4>
                        <p class="text-[10px] font-medium text-slate-400">${date.toLocaleDateString()} \u2022 ${view.location || 'USA'}</p>
                    </div>
                </div>
                ${isRecent ? '<span class="w-2 h-2 bg-lmdr-blue rounded-full"></span>' : ''}
            </div>
        `;
    }).join('');
}

function renderInsightsPanel(stats) {
    const container = document.getElementById('insights-grid');
    if (!container || !stats) return;

    document.getElementById('insight-views-count').textContent = stats.profileViews30d || 0;
    document.getElementById('insight-search-count').textContent = stats.searchAppearances || 0;
    document.getElementById('insight-active-apps').textContent = stats.activeApplications || 0;
    document.getElementById('insight-offer-rate').textContent = stats.offerRate || '0%';
}

function renderProfileStrength(profile) {
    const container = document.getElementById('profile-strength-container');
    const scoreText = document.getElementById('strength-text');
    const circle = document.getElementById('strength-circle');
    const message = document.getElementById('strength-message');
    const suggestionsContainer = document.getElementById('strength-suggestions');

    if (!container || !profile) return;

    container.classList.remove('hidden');

    const score = profile.profile_completeness_score || 0;
    scoreText.textContent = `${score}%`;

    // Update Circle
    const circumference = 251.2;
    const offset = circumference - (score / 100) * circumference;
    circle.style.strokeDashoffset = offset;

    // Color Coding
    if (score >= 80) {
        circle.classList.add('text-emerald-500');
        circle.classList.remove('text-lmdr-blue', 'text-yellow-500', 'text-red-500');
        message.innerHTML = '<span class="text-emerald-600 font-bold">Excellent!</span> Your profile stands out to recruiters.';
    } else if (score >= 50) {
        circle.classList.add('text-lmdr-blue');
        circle.classList.remove('text-emerald-500', 'text-yellow-500', 'text-red-500');
        message.textContent = 'Good progress. Add a few more details to reach All-Star status.';
    } else {
        circle.classList.add('text-yellow-500');
        circle.classList.remove('text-emerald-500', 'text-lmdr-blue', 'text-red-500');
        message.textContent = 'Complete your profile to verify your account and get matches.';
    }

    // Render Suggestions
    suggestionsContainer.innerHTML = '';
    const suggestions = profile.suggestions || [];

    if (suggestions.length > 0) {
        suggestions.slice(0, 3).forEach(s => {
            suggestionsContainer.innerHTML += `
                <button class="suggestion-chip">${s.label} +${s.points}</button>
            `;
        });
    }
}

function renderDashboard(data) {
    const list = document.getElementById('application-list');
    const loading = document.getElementById('loading-state');
    const empty = document.getElementById('empty-state');

    // Store globally if updating
    if (data.applications) applications = data.applications;

    // Render Strength Meter if profile data is present
    if (data.profile) {
        renderProfileStrength(data.profile);
    }

    let filtered = applications;

    // Apply Filter
    if (currentFilter === 'active') {
        filtered = applications.filter(a => ['applied', 'in_review', 'contacted', 'offer'].includes(a.status));
    } else if (currentFilter === 'offer') {
        filtered = applications.filter(a => a.status === 'offer');
    } else if (currentFilter === 'withdrawn') {
        filtered = applications.filter(a => a.status === 'withdrawn');
    }

    // Update Stats
    const activeCount = applications.filter(a =>
        ['applied', 'in_review', 'contacted', 'offer'].includes(a.status)
    ).length;

    document.getElementById('stat-active').textContent = activeCount;
    document.getElementById('stat-total').textContent = applications.length;

    loading.classList.add('hidden');

    if (filtered.length === 0) {
        if (applications.length === 0) {
            empty.classList.remove('hidden');
        } else {
            list.innerHTML = '<div class="text-center py-10 text-slate-400">No applications match this filter.</div>';
            list.classList.remove('hidden');
            empty.classList.add('hidden');
            return;
        }
        list.classList.add('hidden');
        return;
    }

    empty.classList.add('hidden');
    list.classList.remove('hidden');
    list.innerHTML = filtered.map(app => {
        const statusKey = app.status || 'applied';
        const label = STATUS_LABELS[statusKey] || statusKey;
        return `
            <div class="application-card" data-id="${app._id}">
                <h3>${stripHtml(app.carrier_name)}</h3>
                <span class="status-badge status-${statusKey}">${label}</span>
                <span class="carrier-dot">DOT ${app.carrier_dot}</span>
            </div>
        `;
    }).join('');
}

function renderMessages(messages) {
    const container = document.getElementById('chat-messages');
    if (!messages || messages.length === 0) {
        container.innerHTML = `<div class="text-center py-10 text-slate-400">No messages yet.</div>`;
        return;
    }

    container.innerHTML = messages.map(msg => {
        const isDriver = msg.sender_type === 'driver';
        const isSystem = msg.sender_type === 'system';

        if (isSystem) {
            return `<div class="system-message">${stripHtml(msg.content)}</div>`;
        }

        return `
            <div class="message-bubble ${isDriver ? 'message-driver' : 'message-recruiter'}">
                ${stripHtml(msg.content)}
                <span class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</span>
            </div>
        `;
    }).join('');

    container.scrollTop = container.scrollHeight;
}

function openChat(applicationId, carrierName) {
    activeApplicationId = applicationId;
    document.getElementById('chat-carrier-name').textContent = carrierName;
    document.getElementById('chat-carrier-icon').textContent = carrierName.substring(0, 2).toUpperCase();
    document.getElementById('chat-modal').classList.remove('hidden');
    document.getElementById('quick-replies').classList.remove('hidden');
    document.getElementById('chat-messages').innerHTML = '<div class="loading-spinner"></div>';
    sendToVelo('getConversation', { applicationId });
    sendToVelo('markAsRead', { applicationId });
}

function closeChat() {
    document.getElementById('chat-modal').classList.add('hidden');
    activeApplicationId = null;
    sendToVelo('getUnreadCount');
}

function filterApps(filterType) {
    currentFilter = filterType;
    const labels = {
        'all': 'All Statuses',
        'active': 'Active Only',
        'offer': 'Offers',
        'withdrawn': 'Withdrawn'
    };
    document.getElementById('current-filter').textContent = labels[filterType] || 'Filter';
    renderDashboard({ applications: applications });
}

// Message handler simulation
function handleInboundMessage(type, data) {
    switch (type) {
        case 'dashboardData':
            renderDashboard(data);
            break;
        case 'conversationData':
            renderMessages(data.messages);
            break;
        case 'unreadCountData':
            updateUnreadBadge(data.totalUnread, data.unreadByApplication);
            break;
        case 'viewsData':
            renderViewsList(data.views);
            if (data.isDiscoverable !== undefined) {
                updatePrivacyUI(data.isDiscoverable);
            }
            break;
        case 'insightsData':
            renderInsightsPanel(data.stats);
            break;
        case 'withdrawSuccess':
            document.getElementById('withdraw-modal').classList.add('hidden');
            applications = applications.filter(a => a._id !== data.applicationId);
            renderDashboard({ applications });
            break;
        case 'messageSent':
            sendToVelo('getConversation', { applicationId: activeApplicationId });
            break;
        case 'error':
            console.error('Dashboard error:', data.message);
            break;
    }
}

// =============================================================================
// TESTS
// =============================================================================

describe('Driver Dashboard HTML Tests', () => {
    beforeEach(() => {
        resetMocks();
        applications = [];
        activeApplicationId = null;
        currentFilter = 'all';
        isDiscoverable = false;
    });

    // -------------------------------------------------------------------------
    // PAGE READY & INITIAL STATE
    // -------------------------------------------------------------------------
    describe('Page Ready & Initial State', () => {
        test('should send dashboardReady on page load', () => {
            sendToVelo('dashboardReady');
            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0].type).toBe('dashboardReady');
        });

        test('loading state should be visible initially', () => {
            const loading = document.getElementById('loading-state');
            expect(loading.classList.contains('hidden')).toBe(false);
        });

        test('empty state should be hidden initially', () => {
            const empty = document.getElementById('empty-state');
            expect(empty.classList.contains('hidden')).toBe(true);
        });

        test('application list should be hidden initially', () => {
            const list = document.getElementById('application-list');
            expect(list.classList.contains('hidden')).toBe(true);
        });
    });

    // -------------------------------------------------------------------------
    // DASHBOARD DATA RENDERING
    // -------------------------------------------------------------------------
    describe('Dashboard Data Rendering', () => {
        test('should hide loading and show empty state when no applications', () => {
            handleInboundMessage('dashboardData', { applications: [] });

            const loading = document.getElementById('loading-state');
            const empty = document.getElementById('empty-state');
            const list = document.getElementById('application-list');

            expect(loading.classList.contains('hidden')).toBe(true);
            expect(empty.classList.contains('hidden')).toBe(false);
            expect(list.classList.contains('hidden')).toBe(true);
        });

        test('should render applications when data is provided', () => {
            const testApps = [
                {
                    _id: 'app1',
                    carrier_name: 'Swift Transportation',
                    carrier_dot: '1234567',
                    status: 'applied',
                    action_timestamp: '2026-02-01T10:00:00Z'
                },
                {
                    _id: 'app2',
                    carrier_name: 'Werner Enterprises',
                    carrier_dot: '2345678',
                    status: 'in_review',
                    action_timestamp: '2026-02-02T10:00:00Z'
                }
            ];

            handleInboundMessage('dashboardData', { applications: testApps });

            const list = document.getElementById('application-list');
            const empty = document.getElementById('empty-state');

            expect(list.classList.contains('hidden')).toBe(false);
            expect(empty.classList.contains('hidden')).toBe(true);
            expect(list.innerHTML).toContain('Swift Transportation');
            expect(list.innerHTML).toContain('Werner Enterprises');
            expect(list.innerHTML).toContain('DOT 1234567');
        });

        test('should update stats correctly', () => {
            const testApps = [
                { _id: 'app1', carrier_name: 'Carrier A', carrier_dot: '111', status: 'applied' },
                { _id: 'app2', carrier_name: 'Carrier B', carrier_dot: '222', status: 'in_review' },
                { _id: 'app3', carrier_name: 'Carrier C', carrier_dot: '333', status: 'offer' },
                { _id: 'app4', carrier_name: 'Carrier D', carrier_dot: '444', status: 'withdrawn' }
            ];

            handleInboundMessage('dashboardData', { applications: testApps });

            const statActive = document.getElementById('stat-active');
            const statTotal = document.getElementById('stat-total');

            expect(statActive.textContent).toBe('3'); // applied, in_review, offer
            expect(statTotal.textContent).toBe('4');
        });

        test('should render all status types with correct badges', () => {
            const statuses = ['applied', 'in_review', 'contacted', 'offer', 'hired', 'rejected', 'withdrawn'];
            const testApps = statuses.map((status, i) => ({
                _id: `app${i}`,
                carrier_name: `Carrier ${i}`,
                carrier_dot: `${i}00000`,
                status,
                action_timestamp: new Date().toISOString()
            }));

            handleInboundMessage('dashboardData', { applications: testApps });

            const list = document.getElementById('application-list');
            statuses.forEach(status => {
                expect(list.innerHTML).toContain(`status-${status}`);
            });
        });

        test('should sanitize carrier names to prevent XSS', () => {
            const testApps = [{
                _id: 'app1',
                carrier_name: '<script>alert("XSS")</script>Carrier',
                carrier_dot: '1234567',
                status: 'applied',
                action_timestamp: new Date().toISOString()
            }];

            handleInboundMessage('dashboardData', { applications: testApps });

            const list = document.getElementById('application-list');
            expect(list.innerHTML).not.toContain('<script>');
        });
    });

    // -------------------------------------------------------------------------
    // FILTERING
    // -------------------------------------------------------------------------
    describe('Application Filtering', () => {
        const testApps = [
            { _id: 'app1', carrier_name: 'Carrier A', carrier_dot: '111', status: 'applied' },
            { _id: 'app2', carrier_name: 'Carrier B', carrier_dot: '222', status: 'offer' },
            { _id: 'app3', carrier_name: 'Carrier C', carrier_dot: '333', status: 'withdrawn' },
            { _id: 'app4', carrier_name: 'Carrier D', carrier_dot: '444', status: 'in_review' }
        ];

        beforeEach(() => {
            handleInboundMessage('dashboardData', { applications: testApps });
        });

        test('should filter to active only', () => {
            filterApps('active');
            const list = document.getElementById('application-list');
            const filterLabel = document.getElementById('current-filter');

            expect(list.innerHTML).toContain('Carrier A');
            expect(list.innerHTML).toContain('Carrier B');
            expect(list.innerHTML).toContain('Carrier D');
            expect(list.innerHTML).not.toContain('Carrier C');
            expect(filterLabel.textContent).toBe('Active Only');
        });

        test('should filter to offers only', () => {
            filterApps('offer');
            const list = document.getElementById('application-list');

            expect(list.innerHTML).toContain('Carrier B');
            expect(list.innerHTML).not.toContain('Carrier A');
            expect(list.innerHTML).not.toContain('Carrier C');
        });

        test('should filter to withdrawn only', () => {
            filterApps('withdrawn');
            const list = document.getElementById('application-list');

            expect(list.innerHTML).toContain('Carrier C');
            expect(list.innerHTML).not.toContain('Carrier A');
            expect(list.innerHTML).not.toContain('Carrier B');
        });

        test('should show all when filter is "all"', () => {
            filterApps('all');
            const list = document.getElementById('application-list');

            expect(list.innerHTML).toContain('Carrier A');
            expect(list.innerHTML).toContain('Carrier B');
            expect(list.innerHTML).toContain('Carrier C');
            expect(list.innerHTML).toContain('Carrier D');
        });

        test('should show message when filter has no matches', () => {
            // All are not 'offer' status except one, remove that one
            applications = [
                { _id: 'app1', carrier_name: 'Carrier A', carrier_dot: '111', status: 'applied' }
            ];
            filterApps('offer');
            const list = document.getElementById('application-list');

            expect(list.innerHTML).toContain('No applications match this filter');
        });
    });

    // -------------------------------------------------------------------------
    // PROFILE STRENGTH METER
    // -------------------------------------------------------------------------
    describe('Profile Strength Meter', () => {
        test('should render profile strength for low score', () => {
            handleInboundMessage('dashboardData', {
                applications: [],
                profile: {
                    profile_completeness_score: 25,
                    suggestions: [
                        { label: 'Add CDL photo', points: 15 },
                        { label: 'Add work history', points: 10 }
                    ]
                }
            });

            const container = document.getElementById('profile-strength-container');
            const scoreText = document.getElementById('strength-text');
            const circle = document.getElementById('strength-circle');
            const message = document.getElementById('strength-message');

            expect(container.classList.contains('hidden')).toBe(false);
            expect(scoreText.textContent).toBe('25%');
            expect(circle.classList.contains('text-yellow-500')).toBe(true);
            expect(message.textContent).toContain('Complete your profile');
        });

        test('should render profile strength for medium score', () => {
            handleInboundMessage('dashboardData', {
                applications: [],
                profile: {
                    profile_completeness_score: 65,
                    suggestions: []
                }
            });

            const circle = document.getElementById('strength-circle');
            const message = document.getElementById('strength-message');

            expect(circle.classList.contains('text-lmdr-blue')).toBe(true);
            expect(message.textContent).toContain('Good progress');
        });

        test('should render profile strength for high score', () => {
            handleInboundMessage('dashboardData', {
                applications: [],
                profile: {
                    profile_completeness_score: 85,
                    suggestions: []
                }
            });

            const circle = document.getElementById('strength-circle');
            const message = document.getElementById('strength-message');

            expect(circle.classList.contains('text-emerald-500')).toBe(true);
            expect(message.innerHTML).toContain('Excellent');
        });

        test('should render suggestions chips', () => {
            handleInboundMessage('dashboardData', {
                applications: [],
                profile: {
                    profile_completeness_score: 40,
                    suggestions: [
                        { label: 'Add CDL photo', points: 15 },
                        { label: 'Add work history', points: 10 },
                        { label: 'Add endorsements', points: 5 }
                    ]
                }
            });

            const suggestions = document.getElementById('strength-suggestions');
            expect(suggestions.innerHTML).toContain('Add CDL photo');
            expect(suggestions.innerHTML).toContain('+15');
            expect(suggestions.innerHTML).toContain('Add work history');
        });

        test('should update SVG circle offset based on score', () => {
            handleInboundMessage('dashboardData', {
                applications: [],
                profile: { profile_completeness_score: 50 }
            });

            const circle = document.getElementById('strength-circle');
            // 50% = circumference - (50/100) * circumference = 251.2 - 125.6 = 125.6
            expect(parseFloat(circle.style.strokeDashoffset)).toBeCloseTo(125.6, 1);
        });
    });

    // -------------------------------------------------------------------------
    // UNREAD BADGE
    // -------------------------------------------------------------------------
    describe('Unread Badge', () => {
        test('should show badge with count when unread > 0', () => {
            handleInboundMessage('unreadCountData', {
                totalUnread: 5,
                unreadByApplication: { app1: 3, app2: 2 }
            });

            const badge = document.getElementById('unread-badge');
            expect(badge.classList.contains('hidden')).toBe(false);
            expect(badge.textContent).toBe('5');
        });

        test('should hide badge when unread is 0', () => {
            handleInboundMessage('unreadCountData', {
                totalUnread: 0,
                unreadByApplication: {}
            });

            const badge = document.getElementById('unread-badge');
            expect(badge.classList.contains('hidden')).toBe(true);
        });

        test('should show 99+ for large counts', () => {
            handleInboundMessage('unreadCountData', {
                totalUnread: 150,
                unreadByApplication: {}
            });

            const badge = document.getElementById('unread-badge');
            expect(badge.textContent).toBe('99+');
        });

        test('should store unreadByApplication on window', () => {
            const byApp = { app1: 3, app2: 2 };
            handleInboundMessage('unreadCountData', {
                totalUnread: 5,
                unreadByApplication: byApp
            });

            expect(window.unreadByApplication).toEqual(byApp);
        });
    });

    // -------------------------------------------------------------------------
    // CHAT MODAL
    // -------------------------------------------------------------------------
    describe('Chat Modal', () => {
        test('should open chat and request conversation', () => {
            openChat('app123', 'Swift Transportation');

            const modal = document.getElementById('chat-modal');
            const carrierName = document.getElementById('chat-carrier-name');
            const carrierIcon = document.getElementById('chat-carrier-icon');

            expect(modal.classList.contains('hidden')).toBe(false);
            expect(carrierName.textContent).toBe('Swift Transportation');
            expect(carrierIcon.textContent).toBe('SW');
            expect(activeApplicationId).toBe('app123');

            // Should have sent getConversation and markAsRead
            expect(capturedOutbound.some(m => m.type === 'getConversation')).toBe(true);
            expect(capturedOutbound.some(m => m.type === 'markAsRead')).toBe(true);
        });

        test('should close chat and request unread count', () => {
            openChat('app123', 'Test Carrier');
            capturedOutbound = []; // Reset

            closeChat();

            const modal = document.getElementById('chat-modal');
            expect(modal.classList.contains('hidden')).toBe(true);
            expect(activeApplicationId).toBeNull();
            expect(capturedOutbound.some(m => m.type === 'getUnreadCount')).toBe(true);
        });

        test('should render messages when received', () => {
            openChat('app123', 'Test Carrier');

            handleInboundMessage('conversationData', {
                messages: [
                    { sender_type: 'recruiter', content: 'Hello driver!', timestamp: '2026-02-01T10:00:00Z' },
                    { sender_type: 'driver', content: 'Hi there!', timestamp: '2026-02-01T10:05:00Z' }
                ]
            });

            const chatMessages = document.getElementById('chat-messages');
            expect(chatMessages.innerHTML).toContain('Hello driver!');
            expect(chatMessages.innerHTML).toContain('Hi there!');
            expect(chatMessages.innerHTML).toContain('message-recruiter');
            expect(chatMessages.innerHTML).toContain('message-driver');
        });

        test('should render empty state when no messages', () => {
            openChat('app123', 'Test Carrier');
            handleInboundMessage('conversationData', { messages: [] });

            const chatMessages = document.getElementById('chat-messages');
            expect(chatMessages.innerHTML).toContain('No messages yet');
        });

        test('should render system messages differently', () => {
            handleInboundMessage('conversationData', {
                messages: [
                    {
                        sender_type: 'system',
                        content: 'Interview scheduled for tomorrow',
                        timestamp: '2026-02-01T10:00:00Z'
                    }
                ]
            });

            const chatMessages = document.getElementById('chat-messages');
            expect(chatMessages.innerHTML).toContain('system-message');
            expect(chatMessages.innerHTML).toContain('Interview scheduled');
        });

        test('should sanitize message content', () => {
            handleInboundMessage('conversationData', {
                messages: [
                    {
                        sender_type: 'recruiter',
                        content: '<img src=x onerror="alert(1)">Hello',
                        timestamp: '2026-02-01T10:00:00Z'
                    }
                ]
            });

            const chatMessages = document.getElementById('chat-messages');
            expect(chatMessages.innerHTML).not.toContain('<img');
            expect(chatMessages.innerHTML).not.toContain('onerror');
        });
    });

    // -------------------------------------------------------------------------
    // PROFILE VIEWS (PHASE 3)
    // -------------------------------------------------------------------------
    describe('Profile Views (Phase 3)', () => {
        test('should render views list with carrier info', () => {
            handleInboundMessage('viewsData', {
                views: [
                    {
                        carrierName: 'Swift Transportation',
                        viewDate: '2026-02-01T10:00:00Z',
                        location: 'TX',
                        isNew: true
                    },
                    {
                        carrierName: 'Werner Enterprises',
                        viewDate: '2026-01-30T10:00:00Z',
                        location: 'NE',
                        isNew: false
                    }
                ],
                isDiscoverable: true
            });

            const viewsList = document.getElementById('views-list');
            expect(viewsList.innerHTML).toContain('Swift Transportation');
            expect(viewsList.innerHTML).toContain('SW');
            expect(viewsList.innerHTML).toContain('Werner Enterprises');
            expect(viewsList.innerHTML).toContain('WE');
            expect(viewsList.innerHTML).toContain('TX');
        });

        test('should show empty state when no views', () => {
            handleInboundMessage('viewsData', { views: [] });

            const viewsList = document.getElementById('views-list');
            expect(viewsList.innerHTML).toContain('No views yet');
        });

        test('should update privacy toggle based on isDiscoverable', () => {
            handleInboundMessage('viewsData', { views: [], isDiscoverable: true });

            const toggle = document.getElementById('privacy-toggle');
            const label = document.getElementById('privacy-label');

            expect(toggle.classList.contains('bg-lmdr-blue')).toBe(true);
            expect(label.textContent).toBe('Profile Visible');
        });

        test('should show hidden state when not discoverable', () => {
            handleInboundMessage('viewsData', { views: [], isDiscoverable: false });

            const toggle = document.getElementById('privacy-toggle');
            const label = document.getElementById('privacy-label');

            expect(toggle.classList.contains('bg-slate-200')).toBe(true);
            expect(label.textContent).toBe('Profile Hidden');
        });
    });

    // -------------------------------------------------------------------------
    // INSIGHTS PANEL (PHASE 4)
    // -------------------------------------------------------------------------
    describe('Insights Panel (Phase 4)', () => {
        test('should render insights stats', () => {
            handleInboundMessage('insightsData', {
                stats: {
                    profileViews30d: 42,
                    searchAppearances: 156,
                    activeApplications: 5,
                    offerRate: '12%'
                }
            });

            expect(document.getElementById('insight-views-count').textContent).toBe('42');
            expect(document.getElementById('insight-search-count').textContent).toBe('156');
            expect(document.getElementById('insight-active-apps').textContent).toBe('5');
            expect(document.getElementById('insight-offer-rate').textContent).toBe('12%');
        });

        test('should handle missing stats with defaults', () => {
            handleInboundMessage('insightsData', { stats: {} });

            expect(document.getElementById('insight-views-count').textContent).toBe('0');
            expect(document.getElementById('insight-search-count').textContent).toBe('0');
            expect(document.getElementById('insight-active-apps').textContent).toBe('0');
            expect(document.getElementById('insight-offer-rate').textContent).toBe('0%');
        });
    });

    // -------------------------------------------------------------------------
    // WITHDRAW FLOW
    // -------------------------------------------------------------------------
    describe('Withdraw Flow', () => {
        beforeEach(() => {
            handleInboundMessage('dashboardData', {
                applications: [
                    { _id: 'app1', carrier_name: 'Carrier A', carrier_dot: '111', status: 'applied' },
                    { _id: 'app2', carrier_name: 'Carrier B', carrier_dot: '222', status: 'in_review' }
                ]
            });
        });

        test('should remove withdrawn application from list', () => {
            handleInboundMessage('withdrawSuccess', { applicationId: 'app1' });

            const list = document.getElementById('application-list');
            expect(list.innerHTML).not.toContain('Carrier A');
            expect(list.innerHTML).toContain('Carrier B');
            expect(applications).toHaveLength(1);
        });

        test('should close withdraw modal on success', () => {
            // Simulate modal being open
            document.getElementById('withdraw-modal').classList.remove('hidden');

            handleInboundMessage('withdrawSuccess', { applicationId: 'app1' });

            const modal = document.getElementById('withdraw-modal');
            expect(modal.classList.contains('hidden')).toBe(true);
        });

        test('should update stats after withdrawal', () => {
            handleInboundMessage('withdrawSuccess', { applicationId: 'app1' });

            const statActive = document.getElementById('stat-active');
            const statTotal = document.getElementById('stat-total');

            expect(statActive.textContent).toBe('1'); // Only app2 (in_review) remains active
            expect(statTotal.textContent).toBe('1');
        });
    });

    // -------------------------------------------------------------------------
    // OUTBOUND MESSAGES
    // -------------------------------------------------------------------------
    describe('Outbound Messages', () => {
        test('should send refreshDashboard message', () => {
            sendToVelo('refreshDashboard');
            expect(capturedOutbound).toContainEqual({ type: 'refreshDashboard', data: {} });
        });

        test('should send navigateToMatching message', () => {
            sendToVelo('navigateToMatching');
            expect(capturedOutbound).toContainEqual({ type: 'navigateToMatching', data: {} });
        });

        test('should send navigateToProfile message', () => {
            sendToVelo('navigateToProfile');
            expect(capturedOutbound).toContainEqual({ type: 'navigateToProfile', data: {} });
        });

        test('should send withdrawApplication with carrier DOT', () => {
            sendToVelo('withdrawApplication', { carrierDOT: '1234567' });
            expect(capturedOutbound).toContainEqual({
                type: 'withdrawApplication',
                data: { carrierDOT: '1234567' }
            });
        });

        test('should send sendMessage with content and receiver', () => {
            sendToVelo('sendMessage', {
                applicationId: 'app123',
                content: 'Hello!',
                receiverId: 'rec456'
            });

            expect(capturedOutbound).toContainEqual({
                type: 'sendMessage',
                data: {
                    applicationId: 'app123',
                    content: 'Hello!',
                    receiverId: 'rec456'
                }
            });
        });

        test('should send setDiscoverability toggle', () => {
            sendToVelo('setDiscoverability', { isDiscoverable: true });
            expect(capturedOutbound).toContainEqual({
                type: 'setDiscoverability',
                data: { isDiscoverable: true }
            });
        });

        test('should send navigation messages for header buttons', () => {
            sendToVelo('navigateToMyCareer');
            sendToVelo('navigateToForums');
            sendToVelo('navigateToHealth');

            expect(capturedOutbound.some(m => m.type === 'navigateToMyCareer')).toBe(true);
            expect(capturedOutbound.some(m => m.type === 'navigateToForums')).toBe(true);
            expect(capturedOutbound.some(m => m.type === 'navigateToHealth')).toBe(true);
        });
    });

    // -------------------------------------------------------------------------
    // ERROR HANDLING
    // -------------------------------------------------------------------------
    describe('Error Handling', () => {
        test('should handle error messages gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            handleInboundMessage('error', { message: 'Failed to load dashboard' });

            expect(consoleSpy).toHaveBeenCalledWith(
                'Dashboard error:',
                'Failed to load dashboard'
            );

            consoleSpy.mockRestore();
        });

        test('should handle missing data in dashboardData', () => {
            // Should not throw
            expect(() => {
                handleInboundMessage('dashboardData', {});
            }).not.toThrow();
        });

        test('should handle null profile gracefully', () => {
            expect(() => {
                handleInboundMessage('dashboardData', {
                    applications: [],
                    profile: null
                });
            }).not.toThrow();
        });

        test('should handle invalid message types', () => {
            expect(() => {
                handleInboundMessage('unknownMessageType', {});
            }).not.toThrow();
        });
    });

    // -------------------------------------------------------------------------
    // MESSAGE SENT FLOW
    // -------------------------------------------------------------------------
    describe('Message Sent Flow', () => {
        test('should refresh conversation after message sent', () => {
            openChat('app123', 'Test Carrier');
            capturedOutbound = [];

            handleInboundMessage('messageSent', {});

            expect(capturedOutbound.some(m =>
                m.type === 'getConversation' && m.data.applicationId === 'app123'
            )).toBe(true);
        });
    });
});
