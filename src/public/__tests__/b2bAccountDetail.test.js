/**
 * B2B_ACCOUNT_DETAIL Page Code Tests
 *
 * Tests for src/pages/B2B_ACCOUNT_DETAIL.f31mi.js
 * Verifies HTML component discovery safety, accountId extraction,
 * message routing, signal lookup via carrier DOT, risk detection
 * with fallback logic, timeline auto-refresh, and error handling.
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// SOURCE FILE REFERENCE
// =============================================================================

const PAGE_FILE = path.resolve(
    __dirname, '..', '..', 'pages', 'B2B_ACCOUNT_DETAIL.f31mi.js'
);
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

// =============================================================================
// MOCKS
// =============================================================================

function createMockComponent() {
    return {
        onMessage: jest.fn(),
        postMessage: jest.fn()
    };
}

const mockWixLocation = { to: jest.fn(), query: {} };

const mockBackend = {
    getAccount: jest.fn().mockResolvedValue({ success: true, account: { _id: 'acct-1', name: 'Acme', carrier_dot: '123456' } }),
    getContactsByAccount: jest.fn().mockResolvedValue({ success: true, contacts: [{ _id: 'c1', name: 'Jane' }] }),
    getSignalByCarrier: jest.fn().mockResolvedValue({ success: true, signal: { score: 85, intent: 'high' } }),
    getOpportunitiesByAccount: jest.fn().mockResolvedValue({ success: true, opportunities: [{ _id: 'o1', stage: 'proposal', value: 200 }] }),
    getDealsAtRisk: jest.fn().mockResolvedValue({ success: true, atRisk: [] }),
    getAccountTimeline: jest.fn().mockResolvedValue({ success: true, activities: [{ _id: 'a1', type: 'call' }] }),
    logActivity: jest.fn().mockResolvedValue({ success: true }),
    logCall: jest.fn().mockResolvedValue({ success: true }),
    logEmail: jest.fn().mockResolvedValue({ success: true }),
    logSms: jest.fn().mockResolvedValue({ success: true }),
    logTask: jest.fn().mockResolvedValue({ success: true }),
    generateBrief: jest.fn().mockResolvedValue({ success: true })
};

// =============================================================================
// REPLICATED CORE LOGIC (mirrors page code for testability)
// =============================================================================

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function getHtmlComponents($w) {
    const found = [];
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const component = $w(id);
            if (component && typeof component.onMessage === 'function') {
                found.push(component);
            }
        } catch (error) {
            // Element may not exist on this page variant
        }
    }
    return found;
}

function extractAccountId(query) {
    return query?.accountId || query?.id || '';
}

async function routeMessage(component, accountId, message, backend = mockBackend, wixLocation = mockWixLocation) {
    if (!message?.action) return;

    switch (message.action) {
        case 'getAccount':
            await handleGetAccount(component, message.accountId || accountId, backend);
            break;
        case 'getSignal':
            await handleGetSignal(component, message.accountId || accountId, backend);
            break;
        case 'getOpportunity':
            await handleGetOpportunity(component, message.accountId || accountId, backend);
            break;
        case 'getContacts':
            await handleGetContacts(component, message.accountId || accountId, backend);
            break;
        case 'getTimeline':
            await handleGetTimeline(component, message.accountId || accountId, message.limit, backend);
            break;
        case 'getRisks':
            await handleGetRisks(component, message.accountId || accountId, backend);
            break;
        case 'accountAction':
            await handleAccountAction(component, message.accountId || accountId, message.type, backend);
            break;
        case 'navigate':
            handleNavigation(message.target, wixLocation);
            break;
        default:
            console.warn('B2B Account Detail: Unknown message action', message.action);
    }
}

async function handleGetAccount(component, accountId, backend) {
    try {
        const result = await backend.getAccount(accountId);
        if (result.success && result.account) {
            component.postMessage({ action: 'accountLoaded', payload: result.account });
        } else {
            component.postMessage({ action: 'actionError', message: result.error || 'Account not found' });
        }
    } catch (error) {
        console.error('B2B Account Detail: getAccount error', error);
        component.postMessage({ action: 'actionError', message: 'Failed to load account' });
    }
}

async function handleGetSignal(component, accountId, backend) {
    try {
        const accountResult = await backend.getAccount(accountId);
        if (!accountResult.success || !accountResult.account?.carrier_dot) {
            component.postMessage({ action: 'signalLoaded', payload: null });
            return;
        }

        const signalResult = await backend.getSignalByCarrier(accountResult.account.carrier_dot);
        if (signalResult.success && signalResult.signal) {
            component.postMessage({ action: 'signalLoaded', payload: signalResult.signal });
        } else {
            component.postMessage({ action: 'signalLoaded', payload: null });
        }
    } catch (error) {
        console.error('B2B Account Detail: getSignal error', error);
        component.postMessage({ action: 'signalLoaded', payload: null });
    }
}

async function handleGetOpportunity(component, accountId, backend) {
    try {
        const result = await backend.getOpportunitiesByAccount(accountId);
        if (result.success && result.opportunities && result.opportunities.length > 0) {
            const active = result.opportunities.find(
                o => o.stage !== 'closed_won' && o.stage !== 'closed_lost'
            );
            component.postMessage({
                action: 'opportunityLoaded',
                payload: active || result.opportunities[0]
            });
        } else {
            component.postMessage({ action: 'opportunityLoaded', payload: null });
        }
    } catch (error) {
        console.error('B2B Account Detail: getOpportunity error', error);
        component.postMessage({ action: 'opportunityLoaded', payload: null });
    }
}

async function handleGetContacts(component, accountId, backend) {
    try {
        const result = await backend.getContactsByAccount(accountId);
        if (result.success) {
            component.postMessage({ action: 'contactsLoaded', payload: result.contacts || [] });
        } else {
            component.postMessage({ action: 'contactsLoaded', payload: [] });
        }
    } catch (error) {
        console.error('B2B Account Detail: getContacts error', error);
        component.postMessage({ action: 'contactsLoaded', payload: [] });
    }
}

async function handleGetTimeline(component, accountId, limit, backend) {
    try {
        const result = await backend.getAccountTimeline(accountId, { limit: limit || 30 });
        if (result.success) {
            component.postMessage({ action: 'timelineLoaded', payload: result.activities || [] });
        } else {
            component.postMessage({ action: 'timelineLoaded', payload: [] });
        }
    } catch (error) {
        console.error('B2B Account Detail: getTimeline error', error);
        component.postMessage({ action: 'timelineLoaded', payload: [] });
    }
}

async function handleGetRisks(component, accountId, backend) {
    try {
        const result = await backend.getDealsAtRisk({ accountId });
        if (result.success && result.atRisk) {
            const risks = [];
            for (const opp of result.atRisk) {
                if (opp.account_id === accountId && opp.risk_flags) {
                    risks.push(...opp.risk_flags);
                }
            }
            component.postMessage({ action: 'risksLoaded', payload: risks });
        } else {
            await handleGetRisksFallback(component, accountId, backend);
        }
    } catch (error) {
        console.error('B2B Account Detail: getRisks error', error);
        component.postMessage({ action: 'risksLoaded', payload: [] });
    }
}

async function handleGetRisksFallback(component, accountId, backend) {
    try {
        const oppResult = await backend.getOpportunitiesByAccount(accountId);
        if (!oppResult.success || !oppResult.opportunities) {
            component.postMessage({ action: 'risksLoaded', payload: [] });
            return;
        }

        const risks = [];
        const now = new Date();
        for (const opp of oppResult.opportunities) {
            if (opp.stage === 'closed_won' || opp.stage === 'closed_lost') continue;

            if (opp.updated_at) {
                const daysSince = (now - new Date(opp.updated_at)) / (1000 * 60 * 60 * 24);
                if (daysSince > 10) {
                    risks.push({ type: 'stalled', message: `No activity in ${Math.round(daysSince)} days` });
                }
            }
            if (opp.next_step_at && new Date(opp.next_step_at) < now) {
                const daysOverdue = Math.round((now - new Date(opp.next_step_at)) / (1000 * 60 * 60 * 24));
                risks.push({ type: 'overdue', message: `Next step overdue by ${daysOverdue} days` });
            }
            if (!opp.next_step || !opp.next_step.trim()) {
                risks.push({ type: 'no_next_step', message: 'No next step defined' });
            }
        }
        component.postMessage({ action: 'risksLoaded', payload: risks });
    } catch (error) {
        component.postMessage({ action: 'risksLoaded', payload: [] });
    }
}

async function handleAccountAction(component, accountId, actionType, backend) {
    if (!actionType) {
        component.postMessage({ action: 'actionError', message: 'No action type specified' });
        return;
    }

    try {
        switch (actionType) {
            case 'call':
                await backend.logCall(accountId, '', { outcome: 'completed' });
                component.postMessage({ action: 'actionSuccess', message: 'Call logged' });
                refreshTimeline(component, accountId, backend);
                break;
            case 'email':
                await backend.logEmail(accountId, '', 'Outreach email', 'sent');
                component.postMessage({ action: 'actionSuccess', message: 'Email logged' });
                refreshTimeline(component, accountId, backend);
                break;
            case 'sms':
                await backend.logSms(accountId, '', 'Text message', 'sent');
                component.postMessage({ action: 'actionSuccess', message: 'SMS logged' });
                refreshTimeline(component, accountId, backend);
                break;
            case 'task':
                await backend.logTask(accountId, 'Follow-up task', 'scheduled');
                component.postMessage({ action: 'actionSuccess', message: 'Task created' });
                refreshTimeline(component, accountId, backend);
                break;
            case 'brief':
                await handleGenerateBrief(component, accountId, backend);
                break;
            case 'addContact':
                await backend.logActivity({
                    account_id: accountId,
                    type: 'note',
                    subject: 'Contact add requested',
                    notes: 'New contact addition initiated from account detail'
                });
                component.postMessage({ action: 'actionSuccess', message: 'Contact request logged' });
                break;
            case 'logActivity':
                await backend.logActivity({
                    account_id: accountId,
                    type: 'note',
                    subject: 'Manual activity log',
                    notes: 'Activity logged from account detail'
                });
                component.postMessage({ action: 'actionSuccess', message: 'Activity logged' });
                refreshTimeline(component, accountId, backend);
                break;
            default:
                component.postMessage({ action: 'actionError', message: `Unknown action: ${actionType}` });
        }
    } catch (error) {
        console.error('B2B Account Detail: action error', actionType, error);
        component.postMessage({ action: 'actionError', message: error.message || `Failed to execute ${actionType}` });
    }
}

async function handleGenerateBrief(component, accountId, backend) {
    try {
        const result = await backend.generateBrief(accountId);
        if (result.success) {
            component.postMessage({ action: 'actionSuccess', message: 'Research brief generated' });
            refreshTimeline(component, accountId, backend);
        } else {
            component.postMessage({ action: 'actionError', message: result.error || 'Brief generation failed' });
        }
    } catch (error) {
        console.error('B2B Account Detail: generateBrief error', error);
        component.postMessage({ action: 'actionError', message: 'Failed to generate brief' });
    }
}

function handleNavigation(target, wixLocation) {
    if (!target) return;

    const routes = {
        dashboard: '/b2b-dashboard',
        pipeline: '/b2b-pipeline',
        analytics: '/b2b-analytics'
    };

    const routePath = routes[target] || `/${target}`;
    wixLocation.to(routePath);
}

function refreshTimeline(component, accountId, backend) {
    handleGetTimeline(component, accountId, 30, backend).catch(err => {
        console.warn('B2B Account Detail: timeline refresh failed', err.message);
    });
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('B2B_ACCOUNT_DETAIL Page Code', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.warn.mockRestore();
        console.error.mockRestore();
    });

    // =========================================================================
    // SOURCE FILE STRUCTURAL CHECKS
    // =========================================================================

    describe('Source file structure', () => {
        test('imports from backend/b2bAccountService', () => {
            expect(sourceCode).toContain("from 'backend/b2bAccountService'");
        });

        test('imports from backend/b2bMatchSignalService', () => {
            expect(sourceCode).toContain("from 'backend/b2bMatchSignalService'");
        });

        test('imports from backend/b2bPipelineService', () => {
            expect(sourceCode).toContain("from 'backend/b2bPipelineService'");
        });

        test('imports from backend/b2bActivityService', () => {
            expect(sourceCode).toContain("from 'backend/b2bActivityService'");
        });

        test('imports from backend/b2bResearchAgentService', () => {
            expect(sourceCode).toContain("from 'backend/b2bResearchAgentService'");
        });

        test('imports wixLocation', () => {
            expect(sourceCode).toContain("import wixLocation from 'wix-location'");
        });

        test('defines $w.onReady', () => {
            expect(sourceCode).toMatch(/\$w\.onReady/);
        });

        test('defines HTML_COMPONENT_IDS with expected IDs', () => {
            expect(sourceCode).toContain('#html1');
            expect(sourceCode).toContain('#html2');
            expect(sourceCode).toContain('#html3');
            expect(sourceCode).toContain('#html4');
            expect(sourceCode).toContain('#html5');
            expect(sourceCode).toContain('#htmlEmbed1');
        });

        test('defines getHtmlComponents function', () => {
            expect(sourceCode).toContain('function getHtmlComponents()');
        });

        test('defines routeMessage function', () => {
            expect(sourceCode).toContain('async function routeMessage(');
        });

        test('defines refreshTimeline function', () => {
            expect(sourceCode).toContain('function refreshTimeline(');
        });
    });

    // =========================================================================
    // SAFETY CHECKS
    // =========================================================================

    describe('Safety checks', () => {
        test('all $w() calls are wrapped in try-catch in getHtmlComponents', () => {
            expect(sourceCode).toMatch(/try\s*\{[\s\S]*?\$w\(id\)[\s\S]*?\}\s*catch/);
        });

        test('onReady checks for empty components before proceeding', () => {
            expect(sourceCode).toMatch(/if\s*\(!components\.length\)/);
        });

        test('onReady redirects when no accountId is present', () => {
            expect(sourceCode).toMatch(/if\s*\(!accountId\)/);
            expect(sourceCode).toContain("wixLocation.to('/b2b-dashboard')");
        });

        test('routeMessage checks for null/missing message.action', () => {
            expect(sourceCode).toMatch(/if\s*\(!message\?\.action\)\s*return/);
        });

        test('component.onMessage check verifies typeof is function', () => {
            expect(sourceCode).toContain("typeof component.onMessage === 'function'");
        });
    });

    // =========================================================================
    // HTML COMPONENT DISCOVERY
    // =========================================================================

    describe('HTML component discovery', () => {
        test('finds components that have onMessage method', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html1') return createMockComponent();
                if (id === '#html2') return createMockComponent();
                throw new Error('not found');
            });

            const components = getHtmlComponents(mock$w);
            expect(components).toHaveLength(2);
            expect(mock$w).toHaveBeenCalledWith('#html1');
            expect(mock$w).toHaveBeenCalledWith('#html2');
        });

        test('skips components that throw errors', () => {
            const mock$w = jest.fn(() => { throw new Error('not on page'); });
            const components = getHtmlComponents(mock$w);
            expect(components).toHaveLength(0);
        });

        test('skips components without onMessage', () => {
            const mock$w = jest.fn(() => ({ postMessage: jest.fn() }));
            const components = getHtmlComponents(mock$w);
            expect(components).toHaveLength(0);
        });

        test('skips components that return null-ish from $w', () => {
            const mock$w = jest.fn(() => null);
            const components = getHtmlComponents(mock$w);
            expect(components).toHaveLength(0);
        });

        test('tries all six component IDs', () => {
            const mock$w = jest.fn(() => { throw new Error('skip'); });
            getHtmlComponents(mock$w);
            expect(mock$w).toHaveBeenCalledTimes(6);
            expect(mock$w).toHaveBeenCalledWith('#html1');
            expect(mock$w).toHaveBeenCalledWith('#html2');
            expect(mock$w).toHaveBeenCalledWith('#html3');
            expect(mock$w).toHaveBeenCalledWith('#html4');
            expect(mock$w).toHaveBeenCalledWith('#html5');
            expect(mock$w).toHaveBeenCalledWith('#htmlEmbed1');
        });
    });

    // =========================================================================
    // ACCOUNT ID EXTRACTION
    // =========================================================================

    describe('AccountId extraction from URL query params', () => {
        test('uses accountId when present in query', () => {
            expect(extractAccountId({ accountId: 'acct-from-accountId' })).toBe('acct-from-accountId');
        });

        test('falls back to id when accountId is missing', () => {
            expect(extractAccountId({ id: 'acct-from-id' })).toBe('acct-from-id');
        });

        test('prefers accountId over id when both present', () => {
            expect(extractAccountId({ accountId: 'primary', id: 'fallback' })).toBe('primary');
        });

        test('returns empty string when neither accountId nor id is present', () => {
            expect(extractAccountId({})).toBe('');
        });

        test('returns empty string when query is null', () => {
            expect(extractAccountId(null)).toBe('');
        });

        test('returns empty string when query is undefined', () => {
            expect(extractAccountId(undefined)).toBe('');
        });

        test('source code extracts accountId with fallback pattern', () => {
            expect(sourceCode).toContain("wixLocation.query?.accountId || wixLocation.query?.id || ''");
        });
    });

    // =========================================================================
    // MESSAGE ROUTING - getAccount
    // =========================================================================

    describe('Message routing: getAccount', () => {
        test('calls getAccount and posts accountLoaded on success', async () => {
            const fakeAccount = { _id: 'acct-1', name: 'Acme Trucking' };
            const backend = { ...mockBackend, getAccount: jest.fn().mockResolvedValue({ success: true, account: fakeAccount }) };

            await routeMessage(component, 'acct-1', { action: 'getAccount' }, backend);

            expect(backend.getAccount).toHaveBeenCalledWith('acct-1');
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'accountLoaded', payload: fakeAccount });
        });

        test('posts actionError with error message when account not found', async () => {
            const backend = { ...mockBackend, getAccount: jest.fn().mockResolvedValue({ success: false, error: 'Not found' }) };

            await routeMessage(component, 'acct-1', { action: 'getAccount' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({ action: 'actionError', message: 'Not found' });
        });

        test('posts actionError with fallback message when result has no error string', async () => {
            const backend = { ...mockBackend, getAccount: jest.fn().mockResolvedValue({ success: false }) };

            await routeMessage(component, 'acct-1', { action: 'getAccount' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({ action: 'actionError', message: 'Account not found' });
        });

        test('posts actionError on exception', async () => {
            const backend = { ...mockBackend, getAccount: jest.fn().mockRejectedValue(new Error('Network error')) };

            await routeMessage(component, 'acct-1', { action: 'getAccount' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({ action: 'actionError', message: 'Failed to load account' });
            expect(console.error).toHaveBeenCalledWith('B2B Account Detail: getAccount error', expect.any(Error));
        });

        test('uses message.accountId when provided instead of URL accountId', async () => {
            const backend = { ...mockBackend, getAccount: jest.fn().mockResolvedValue({ success: true, account: { _id: 'override' } }) };

            await routeMessage(component, 'url-acct', { action: 'getAccount', accountId: 'override' }, backend);

            expect(backend.getAccount).toHaveBeenCalledWith('override');
        });
    });

    // =========================================================================
    // MESSAGE ROUTING - getSignal (via carrier DOT)
    // =========================================================================

    describe('Message routing: getSignal (carrier DOT lookup)', () => {
        test('fetches account first, then looks up signal by carrier_dot', async () => {
            const backend = {
                ...mockBackend,
                getAccount: jest.fn().mockResolvedValue({ success: true, account: { _id: 'acct-1', carrier_dot: '123456' } }),
                getSignalByCarrier: jest.fn().mockResolvedValue({ success: true, signal: { score: 85, intent: 'high' } })
            };

            await routeMessage(component, 'acct-1', { action: 'getSignal' }, backend);

            expect(backend.getAccount).toHaveBeenCalledWith('acct-1');
            expect(backend.getSignalByCarrier).toHaveBeenCalledWith('123456');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'signalLoaded',
                payload: { score: 85, intent: 'high' }
            });
        });

        test('posts null signal when account has no carrier_dot', async () => {
            const backend = {
                ...mockBackend,
                getAccount: jest.fn().mockResolvedValue({ success: true, account: { _id: 'acct-1' } }),
                getSignalByCarrier: jest.fn()
            };

            await routeMessage(component, 'acct-1', { action: 'getSignal' }, backend);

            expect(backend.getSignalByCarrier).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'signalLoaded', payload: null });
        });

        test('posts null signal when account lookup fails', async () => {
            const backend = {
                ...mockBackend,
                getAccount: jest.fn().mockResolvedValue({ success: false }),
                getSignalByCarrier: jest.fn()
            };

            await routeMessage(component, 'acct-1', { action: 'getSignal' }, backend);

            expect(backend.getSignalByCarrier).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'signalLoaded', payload: null });
        });

        test('posts null signal when getSignalByCarrier returns no success', async () => {
            const backend = {
                ...mockBackend,
                getAccount: jest.fn().mockResolvedValue({ success: true, account: { _id: 'acct-1', carrier_dot: '999' } }),
                getSignalByCarrier: jest.fn().mockResolvedValue({ success: false })
            };

            await routeMessage(component, 'acct-1', { action: 'getSignal' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({ action: 'signalLoaded', payload: null });
        });

        test('posts null signal when getSignalByCarrier returns success but no signal', async () => {
            const backend = {
                ...mockBackend,
                getAccount: jest.fn().mockResolvedValue({ success: true, account: { _id: 'acct-1', carrier_dot: '999' } }),
                getSignalByCarrier: jest.fn().mockResolvedValue({ success: true, signal: null })
            };

            await routeMessage(component, 'acct-1', { action: 'getSignal' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({ action: 'signalLoaded', payload: null });
        });

        test('posts null signal on exception', async () => {
            const backend = {
                ...mockBackend,
                getAccount: jest.fn().mockRejectedValue(new Error('timeout'))
            };

            await routeMessage(component, 'acct-1', { action: 'getSignal' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({ action: 'signalLoaded', payload: null });
            expect(console.error).toHaveBeenCalledWith('B2B Account Detail: getSignal error', expect.any(Error));
        });
    });

    // =========================================================================
    // MESSAGE ROUTING - getOpportunity
    // =========================================================================

    describe('Message routing: getOpportunity', () => {
        test('returns the first active (non-closed) opportunity', async () => {
            const opps = [
                { _id: 'o1', stage: 'closed_won', value: 100 },
                { _id: 'o2', stage: 'proposal', value: 200 },
                { _id: 'o3', stage: 'negotiation', value: 300 }
            ];
            const backend = { ...mockBackend, getOpportunitiesByAccount: jest.fn().mockResolvedValue({ success: true, opportunities: opps }) };

            await routeMessage(component, 'acct-1', { action: 'getOpportunity' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'opportunityLoaded',
                payload: expect.objectContaining({ _id: 'o2' })
            });
        });

        test('falls back to first opportunity when all are closed', async () => {
            const opps = [
                { _id: 'o1', stage: 'closed_won' },
                { _id: 'o2', stage: 'closed_lost' }
            ];
            const backend = { ...mockBackend, getOpportunitiesByAccount: jest.fn().mockResolvedValue({ success: true, opportunities: opps }) };

            await routeMessage(component, 'acct-1', { action: 'getOpportunity' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'opportunityLoaded',
                payload: expect.objectContaining({ _id: 'o1' })
            });
        });

        test('posts null when no opportunities exist', async () => {
            const backend = { ...mockBackend, getOpportunitiesByAccount: jest.fn().mockResolvedValue({ success: true, opportunities: [] }) };

            await routeMessage(component, 'acct-1', { action: 'getOpportunity' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({ action: 'opportunityLoaded', payload: null });
        });

        test('posts null when result has no opportunities array', async () => {
            const backend = { ...mockBackend, getOpportunitiesByAccount: jest.fn().mockResolvedValue({ success: true }) };

            await routeMessage(component, 'acct-1', { action: 'getOpportunity' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({ action: 'opportunityLoaded', payload: null });
        });

        test('posts null on failure', async () => {
            const backend = { ...mockBackend, getOpportunitiesByAccount: jest.fn().mockResolvedValue({ success: false }) };

            await routeMessage(component, 'acct-1', { action: 'getOpportunity' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({ action: 'opportunityLoaded', payload: null });
        });

        test('posts null on exception', async () => {
            const backend = { ...mockBackend, getOpportunitiesByAccount: jest.fn().mockRejectedValue(new Error('fail')) };

            await routeMessage(component, 'acct-1', { action: 'getOpportunity' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({ action: 'opportunityLoaded', payload: null });
        });
    });

    // =========================================================================
    // MESSAGE ROUTING - getContacts
    // =========================================================================

    describe('Message routing: getContacts', () => {
        test('posts contactsLoaded with contacts array', async () => {
            const contacts = [{ _id: 'c1', name: 'Jane' }];
            const backend = { ...mockBackend, getContactsByAccount: jest.fn().mockResolvedValue({ success: true, contacts }) };

            await routeMessage(component, 'acct-1', { action: 'getContacts' }, backend);

            expect(backend.getContactsByAccount).toHaveBeenCalledWith('acct-1');
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'contactsLoaded', payload: contacts });
        });

        test('posts empty array when contacts is undefined in result', async () => {
            const backend = { ...mockBackend, getContactsByAccount: jest.fn().mockResolvedValue({ success: true }) };

            await routeMessage(component, 'acct-1', { action: 'getContacts' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({ action: 'contactsLoaded', payload: [] });
        });

        test('posts empty array on failure', async () => {
            const backend = { ...mockBackend, getContactsByAccount: jest.fn().mockResolvedValue({ success: false }) };

            await routeMessage(component, 'acct-1', { action: 'getContacts' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({ action: 'contactsLoaded', payload: [] });
        });

        test('posts empty array on exception', async () => {
            const backend = { ...mockBackend, getContactsByAccount: jest.fn().mockRejectedValue(new Error('fail')) };

            await routeMessage(component, 'acct-1', { action: 'getContacts' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({ action: 'contactsLoaded', payload: [] });
        });
    });

    // =========================================================================
    // MESSAGE ROUTING - getTimeline
    // =========================================================================

    describe('Message routing: getTimeline', () => {
        test('posts timelineLoaded with activities', async () => {
            const activities = [{ _id: 'a1', type: 'call' }];
            const backend = { ...mockBackend, getAccountTimeline: jest.fn().mockResolvedValue({ success: true, activities }) };

            await routeMessage(component, 'acct-1', { action: 'getTimeline', limit: 10 }, backend);

            expect(backend.getAccountTimeline).toHaveBeenCalledWith('acct-1', { limit: 10 });
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'timelineLoaded', payload: activities });
        });

        test('defaults limit to 30 when not provided', async () => {
            const backend = { ...mockBackend, getAccountTimeline: jest.fn().mockResolvedValue({ success: true, activities: [] }) };

            await routeMessage(component, 'acct-1', { action: 'getTimeline' }, backend);

            expect(backend.getAccountTimeline).toHaveBeenCalledWith('acct-1', { limit: 30 });
        });

        test('posts empty array when activities is undefined', async () => {
            const backend = { ...mockBackend, getAccountTimeline: jest.fn().mockResolvedValue({ success: true }) };

            await routeMessage(component, 'acct-1', { action: 'getTimeline' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({ action: 'timelineLoaded', payload: [] });
        });

        test('posts empty array on failure', async () => {
            const backend = { ...mockBackend, getAccountTimeline: jest.fn().mockResolvedValue({ success: false }) };

            await routeMessage(component, 'acct-1', { action: 'getTimeline' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({ action: 'timelineLoaded', payload: [] });
        });

        test('posts empty array on exception', async () => {
            const backend = { ...mockBackend, getAccountTimeline: jest.fn().mockRejectedValue(new Error('fail')) };

            await routeMessage(component, 'acct-1', { action: 'getTimeline' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({ action: 'timelineLoaded', payload: [] });
        });
    });

    // =========================================================================
    // MESSAGE ROUTING - getRisks (with fallback)
    // =========================================================================

    describe('Message routing: getRisks with fallback logic', () => {
        test('returns risk_flags from getDealsAtRisk when available', async () => {
            const backend = {
                ...mockBackend,
                getDealsAtRisk: jest.fn().mockResolvedValue({
                    success: true,
                    atRisk: [
                        { account_id: 'acct-1', risk_flags: [{ type: 'stalled', message: 'No activity' }] },
                        { account_id: 'acct-1', risk_flags: [{ type: 'overdue', message: 'Overdue step' }] }
                    ]
                })
            };

            await routeMessage(component, 'acct-1', { action: 'getRisks' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'risksLoaded',
                payload: [
                    { type: 'stalled', message: 'No activity' },
                    { type: 'overdue', message: 'Overdue step' }
                ]
            });
        });

        test('filters atRisk items by accountId', async () => {
            const backend = {
                ...mockBackend,
                getDealsAtRisk: jest.fn().mockResolvedValue({
                    success: true,
                    atRisk: [
                        { account_id: 'other-account', risk_flags: [{ type: 'stalled', message: 'Other' }] },
                        { account_id: 'acct-1', risk_flags: [{ type: 'overdue', message: 'Mine' }] }
                    ]
                })
            };

            await routeMessage(component, 'acct-1', { action: 'getRisks' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'risksLoaded',
                payload: [{ type: 'overdue', message: 'Mine' }]
            });
        });

        test('returns empty risks when atRisk items have no risk_flags', async () => {
            const backend = {
                ...mockBackend,
                getDealsAtRisk: jest.fn().mockResolvedValue({
                    success: true,
                    atRisk: [{ account_id: 'acct-1' }]
                })
            };

            await routeMessage(component, 'acct-1', { action: 'getRisks' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'risksLoaded',
                payload: []
            });
        });

        test('falls back to opportunity-based risk calculation when getDealsAtRisk returns no success', async () => {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const backend = {
                ...mockBackend,
                getDealsAtRisk: jest.fn().mockResolvedValue({ success: false }),
                getOpportunitiesByAccount: jest.fn().mockResolvedValue({
                    success: true,
                    opportunities: [{
                        _id: 'opp1',
                        stage: 'proposal',
                        updated_at: thirtyDaysAgo.toISOString(),
                        next_step: '',
                        next_step_at: null
                    }]
                })
            };

            await routeMessage(component, 'acct-1', { action: 'getRisks' }, backend);

            const risksCall = component.postMessage.mock.calls.find(c => c[0].action === 'risksLoaded');
            expect(risksCall).toBeTruthy();
            const risks = risksCall[0].payload;
            expect(risks).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ type: 'stalled' }),
                    expect.objectContaining({ type: 'no_next_step', message: 'No next step defined' })
                ])
            );
        });

        test('fallback detects overdue next_step_at', async () => {
            const fiveDaysAgo = new Date();
            fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

            const backend = {
                ...mockBackend,
                getDealsAtRisk: jest.fn().mockResolvedValue({ success: false }),
                getOpportunitiesByAccount: jest.fn().mockResolvedValue({
                    success: true,
                    opportunities: [{
                        _id: 'opp2',
                        stage: 'negotiation',
                        updated_at: new Date().toISOString(),
                        next_step: 'Send proposal',
                        next_step_at: fiveDaysAgo.toISOString()
                    }]
                })
            };

            await routeMessage(component, 'acct-1', { action: 'getRisks' }, backend);

            const risksCall = component.postMessage.mock.calls.find(c => c[0].action === 'risksLoaded');
            const risks = risksCall[0].payload;
            expect(risks).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ type: 'overdue' })
                ])
            );
        });

        test('fallback does NOT flag stalled if updated_at is recent (< 10 days)', async () => {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

            const backend = {
                ...mockBackend,
                getDealsAtRisk: jest.fn().mockResolvedValue({ success: false }),
                getOpportunitiesByAccount: jest.fn().mockResolvedValue({
                    success: true,
                    opportunities: [{
                        _id: 'opp3',
                        stage: 'proposal',
                        updated_at: threeDaysAgo.toISOString(),
                        next_step: 'Follow up',
                        next_step_at: null
                    }]
                })
            };

            await routeMessage(component, 'acct-1', { action: 'getRisks' }, backend);

            const risksCall = component.postMessage.mock.calls.find(c => c[0].action === 'risksLoaded');
            const risks = risksCall[0].payload;
            const stalledRisks = risks.filter(r => r.type === 'stalled');
            expect(stalledRisks).toHaveLength(0);
        });

        test('fallback skips closed_won opportunities', async () => {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const backend = {
                ...mockBackend,
                getDealsAtRisk: jest.fn().mockResolvedValue({ success: false }),
                getOpportunitiesByAccount: jest.fn().mockResolvedValue({
                    success: true,
                    opportunities: [
                        { _id: 'opp3', stage: 'closed_won', updated_at: thirtyDaysAgo.toISOString(), next_step: '' }
                    ]
                })
            };

            await routeMessage(component, 'acct-1', { action: 'getRisks' }, backend);

            const risksCall = component.postMessage.mock.calls.find(c => c[0].action === 'risksLoaded');
            expect(risksCall[0].payload).toEqual([]);
        });

        test('fallback skips closed_lost opportunities', async () => {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const backend = {
                ...mockBackend,
                getDealsAtRisk: jest.fn().mockResolvedValue({ success: false }),
                getOpportunitiesByAccount: jest.fn().mockResolvedValue({
                    success: true,
                    opportunities: [
                        { _id: 'opp4', stage: 'closed_lost', updated_at: thirtyDaysAgo.toISOString(), next_step: '' }
                    ]
                })
            };

            await routeMessage(component, 'acct-1', { action: 'getRisks' }, backend);

            const risksCall = component.postMessage.mock.calls.find(c => c[0].action === 'risksLoaded');
            expect(risksCall[0].payload).toEqual([]);
        });

        test('fallback posts empty array when getOpportunitiesByAccount fails', async () => {
            const backend = {
                ...mockBackend,
                getDealsAtRisk: jest.fn().mockResolvedValue({ success: false }),
                getOpportunitiesByAccount: jest.fn().mockResolvedValue({ success: false })
            };

            await routeMessage(component, 'acct-1', { action: 'getRisks' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({ action: 'risksLoaded', payload: [] });
        });

        test('fallback posts empty array when getOpportunitiesByAccount throws', async () => {
            const backend = {
                ...mockBackend,
                getDealsAtRisk: jest.fn().mockResolvedValue({ success: false }),
                getOpportunitiesByAccount: jest.fn().mockRejectedValue(new Error('network'))
            };

            await routeMessage(component, 'acct-1', { action: 'getRisks' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({ action: 'risksLoaded', payload: [] });
        });

        test('posts empty risks on exception from getDealsAtRisk', async () => {
            const backend = {
                ...mockBackend,
                getDealsAtRisk: jest.fn().mockRejectedValue(new Error('service down'))
            };

            await routeMessage(component, 'acct-1', { action: 'getRisks' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({ action: 'risksLoaded', payload: [] });
        });
    });

    // =========================================================================
    // MESSAGE ROUTING - navigate
    // =========================================================================

    describe('Message routing: navigate', () => {
        test('navigates to /b2b-dashboard for target "dashboard"', async () => {
            await routeMessage(component, 'acct-1', { action: 'navigate', target: 'dashboard' });
            expect(mockWixLocation.to).toHaveBeenCalledWith('/b2b-dashboard');
        });

        test('navigates to /b2b-pipeline for target "pipeline"', async () => {
            await routeMessage(component, 'acct-1', { action: 'navigate', target: 'pipeline' });
            expect(mockWixLocation.to).toHaveBeenCalledWith('/b2b-pipeline');
        });

        test('navigates to /b2b-analytics for target "analytics"', async () => {
            await routeMessage(component, 'acct-1', { action: 'navigate', target: 'analytics' });
            expect(mockWixLocation.to).toHaveBeenCalledWith('/b2b-analytics');
        });

        test('uses slash-prefix fallback for unknown targets', async () => {
            await routeMessage(component, 'acct-1', { action: 'navigate', target: 'custom-page' });
            expect(mockWixLocation.to).toHaveBeenCalledWith('/custom-page');
        });

        test('does nothing when target is missing/falsy', async () => {
            await routeMessage(component, 'acct-1', { action: 'navigate' });
            expect(mockWixLocation.to).not.toHaveBeenCalled();
        });

        test('does nothing when target is empty string', async () => {
            await routeMessage(component, 'acct-1', { action: 'navigate', target: '' });
            expect(mockWixLocation.to).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // MESSAGE ROUTING - unknown / null actions
    // =========================================================================

    describe('Message routing: edge cases', () => {
        test('logs warning for unknown action', async () => {
            await routeMessage(component, 'acct-1', { action: 'unknownAction' });
            expect(console.warn).toHaveBeenCalledWith('B2B Account Detail: Unknown message action', 'unknownAction');
        });

        test('ignores messages with no action property', async () => {
            await routeMessage(component, 'acct-1', { someOtherProp: true });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('ignores null message', async () => {
            await routeMessage(component, 'acct-1', null);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('ignores undefined message', async () => {
            await routeMessage(component, 'acct-1', undefined);
            expect(component.postMessage).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // ACCOUNT ACTIONS + TIMELINE AUTO-REFRESH
    // =========================================================================

    describe('Account actions and timeline auto-refresh', () => {
        test('call action: logs call, posts success, refreshes timeline', async () => {
            const backend = {
                ...mockBackend,
                logCall: jest.fn().mockResolvedValue({}),
                getAccountTimeline: jest.fn().mockResolvedValue({ success: true, activities: [{ _id: 'a1' }] })
            };

            await routeMessage(component, 'acct-1', { action: 'accountAction', type: 'call' }, backend);
            // Let the refresh fire (it is async/fire-and-forget)
            await new Promise(r => setTimeout(r, 50));

            expect(backend.logCall).toHaveBeenCalledWith('acct-1', '', { outcome: 'completed' });
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'actionSuccess', message: 'Call logged' });
            expect(backend.getAccountTimeline).toHaveBeenCalledWith('acct-1', { limit: 30 });
        });

        test('email action: logs email, posts success, refreshes timeline', async () => {
            const backend = {
                ...mockBackend,
                logEmail: jest.fn().mockResolvedValue({}),
                getAccountTimeline: jest.fn().mockResolvedValue({ success: true, activities: [] })
            };

            await routeMessage(component, 'acct-1', { action: 'accountAction', type: 'email' }, backend);
            await new Promise(r => setTimeout(r, 50));

            expect(backend.logEmail).toHaveBeenCalledWith('acct-1', '', 'Outreach email', 'sent');
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'actionSuccess', message: 'Email logged' });
            expect(backend.getAccountTimeline).toHaveBeenCalled();
        });

        test('sms action: logs sms, posts success, refreshes timeline', async () => {
            const backend = {
                ...mockBackend,
                logSms: jest.fn().mockResolvedValue({}),
                getAccountTimeline: jest.fn().mockResolvedValue({ success: true, activities: [] })
            };

            await routeMessage(component, 'acct-1', { action: 'accountAction', type: 'sms' }, backend);
            await new Promise(r => setTimeout(r, 50));

            expect(backend.logSms).toHaveBeenCalledWith('acct-1', '', 'Text message', 'sent');
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'actionSuccess', message: 'SMS logged' });
            expect(backend.getAccountTimeline).toHaveBeenCalled();
        });

        test('task action: logs task, posts success, refreshes timeline', async () => {
            const backend = {
                ...mockBackend,
                logTask: jest.fn().mockResolvedValue({}),
                getAccountTimeline: jest.fn().mockResolvedValue({ success: true, activities: [] })
            };

            await routeMessage(component, 'acct-1', { action: 'accountAction', type: 'task' }, backend);
            await new Promise(r => setTimeout(r, 50));

            expect(backend.logTask).toHaveBeenCalledWith('acct-1', 'Follow-up task', 'scheduled');
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'actionSuccess', message: 'Task created' });
            expect(backend.getAccountTimeline).toHaveBeenCalled();
        });

        test('brief action: generates brief, posts success, refreshes timeline', async () => {
            const backend = {
                ...mockBackend,
                generateBrief: jest.fn().mockResolvedValue({ success: true }),
                getAccountTimeline: jest.fn().mockResolvedValue({ success: true, activities: [] })
            };

            await routeMessage(component, 'acct-1', { action: 'accountAction', type: 'brief' }, backend);
            await new Promise(r => setTimeout(r, 50));

            expect(backend.generateBrief).toHaveBeenCalledWith('acct-1');
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'actionSuccess', message: 'Research brief generated' });
            expect(backend.getAccountTimeline).toHaveBeenCalled();
        });

        test('brief action: posts actionError when generation fails with error message', async () => {
            const backend = {
                ...mockBackend,
                generateBrief: jest.fn().mockResolvedValue({ success: false, error: 'Quota exceeded' })
            };

            await routeMessage(component, 'acct-1', { action: 'accountAction', type: 'brief' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({ action: 'actionError', message: 'Quota exceeded' });
        });

        test('brief action: posts fallback actionError when generation fails with no error string', async () => {
            const backend = {
                ...mockBackend,
                generateBrief: jest.fn().mockResolvedValue({ success: false })
            };

            await routeMessage(component, 'acct-1', { action: 'accountAction', type: 'brief' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({ action: 'actionError', message: 'Brief generation failed' });
        });

        test('brief action: posts actionError on exception', async () => {
            const backend = {
                ...mockBackend,
                generateBrief: jest.fn().mockRejectedValue(new Error('server error'))
            };

            await routeMessage(component, 'acct-1', { action: 'accountAction', type: 'brief' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({ action: 'actionError', message: 'Failed to generate brief' });
        });

        test('addContact action: logs activity and posts success (no timeline refresh)', async () => {
            const backend = {
                ...mockBackend,
                logActivity: jest.fn().mockResolvedValue({}),
                getAccountTimeline: jest.fn()
            };

            await routeMessage(component, 'acct-1', { action: 'accountAction', type: 'addContact' }, backend);
            await new Promise(r => setTimeout(r, 50));

            expect(backend.logActivity).toHaveBeenCalledWith(
                expect.objectContaining({
                    account_id: 'acct-1',
                    type: 'note',
                    subject: 'Contact add requested'
                })
            );
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'actionSuccess', message: 'Contact request logged' });
            // addContact does NOT refresh timeline
            expect(backend.getAccountTimeline).not.toHaveBeenCalled();
        });

        test('logActivity action: logs activity, posts success, refreshes timeline', async () => {
            const backend = {
                ...mockBackend,
                logActivity: jest.fn().mockResolvedValue({}),
                getAccountTimeline: jest.fn().mockResolvedValue({ success: true, activities: [] })
            };

            await routeMessage(component, 'acct-1', { action: 'accountAction', type: 'logActivity' }, backend);
            await new Promise(r => setTimeout(r, 50));

            expect(backend.logActivity).toHaveBeenCalledWith(
                expect.objectContaining({
                    account_id: 'acct-1',
                    type: 'note',
                    subject: 'Manual activity log'
                })
            );
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'actionSuccess', message: 'Activity logged' });
            expect(backend.getAccountTimeline).toHaveBeenCalled();
        });

        test('unknown action type posts actionError', async () => {
            await routeMessage(component, 'acct-1', { action: 'accountAction', type: 'unknownType' });

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Unknown action: unknownType'
            });
        });

        test('missing action type posts actionError', async () => {
            await routeMessage(component, 'acct-1', { action: 'accountAction' });

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'No action type specified'
            });
        });

        test('action exception posts actionError with error message', async () => {
            const backend = {
                ...mockBackend,
                logCall: jest.fn().mockRejectedValue(new Error('DB write failed'))
            };

            await routeMessage(component, 'acct-1', { action: 'accountAction', type: 'call' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'DB write failed'
            });
        });

        test('action exception with no error.message uses fallback', async () => {
            const backend = {
                ...mockBackend,
                logCall: jest.fn().mockRejectedValue({})
            };

            await routeMessage(component, 'acct-1', { action: 'accountAction', type: 'call' }, backend);

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Failed to execute call'
            });
        });
    });

    // =========================================================================
    // TIMELINE AUTO-REFRESH RESILIENCE
    // =========================================================================

    describe('Timeline auto-refresh resilience', () => {
        test('timeline refresh failure in backend does not break the action', async () => {
            // When getAccountTimeline rejects, handleGetTimeline's try-catch
            // catches it internally and posts an empty timelineLoaded.
            // The action itself still succeeds.
            const backend = {
                ...mockBackend,
                logCall: jest.fn().mockResolvedValue({}),
                getAccountTimeline: jest.fn().mockRejectedValue(new Error('refresh fail'))
            };

            await routeMessage(component, 'acct-1', { action: 'accountAction', type: 'call' }, backend);
            // Wait for the fire-and-forget refresh to settle
            await new Promise(r => setTimeout(r, 50));

            // Action should still succeed
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'actionSuccess', message: 'Call logged' });
            // The internal error is logged
            expect(console.error).toHaveBeenCalledWith(
                'B2B Account Detail: getTimeline error',
                expect.any(Error)
            );
            // Timeline still posts empty array as fallback
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'timelineLoaded', payload: [] });
        });

        test('refreshTimeline calls handleGetTimeline with limit 30', async () => {
            const backend = {
                ...mockBackend,
                logEmail: jest.fn().mockResolvedValue({}),
                getAccountTimeline: jest.fn().mockResolvedValue({ success: true, activities: [{ _id: 'new' }] })
            };

            await routeMessage(component, 'acct-1', { action: 'accountAction', type: 'email' }, backend);
            await new Promise(r => setTimeout(r, 50));

            expect(backend.getAccountTimeline).toHaveBeenCalledWith('acct-1', { limit: 30 });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'timelineLoaded',
                payload: [{ _id: 'new' }]
            });
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error handling', () => {
        test('getAccount exception logs to console.error', async () => {
            const backend = { ...mockBackend, getAccount: jest.fn().mockRejectedValue(new Error('timeout')) };
            await routeMessage(component, 'acct-1', { action: 'getAccount' }, backend);
            expect(console.error).toHaveBeenCalledWith('B2B Account Detail: getAccount error', expect.any(Error));
        });

        test('getSignal exception logs to console.error', async () => {
            const backend = { ...mockBackend, getAccount: jest.fn().mockRejectedValue(new Error('fail')) };
            await routeMessage(component, 'acct-1', { action: 'getSignal' }, backend);
            expect(console.error).toHaveBeenCalledWith('B2B Account Detail: getSignal error', expect.any(Error));
        });

        test('getOpportunity exception logs to console.error', async () => {
            const backend = { ...mockBackend, getOpportunitiesByAccount: jest.fn().mockRejectedValue(new Error('fail')) };
            await routeMessage(component, 'acct-1', { action: 'getOpportunity' }, backend);
            expect(console.error).toHaveBeenCalledWith('B2B Account Detail: getOpportunity error', expect.any(Error));
        });

        test('getContacts exception logs to console.error', async () => {
            const backend = { ...mockBackend, getContactsByAccount: jest.fn().mockRejectedValue(new Error('fail')) };
            await routeMessage(component, 'acct-1', { action: 'getContacts' }, backend);
            expect(console.error).toHaveBeenCalledWith('B2B Account Detail: getContacts error', expect.any(Error));
        });

        test('getTimeline exception logs to console.error', async () => {
            const backend = { ...mockBackend, getAccountTimeline: jest.fn().mockRejectedValue(new Error('fail')) };
            await routeMessage(component, 'acct-1', { action: 'getTimeline' }, backend);
            expect(console.error).toHaveBeenCalledWith('B2B Account Detail: getTimeline error', expect.any(Error));
        });

        test('getRisks exception logs to console.error', async () => {
            const backend = { ...mockBackend, getDealsAtRisk: jest.fn().mockRejectedValue(new Error('fail')) };
            await routeMessage(component, 'acct-1', { action: 'getRisks' }, backend);
            expect(console.error).toHaveBeenCalledWith('B2B Account Detail: getRisks error', expect.any(Error));
        });

        test('accountAction exception logs to console.error with action type', async () => {
            const backend = { ...mockBackend, logCall: jest.fn().mockRejectedValue(new Error('fail')) };
            await routeMessage(component, 'acct-1', { action: 'accountAction', type: 'call' }, backend);
            expect(console.error).toHaveBeenCalledWith('B2B Account Detail: action error', 'call', expect.any(Error));
        });

        test('generateBrief exception logs to console.error', async () => {
            const backend = { ...mockBackend, generateBrief: jest.fn().mockRejectedValue(new Error('fail')) };
            await routeMessage(component, 'acct-1', { action: 'accountAction', type: 'brief' }, backend);
            expect(console.error).toHaveBeenCalledWith('B2B Account Detail: generateBrief error', expect.any(Error));
        });
    });

    // =========================================================================
    // BACKEND SERVICE CALL VERIFICATION
    // =========================================================================

    describe('Backend service call verification', () => {
        test('getSignal calls getAccount once then getSignalByCarrier once', async () => {
            const backend = {
                ...mockBackend,
                getAccount: jest.fn().mockResolvedValue({ success: true, account: { _id: 'a', carrier_dot: '555' } }),
                getSignalByCarrier: jest.fn().mockResolvedValue({ success: true, signal: { score: 50 } })
            };

            await routeMessage(component, 'acct-1', { action: 'getSignal' }, backend);

            expect(backend.getAccount).toHaveBeenCalledTimes(1);
            expect(backend.getSignalByCarrier).toHaveBeenCalledTimes(1);
            expect(backend.getSignalByCarrier).toHaveBeenCalledWith('555');
        });

        test('getRisks calls getDealsAtRisk with { accountId } object', async () => {
            const backend = {
                ...mockBackend,
                getDealsAtRisk: jest.fn().mockResolvedValue({ success: true, atRisk: [] })
            };

            await routeMessage(component, 'acct-1', { action: 'getRisks' }, backend);

            expect(backend.getDealsAtRisk).toHaveBeenCalledWith({ accountId: 'acct-1' });
        });

        test('logCall receives accountId, empty contactId, and outcome object', async () => {
            const backend = {
                ...mockBackend,
                logCall: jest.fn().mockResolvedValue({}),
                getAccountTimeline: jest.fn().mockResolvedValue({ success: true, activities: [] })
            };

            await routeMessage(component, 'acct-1', { action: 'accountAction', type: 'call' }, backend);

            expect(backend.logCall).toHaveBeenCalledWith('acct-1', '', { outcome: 'completed' });
        });

        test('logEmail receives correct arguments', async () => {
            const backend = {
                ...mockBackend,
                logEmail: jest.fn().mockResolvedValue({}),
                getAccountTimeline: jest.fn().mockResolvedValue({ success: true, activities: [] })
            };

            await routeMessage(component, 'acct-1', { action: 'accountAction', type: 'email' }, backend);

            expect(backend.logEmail).toHaveBeenCalledWith('acct-1', '', 'Outreach email', 'sent');
        });

        test('logSms receives correct arguments', async () => {
            const backend = {
                ...mockBackend,
                logSms: jest.fn().mockResolvedValue({}),
                getAccountTimeline: jest.fn().mockResolvedValue({ success: true, activities: [] })
            };

            await routeMessage(component, 'acct-1', { action: 'accountAction', type: 'sms' }, backend);

            expect(backend.logSms).toHaveBeenCalledWith('acct-1', '', 'Text message', 'sent');
        });

        test('logTask receives correct arguments', async () => {
            const backend = {
                ...mockBackend,
                logTask: jest.fn().mockResolvedValue({}),
                getAccountTimeline: jest.fn().mockResolvedValue({ success: true, activities: [] })
            };

            await routeMessage(component, 'acct-1', { action: 'accountAction', type: 'task' }, backend);

            expect(backend.logTask).toHaveBeenCalledWith('acct-1', 'Follow-up task', 'scheduled');
        });
    });
});
