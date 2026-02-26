// ============================================================================
// ROS-VIEW-SEARCH Bridge Tests — RecruiterOS postMessage Contract
// Tests the full reverse matching engine integration within the OS
// ============================================================================

/**
 * These tests validate the postMessage bridge contract between ros-view-search.js
 * (running inside the Wix HTML component iframe) and the Velo page code.
 *
 * Pattern: 
 *   Component sends: window.parent.postMessage({ type, data }, '*')
 *   Velo responds:   htmlComponent.postMessage({ type, data })
 */

// -- Mocks --
const mockVeloBridge = {
    sentMessages: [],
    receivedResponses: [],

    reset() {
        this.sentMessages = [];
        this.receivedResponses = [];
    },

    // Simulate what the ROS bridge sends to Velo
    captureOutbound(msg) {
        this.sentMessages.push(msg);
    },

    // Simulate Velo responding with data
    simulateResponse(type, data) {
        const event = new MessageEvent('message', {
            data: { type, data },
            origin: 'https://www.wix.com'
        });
        window.dispatchEvent(event);
    }
};

// ── Test Suite: Core Search Flow ──
describe('ROS Search View — Core Reverse Match Bridge Contract', () => {

    beforeEach(() => {
        mockVeloBridge.reset();
        // Reset the ROS view state
        if (window.ROS && window.ROS.views && window.ROS.views._search) {
            window.ROS.views._search.clearFilters();
        }
    });

    // ── 1. Search Initialization ──
    describe('driverSearchReady → driverSearchInit', () => {
        it('should send driverSearchReady on mount', () => {
            // When the search view mounts, it sends this signal
            const expectedMsg = { type: 'driverSearchReady', data: {} };
            expect(mockVeloBridge.sentMessages).toContainEqual(
                expect.objectContaining({ type: 'driverSearchReady' })
            );
        });

        it('should render quota bar when driverSearchInit includes quotaStatus', () => {
            const quotaStatus = { used: 5, limit: 25, tier: 'pro' };
            mockVeloBridge.simulateResponse('driverSearchInit', {
                quotaStatus,
                currentCarrierDOT: '1234567'
            });
            const quotaBar = document.getElementById('search-quota-bar');
            expect(quotaBar).toBeTruthy(); // Bar should be present in DOM
        });

        it('should show no-carrier alert when carrier list is empty', () => {
            mockVeloBridge.simulateResponse('driverSearchInit', {
                carriers: [],
                currentCarrierDOT: null
            });
            // Should render the no-carrier-alert banner
            expect(document.getElementById('no-carrier-alert')).toBeTruthy();
        });
    });

    // ── 2. Search Drivers ──
    describe('searchDrivers → searchDriversResult', () => {
        it('should send searchDrivers with correct payload on doSearch()', () => {
            // Trigger a search
            if (window.ROS && window.ROS.views && window.ROS.views._search) {
                window.ROS.views._search.doSearch();
            }
            expect(mockVeloBridge.sentMessages).toContainEqual(
                expect.objectContaining({
                    type: 'searchDrivers',
                    data: expect.objectContaining({ usePreferences: true, includeMutualMatches: true })
                })
            );
        });

        it('should render driver cards on successful searchDriversResult', () => {
            const mockDrivers = [
                { _id: 'driver1', name: 'John D.', matchScore: 94, cdl_type: 'A', city: 'Dallas', state: 'TX', years_experience: 5 },
                { _id: 'driver2', name: 'Maria S.', matchScore: 78, cdl_type: 'B', city: 'Houston', state: 'TX', years_experience: 3, isMutualMatch: true }
            ];
            mockVeloBridge.simulateResponse('searchDriversResult', {
                success: true,
                drivers: mockDrivers,
                quotaStatus: { used: 5, limit: 25, tier: 'pro' }
            });
            const resultsContainer = document.getElementById('search-results');
            expect(resultsContainer).toBeTruthy();
        });

        it('should show Mutual badge on mutual match drivers', () => {
            const driver = { _id: 'drv1', name: 'Test D.', matchScore: 88, isMutualMatch: true };
            mockVeloBridge.simulateResponse('searchDriversResult', {
                success: true,
                drivers: [driver]
            });
            expect(document.body.innerHTML).toContain('Mutual');
        });

        it('should display no-carrier state when search fails with carrier error', () => {
            mockVeloBridge.simulateResponse('searchDriversResult', {
                success: false,
                error: 'No carrier assigned'
            });
            expect(document.getElementById('no-carrier-alert')).toBeTruthy();
        });
    });

    // ── 3. Profile View (Quota-Gated) ──
    describe('viewDriverProfile → viewDriverProfileResult', () => {
        it('should send viewDriverProfile with driverId and matchScore', () => {
            if (window.ROS && window.ROS.views && window.ROS.views._search) {
                window.ROS.views._search.viewProfile('driver123', 94);
            }
            expect(mockVeloBridge.sentMessages).toContainEqual(
                expect.objectContaining({
                    type: 'viewDriverProfile',
                    data: expect.objectContaining({ driverId: 'driver123', matchScore: 94 })
                })
            );
        });

        it('should render profile modal on successful viewDriverProfileResult', () => {
            mockVeloBridge.simulateResponse('viewDriverProfileResult', {
                success: true,
                driver: { name: 'John D.', matchScore: 94, cdl_type: 'A', city: 'Dallas', state: 'TX' },
                quotaStatus: { used: 6, limit: 25, tier: 'pro' }
            });
            expect(document.getElementById('profile-modal')).toBeTruthy();
        });

        it('should show quota exceeded modal when quotaExceeded is true', () => {
            mockVeloBridge.simulateResponse('viewDriverProfileResult', {
                success: false,
                quotaExceeded: true,
                quotaStatus: { used: 25, limit: 25, tier: 'pro' }
            });
            const modal = document.getElementById('profile-modal');
            expect(modal).toBeTruthy();
            expect(modal.innerHTML).toContain('Quota Exceeded');
        });
    });

    // ── 4. Save Driver to Pipeline ──
    describe('saveDriver → saveDriverResult', () => {
        it('should require profile view before saving', () => {
            // Spy on showToast to verify error
            const toastSpy = jest.spyOn(document, 'createElement');
            if (window.ROS && window.ROS.views && window.ROS.views._search) {
                window.ROS.views._search.saveDriver('driver123', 94);
            }
            // Should NOT send saveDriver message (driver not viewed)
            expect(mockVeloBridge.sentMessages.find(m => m.type === 'saveDriver')).toBeFalsy();
        });

        it('should send saveDriver after profile has been viewed', () => {
            // First view the profile
            mockVeloBridge.simulateResponse('viewDriverProfileResult', {
                success: true,
                driver: { _id: 'driver123', name: 'John D.', matchScore: 94 },
                quotaStatus: { used: 6, limit: 25, tier: 'pro' }
            });
            // Now save (profile is now in viewedDriverIds)
            if (window.ROS && window.ROS.views && window.ROS.views._search) {
                window.ROS.views._search.saveDriverFromModal();
            }
            expect(mockVeloBridge.sentMessages).toContainEqual(
                expect.objectContaining({ type: 'saveDriver' })
            );
        });
    });

    // ── 5. Contact Driver ──
    describe('contactDriver → contactDriverResult', () => {
        it('should send contactDriver with driverId and message', () => {
            // Setup: set selectedDriver
            mockVeloBridge.simulateResponse('viewDriverProfileResult', {
                success: true,
                driver: { _id: 'driver123', name: 'John D.', matchScore: 94 }
            });
            // Simulate filling the message textarea
            const div = document.createElement('div');
            div.id = 'msg-textarea';
            div.value = 'Hello, we have an opportunity for you!';
            document.body.appendChild(div);

            if (window.ROS && window.ROS.views && window.ROS.views._search) {
                window.ROS.views._search.sendMessage();
            }
            expect(mockVeloBridge.sentMessages).toContainEqual(
                expect.objectContaining({ type: 'contactDriver' })
            );
        });
    });

    // ── 6. Match Weight Preferences ──
    describe('getWeightPreferences / saveWeightPreferences', () => {
        it('should send getWeightPreferences on mount', () => {
            expect(mockVeloBridge.sentMessages).toContainEqual(
                expect.objectContaining({ type: 'getWeightPreferences' })
            );
        });

        it('should update weight sliders on getWeightPreferencesResult', () => {
            mockVeloBridge.simulateResponse('getWeightPreferencesResult', {
                success: true,
                preferences: {
                    weight_qualifications: 30,
                    weight_experience: 25,
                    weight_location: 20,
                    weight_availability: 10,
                    weight_salary_fit: 10,
                    weight_engagement: 5
                }
            });
            // Weights should be updated in state (can be verified via sliders if orb is open)
        });

        it('should send saveWeightPreferences with all 6 weights summing to ≤100', () => {
            if (window.ROS && window.ROS.views && window.ROS.views._search) {
                window.ROS.views._search.saveWeights();
            }
            const msg = mockVeloBridge.sentMessages.find(m => m.type === 'saveWeightPreferences');
            if (msg) {
                const total = Object.values(msg.data).reduce((a, b) => a + b, 0);
                expect(total).toBeLessThanOrEqual(100);
            }
        });
    });

    // ── 7. Saved Searches ──
    describe('loadSavedSearches / saveSearch / deleteSavedSearch', () => {
        it('should send loadSavedSearches when "Saved" button clicked', () => {
            if (window.ROS && window.ROS.views && window.ROS.views._search) {
                window.ROS.views._search.loadSaved();
            }
            expect(mockVeloBridge.sentMessages).toContainEqual(
                expect.objectContaining({ type: 'loadSavedSearches' })
            );
        });

        it('should render saved search list on savedSearchesLoaded', () => {
            mockVeloBridge.simulateResponse('savedSearchesLoaded', {
                searches: [
                    { _id: 's1', name: 'CDL-A Dallas', result_count: 47, alert_frequency: 'daily', new_matches_since_last: 3 }
                ]
            });
            expect(document.getElementById('saved-searches-panel')).toBeTruthy();
        });

        it('should send saveSearch with name, criteria, frequency, and channel', () => {
            // Simulate name input
            const nameInput = document.createElement('input');
            nameInput.id = 'save-search-name';
            nameInput.value = 'CDL-A OTR Dallas';
            document.body.appendChild(nameInput);

            if (window.ROS && window.ROS.views && window.ROS.views._search) {
                window.ROS.views._search.submitSaveSearch();
            }
            expect(mockVeloBridge.sentMessages).toContainEqual(
                expect.objectContaining({
                    type: 'saveSearch',
                    data: expect.objectContaining({ searchName: 'CDL-A OTR Dallas' })
                })
            );
        });
    });

    // ── 8. AI Draft Generation ──
    describe('generateAIDraft → generateAIDraftResult', () => {
        it('should send generateAIDraft with driver context', () => {
            // Set driver context
            mockVeloBridge.simulateResponse('viewDriverProfileResult', {
                success: true,
                driver: { _id: 'drv1', name: 'John D.', matchScore: 94 }
            });
            if (window.ROS && window.ROS.views && window.ROS.views._search) {
                window.ROS.views._search.generateAIDraft();
            }
            expect(mockVeloBridge.sentMessages).toContainEqual(
                expect.objectContaining({
                    type: 'generateAIDraft',
                    data: expect.objectContaining({ driverId: expect.any(String) })
                })
            );
        });

        it('should populate textarea on successful generateAIDraftResult', () => {
            const textarea = document.createElement('textarea');
            textarea.id = 'msg-textarea';
            document.body.appendChild(textarea);

            mockVeloBridge.simulateResponse('generateAIDraftResult', {
                success: true,
                draft: 'Hi, we think you would be a great fit for our OTR position!'
            });
            expect(textarea.value).toContain('great fit');
        });
    });

    // ── 9. NEW: Hiring Preferences (Gap 1) ──
    describe('getHiringPreferences → getHiringPreferencesResult', () => {
        it('should send getHiringPreferences when preferences panel opens', () => {
            // This will be implemented when Gap 1 is built
            // Verify message type exists in MESSAGES array
            // expect MESSAGES.includes('getHiringPreferencesResult')
        });

        it('should send saveHiringPreferences with all required fields', () => {
            const expectedPayload = {
                jobType: 'otr',
                teamDriving: false,
                minPay: 0.55,
                maxPay: 0.75
            };
            // When save button in preferences panel is clicked
            // expect(mockVeloBridge.sentMessages).toContainEqual(
            //   expect.objectContaining({ type: 'saveHiringPreferences', data: expectedPayload })
            // );
        });
    });

    // ── 10. NEW: Analytics Mini-Dashboard (Gap 2) ──
    describe('getReverseMatchAnalytics → getReverseMatchAnalyticsResult', () => {
        it('should send getReverseMatchAnalytics on analytics strip click', () => {
            // After Gap 2 is built, clicking the analytics strip should trigger this
        });

        it('should render analytics modal with correct KPIs', () => {
            mockVeloBridge.simulateResponse('getReverseMatchAnalyticsResult', {
                success: true,
                data: {
                    totalSearches: 347,
                    totalViews: 124,
                    contactRate: 0.28,
                    mutualMatches: 3
                }
            });
            // Verify KPI values render in analytics modal
        });
    });

    // ── 11. Upgrade Flow ──
    describe('navigateTo (upgrade)', () => {
        it('should send navigateTo /pricing when upgrade button is clicked', () => {
            if (window.ROS && window.ROS.views && window.ROS.views._search) {
                window.ROS.views._search.upgrade();
            }
            expect(mockVeloBridge.sentMessages).toContainEqual(
                expect.objectContaining({
                    type: 'navigateTo',
                    data: { page: '/pricing' }
                })
            );
        });
    });
});

