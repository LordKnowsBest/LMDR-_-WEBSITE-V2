/**
 * HTML DOM TESTS: Recruiter Driver Search
 * ========================================
 * Tests that incoming postMessage events correctly update RECRUITER_DRIVER_SEARCH.html DOM.
 *
 * Message types tested (from Velo → HTML):
 *   - searchDriversResult: Displays driver cards in grid
 *   - viewDriverProfileResult: Opens driver detail modal
 *   - saveDriverResult: Shows save confirmation
 *   - contactDriverResult: Shows message sent confirmation
 *   - getQuotaStatusResult: Updates quota bar display
 *   - saveSearchResult: Shows saved search confirmation
 *   - savedSearchesLoaded: Populates saved searches panel
 *   - savedSearchExecuted: Displays results from saved search
 *   - savedSearchDeleted: Updates saved searches list
 *   - savedSearchUpdated: Updates saved searches list
 *   - getWeightPreferencesResult: Loads weight sliders
 *   - saveWeightPreferencesResult: Shows save confirmation
 *   - noCarrierAssigned: Shows onboarding prompt
 *   - recruiterProfile: Updates sidebar user info
 *
 * @module public/__tests__/recruiterDriverSearch.html.test.js
 */

// =============================================================================
// MOCK DOM INFRASTRUCTURE
// =============================================================================

const mockElements = {};
let capturedOutbound = [];
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
        style: { width: '' },
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
        remove: jest.fn(),
        onclick: null
    };
}

function setupMockDOM() {
    // Driver grid and cards
    mockElements['driverGrid'] = createMockElement('driverGrid');
    mockElements['driverCardTemplate'] = createMockElement('driverCardTemplate');
    mockElements['emptyState'] = createMockElement('emptyState', { classes: ['hidden'] });
    mockElements['loadingState'] = createMockElement('loadingState', { classes: ['hidden'] });
    mockElements['errorState'] = createMockElement('errorState', { classes: ['hidden'] });
    mockElements['loadMoreContainer'] = createMockElement('loadMoreContainer', { classes: ['hidden'] });

    // Results and quota
    mockElements['resultsCount'] = createMockElement('resultsCount', { textContent: '0' });
    mockElements['quotaUsed'] = createMockElement('quotaUsed', { textContent: '0' });
    mockElements['quotaLimit'] = createMockElement('quotaLimit', { textContent: '0' });
    mockElements['quotaBar'] = createMockElement('quotaBar');
    mockElements['quotaTier'] = createMockElement('quotaTier', { textContent: 'free' });
    mockElements['quotaResetDate'] = createMockElement('quotaResetDate');
    mockElements['upgradeBtn'] = createMockElement('upgradeBtn', { classes: ['hidden'] });

    // Filter inputs
    mockElements['filterZip'] = createMockElement('filterZip', { value: '' });
    mockElements['filterRadius'] = createMockElement('filterRadius', { value: '50' });
    mockElements['sortBy'] = createMockElement('sortBy', { value: 'matchScore' });

    // Driver detail modal
    mockElements['driverModal'] = createMockElement('driverModal', { classes: ['hidden'] });
    mockElements['modalDriverName'] = createMockElement('modalDriverName');
    mockElements['modalMatchScore'] = createMockElement('modalMatchScore');
    mockElements['modalLocation'] = createMockElement('modalLocation');
    mockElements['modalExperience'] = createMockElement('modalExperience');
    mockElements['modalCdlClass'] = createMockElement('modalCdlClass');
    mockElements['modalEndorsements'] = createMockElement('modalEndorsements');
    mockElements['modalPhone'] = createMockElement('modalPhone');
    mockElements['modalEmail'] = createMockElement('modalEmail');
    mockElements['modalAvailability'] = createMockElement('modalAvailability');
    mockElements['modalRationale'] = createMockElement('modalRationale');
    mockElements['saveDriverBtn'] = createMockElement('saveDriverBtn');
    mockElements['contactDriverBtn'] = createMockElement('contactDriverBtn');

    // Saved searches
    mockElements['savedSearchesList'] = createMockElement('savedSearchesList');
    mockElements['saveSearchModal'] = createMockElement('saveSearchModal', { classes: ['hidden'] });
    mockElements['searchNameInput'] = createMockElement('searchNameInput');
    mockElements['alertFrequency'] = createMockElement('alertFrequency', { value: 'daily' });

    // Weight preferences / Settings
    mockElements['settingsPanel'] = createMockElement('settingsPanel', { classes: ['hidden'] });
    mockElements['sliderQualifications'] = createMockElement('sliderQualifications', { value: '30' });
    mockElements['sliderExperience'] = createMockElement('sliderExperience', { value: '20' });
    mockElements['sliderLocation'] = createMockElement('sliderLocation', { value: '20' });
    mockElements['sliderAvailability'] = createMockElement('sliderAvailability', { value: '15' });
    mockElements['sliderSalaryFit'] = createMockElement('sliderSalaryFit', { value: '10' });
    mockElements['sliderEngagement'] = createMockElement('sliderEngagement', { value: '5' });
    mockElements['saveWeightsBtn'] = createMockElement('saveWeightsBtn');
    mockElements['totalPercent'] = createMockElement('totalPercent', { textContent: '100%' });

    // Sidebar user info
    mockElements['sidebarUserName'] = createMockElement('sidebarUserName');
    mockElements['sidebarUserCompany'] = createMockElement('sidebarUserCompany');
    mockElements['sidebarUserInitials'] = createMockElement('sidebarUserInitials');

    // No carrier / onboarding state
    mockElements['noCarrierBanner'] = createMockElement('noCarrierBanner', { classes: ['hidden'] });
    mockElements['noCarrierMessage'] = createMockElement('noCarrierMessage');

    // Contact modal
    mockElements['contactModal'] = createMockElement('contactModal', { classes: ['hidden'] });
    mockElements['contactMessageInput'] = createMockElement('contactMessageInput');
    mockElements['sendMessageBtn'] = createMockElement('sendMessageBtn');

    global.document = {
        getElementById: (id) => mockElements[id] || null,
        querySelector: (sel) => mockElements[sel.replace('#', '')] || null,
        querySelectorAll: () => [],
        createElement: (tag) => createMockElement(`dynamic-${tag}-${Date.now()}`)
    };

    toastMessages = [];
    capturedOutbound = [];
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
    toastMessages = [];
    capturedOutbound = [];
    setupMockDOM();
}

