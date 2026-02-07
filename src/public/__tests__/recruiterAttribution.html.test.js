/* eslint-env jest */
const fs = require('fs');
const path = require('path');

// CONFIGURATION
const HTML_FILE = path.resolve(__dirname, '..', 'recruiter', 'RECRUITER_ATTRIBUTION.html');

const INBOUND_MESSAGES = ['attributionData', 'attributionError', 'touchpointResult', 'hireAttributionResult', 'carrierContext'];
const OUTBOUND_MESSAGES = ['attributionReady', 'getAttributionData', 'recordTouchpoint', 'recordHireAttribution'];

// READ SOURCE FILE
const htmlSource = fs.readFileSync(HTML_FILE, 'utf8');

describe('RECRUITER_ATTRIBUTION.html - HTML Structure', () => {
  test('should have DOCTYPE declaration', () => {
    expect(htmlSource.trim()).toMatch(/^<!DOCTYPE html>/i);
  });

  test('should have html tag with lang attribute', () => {
    expect(htmlSource).toMatch(/<html\s+[^>]*lang=["']en["']/i);
  });

  test('should have meta charset UTF-8', () => {
    expect(htmlSource).toMatch(/<meta\s+charset=["']UTF-8["']/i);
  });

  test('should have meta viewport tag', () => {
    expect(htmlSource).toMatch(/<meta\s+name=["']viewport["']/i);
  });

  test('should have title tag', () => {
    expect(htmlSource).toMatch(/<title>.*<\/title>/i);
  });

  test('should have exact title "Source Attribution - VelocityMatch"', () => {
    const titleMatch = htmlSource.match(/<title>(.*?)<\/title>/i);
    expect(titleMatch).toBeTruthy();
    expect(titleMatch[1]).toBe('Source Attribution - VelocityMatch');
  });
});

describe('RECRUITER_ATTRIBUTION.html - External Dependencies', () => {
  test('should include Tailwind CSS CDN', () => {
    expect(htmlSource).toMatch(/https:\/\/cdn\.tailwindcss\.com/);
  });

  test('should include Chart.js CDN', () => {
    expect(htmlSource).toMatch(/https:\/\/cdn\.jsdelivr\.net\/npm\/chart\.js/);
  });

  test('should include Font Awesome CDN', () => {
    expect(htmlSource).toMatch(/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome/);
  });

  test('should include Google Fonts Inter', () => {
    expect(htmlSource).toMatch(/fonts\.googleapis\.com\/css2\?family=Inter/);
  });

  test('should have inline Tailwind config script', () => {
    expect(htmlSource).toMatch(/tailwind\.config\s*=/);
  });
});

describe('RECRUITER_ATTRIBUTION.html - Tailwind Configuration', () => {
  test('should define lmdr color palette in tailwind.config', () => {
    expect(htmlSource).toMatch(/colors:\s*{\s*lmdr:/);
  });

  test('should define lmdr.blue as #2563eb', () => {
    expect(htmlSource).toMatch(/blue:\s*['"]#2563eb['"]/);
  });

  test('should define lmdr.dark as #0f172a', () => {
    expect(htmlSource).toMatch(/dark:\s*['"]#0f172a['"]/);
  });
});

describe('RECRUITER_ATTRIBUTION.html - Message Protocol', () => {
  test('should have window.addEventListener for message event', () => {
    expect(htmlSource).toMatch(/window\.addEventListener\s*\(\s*['"]message['"]/);
  });

  test('should handle attributionData message type', () => {
    expect(htmlSource).toMatch(/case\s+['"]attributionData['"]/);
  });

  test('should send attributionReady message on init', () => {
    expect(htmlSource).toMatch(/sendToWix\s*\(\s*['"]attributionReady['"]/);
  });

  test('should send getAttributionData message', () => {
    expect(htmlSource).toMatch(/sendToWix\s*\(\s*['"]getAttributionData['"]/);
  });

  test('should use type protocol (msg.type) not action protocol', () => {
    expect(htmlSource).toMatch(/msg\.type/);
    expect(htmlSource).toMatch(/type:/);
  });

  test('should use parent.postMessage for sending messages', () => {
    expect(htmlSource).toMatch(/parent\.postMessage/);
  });
});

describe('RECRUITER_ATTRIBUTION.html - DOM Elements', () => {
  test('should have sourceChart canvas element', () => {
    expect(htmlSource).toMatch(/<canvas\s+id=["']sourceChart["']/);
  });

  test('should have mediumChart canvas element', () => {
    expect(htmlSource).toMatch(/<canvas\s+id=["']mediumChart["']/);
  });

  test('should have attribution model toggle buttons', () => {
    expect(htmlSource).toMatch(/id=["']btn-first["']/);
    expect(htmlSource).toMatch(/id=["']btn-last["']/);
  });

  test('should have loading state element', () => {
    expect(htmlSource).toMatch(/id=["']loading["']/);
  });

  test('should have campaign table body element', () => {
    expect(htmlSource).toMatch(/id=["']campaign-table-body["']/);
  });
});

describe('RECRUITER_ATTRIBUTION.html - Security & Sanitization', () => {
  test('should use textContent for dynamic text updates (not innerHTML with user data)', () => {
    // Check that summary cards use textContent
    expect(htmlSource).toMatch(/getElementById\(['"]total-conversions['"]\)\.textContent/);
    expect(htmlSource).toMatch(/getElementById\(['"]top-source['"]\)\.textContent/);
    expect(htmlSource).toMatch(/getElementById\(['"]top-medium['"]\)\.textContent/);
  });

  test('should not use eval()', () => {
    expect(htmlSource).not.toMatch(/\beval\s*\(/);
  });

  test('should not use document.write', () => {
    expect(htmlSource).not.toMatch(/document\.write/);
  });
});

describe('RECRUITER_ATTRIBUTION.html - VelocityMatch Branding', () => {
  test('should have VelocityMatch in title', () => {
    expect(htmlSource).toMatch(/<title>.*VelocityMatch.*<\/title>/i);
  });

  test('should not have LMDR branding in title', () => {
    const titleMatch = htmlSource.match(/<title>(.*?)<\/title>/i);
    expect(titleMatch).toBeTruthy();
    expect(titleMatch[1]).not.toMatch(/LMDR/i);
  });
});

describe('RECRUITER_ATTRIBUTION.html - Chart.js Integration', () => {
  test('should initialize Chart instances for sourceChart', () => {
    expect(htmlSource).toMatch(/getElementById\(['"]sourceChart['"]\)\.getContext\(['"]2d['"]\)/);
  });

  test('should initialize Chart instances for mediumChart', () => {
    expect(htmlSource).toMatch(/getElementById\(['"]mediumChart['"]\)\.getContext\(['"]2d['"]\)/);
  });

  test('should destroy existing charts before re-rendering', () => {
    expect(htmlSource).toMatch(/chartInstances\.\w+\.destroy\(\)/);
  });

  test('should create bar chart for source attribution', () => {
    expect(htmlSource).toMatch(/type:\s*['"]bar['"]/);
  });

  test('should create doughnut chart for medium breakdown', () => {
    expect(htmlSource).toMatch(/type:\s*['"]doughnut['"]/);
  });
});

describe('RECRUITER_ATTRIBUTION.html - Attribution Model Logic', () => {
  test('should have setModel function', () => {
    expect(htmlSource).toMatch(/function\s+setModel\s*\(/);
  });

  test('should support first_touch model', () => {
    expect(htmlSource).toMatch(/['"]first_touch['"]/);
  });

  test('should support last_touch model', () => {
    expect(htmlSource).toMatch(/['"]last_touch['"]/);
  });

  test('should track currentModel state variable', () => {
    expect(htmlSource).toMatch(/let\s+currentModel/);
  });
});

describe('RECRUITER_ATTRIBUTION.html - Date Range Functionality', () => {
  test('should have dateRange select element', () => {
    expect(htmlSource).toMatch(/id=["']dateRange["']/);
  });

  test('should have fetchData function', () => {
    expect(htmlSource).toMatch(/function\s+fetchData\s*\(/);
  });

  test('should have getDateRange helper function', () => {
    expect(htmlSource).toMatch(/function\s+getDateRange\s*\(/);
  });

  test('should support multiple date range options', () => {
    expect(htmlSource).toMatch(/value=["']30["']/);
    expect(htmlSource).toMatch(/value=["']90["']/);
    expect(htmlSource).toMatch(/value=["']365["']/);
    expect(htmlSource).toMatch(/value=["']all["']/);
  });
});