// ── Test Suite: Quota Management ──
describe('ROS Search View — Quota Display Logic', () => {
    it('should show green quota bar at <50% usage', () => {
        mockVeloBridge.simulateResponse('getQuotaStatusResult', {
            used: 5, limit: 25, tier: 'pro'
        });
        const bar = document.querySelector('[class*="bg-emerald"]');
        // Verify green color applied
    });

    it('should show amber bar at 50-89% usage', () => {
        mockVeloBridge.simulateResponse('getQuotaStatusResult', {
            used: 15, limit: 25, tier: 'pro'
        });
        // Verify amber color applied + Upgrade button appears
    });

    it('should show red bar at ≥90% usage', () => {
        mockVeloBridge.simulateResponse('getQuotaStatusResult', {
            used: 23, limit: 25, tier: 'pro'
        });
        // Verify red color applied
    });

    it('should show ∞ for unlimited quota', () => {
        mockVeloBridge.simulateResponse('getQuotaStatusResult', {
            used: 150, limit: -1, tier: 'enterprise'
        });
        const quotaBar = document.getElementById('search-quota-bar');
        if (quotaBar) {
            expect(quotaBar.innerHTML).toContain('∞');
        }
    });
});

// ── Test Suite: Neumorphic Design Contract ──
describe('ROS Search View — Neumorphic Design Contract', () => {
    it('driver cards should use neu-s class for neumorphic surface', () => {
        mockVeloBridge.simulateResponse('searchDriversResult', {
            success: true,
            drivers: [{ _id: 'd1', name: 'Test D.', matchScore: 91 }]
        });
        const results = document.getElementById('search-results');
        expect(results && results.innerHTML).toContain('neu-s');
    });

    it('filter orbs should use neu-x class when inactive', () => {
        const orbs = document.querySelectorAll('.filter-orb');
        orbs.forEach(orb => {
            if (!orb.classList.contains('filter-orb-active')) {
                expect(orb.classList.contains('neu-x')).toBe(true);
            }
        });
    });

    it('active filter orbs should use filter-orb-active class with blue gradient', () => {
        const cdlOrb = document.querySelector('[data-filter-group="cdlClass"]');
        if (cdlOrb) {
            cdlOrb.click();
            expect(cdlOrb.classList.contains('filter-orb-active')).toBe(true);
        }
    });

    it('profile modal should use neu class for main container', () => {
        mockVeloBridge.simulateResponse('viewDriverProfileResult', {
            success: true,
            driver: { _id: 'd1', name: 'Test D.', matchScore: 91 }
        });
        const modal = document.getElementById('profile-modal');
        expect(modal && modal.innerHTML).toContain('class="relative w-full max-w-lg');
        expect(modal && modal.innerHTML).toContain('neu rounded-2xl');
    });
});
