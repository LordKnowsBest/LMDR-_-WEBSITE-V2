/* eslint-env jest */

const fs = require('fs');
const path = require('path');

describe('external api platform phase 8 assets', () => {
  const portalHtml = path.resolve(__dirname, '..', 'admin', 'API_PORTAL_DASHBOARD.html');
  const partnersHtml = path.resolve(__dirname, '..', 'admin', 'ADMIN_API_PARTNERS.html');
  const docsHtml = path.resolve(__dirname, '..', 'admin', 'API_DOCS_PORTAL.html');
  const changelogHtml = path.resolve(__dirname, '..', 'admin', 'API_CHANGELOG.html');
  const statusHtml = path.resolve(__dirname, '..', 'admin', 'API_STATUS.html');
  const gettingStartedGuide = path.resolve(__dirname, '..', '..', '..', 'docs', 'api', 'getting-started.external.v1.md');
  const portalPage = path.resolve(__dirname, '..', '..', 'pages', 'API_PORTAL_DASHBOARD.external.js');
  const partnersPage = path.resolve(__dirname, '..', '..', 'pages', 'ADMIN_API_PARTNERS.external.js');
  const docsPage = path.resolve(__dirname, '..', '..', 'pages', 'API_DOCS_PORTAL.external.js');
  const changelogPage = path.resolve(__dirname, '..', '..', 'pages', 'API_CHANGELOG.external.js');
  const statusPage = path.resolve(__dirname, '..', '..', 'pages', 'API_STATUS.external.js');
  const portalService = path.resolve(__dirname, '..', '..', 'backend', 'apiPortalService.jsw');

  test('creates required admin html assets', () => {
    expect(fs.existsSync(portalHtml)).toBe(true);
    expect(fs.existsSync(partnersHtml)).toBe(true);
    expect(fs.existsSync(docsHtml)).toBe(true);
    expect(fs.existsSync(changelogHtml)).toBe(true);
    expect(fs.existsSync(statusHtml)).toBe(true);

    const portal = fs.readFileSync(portalHtml, 'utf8');
    const partners = fs.readFileSync(partnersHtml, 'utf8');
    const docs = fs.readFileSync(docsHtml, 'utf8');
    const changelog = fs.readFileSync(changelogHtml, 'utf8');
    const status = fs.readFileSync(statusHtml, 'utf8');

    expect(portal).toContain('API Partner Portal');
    expect(portal).toContain('loadSnapshot');
    expect(portal).toContain('setEnvironment');
    expect(portal).toContain('sendWebhookTest');
    expect(portal).toContain('createCheckout');
    expect(portal).toContain('endpointBreakdown');
    expect(portal).toContain('Create Overage Invoice');
    expect(portal).toContain('Change Subscription Plan');
    expect(portal).toContain('Ensure Stripe Tier Products');
    expect(portal).toContain('Onboarding Checklist');
    expect(portal).toContain('getting-started.external.v1.md');
    expect(partners).toContain('API Partners Admin');
    expect(partners).toContain('setPartnerTier');
    expect(partners).toContain('setEnvironment');
    expect(partners).toContain('loadHistory');
    expect(partners).toContain('Load Revenue Report');
    expect(partners).toContain('revenueReportLoaded');
    expect(docs).toContain('External API Documentation');
    expect(docs).toContain('Try Sandbox');
    expect(docs).toContain('searchInput');
    expect(changelog).toContain('API Changelog');
    expect(changelog).toContain('getApiChangelog');
    expect(status).toContain('API Status');
    expect(status).toContain('getApiStatus');
    expect(fs.existsSync(gettingStartedGuide)).toBe(true);
  });

  test('creates page bridge files with expected message actions', () => {
    expect(fs.existsSync(portalPage)).toBe(true);
    expect(fs.existsSync(partnersPage)).toBe(true);
    expect(fs.existsSync(docsPage)).toBe(true);
    expect(fs.existsSync(changelogPage)).toBe(true);
    expect(fs.existsSync(statusPage)).toBe(true);

    const portalSource = fs.readFileSync(portalPage, 'utf8');
    const partnersSource = fs.readFileSync(partnersPage, 'utf8');
    const docsSource = fs.readFileSync(docsPage, 'utf8');
    const changelogSource = fs.readFileSync(changelogPage, 'utf8');
    const statusSource = fs.readFileSync(statusPage, 'utf8');

    expect(portalSource).toContain("case 'getSnapshot'");
    expect(portalSource).toContain("case 'createKey'");
    expect(portalSource).toContain("case 'createBillingPortal'");
    expect(portalSource).toContain("case 'createOverageInvoice'");
    expect(portalSource).toContain("case 'changePlan'");
    expect(portalSource).toContain("case 'ensureTierProducts'");
    expect(portalSource).toContain("case 'getOnboardingSequence'");
    expect(portalSource).toContain("case 'initOnboarding'");

    expect(partnersSource).toContain("case 'listPartners'");
    expect(partnersSource).toContain("case 'setPartnerTier'");
    expect(partnersSource).toContain("case 'setPartnerStatus'");
    expect(partnersSource).toContain("case 'getPartnerHistory'");
    expect(partnersSource).toContain("case 'getRevenueReport'");
    expect(docsSource).toContain("case 'getDocsCatalog'");
    expect(docsSource).toContain("case 'trySandbox'");
    expect(docsSource).toContain("case 'getApiStatus'");
    expect(docsSource).toContain("case 'getApiChangelog'");
    expect(changelogSource).toContain("action === 'getApiChangelog'");
    expect(statusSource).toContain("action === 'getApiStatus'");
  });

  test('apiPortalService exposes tier/status admin update functions', () => {
    const source = fs.readFileSync(portalService, 'utf8');
    expect(source).toContain('export async function setApiPartnerTier');
    expect(source).toContain('export async function setApiPartnerStatus');
    expect(source).toContain('export async function getApiPartnerHistory');
    expect(source).toContain('export async function getApiRevenueReport');
    expect(source).toContain('export async function getApiDocumentationCatalog');
    expect(source).toContain('export async function runApiSandboxRequest');
    expect(source).toContain('export async function getApiChangelog');
    expect(source).toContain('export async function getApiHealthStatus');
    expect(source).toContain('export async function createApiTierProducts');
    expect(source).toContain('export async function createPartnerOverageInvoice');
    expect(source).toContain('export async function changePartnerApiSubscription');
    expect(source).toContain('export async function getApiOnboardingEmailSequence');
    expect(source).toContain('export async function initializePartnerOnboarding');
    expect(source).toContain('export async function processPartnerOnboardingFollowUps');
  });
});