// =============================================================================
// SIMULATED MESSAGE HANDLERS (mimic RECRUITER_DRIVER_SEARCH.html behavior)
// =============================================================================

let currentDrivers = [];
let selectedDriver = null;

function stripHtml(str) {
    return String(str || '').replace(/<[^>]*>/g, '');
}

function showToast(message, type = 'info') {
    toastMessages.push({ message, type });
}

function showLoading(show) {
    const loadingEl = mockElements['loadingState'];
    if (loadingEl) {
        show ? loadingEl.classList.remove('hidden') : loadingEl.classList.add('hidden');
    }
}

function showEmpty() {
    const emptyEl = mockElements['emptyState'];
    if (emptyEl) emptyEl.classList.remove('hidden');
}

function hideEmpty() {
    const emptyEl = mockElements['emptyState'];
    if (emptyEl) emptyEl.classList.add('hidden');
}

function showError(message) {
    const errorEl = mockElements['errorState'];
    if (errorEl) {
        errorEl.textContent = stripHtml(message);
        errorEl.classList.remove('hidden');
    }
    showToast(message, 'error');
}

function updateResultsCount(count) {
    const el = mockElements['resultsCount'];
    if (el) el.textContent = String(count);
}

function updateQuotaDisplay(quotaStatus) {
    if (!quotaStatus) return;

    const usedEl = mockElements['quotaUsed'];
    const limitEl = mockElements['quotaLimit'];
    const tierEl = mockElements['quotaTier'];
    const barEl = mockElements['quotaBar'];
    const resetEl = mockElements['quotaResetDate'];
    const upgradeEl = mockElements['upgradeBtn'];

    if (usedEl) usedEl.textContent = String(quotaStatus.used || 0);
    if (limitEl) limitEl.textContent = String(quotaStatus.limit || 0);
    if (tierEl) tierEl.textContent = quotaStatus.tier || 'free';

    if (barEl) {
        const percent = quotaStatus.limit > 0
            ? Math.round((quotaStatus.used / quotaStatus.limit) * 100)
            : 0;
        barEl.style.width = `${percent}%`;
        barEl.setAttribute('data-percent', percent);
    }

    if (resetEl && quotaStatus.resetDate) {
        resetEl.textContent = quotaStatus.resetDate;
    }

    // Show upgrade button for free tier
    if (upgradeEl) {
        if (quotaStatus.tier === 'free' || !quotaStatus.canSearch) {
            upgradeEl.classList.remove('hidden');
        } else {
            upgradeEl.classList.add('hidden');
        }
    }
}

