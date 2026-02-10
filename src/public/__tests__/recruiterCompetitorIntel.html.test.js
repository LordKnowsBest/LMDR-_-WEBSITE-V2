/* eslint-disable */
/* eslint-env jest */
const fs = require('fs');
const path = require('path');

const HTML_FILE = path.resolve(__dirname, '..', 'recruiter', 'RECRUITER_COMPETITOR_INTEL.html');

// Actual message types used in the HTML (may differ from page code names)
const INBOUND_MESSAGES = ['competitorData', 'intelSaved'];
const OUTBOUND_MESSAGES = ['competitorIntelReady', 'getCompetitorData', 'saveIntel'];

const htmlSource = fs.readFileSync(HTML_FILE, 'utf8');

describe('RECRUITER_COMPETITOR_INTEL.html - HTML Structure', () => {
  test('has DOCTYPE declaration', () => {
    expect(htmlSource).toMatch(/<!DOCTYPE html>/i);
  });

  test('has html tag with lang attribute', () => {
    expect(htmlSource).toMatch(/<html[^>]+lang=/i);
  });

  test('has UTF-8 charset meta tag', () => {
    expect(htmlSource).toMatch(/<meta[^>]+charset=["']utf-8["']/i);
  });

  test('has viewport meta tag', () => {
    expect(htmlSource).toMatch(/<meta[^>]+name=["']viewport["']/i);
  });

  test('has correct title', () => {
    expect(htmlSource).toMatch(/<title>Competitor Intel - VelocityMatch<\/title>/i);
  });
});

describe('RECRUITER_COMPETITOR_INTEL.html - External Dependencies', () => {
  test('includes Tailwind CSS CDN', () => {
    expect(htmlSource).toMatch(/cdn\.tailwindcss\.com/);
  });

  test('includes Chart.js CDN', () => {
    expect(htmlSource).toMatch(/cdn\.jsdelivr\.net.*chart\.js/i);
  });

  test('includes Font Awesome', () => {
    expect(htmlSource).toMatch(/cdnjs\.cloudflare\.com.*font-?awesome/i);
  });

  test('includes Inter font', () => {
    expect(htmlSource).toMatch(/fonts\.googleapis\.com.*inter/i);
  });

  test('has inline Tailwind configuration', () => {
    expect(htmlSource).toMatch(/tailwind\.config\s*=/);
  });
});

describe('RECRUITER_COMPETITOR_INTEL.html - Tailwind Configuration', () => {
  test('defines lmdr blue color', () => {
    expect(htmlSource).toMatch(/blue:\s*['"]#2563eb['"]/);
  });

  test('defines lmdr dark color', () => {
    expect(htmlSource).toMatch(/dark:\s*['"]#0f172a['"]/);
  });

  test('defines lmdr yellow color', () => {
    expect(htmlSource).toMatch(/yellow:\s*['"]#fbbf24['"]/);
  });

  test('defines lmdr canvas color', () => {
    expect(htmlSource).toMatch(/canvas:\s*['"]#f1f5f9['"]/);
  });
});

describe('RECRUITER_COMPETITOR_INTEL.html - Message Protocol', () => {
  test('sets up message event listener', () => {
    expect(htmlSource).toMatch(/addEventListener\s*\(\s*['"]message['"]/);
  });

  test('handles competitorData inbound message', () => {
    expect(htmlSource).toMatch(/case\s+['"]competitorData['"]/);
  });

  test('handles intelSaved inbound message', () => {
    expect(htmlSource).toMatch(/case\s+['"]intelSaved['"]/);
  });

  test('sends competitorIntelReady outbound message', () => {
    expect(htmlSource).toMatch(/sendToWix\s*\(\s*['"]competitorIntelReady['"]/);
  });

  test('sends getCompetitorData outbound message', () => {
    expect(htmlSource).toMatch(/sendToWix\s*\(\s*['"]getCompetitorData['"]/);
  });

  test('sends saveIntel outbound message', () => {
    expect(htmlSource).toMatch(/sendToWix\s*\(\s*['"]saveIntel['"]/);
  });

  test('uses TYPE protocol (msg.type or .type)', () => {
    expect(htmlSource).toMatch(/\.type\s*===|type:\s*['"]|\.type\b/);
  });

  test('uses sendToWix utility for outbound messages', () => {
    expect(htmlSource).toMatch(/function\s+sendToWix/);
  });

  test('uses parent.postMessage for sending', () => {
    expect(htmlSource).toMatch(/window\.parent\.postMessage/);
  });
});

describe('RECRUITER_COMPETITOR_INTEL.html - DOM Elements', () => {
  test('has pay benchmarks section', () => {
    expect(htmlSource).toMatch(/pay.*benchmark/i);
  });

  test('has competitor table', () => {
    expect(htmlSource).toMatch(/competitor-table-body/i);
  });

  test('has intel form or modal', () => {
    expect(htmlSource).toMatch(/addIntelModal/i);
  });

  test('has region filter', () => {
    expect(htmlSource).toMatch(/id=["']regionFilter["']/);
  });

  test('has job type filter', () => {
    expect(htmlSource).toMatch(/id=["']jobTypeFilter["']/);
  });

  test('has loading state element', () => {
    expect(htmlSource).toMatch(/id=["']loading["']/);
  });
});

describe('RECRUITER_COMPETITOR_INTEL.html - Security', () => {
  test('does not use eval', () => {
    expect(htmlSource).not.toMatch(/\beval\s*\(/);
  });

  test('does not use document.write', () => {
    expect(htmlSource).not.toMatch(/document\.write/);
  });
});

describe('RECRUITER_COMPETITOR_INTEL.html - Branding', () => {
  test('uses VelocityMatch branding in title', () => {
    expect(htmlSource).toMatch(/VelocityMatch/);
  });

  test('does not use LMDR branding in title', () => {
    const titleMatch = htmlSource.match(/<title>([^<]+)<\/title>/i);
    expect(titleMatch).toBeTruthy();
    expect(titleMatch[1]).not.toMatch(/LMDR/i);
  });
});
