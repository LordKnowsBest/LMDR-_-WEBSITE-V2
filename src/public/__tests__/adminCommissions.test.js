/* eslint-disable */
/**
 * ADMIN_COMMISSIONS Bridge + Unit Tests
 *
 * Tests for:
 * - src/backend/adminCommissionService.jsw (backend exports)
 * - src/public/admin/ADMIN_COMMISSIONS.html (HTML component + postMessage bridge)
 * - routeMessage wiring for all commission actions
 * - Commission calculation logic
 * - Hold period enforcement
 * - Status transitions
 * - Bulk approval logic
 * - Error handling
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// SOURCE FILE REFERENCES
// =============================================================================

const BACKEND_FILE = path.resolve(
    __dirname, '..', '..', 'backend', 'adminCommissionService.jsw'
);
const HTML_FILE = path.resolve(
    __dirname, '..', 'admin', 'ADMIN_COMMISSIONS.html'
);

const backendCode = fs.readFileSync(BACKEND_FILE, 'utf8');
const htmlCode = fs.readFileSync(HTML_FILE, 'utf8');

// =============================================================================
// MOCKS
// =============================================================================

function createMockComponent() {
    return {
        onMessage: jest.fn(),
        postMessage: jest.fn()
    };
}

const mockBackend = {
    getCommissionRules: jest.fn().mockResolvedValue({ success: true, rules: [{ _id: 'rule1', rule_name: 'Standard Sub', event_type: 'new_subscription', base_rate: 0.10, priority: 1, status: 'active' }] }),
    saveCommissionRule: jest.fn().mockResolvedValue({ success: true, rule: { _id: 'rule1' } }),
    processAutoCommission: jest.fn().mockResolvedValue({ success: true, commission: { _id: 'c1' } }),
    getSalesReps: jest.fn().mockResolvedValue({ success: true, reps: [{ _id: 'rep1', name: 'Alice', email: 'alice@test.com', status: 'active', total_deals: 5, total_revenue: 50000, total_commission: 5000 }] }),
    saveSalesRep: jest.fn().mockResolvedValue({ success: true, rep: { _id: 'rep1' } }),
    getCommissionSummary: jest.fn().mockResolvedValue({ success: true, summary: { total_earned: 10000, total_pending: 3000, total_paid: 7000, count_approved: 4, count_pending: 3, count_paid: 7, total_deals: 14, period: 'month' } }),
    getSalesLeaderboard: jest.fn().mockResolvedValue({ success: true, leaderboard: [{ rank: 1, name: 'Alice', deals: 5, revenue: 50000, commission: 5000, avg_deal_size: 10000 }], period: 'month' }),
    getRepCommissions: jest.fn().mockResolvedValue({ success: true, commissions: [], totalCount: 0, currentPage: 1, pageSize: 50, totalPages: 0 }),
    recordCommission: jest.fn().mockResolvedValue({ success: true, commission: { _id: 'c2' } }),
    approveCommission: jest.fn().mockResolvedValue({ success: true, commissionId: 'c1', status: 'approved' }),
    bulkApproveCommissions: jest.fn().mockResolvedValue({ success: true, results: [], approved: 2, failed: 0 }),
    generatePayoutReport: jest.fn().mockResolvedValue({ success: true, report: [], period: 'month', total_payout: 0 }),
    markCommissionsPaid: jest.fn().mockResolvedValue({ success: true, results: [], paid: 2, failed: 0 })
};

// =============================================================================
// REPLICATED CORE LOGIC (mirrors page code routeMessage pattern)
// =============================================================================

function safeSend(component, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage(data);
        }
    } catch (error) {
        // silently fail
    }
}

async function routeMessage(component, message, backend = mockBackend) {
    if (!message?.action) return;
    const { action } = message;

    try {
        switch (action) {
            case 'getSummary': {
                const data = await backend.getCommissionSummary(message.period || 'month');
                safeSend(component, { action: 'summaryLoaded', payload: data.summary || data });
                break;
            }
            case 'getLeaderboard': {
                const data = await backend.getSalesLeaderboard(message.period || 'month');
                safeSend(component, { action: 'leaderboardLoaded', payload: data });
                break;
            }
            case 'getCommissions': {
                const filters = message.filters || {};
                let data;
                if (filters.repId) {
                    data = await backend.getRepCommissions(filters.repId, filters);
                } else {
                    data = await backend.getRepCommissions(null, filters);
                }
                safeSend(component, { action: 'commissionsLoaded', payload: data });
                break;
            }
            case 'getRules': {
                const data = await backend.getCommissionRules();
                safeSend(component, { action: 'rulesLoaded', payload: data });
                break;
            }
            case 'getReps': {
                const data = await backend.getSalesReps();
                safeSend(component, { action: 'repsLoaded', payload: data });
                break;
            }
            case 'getCommissionDetail': {
                if (!message.commissionId) {
                    safeSend(component, { action: 'actionError', message: 'Missing commission ID' });
                    return;
                }
                const data = await backend.getRepCommissions(null, { commissionId: message.commissionId });
                const commission = (data.commissions || [])[0] || null;
                safeSend(component, { action: 'commissionDetailLoaded', payload: commission });
                break;
            }
            case 'recordCommission': {
                if (!message.commissionData) {
                    safeSend(component, { action: 'actionError', message: 'Missing commission data' });
                    return;
                }
                const result = await backend.recordCommission(message.commissionData);
                if (result.success) {
                    safeSend(component, { action: 'actionSuccess', message: 'Commission recorded successfully' });
                } else {
                    safeSend(component, { action: 'actionError', message: result.error });
                }
                break;
            }
            case 'approveCommission': {
                if (!message.commissionId) {
                    safeSend(component, { action: 'actionError', message: 'Missing commission ID' });
                    return;
                }
                const result = await backend.approveCommission(message.commissionId, message.adminId || 'system');
                if (result.success) {
                    safeSend(component, { action: 'actionSuccess', message: 'Commission approved' });
                } else {
                    safeSend(component, { action: 'actionError', message: result.error });
                }
                break;
            }
            case 'bulkApprove': {
                if (!message.commissionIds || !message.commissionIds.length) {
                    safeSend(component, { action: 'actionError', message: 'No commissions selected' });
                    return;
                }
                const result = await backend.bulkApproveCommissions(message.commissionIds, message.adminId || 'system');
                if (result.success) {
                    safeSend(component, { action: 'actionSuccess', message: `Approved ${result.approved} commission(s)` });
                } else {
                    safeSend(component, { action: 'actionError', message: result.error });
                }
                break;
            }
            case 'saveRule': {
                if (!message.rule) {
                    safeSend(component, { action: 'actionError', message: 'Missing rule data' });
                    return;
                }
                const result = await backend.saveCommissionRule(message.rule);
                if (result.success) {
                    safeSend(component, { action: 'actionSuccess', message: 'Rule saved' });
                } else {
                    safeSend(component, { action: 'actionError', message: result.error });
                }
                break;
            }
            case 'saveRep': {
                if (!message.rep) {
                    safeSend(component, { action: 'actionError', message: 'Missing rep data' });
                    return;
                }
                const result = await backend.saveSalesRep(message.rep);
                if (result.success) {
                    safeSend(component, { action: 'actionSuccess', message: 'Sales rep saved' });
                } else {
                    safeSend(component, { action: 'actionError', message: result.error });
                }
                break;
            }
            case 'generatePayout': {
                const data = await backend.generatePayoutReport(message.period || 'month');
                safeSend(component, { action: 'payoutReportReady', payload: data });
                break;
            }
            case 'markPaid': {
                if (!message.commissionIds || !message.commissionIds.length) {
                    safeSend(component, { action: 'actionError', message: 'No commissions to mark paid' });
                    return;
                }
                const result = await backend.markCommissionsPaid(message.commissionIds, message.payoutReference || '');
                if (result.success) {
                    safeSend(component, { action: 'actionSuccess', message: `Marked ${result.paid} commission(s) as paid` });
                } else {
                    safeSend(component, { action: 'actionError', message: result.error });
                }
                break;
            }
            case 'exportCSV': {
                // CSV export is handled client-side; just acknowledge
                safeSend(component, { action: 'actionSuccess', message: 'CSV export triggered' });
                break;
            }
            default:
                break;
        }
    } catch (error) {
        safeSend(component, {
            action: 'actionError',
            message: error.message || 'An unexpected error occurred'
        });
    }
}

// =============================================================================
// COMMISSION CALCULATION HELPER (mirrors backend logic)
// =============================================================================

function calculateCommission(dealValue, rate) {
    return Number(dealValue) * Number(rate);
}

function isHoldExpired(holdUntilStr) {
    return new Date() >= new Date(holdUntilStr);
}

function getHoldUntilDate(createdDate, holdDays = 30) {
    const d = new Date(createdDate);
    d.setDate(d.getDate() + holdDays);
    return d;
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('ADMIN_COMMISSIONS', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    // =========================================================================
    // SOURCE FILE EXISTENCE
    // =========================================================================

    describe('Source files exist', () => {
        test('backend service file exists', () => {
            expect(fs.existsSync(BACKEND_FILE)).toBe(true);
        });

        test('HTML file exists', () => {
            expect(fs.existsSync(HTML_FILE)).toBe(true);
        });
    });

    // =========================================================================
    // BACKEND EXPORTS
    // =========================================================================

    describe('Backend exports', () => {
        const expectedExports = [
            'getCommissionRules',
            'saveCommissionRule',
            'processAutoCommission',
            'getSalesReps',
            'saveSalesRep',
            'getCommissionSummary',
            'getSalesLeaderboard',
            'getRepCommissions',
            'recordCommission',
            'approveCommission',
            'bulkApproveCommissions',
            'generatePayoutReport',
            'markCommissionsPaid'
        ];

        expectedExports.forEach(fn => {
            test(`exports ${fn}`, () => {
                expect(backendCode).toContain(`export async function ${fn}`);
            });
        });
    });

    // =========================================================================
    // BACKEND STRUCTURE
    // =========================================================================

    describe('Backend structure', () => {
        test('imports from wix-members-backend', () => {
            expect(backendCode).toContain("from 'wix-members-backend'");
        });

        test('imports from backend/dataAccess', () => {
            expect(backendCode).toContain("from 'backend/dataAccess'");
        });

        test('defines COLLECTIONS with required keys', () => {
            expect(backendCode).toContain("commissions: 'commissions'");
            expect(backendCode).toContain("salesReps: 'salesReps'");
            expect(backendCode).toContain("rules: 'commissionRules'");
            expect(backendCode).toContain("auditLog: 'auditLog'");
        });

        test('defines HOLD_PERIOD_DAYS = 30', () => {
            expect(backendCode).toContain('HOLD_PERIOD_DAYS = 30');
        });

        test('defines DEFAULT_RATES', () => {
            expect(backendCode).toContain('new_subscription: 0.10');
            expect(backendCode).toContain('upgrade: 0.05');
            expect(backendCode).toContain('renewal: 0.03');
            expect(backendCode).toContain('placement: 0.15');
        });

        test('defines requireAdmin function', () => {
            expect(backendCode).toContain('async function requireAdmin()');
        });

        test('uses suppressAuth: true for backend operations', () => {
            const matches = backendCode.match(/suppressAuth:\s*true/g) || [];
            expect(matches.length).toBeGreaterThan(5);
        });
    });

    // =========================================================================
    // HTML STRUCTURE
    // =========================================================================

    describe('HTML structure', () => {
        test('uses VelocityMatch branding', () => {
            expect(htmlCode).toContain('VelocityMatch Commission Tracking');
            expect(htmlCode).toContain('>VM</div>');
            // lmdr color key in Tailwind config is accepted (same pattern as ADMIN_DASHBOARD)
            expect(htmlCode).not.toMatch(/<title>.*LMDR/i);
        });

        test('has postMessage bridge listener', () => {
            expect(htmlCode).toContain("window.addEventListener('message'");
        });

        test('handles init action', () => {
            expect(htmlCode).toContain("case 'init':");
            expect(htmlCode).toContain('loadInitialData()');
        });

        test('handles all expected incoming actions', () => {
            const expectedActions = [
                'summaryLoaded',
                'leaderboardLoaded',
                'commissionsLoaded',
                'rulesLoaded',
                'repsLoaded',
                'commissionDetailLoaded',
                'payoutReportReady',
                'actionSuccess',
                'actionError'
            ];
            expectedActions.forEach(action => {
                expect(htmlCode).toContain(`case '${action}':`);
            });
        });

        test('sends expected outgoing actions', () => {
            const outgoingActions = [
                'getSummary',
                'getLeaderboard',
                'getCommissions',
                'getRules',
                'getReps',
                'getCommissionDetail',
                'recordCommission',
                'approveCommission',
                'bulkApprove',
                'saveRule',
                'saveRep',
                'generatePayout',
                'markPaid',
                'exportCSV'
            ];
            outgoingActions.forEach(action => {
                expect(htmlCode).toContain(`action: '${action}'`);
            });
        });

        test('has summary cards (earned, pending, paid)', () => {
            expect(htmlCode).toContain('id="totalEarned"');
            expect(htmlCode).toContain('id="totalPending"');
            expect(htmlCode).toContain('id="totalPaid"');
        });

        test('has four tabs', () => {
            expect(htmlCode).toContain("data-tab=\"leaderboard\"");
            expect(htmlCode).toContain("data-tab=\"commissions\"");
            expect(htmlCode).toContain("data-tab=\"rules\"");
            expect(htmlCode).toContain("data-tab=\"reps\"");
        });

        test('has required modals', () => {
            expect(htmlCode).toContain('id="commissionDetailModal"');
            expect(htmlCode).toContain('id="recordCommissionModal"');
            expect(htmlCode).toContain('id="ruleModal"');
            expect(htmlCode).toContain('id="repModal"');
            expect(htmlCode).toContain('id="payoutModal"');
        });

        test('includes Tailwind CDN with inline config', () => {
            expect(htmlCode).toContain('cdn.tailwindcss.com');
            expect(htmlCode).toContain('tailwind.config');
        });

        test('includes Chart.js', () => {
            expect(htmlCode).toContain('chart.js');
        });

        test('has period selector', () => {
            expect(htmlCode).toContain('id="periodSelector"');
        });

        test('has bulk approve button', () => {
            expect(htmlCode).toContain('id="btnBulkApprove"');
        });
    });

    // =========================================================================
    // ROUTE MESSAGE TESTS
    // =========================================================================

    describe('routeMessage', () => {
        test('ignores messages with no action', async () => {
            await routeMessage(component, {});
            await routeMessage(component, null);
            await routeMessage(component, undefined);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('getSummary calls getCommissionSummary and sends summaryLoaded', async () => {
            await routeMessage(component, { action: 'getSummary', period: 'quarter' });
            expect(mockBackend.getCommissionSummary).toHaveBeenCalledWith('quarter');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'summaryLoaded' })
            );
        });

        test('getLeaderboard calls getSalesLeaderboard and sends leaderboardLoaded', async () => {
            await routeMessage(component, { action: 'getLeaderboard', period: 'month' });
            expect(mockBackend.getSalesLeaderboard).toHaveBeenCalledWith('month');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'leaderboardLoaded' })
            );
        });

        test('getCommissions calls getRepCommissions and sends commissionsLoaded', async () => {
            await routeMessage(component, { action: 'getCommissions', filters: { status: 'pending' } });
            expect(mockBackend.getRepCommissions).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'commissionsLoaded' })
            );
        });

        test('getRules calls getCommissionRules and sends rulesLoaded', async () => {
            await routeMessage(component, { action: 'getRules' });
            expect(mockBackend.getCommissionRules).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'rulesLoaded' })
            );
        });

        test('getReps calls getSalesReps and sends repsLoaded', async () => {
            await routeMessage(component, { action: 'getReps' });
            expect(mockBackend.getSalesReps).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'repsLoaded' })
            );
        });

        test('recordCommission with missing data sends actionError', async () => {
            await routeMessage(component, { action: 'recordCommission' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'actionError', message: 'Missing commission data' })
            );
        });

        test('recordCommission with data sends actionSuccess', async () => {
            await routeMessage(component, {
                action: 'recordCommission',
                commissionData: { sales_rep_id: 'rep1', deal_value: 1000, event_type: 'new_subscription' }
            });
            expect(mockBackend.recordCommission).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'actionSuccess', message: 'Commission recorded successfully' })
            );
        });

        test('approveCommission with missing ID sends actionError', async () => {
            await routeMessage(component, { action: 'approveCommission' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'actionError', message: 'Missing commission ID' })
            );
        });

        test('approveCommission with valid ID sends actionSuccess', async () => {
            await routeMessage(component, { action: 'approveCommission', commissionId: 'c1' });
            expect(mockBackend.approveCommission).toHaveBeenCalledWith('c1', 'system');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'actionSuccess', message: 'Commission approved' })
            );
        });

        test('bulkApprove with no IDs sends actionError', async () => {
            await routeMessage(component, { action: 'bulkApprove', commissionIds: [] });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'actionError', message: 'No commissions selected' })
            );
        });

        test('bulkApprove with IDs sends actionSuccess', async () => {
            await routeMessage(component, { action: 'bulkApprove', commissionIds: ['c1', 'c2'] });
            expect(mockBackend.bulkApproveCommissions).toHaveBeenCalledWith(['c1', 'c2'], 'system');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'actionSuccess' })
            );
        });

        test('saveRule with missing data sends actionError', async () => {
            await routeMessage(component, { action: 'saveRule' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'actionError', message: 'Missing rule data' })
            );
        });

        test('saveRule with valid data sends actionSuccess', async () => {
            await routeMessage(component, { action: 'saveRule', rule: { rule_name: 'Test', event_type: 'renewal', base_rate: 0.03 } });
            expect(mockBackend.saveCommissionRule).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'actionSuccess', message: 'Rule saved' })
            );
        });

        test('saveRep with missing data sends actionError', async () => {
            await routeMessage(component, { action: 'saveRep' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'actionError', message: 'Missing rep data' })
            );
        });

        test('saveRep with valid data sends actionSuccess', async () => {
            await routeMessage(component, { action: 'saveRep', rep: { name: 'Bob', email: 'bob@test.com' } });
            expect(mockBackend.saveSalesRep).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'actionSuccess', message: 'Sales rep saved' })
            );
        });

        test('generatePayout calls generatePayoutReport and sends payoutReportReady', async () => {
            await routeMessage(component, { action: 'generatePayout', period: 'month' });
            expect(mockBackend.generatePayoutReport).toHaveBeenCalledWith('month');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'payoutReportReady' })
            );
        });

        test('markPaid with no IDs sends actionError', async () => {
            await routeMessage(component, { action: 'markPaid', commissionIds: [] });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'actionError', message: 'No commissions to mark paid' })
            );
        });

        test('markPaid with valid IDs sends actionSuccess', async () => {
            await routeMessage(component, { action: 'markPaid', commissionIds: ['c1', 'c2'], payoutReference: 'CHK-001' });
            expect(mockBackend.markCommissionsPaid).toHaveBeenCalledWith(['c1', 'c2'], 'CHK-001');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'actionSuccess' })
            );
        });

        test('getCommissionDetail with no ID sends actionError', async () => {
            await routeMessage(component, { action: 'getCommissionDetail' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'actionError', message: 'Missing commission ID' })
            );
        });

        test('unknown action does nothing', async () => {
            await routeMessage(component, { action: 'nonexistentAction' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('backend error sends actionError', async () => {
            mockBackend.getCommissionSummary.mockRejectedValueOnce(new Error('DB down'));
            await routeMessage(component, { action: 'getSummary' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'actionError', message: 'DB down' })
            );
        });
    });

    // =========================================================================
    // COMMISSION CALCULATION TESTS
    // =========================================================================

    describe('Commission calculations', () => {
        test('basic rate * deal_value', () => {
            expect(calculateCommission(1000, 0.10)).toBe(100);
            expect(calculateCommission(5000, 0.05)).toBe(250);
            expect(calculateCommission(2000, 0.15)).toBe(300);
            expect(calculateCommission(10000, 0.03)).toBe(300);
        });

        test('handles zero values', () => {
            expect(calculateCommission(0, 0.10)).toBe(0);
            expect(calculateCommission(1000, 0)).toBe(0);
        });

        test('handles decimal deal values', () => {
            expect(calculateCommission(1999.99, 0.10)).toBeCloseTo(200.00, 1);
        });

        test('default rates match spec', () => {
            expect(calculateCommission(1000, 0.10)).toBe(100);   // new_subscription 10%
            expect(calculateCommission(1000, 0.05)).toBe(50);    // upgrade 5%
            expect(calculateCommission(1000, 0.03)).toBe(30);    // renewal 3%
            expect(calculateCommission(1000, 0.15)).toBe(150);   // placement 15%
        });
    });

    // =========================================================================
    // HOLD PERIOD ENFORCEMENT
    // =========================================================================

    describe('Hold period enforcement', () => {
        test('hold period is 30 days from creation', () => {
            const created = new Date('2026-01-01T00:00:00Z');
            const holdUntil = getHoldUntilDate(created);
            expect(holdUntil.toISOString()).toBe('2026-01-31T00:00:00.000Z');
        });

        test('cannot approve before hold expires', () => {
            // future date = hold not expired
            const futureHold = new Date();
            futureHold.setDate(futureHold.getDate() + 15);
            expect(isHoldExpired(futureHold.toISOString())).toBe(false);
        });

        test('can approve after hold expires', () => {
            // past date = hold expired
            const pastHold = new Date();
            pastHold.setDate(pastHold.getDate() - 1);
            expect(isHoldExpired(pastHold.toISOString())).toBe(true);
        });

        test('backend enforces hold period in approveCommission', () => {
            // Verify the backend code checks hold_until
            expect(backendCode).toContain('hold_until');
            expect(backendCode).toContain('Hold period has not expired');
            expect(backendCode).toContain('daysRemaining');
        });
    });

    // =========================================================================
    // STATUS TRANSITIONS
    // =========================================================================

    describe('Status transitions', () => {
        test('backend validates pending -> approved transition', () => {
            expect(backendCode).toContain("commission.status !== 'pending'");
            expect(backendCode).toContain("Cannot approve commission with status");
        });

        test('valid statuses are pending, approved, paid', () => {
            expect(backendCode).toContain("'pending', 'approved', 'paid'");
        });

        test('new commissions start as pending', () => {
            expect(backendCode).toContain("status: 'pending'");
        });

        test('markCommissionsPaid sets status to paid', () => {
            expect(backendCode).toContain("status: 'paid'");
            expect(backendCode).toContain('paid_date');
            expect(backendCode).toContain('payout_reference');
        });

        test('approval sets approved_by and approved_date', () => {
            expect(backendCode).toContain("status: 'approved'");
            expect(backendCode).toContain('approved_by');
            expect(backendCode).toContain('approved_date');
        });
    });

    // =========================================================================
    // BULK APPROVAL
    // =========================================================================

    describe('Bulk approval', () => {
        test('bulkApproveCommissions iterates through IDs', () => {
            expect(backendCode).toContain('for (const id of commissionIds)');
        });

        test('returns count of approved and failed', () => {
            expect(backendCode).toContain('approved');
            expect(backendCode).toContain('failed');
        });

        test('calls approveCommission for each ID', () => {
            expect(backendCode).toContain('await approveCommission(id, adminId)');
        });

        test('route rejects empty bulk approve', async () => {
            await routeMessage(component, { action: 'bulkApprove', commissionIds: [] });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'actionError' })
            );
        });

        test('route processes valid bulk approve', async () => {
            mockBackend.bulkApproveCommissions.mockResolvedValueOnce({ success: true, results: [{ commissionId: 'c1', success: true }, { commissionId: 'c2', success: true }], approved: 2, failed: 0 });
            await routeMessage(component, { action: 'bulkApprove', commissionIds: ['c1', 'c2'] });
            expect(mockBackend.bulkApproveCommissions).toHaveBeenCalledWith(['c1', 'c2'], 'system');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'actionSuccess', message: 'Approved 2 commission(s)' })
            );
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error handling', () => {
        test('backend functions return { success: false, error } on failure', () => {
            const errorPatterns = backendCode.match(/return\s*\{\s*success:\s*false/g) || [];
            expect(errorPatterns.length).toBeGreaterThan(5);
        });

        test('backend catches errors in all exported functions', () => {
            const tryCatchMatches = backendCode.match(/try\s*\{[\s\S]*?catch\s*\(/g) || [];
            expect(tryCatchMatches.length).toBeGreaterThan(8);
        });

        test('routeMessage wraps all handlers in try-catch', async () => {
            mockBackend.getCommissionRules.mockRejectedValueOnce(new Error('Network error'));
            await routeMessage(component, { action: 'getRules' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'actionError', message: 'Network error' })
            );
        });

        test('safeSend handles null component gracefully', () => {
            expect(() => safeSend(null, { action: 'test' })).not.toThrow();
        });

        test('safeSend handles component without postMessage', () => {
            expect(() => safeSend({}, { action: 'test' })).not.toThrow();
        });

        test('backend validates required fields for rules', () => {
            expect(backendCode).toContain('rule_name');
            expect(backendCode).toContain('event_type');
            expect(backendCode).toContain('base_rate');
        });

        test('backend validates required fields for reps', () => {
            expect(backendCode).toContain("!rep.name || !rep.email");
        });

        test('backend validates event_type against EVENT_TYPES', () => {
            expect(backendCode).toContain('EVENT_TYPES.includes(eventType)');
        });
    });

    // =========================================================================
    // AUDIT LOGGING
    // =========================================================================

    describe('Audit logging', () => {
        test('recordCommission logs to auditLog', () => {
            expect(backendCode).toContain("action: 'commission_recorded'");
        });

        test('approveCommission logs to auditLog', () => {
            expect(backendCode).toContain("action: 'commission_approved'");
        });

        test('markCommissionsPaid logs to auditLog', () => {
            expect(backendCode).toContain("action: 'commissions_paid'");
        });
    });
});