function renderDrivers(drivers) {
    currentDrivers = drivers;
    const grid = mockElements['driverGrid'];

    if (!grid) return;

    // Clear existing cards
    grid.children = [];

    if (drivers.length === 0) {
        showEmpty();
        return;
    }

    hideEmpty();

    drivers.forEach(driver => {
        const card = document.createElement('div');
        card.className = 'driver-card';
        card.setAttribute('data-id', driver.id);
        card.setAttribute('data-name', stripHtml(driver.name));
        card.setAttribute('data-score', driver.matchScore);

        // Score color class
        let scoreClass = 'score-poor';
        if (driver.matchScore >= 90) scoreClass = 'score-excellent';
        else if (driver.matchScore >= 75) scoreClass = 'score-good';
        else if (driver.matchScore >= 60) scoreClass = 'score-fair';

        card.classList.add(scoreClass);

        if (driver.isMutualMatch) {
            card.classList.add('mutual-match');
        }

        grid.children.push(card);
    });
}

function openDriverModal(driver) {
    selectedDriver = driver;
    const modal = mockElements['driverModal'];
    const nameEl = mockElements['modalDriverName'];
    const scoreEl = mockElements['modalMatchScore'];
    const locationEl = mockElements['modalLocation'];
    const expEl = mockElements['modalExperience'];
    const cdlEl = mockElements['modalCdlClass'];
    const endorseEl = mockElements['modalEndorsements'];
    const phoneEl = mockElements['modalPhone'];
    const emailEl = mockElements['modalEmail'];
    const availEl = mockElements['modalAvailability'];
    const rationaleEl = mockElements['modalRationale'];

    if (modal) modal.classList.remove('hidden');
    if (nameEl) nameEl.textContent = stripHtml(driver.name);
    if (scoreEl) {
        scoreEl.textContent = `${driver.matchScore}%`;
        scoreEl.setAttribute('data-score', driver.matchScore);
    }
    if (locationEl) locationEl.textContent = stripHtml(driver.location);
    if (expEl) expEl.textContent = `${driver.experienceYears} years`;
    if (cdlEl) cdlEl.textContent = driver.cdlClass || 'A';
    if (endorseEl) endorseEl.textContent = (driver.endorsements || []).join(', ');
    if (phoneEl) phoneEl.textContent = driver.phone || '--';
    if (emailEl) emailEl.textContent = driver.email || '--';
    if (availEl) availEl.textContent = driver.availability || 'Unknown';
    if (rationaleEl) rationaleEl.innerHTML = '';
}

function closeDriverModal() {
    const modal = mockElements['driverModal'];
    if (modal) modal.classList.add('hidden');
    selectedDriver = null;
}

function handleViewDriverProfileResult(data) {
    if (data.success) {
        openDriverModal(data.driver);
        if (data.quotaStatus) {
            updateQuotaDisplay(data.quotaStatus);
        }
    } else if (data.quotaExceeded) {
        showToast('Monthly profile view quota exceeded. Upgrade to view more.', 'error');
    } else {
        showToast(data.error || 'Failed to load driver profile', 'error');
    }
}

function handleSaveDriverResult(data) {
    if (data.success) {
        showToast('Driver saved to pipeline!', 'success');
        const saveBtn = mockElements['saveDriverBtn'];
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saved';
        }
    } else if (data.alreadySaved) {
        showToast('Driver already in your pipeline', 'info');
    } else {
        showToast(data.error || 'Failed to save driver', 'error');
    }
}

