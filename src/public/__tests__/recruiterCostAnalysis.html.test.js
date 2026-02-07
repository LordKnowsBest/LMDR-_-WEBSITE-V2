/* eslint-env jest */
const fs = require('fs');
const path = require('path');

const HTML_FILE = path.resolve(__dirname, '..', 'recruiter', 'RECRUITER_COST_ANALYSIS.html');

// Actual message types used in the HTML (may differ from page code names)
const INBOUND_MESSAGES = ['costData', 'trendData', 'spendSaved', 'importComplete'];
const OUTBOUND_MESSAGES = ['costAnalysisReady', 'getCostData', 'getSpendTrend', 'saveSpend', 'importSpendCsv'];

const htmlSource = fs.readFileSync(HTML_FILE, 'utf8');

describe('RECRUITER_COST_ANALYSIS.html DOM Structure', () => {
  test('has valid HTML5 DOCTYPE', () => {
    expect(htmlSource).toMatch(/<!DOCTYPE html>/i);
  });

  test('has html tag with lang attribute', () => {
    expect(htmlSource).toMatch(/<html[^>]+lang=["']en["']/i);
  });

  test('has UTF-8 charset meta tag', () => {
    expect(htmlSource).toMatch(/<meta[^>]+charset=["']UTF-8["']/i);
  });

  test('has viewport meta tag for mobile responsiveness', () => {
    expect(htmlSource).toMatch(/<meta[^>]+name=["']viewport["']/i);
  });

  test('has correct page title', () => {
    expect(htmlSource).toMatch(/<title>Cost Per Hire - VelocityMatch<\/title>/i);
  });
});

describe('RECRUITER_COST_ANALYSIS.html External Dependencies', () => {
  test('includes Tailwind CSS CDN', () => {
    expect(htmlSource).toMatch(/https:\/\/cdn\.tailwindcss\.com/);
  });

  test('includes Chart.js CDN', () => {
    expect(htmlSource).toMatch(/https:\/\/cdn\.jsdelivr\.net\/npm\/chart\.js/);
  });

  test('includes Font Awesome CDN', () => {
    expect(htmlSource).toMatch(/https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome/);
  });

  test('includes Inter font from Google Fonts', () => {
    expect(htmlSource).toMatch(/fonts\.googleapis\.com.*inter/i);
  });

  test('has inline Tailwind configuration', () => {
    expect(htmlSource).toMatch(/tailwind\.config\s*=/);
  });
});

describe('RECRUITER_COST_ANALYSIS.html Tailwind Configuration', () => {
  test('defines lmdr blue color in config', () => {
    expect(htmlSource).toMatch(/blue:\s*['"]#2563eb['"]/);
  });

  test('defines lmdr dark color in config', () => {
    expect(htmlSource).toMatch(/dark:\s*['"]#0f172a['"]/);
  });

  test('defines lmdr yellow and canvas colors in config', () => {
    expect(htmlSource).toMatch(/yellow:\s*['"]#fbbf24['"]/);
    expect(htmlSource).toMatch(/canvas:\s*['"]#f1f5f9['"]/);
  });
});

describe('RECRUITER_COST_ANALYSIS.html Message Protocol', () => {
  test('has window message event listener', () => {
    expect(htmlSource).toMatch(/window\.addEventListener\s*\(\s*['"]message['"]/);
  });

  test('uses TYPE protocol (msg.type) not ACTION protocol', () => {
    expect(htmlSource).toMatch(/\.type\b/);
  });

  test('handles all INBOUND message types', () => {
    INBOUND_MESSAGES.forEach(msgType => {
      expect(htmlSource).toContain(msgType);
    });
  });

  test('sends all OUTBOUND message types', () => {
    OUTBOUND_MESSAGES.forEach(msgType => {
      expect(htmlSource).toContain(msgType);
    });
  });

  test('sends costAnalysisReady on initialization', () => {
    expect(htmlSource).toMatch(/sendToWix\s*\(\s*['"]costAnalysisReady['"]/);
  });

  test('sends getCostData to request data', () => {
    expect(htmlSource).toMatch(/sendToWix\s*\(\s*['"]getCostData['"]/);
  });

  test('uses sendToWix utility for outbound messages', () => {
    expect(htmlSource).toMatch(/sendToWix\s*\(/);
  });

  test('defines handleMessage function', () => {
    expect(htmlSource).toMatch(/function\s+handleMessage/);
  });
});

describe('RECRUITER_COST_ANALYSIS.html DOM Elements', () => {
  test('has canvas elements for Chart.js charts', () => {
    expect(htmlSource).toMatch(/<canvas/i);
  });

  test('has spend tracking form elements', () => {
    expect(htmlSource).toMatch(/<input/i);
  });

  test('has CSV import area or file input', () => {
    expect(htmlSource).toMatch(/type=["']file["']/i);
  });

  test('has metric display elements', () => {
    expect(htmlSource).toMatch(/Total Spend|Total Hires|Cost Per Hire/i);
  });
});

describe('RECRUITER_COST_ANALYSIS.html Security', () => {
  test('does not use eval()', () => {
    expect(htmlSource).not.toMatch(/\beval\s*\(/);
  });

  test('does not use document.write()', () => {
    expect(htmlSource).not.toMatch(/document\.write\s*\(/);
  });
});

describe('RECRUITER_COST_ANALYSIS.html Branding', () => {
  test('uses VelocityMatch branding in title', () => {
    expect(htmlSource).toMatch(/VelocityMatch/);
  });

  test('does not use LMDR branding in title', () => {
    const titleMatch = htmlSource.match(/<title>(.*?)<\/title>/i);
    expect(titleMatch).toBeTruthy();
    expect(titleMatch[1]).not.toMatch(/LMDR/i);
  });
});

describe('RECRUITER_COST_ANALYSIS.html Functionality', () => {
  test('handles costData message for rendering', () => {
    expect(htmlSource).toMatch(/case\s+['"]costData['"]/);
  });

  test('handles trendData message for trend chart', () => {
    expect(htmlSource).toMatch(/case\s+['"]trendData['"]/);
  });

  test('handles spendSaved message for confirmation', () => {
    expect(htmlSource).toMatch(/case\s+['"]spendSaved['"]/);
  });

  test('handles importComplete message for CSV import', () => {
    expect(htmlSource).toMatch(/case\s+['"]importComplete['"]/);
  });

  test('has channel select dropdown', () => {
    expect(htmlSource).toMatch(/id=["']spend-channel["']/);
  });

  test('has date range selector', () => {
    expect(htmlSource).toMatch(/id=["']dateRange["']/);
  });
});
