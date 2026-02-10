/* eslint-disable */
/* eslint-env jest */
const fs = require('fs');
const path = require('path');

const HTML_FILE = path.resolve(__dirname, '..', 'recruiter', 'RECRUITER_FUNNEL.html');
// Actual message types used in the HTML (may differ from page code)
const INBOUND_MESSAGES = ['funnelData'];
const OUTBOUND_MESSAGES = ['funnelReady', 'getFunnelData'];

const htmlSource = fs.readFileSync(HTML_FILE, 'utf8');

describe('RECRUITER_FUNNEL.html - HTML Structure', () => {
  test('declares DOCTYPE html', () => {
    expect(htmlSource).toMatch(/<!DOCTYPE html>/i);
  });

  test('has html tag with lang attribute', () => {
    expect(htmlSource).toMatch(/<html[^>]+lang=["']en["']/i);
  });

  test('declares UTF-8 charset', () => {
    expect(htmlSource).toMatch(/<meta[^>]+charset=["']UTF-8["']/i);
  });

  test('includes viewport meta tag', () => {
    expect(htmlSource).toMatch(/<meta[^>]+name=["']viewport["']/i);
    expect(htmlSource).toMatch(/width=device-width/i);
  });

  test('has correct title', () => {
    expect(htmlSource).toMatch(/<title>Recruiting Funnel - VelocityMatch<\/title>/);
  });
});

describe('RECRUITER_FUNNEL.html - External Dependencies', () => {
  test('loads Tailwind CSS from CDN', () => {
    expect(htmlSource).toMatch(/https:\/\/cdn\.tailwindcss\.com/);
  });

  test('loads Chart.js from CDN', () => {
    expect(htmlSource).toMatch(/https:\/\/cdn\.jsdelivr\.net\/npm\/chart\.js/);
  });

  test('loads chartjs-plugin-datalabels from CDN', () => {
    expect(htmlSource).toMatch(/https:\/\/cdn\.jsdelivr\.net\/npm\/chartjs-plugin-datalabels@2\.0\.0/);
  });

  test('loads Font Awesome from CDN', () => {
    expect(htmlSource).toMatch(/font-awesome\/6\.\d+\.\d+\/css\/all\.min\.css/);
  });

  test('loads Inter font from Google Fonts', () => {
    expect(htmlSource).toMatch(/fonts\.googleapis\.com\/css2\?family=Inter/);
  });

  test('includes inline Tailwind config', () => {
    expect(htmlSource).toMatch(/tailwind\.config\s*=/);
  });
});

describe('RECRUITER_FUNNEL.html - Tailwind Configuration', () => {
  test('defines lmdr color palette', () => {
    expect(htmlSource).toMatch(/lmdr:\s*{/);
    expect(htmlSource).toMatch(/blue:\s*['"]#2563eb['"]/);
    expect(htmlSource).toMatch(/dark:\s*['"]#0f172a['"]/);
    expect(htmlSource).toMatch(/yellow:\s*['"]#fbbf24['"]/);
  });

  test('defines premium box shadow styles', () => {
    expect(htmlSource).toMatch(/['"]?premium['"]?\s*:/);
    expect(htmlSource).toMatch(/['"]?premium-hover['"]?\s*:/);
  });

  test('defines float animation', () => {
    expect(htmlSource).toMatch(/['"]?float['"]?\s*:/);
    expect(htmlSource).toMatch(/keyframes:\s*{[\s\S]*?float:/);
    expect(htmlSource).toMatch(/translateY/);
  });
});

describe('RECRUITER_FUNNEL.html - Message Protocol', () => {
  test('sets up message event listener', () => {
    expect(htmlSource).toMatch(/window\.addEventListener\s*\(\s*['"]message['"]/);
    expect(htmlSource).toMatch(/handleMessage/);
  });

  test('handles all inbound message types', () => {
    INBOUND_MESSAGES.forEach(msgType => {
      const pattern = new RegExp(`['"\`]${msgType}['"\`]`, 'i');
      expect(htmlSource).toMatch(pattern);
    });
  });

  test('sends all outbound message types', () => {
    OUTBOUND_MESSAGES.forEach(msgType => {
      const pattern = new RegExp(`['"\`]${msgType}['"\`]`);
      expect(htmlSource).toMatch(pattern);
    });
  });

  test('uses type protocol (msg.type)', () => {
    expect(htmlSource).toMatch(/msg\.type|event\.data\.type/);
    expect(htmlSource).not.toMatch(/msg\.action|event\.data\.action/);
  });

  test('sends funnelReady on initialization', () => {
    expect(htmlSource).toMatch(/sendToWix\s*\(\s*['"]funnelReady['"]/);
  });

  test('validates message source from parent', () => {
    expect(htmlSource).toMatch(/event\.source\s*[!=]==?\s*window\.parent/);
  });
});

describe('RECRUITER_FUNNEL.html - DOM Elements', () => {
  test('includes chart canvas element', () => {
    expect(htmlSource).toMatch(/<canvas[^>]+id=["']funnelChart["']/);
  });

  test('includes bottleneck insights panel', () => {
    expect(htmlSource).toMatch(/id=["']bottlenecks-list["']/);
    expect(htmlSource).toMatch(/Insights & Bottlenecks|Automated Analysis/i);
  });

  test('includes stage metrics table', () => {
    expect(htmlSource).toMatch(/id=["']metrics-table-body["']/);
    expect(htmlSource).toMatch(/Stage Performance Matrix|Stage Name/i);
  });

  test('includes loading overlay', () => {
    expect(htmlSource).toMatch(/id=["']loading["']/);
    expect(htmlSource).toMatch(/Loading Analytics/i);
  });
});

describe('RECRUITER_FUNNEL.html - Security', () => {
  test('does not use raw innerHTML with user data', () => {
    const dangerousPatterns = [
      /\.innerHTML\s*=\s*msg\./,
      /\.innerHTML\s*=\s*data\./,
      /\.innerHTML\s*=\s*event\.data/
    ];
    dangerousPatterns.forEach(pattern => {
      expect(htmlSource).not.toMatch(pattern);
    });
  });

  test('does not use eval', () => {
    expect(htmlSource).not.toMatch(/\beval\s*\(/);
  });

  test('does not use document.write', () => {
    expect(htmlSource).not.toMatch(/document\.write/);
  });
});

describe('RECRUITER_FUNNEL.html - Branding', () => {
  test('uses VelocityMatch branding in title', () => {
    expect(htmlSource).toMatch(/VelocityMatch/);
  });

  test('does not reference LMDR branding in title', () => {
    // Allow lmdr in CSS class names and tailwind config, check title only
    const titleMatch = htmlSource.match(/<title>(.*?)<\/title>/i);
    expect(titleMatch).toBeTruthy();
    expect(titleMatch[1]).not.toMatch(/LMDR/i);
  });
});
