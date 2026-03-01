/* eslint-env jest */

const fs = require('fs');
const path = require('path');

describe('AI matching page refactor wiring', () => {
  const pagePath = path.resolve(
    __dirname,
    '..',
    '..',
    'pages',
    'AI - MATCHING.rof4w.js'
  );

  const pageSource = fs.readFileSync(pagePath, 'utf8');

  test('imports extracted page state, bridge, and router modules', () => {
    expect(pageSource).toContain("from 'backend/aiMatchingFacade.jsw'");
    expect(pageSource).toContain("from 'public/js/ai-matching-page-state'");
    expect(pageSource).toContain("from 'public/js/ai-matching-page-bridge'");
    expect(pageSource).toContain("from 'public/js/ai-matching-page-router'");
  });

  test('routes inbound HTML actions through the extracted router', () => {
    expect(pageSource).toContain('routeAiMatchingAction(action, payload');
  });

  test('builds pageReady payload through the extracted state helper', () => {
    expect(pageSource).toContain('buildPageReadyPayload(pageState');
  });

  test('sends outbound messages through the extracted bridge helper', () => {
    expect(pageSource).toContain('sendToHtmlBridge(type, data');
  });
});