function handleContactDriverResult(data) {
    if (data.success) {
        showToast('Message sent successfully!', 'success');
        const modal = mockElements['contactModal'];
        const input = mockElements['contactMessageInput'];
        if (modal) modal.classList.add('hidden');
        if (input) input.value = '';
    } else if (data.requiresSubscription) {
        showToast('Upgrade your subscription to contact drivers', 'error');
    } else {
        showToast(data.error || 'Failed to send message', 'error');
    }
}

function renderSavedSearches(searches) {
    const list = mockElements['savedSearchesList'];
    if (!list) return;

    list.children = [];

    searches.forEach(search => {
        const item = document.createElement('div');
        item.className = 'saved-search-item';
        item.setAttribute('data-id', search._id || search.id);
        item.setAttribute('data-name', stripHtml(search.name));
        list.children.push(item);
    });
}

function closeSaveSearchModal() {
    const modal = mockElements['saveSearchModal'];
    if (modal) modal.classList.add('hidden');
    const input = mockElements['searchNameInput'];
    if (input) input.value = '';
}

function loadWeights(weights) {
    const sliders = {
        qualifications: mockElements['sliderQualifications'],
        experience: mockElements['sliderExperience'],
        location: mockElements['sliderLocation'],
        availability: mockElements['sliderAvailability'],
        salaryFit: mockElements['sliderSalaryFit'],
        engagement: mockElements['sliderEngagement']
    };

    Object.entries(weights).forEach(([key, value]) => {
        if (sliders[key]) {
            sliders[key].value = String(value);
        }
    });

    // Update total
    const total = Object.values(weights).reduce((a, b) => a + (b || 0), 0);
    const totalEl = mockElements['totalPercent'];
    if (totalEl) totalEl.textContent = `${total}%`;
}

function handleWeightSaveResult(data) {
    if (data.success) {
        showToast('Preferences saved!', 'success');
    } else {
        showToast(data.error || 'Failed to save preferences', 'error');
    }
}

function handleNoCarrierAssigned(data) {
    const banner = mockElements['noCarrierBanner'];
    const message = mockElements['noCarrierMessage'];

    if (banner) banner.classList.remove('hidden');
    if (message) message.textContent = stripHtml(data.message) || 'No carrier assigned';

    // Disable search
    showError('Please complete your account setup to search for drivers.');
}

function handleRecruiterProfile(data) {
    const nameEl = mockElements['sidebarUserName'];
    const companyEl = mockElements['sidebarUserCompany'];
    const initialsEl = mockElements['sidebarUserInitials'];

    if (nameEl) nameEl.textContent = stripHtml(data.name);
    if (companyEl) companyEl.textContent = stripHtml(data.company);
    if (initialsEl) {
        const parts = (data.name || 'U').split(' ');
        initialsEl.textContent = parts.map(p => p[0]).join('').substring(0, 2).toUpperCase();
    }
}

