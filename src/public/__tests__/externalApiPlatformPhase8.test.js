/* eslint-env jest */

const fs = require('fs');
const path = require('path');

describe('external api platform phase 8 assets', () => {
  const portalHtml = path.resolve(__dirname, '..', 'admin', 'API_PORTAL_DASHBOARD.html');
  const partnersHtml = path.resolve(__dirname, '..', 'admin', 'ADMIN_API_PARTNERS.html');
  const portalPage = path.resolve(__dirname, '..', '..', 'pages', 'API_PORTAL_DASHBOARD.external.js');
  const partnersPage = path.resolve(__dirname, '..', '..', 'pages', 'ADMIN_API_PARTNERS.external.js');
  const portalService = path.resolve(__dirname, '..', '..', 'backend', 'apiPortalService.jsw');

  test('creates required admin html assets', () => {
    expect(fs.existsSync(portalHtml)).toBe(true);
    expect(fs.existsSync(partnersHtml)).toBe(true);

    const portal = fs.readFileSync(portalHtml, 'utf8');
    const partners = fs.readFileSync(partnersHtml, 'utf8');

    expect(portal).toContain('API Partner Portal');
    expect(portal).toContain('loadSnapshot');
    expect(portal).toContain('setEnvironment');
    expect(portal).toContain('sendWebhookTest');
    expect(portal).toContain('createCheckout');
    expect(portal).toContain('endpointBreakdown');
    expect(partners).toContain('API Partners Admin');
    expect(partners).toContain('setPartnerTier');
    expect(partners).toContain('setEnvironment');
    expect(partners).toContain('loadHistory');
    expect(partners).toContain('Load Revenue Report');
    expect(partners).toContain('revenueReportLoaded');
  });

  test('creates page bridge files with expected message actions', () => {
    expect(fs.existsSync(portalPage)).toBe(true);
    expect(fs.existsSync(partnersPage)).toBe(true);

    const portalSource = fs.readFileSync(portalPage, 'utf8');
    const partnersSource = fs.readFileSync(partnersPage, 'utf8');

    expect(portalSource).toContain("case 'getSnapshot'");
    expect(portalSource).toContain("case 'createKey'");
    expect(portalSource).toContain("case 'createBillingPortal'");

    expect(partnersSource).toContain("case 'listPartners'");
    expect(partnersSource).toContain("case 'setPartnerTier'");
    expect(partnersSource).toContain("case 'setPartnerStatus'");
    expect(partnersSource).toContain("case 'getPartnerHistory'");
    expect(partnersSource).toContain("case 'getRevenueReport'");
  });

  test('apiPortalService exposes tier/status admin update functions', () => {
    const source = fs.readFileSync(portalService, 'utf8');
    expect(source).toContain('export async function setApiPartnerTier');
    expect(source).toContain('export async function setApiPartnerStatus');
    expect(source).toContain('export async function getApiPartnerHistory');
    expect(source).toContain('export async function getApiRevenueReport');
  });
});