function processMessage(msg) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
        case 'searchDriversResult':
            if (msg.data?.success) {
                renderDrivers(msg.data.drivers || []);
                updateResultsCount(msg.data.total || 0);
                updateQuotaDisplay(msg.data.quotaStatus);

                const loadMore = mockElements['loadMoreContainer'];
                if (loadMore) {
                    if ((msg.data.drivers || []).length >= 20 && currentDrivers.length < msg.data.total) {
                        loadMore.classList.remove('hidden');
                    } else {
                        loadMore.classList.add('hidden');
                    }
                }
            } else {
                showError(msg.data?.error || 'Search failed');
            }
            showLoading(false);
            break;

        case 'viewDriverProfileResult':
            handleViewDriverProfileResult(msg.data || {});
            break;

        case 'saveDriverResult':
            handleSaveDriverResult(msg.data || {});
            break;

        case 'contactDriverResult':
            handleContactDriverResult(msg.data || {});
            break;

        case 'getQuotaStatusResult':
            if (msg.data?.success) {
                updateQuotaDisplay(msg.data);
            }
            break;

        case 'saveSearchResult':
            if (msg.data?.success) {
                showToast('Search saved successfully!', 'success');
                closeSaveSearchModal();
            } else {
                showToast(msg.data?.error || 'Failed to save search', 'error');
            }
            break;

        case 'savedSearchesLoaded':
            if (msg.data?.success) {
                renderSavedSearches(msg.data.searches || []);
            }
            break;

        case 'savedSearchExecuted':
            if (msg.data?.success) {
                renderDrivers(msg.data.drivers || []);
                updateResultsCount(msg.data.total || 0);
                showToast(`Found ${msg.data.total || 0} drivers (${msg.data.newMatches || 0} new)`, 'info');
            }
            break;

        case 'savedSearchDeleted':
            if (msg.data?.success) {
                showToast('Search deleted', 'success');
            }
            break;

        case 'savedSearchUpdated':
            if (msg.data?.success) {
                showToast('Search updated', 'success');
            }
            break;

        case 'getWeightPreferencesResult':
            if (msg.data?.preferences) {
                loadWeights(msg.data.preferences);
            }
            break;

        case 'loadWeightPreferences':
            if (msg.data?.weights) {
                loadWeights(msg.data.weights);
            }
            break;

        case 'saveWeightPreferencesResult':
        case 'savePreferencesResult':
            handleWeightSaveResult(msg.data || {});
            break;

        case 'noCarrierAssigned':
            handleNoCarrierAssigned(msg.data || {});
            break;

        case 'recruiterProfile':
            if (msg.data) {
                handleRecruiterProfile(msg.data);
            }
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('RECRUITER_DRIVER_SEARCH.html DOM Tests', () => {
    beforeEach(() => {
        resetMockDOM();
        currentDrivers = [];
        selectedDriver = null;
    });

    // =========================================================================
    // DRIVER SEARCH RESULTS
    // =========================================================================
    describe('Search Results', () => {
        it('should render driver cards on successful search', () => {
            processMessage({
                type: 'searchDriversResult',
                data: {
                    success: true,
                    drivers: [
                        { id: 'd1', name: 'John Doe', matchScore: 92, location: 'Dallas, TX', experienceYears: 5, cdlClass: 'A', isMutualMatch: true },
                        { id: 'd2', name: 'Jane Smith', matchScore: 78, location: 'Houston, TX', experienceYears: 3, cdlClass: 'A', isMutualMatch: false }
                    ],
                    total: 2,
                    quotaStatus: { tier: 'pro', used: 5, limit: 50 }
                }
            });

            expect(mockElements['driverGrid'].children.length).toBe(2);
            expect(mockElements['resultsCount'].textContent).toBe('2');
            expect(mockElements['emptyState'].classList.contains('hidden')).toBe(true);
        });

        it('should show score color classes based on match score', () => {
            processMessage({
                type: 'searchDriversResult',
                data: {
                    success: true,
                    drivers: [
                        { id: 'd1', name: 'Excellent', matchScore: 95 },
                        { id: 'd2', name: 'Good', matchScore: 80 },
                        { id: 'd3', name: 'Fair', matchScore: 65 },
                        { id: 'd4', name: 'Poor', matchScore: 50 }
                    ],
                    total: 4
                }
            });

            const cards = mockElements['driverGrid'].children;
            expect(cards[0].classList.contains('score-excellent')).toBe(true);
            expect(cards[1].classList.contains('score-good')).toBe(true);
            expect(cards[2].classList.contains('score-fair')).toBe(true);
            expect(cards[3].classList.contains('score-poor')).toBe(true);
        });

        it('should mark mutual matches', () => {
            processMessage({
                type: 'searchDriversResult',
                data: {
                    success: true,
                    drivers: [
                        { id: 'd1', name: 'Mutual', matchScore: 90, isMutualMatch: true },
                        { id: 'd2', name: 'One-way', matchScore: 85, isMutualMatch: false }
                    ],
                    total: 2
                }
            });

            const cards = mockElements['driverGrid'].children;
            expect(cards[0].classList.contains('mutual-match')).toBe(true);
            expect(cards[1].classList.contains('mutual-match')).toBe(false);
        });

        it('should show empty state when no drivers found', () => {
            processMessage({
                type: 'searchDriversResult',
                data: {
                    success: true,
                    drivers: [],
                    total: 0
                }
            });

            expect(mockElements['driverGrid'].children.length).toBe(0);
            expect(mockElements['emptyState'].classList.contains('hidden')).toBe(false);
        });

        it('should show error on failed search', () => {
            processMessage({
                type: 'searchDriversResult',
                data: {
                    success: false,
                    error: 'Search service unavailable'
                }
            });

            expect(toastMessages).toContainEqual({ message: 'Search service unavailable', type: 'error' });
        });

        it('should show load more when more results available', () => {
            const drivers = Array(20).fill(null).map((_, i) => ({
                id: `d${i}`, name: `Driver ${i}`, matchScore: 80
            }));

            processMessage({
                type: 'searchDriversResult',
                data: {
                    success: true,
                    drivers,
                    total: 50
                }
            });

            expect(mockElements['loadMoreContainer'].classList.contains('hidden')).toBe(false);
        });

        it('should hide load more when all results shown', () => {
            processMessage({
                type: 'searchDriversResult',
                data: {
                    success: true,
                    drivers: [{ id: 'd1', name: 'Only One', matchScore: 90 }],
                    total: 1
                }
            });

            expect(mockElements['loadMoreContainer'].classList.contains('hidden')).toBe(true);
        });

        it('should sanitize XSS in driver names', () => {
            processMessage({
                type: 'searchDriversResult',
                data: {
                    success: true,
                    drivers: [
                        { id: 'd1', name: '<script>alert("xss")</script>Bad Driver', matchScore: 85 }
                    ],
                    total: 1
                }
            });

            const card = mockElements['driverGrid'].children[0];
            expect(card.getAttribute('data-name')).not.toContain('<script>');
        });
    });

    // =========================================================================
    // QUOTA DISPLAY
    // =========================================================================
    describe('Quota Display', () => {
        it('should update quota bar on search result', () => {
            processMessage({
                type: 'searchDriversResult',
                data: {
                    success: true,
                    drivers: [],
                    total: 0,
                    quotaStatus: {
                        tier: 'pro',
                        used: 25,
                        limit: 100,
                        resetDate: '2026-03-01'
                    }
                }
            });

            expect(mockElements['quotaUsed'].textContent).toBe('25');
            expect(mockElements['quotaLimit'].textContent).toBe('100');
            expect(mockElements['quotaTier'].textContent).toBe('pro');
            expect(mockElements['quotaBar'].getAttribute('data-percent')).toBe('25');
        });

        it('should show upgrade button for free tier', () => {
            processMessage({
                type: 'getQuotaStatusResult',
                data: {
                    success: true,
                    tier: 'free',
                    used: 0,
                    limit: 0,
                    canSearch: false
                }
            });

            expect(mockElements['upgradeBtn'].classList.contains('hidden')).toBe(false);
        });

        it('should hide upgrade button for paid tier', () => {
            processMessage({
                type: 'getQuotaStatusResult',
                data: {
                    success: true,
                    tier: 'enterprise',
                    used: 50,
                    limit: 1000,
                    canSearch: true
                }
            });

            expect(mockElements['upgradeBtn'].classList.contains('hidden')).toBe(true);
        });
    });

    // =========================================================================
    // DRIVER PROFILE MODAL
    // =========================================================================
    describe('Driver Profile Modal', () => {
        it('should open modal with driver details', () => {
            processMessage({
                type: 'viewDriverProfileResult',
                data: {
                    success: true,
                    driver: {
                        id: 'd1',
                        name: 'John Doe',
                        matchScore: 92,
                        location: 'Dallas, TX',
                        experienceYears: 5,
                        cdlClass: 'A',
                        endorsements: ['H', 'T'],
                        phone: '555-123-4567',
                        email: 'john@example.com',
                        availability: 'immediate'
                    },
                    quotaStatus: { used: 6, limit: 50 }
                }
            });

            expect(mockElements['driverModal'].classList.contains('hidden')).toBe(false);
            expect(mockElements['modalDriverName'].textContent).toBe('John Doe');
            expect(mockElements['modalMatchScore'].textContent).toBe('92%');
            expect(mockElements['modalLocation'].textContent).toBe('Dallas, TX');
            expect(mockElements['modalExperience'].textContent).toBe('5 years');
            expect(mockElements['modalPhone'].textContent).toBe('555-123-4567');
            expect(mockElements['modalEmail'].textContent).toBe('john@example.com');
        });

        it('should show quota exceeded error', () => {
            processMessage({
                type: 'viewDriverProfileResult',
                data: {
                    success: false,
                    quotaExceeded: true
                }
            });

            expect(toastMessages).toContainEqual(
                expect.objectContaining({ type: 'error', message: expect.stringContaining('quota exceeded') })
            );
        });

        it('should show placeholder for missing contact info', () => {
            processMessage({
                type: 'viewDriverProfileResult',
                data: {
                    success: true,
                    driver: {
                        id: 'd1',
                        name: 'Jane Doe',
                        matchScore: 85,
                        phone: null,
                        email: null
                    }
                }
            });

            expect(mockElements['modalPhone'].textContent).toBe('--');
            expect(mockElements['modalEmail'].textContent).toBe('--');
        });
    });

    // =========================================================================
    // SAVE DRIVER
    // =========================================================================
    describe('Save Driver', () => {
        it('should show success toast and disable button on save', () => {
            processMessage({
                type: 'saveDriverResult',
                data: { success: true }
            });

            expect(toastMessages).toContainEqual({ message: 'Driver saved to pipeline!', type: 'success' });
            expect(mockElements['saveDriverBtn'].disabled).toBe(true);
            expect(mockElements['saveDriverBtn'].textContent).toBe('Saved');
        });

        it('should show info toast for already saved driver', () => {
            processMessage({
                type: 'saveDriverResult',
                data: { success: false, alreadySaved: true }
            });

            expect(toastMessages).toContainEqual({ message: 'Driver already in your pipeline', type: 'info' });
        });

        it('should show error toast on failure', () => {
            processMessage({
                type: 'saveDriverResult',
                data: { success: false, error: 'Pipeline limit reached' }
            });

            expect(toastMessages).toContainEqual({ message: 'Pipeline limit reached', type: 'error' });
        });
    });

    // =========================================================================
    // CONTACT DRIVER
    // =========================================================================
    describe('Contact Driver', () => {
        it('should show success and close modal on message sent', () => {
            mockElements['contactModal'].classList.remove('hidden');
            mockElements['contactMessageInput'].value = 'Hello there!';

            processMessage({
                type: 'contactDriverResult',
                data: { success: true }
            });

            expect(toastMessages).toContainEqual({ message: 'Message sent successfully!', type: 'success' });
            expect(mockElements['contactModal'].classList.contains('hidden')).toBe(true);
            expect(mockElements['contactMessageInput'].value).toBe('');
        });

        it('should show subscription required error', () => {
            processMessage({
                type: 'contactDriverResult',
                data: { success: false, requiresSubscription: true }
            });

            expect(toastMessages).toContainEqual(
                expect.objectContaining({ type: 'error', message: expect.stringContaining('subscription') })
            );
        });
    });

    // =========================================================================
    // SAVED SEARCHES
    // =========================================================================
    describe('Saved Searches', () => {
        it('should render saved searches list', () => {
            processMessage({
                type: 'savedSearchesLoaded',
                data: {
                    success: true,
                    searches: [
                        { id: 's1', name: 'Texas CDL-A' },
                        { id: 's2', name: 'Hazmat Drivers' },
                        { id: 's3', name: 'Local Immediate' }
                    ]
                }
            });

            expect(mockElements['savedSearchesList'].children.length).toBe(3);
            expect(mockElements['savedSearchesList'].children[0].getAttribute('data-name')).toBe('Texas CDL-A');
        });

        it('should show toast on save search success', () => {
            processMessage({
                type: 'saveSearchResult',
                data: { success: true }
            });

            expect(toastMessages).toContainEqual({ message: 'Search saved successfully!', type: 'success' });
            expect(mockElements['saveSearchModal'].classList.contains('hidden')).toBe(true);
        });

        it('should render drivers from saved search execution', () => {
            processMessage({
                type: 'savedSearchExecuted',
                data: {
                    success: true,
                    drivers: [
                        { id: 'd1', name: 'Match 1', matchScore: 90 },
                        { id: 'd2', name: 'Match 2', matchScore: 88 }
                    ],
                    total: 15,
                    newMatches: 3
                }
            });

            expect(mockElements['driverGrid'].children.length).toBe(2);
            expect(mockElements['resultsCount'].textContent).toBe('15');
            expect(toastMessages).toContainEqual(
                expect.objectContaining({ message: 'Found 15 drivers (3 new)', type: 'info' })
            );
        });

        it('should show toast on search deleted', () => {
            processMessage({
                type: 'savedSearchDeleted',
                data: { success: true }
            });

            expect(toastMessages).toContainEqual({ message: 'Search deleted', type: 'success' });
        });
    });

    // =========================================================================
    // WEIGHT PREFERENCES
    // =========================================================================
    describe('Weight Preferences', () => {
        it('should load weight values into sliders', () => {
            processMessage({
                type: 'loadWeightPreferences',
                data: {
                    weights: {
                        qualifications: 35,
                        experience: 25,
                        location: 15,
                        availability: 10,
                        salaryFit: 10,
                        engagement: 5
                    }
                }
            });

            expect(mockElements['sliderQualifications'].value).toBe('35');
            expect(mockElements['sliderExperience'].value).toBe('25');
            expect(mockElements['sliderLocation'].value).toBe('15');
            expect(mockElements['totalPercent'].textContent).toBe('100%');
        });

        it('should show success toast on save', () => {
            processMessage({
                type: 'savePreferencesResult',
                data: { success: true }
            });

            expect(toastMessages).toContainEqual({ message: 'Preferences saved!', type: 'success' });
        });

        it('should show error toast on save failure', () => {
            processMessage({
                type: 'savePreferencesResult',
                data: { success: false, error: 'Invalid weights' }
            });

            expect(toastMessages).toContainEqual({ message: 'Invalid weights', type: 'error' });
        });
    });

    // =========================================================================
    // NO CARRIER / ONBOARDING
    // =========================================================================
    describe('No Carrier State', () => {
        it('should show banner and disable search when no carrier', () => {
            processMessage({
                type: 'noCarrierAssigned',
                data: { message: 'Please complete your fleet profile to start searching.' }
            });

            expect(mockElements['noCarrierBanner'].classList.contains('hidden')).toBe(false);
            expect(mockElements['noCarrierMessage'].textContent).toBe('Please complete your fleet profile to start searching.');
        });

        it('should sanitize XSS in no carrier message', () => {
            processMessage({
                type: 'noCarrierAssigned',
                data: { message: '<img onerror=alert(1)>Bad message' }
            });

            expect(mockElements['noCarrierMessage'].textContent).not.toContain('<img');
        });
    });

    // =========================================================================
    // RECRUITER PROFILE
    // =========================================================================
    describe('Recruiter Profile', () => {
        it('should update sidebar user info', () => {
            processMessage({
                type: 'recruiterProfile',
                data: {
                    name: 'Sarah Johnson',
                    company: 'Swift Transportation'
                }
            });

            expect(mockElements['sidebarUserName'].textContent).toBe('Sarah Johnson');
            expect(mockElements['sidebarUserCompany'].textContent).toBe('Swift Transportation');
            expect(mockElements['sidebarUserInitials'].textContent).toBe('SJ');
        });

        it('should handle single name for initials', () => {
            processMessage({
                type: 'recruiterProfile',
                data: { name: 'Admin', company: '' }
            });

            expect(mockElements['sidebarUserInitials'].textContent).toBe('A');
        });
    });

    // =========================================================================
    // MESSAGE VALIDATION
    // =========================================================================
    describe('Message Validation', () => {
        it('should ignore messages without type', () => {
            const initialCount = mockElements['resultsCount'].textContent;

            processMessage({ data: { total: 999 } });
            processMessage(null);
            processMessage(undefined);

            expect(mockElements['resultsCount'].textContent).toBe(initialCount);
        });
    });
});
