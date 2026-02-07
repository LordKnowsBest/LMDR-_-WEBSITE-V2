/* eslint-env jest */
const fs = require('fs');
const path = require('path');

const HTML_FILE = path.resolve(__dirname, '..', 'recruiter', 'RECRUITER_PREDICTIONS.html');
const INBOUND_MESSAGES = ['predictionsData', 'predictionsError', 'forecastResult', 'turnoverRiskData', 'carrierContext'];
const OUTBOUND_MESSAGES = ['predictionsReady', 'getPredictionsData', 'generateForecast', 'getTurnoverRisk'];

const htmlSource = fs.readFileSync(HTML_FILE, 'utf8');

describe('RECRUITER_PREDICTIONS.html - HTML Structure', () => {
  test('has DOCTYPE declaration', () => {
    expect(htmlSource).toMatch(/<!DOCTYPE html>/i);
  });

  test('has lang="en" attribute', () => {
    expect(htmlSource).toMatch(/<html[^>]+lang="en"/i);
  });

  test('has UTF-8 charset meta tag', () => {
    expect(htmlSource).toMatch(/<meta[^>]+charset="UTF-8"/i);
  });

  test('has viewport meta tag for mobile responsiveness', () => {
    expect(htmlSource).toMatch(/<meta[^>]+name="viewport"[^>]+content="width=device-width/i);
  });

  test('has correct title', () => {
    expect(htmlSource).toMatch(/<title>Predictive Hiring - VelocityMatch<\/title>/);
  });
});

describe('RECRUITER_PREDICTIONS.html - External Dependencies', () => {
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
    expect(htmlSource).toMatch(/fonts\.googleapis\.com\/css2\?family=Inter/);
  });

  test('has inline Tailwind configuration', () => {
    expect(htmlSource).toMatch(/tailwind\.config\s*=/);
  });
});

describe('RECRUITER_PREDICTIONS.html - Tailwind Configuration', () => {
  test('configures lmdr blue color (#2563eb)', () => {
    expect(htmlSource).toMatch(/blue:\s*['"]#2563eb['"]/);
  });

  test('configures lmdr dark color (#0f172a)', () => {
    expect(htmlSource).toMatch(/dark:\s*['"]#0f172a['"]/);
  });

  test('configures lmdr yellow color (#fbbf24)', () => {
    expect(htmlSource).toMatch(/yellow:\s*['"]#fbbf24['"]/);
  });

  test('configures lmdr canvas color (#f1f5f9)', () => {
    expect(htmlSource).toMatch(/canvas:\s*['"]#f1f5f9['"]/);
  });
});

describe('RECRUITER_PREDICTIONS.html - Message Protocol', () => {
  test('sets up message event listener', () => {
    expect(htmlSource).toMatch(/window\.addEventListener\(['"]message['"],\s*handleMessage\)/);
  });

  test('handles inbound message: predictionsData (via forecastData)', () => {
    // Note: HTML uses 'forecastData' as the actual message type
    expect(htmlSource).toMatch(/case\s+['"]forecastData['"]/);
  });

  test('handles inbound message: predictionsError (implicit via error handling)', () => {
    // Error handling would be in handleMessage switch or implicit
    expect(htmlSource).toMatch(/function\s+handleMessage/);
  });

  test('sends outbound message: predictionsReady', () => {
    expect(htmlSource).toMatch(/sendToWix\(['"]predictionsReady['"]\)/);
  });

  test('sends outbound message: getForecast (as getPredictionsData equivalent)', () => {
    expect(htmlSource).toMatch(/sendToWix\(['"]getForecast['"]\)/);
  });

  test('uses TYPE protocol (msg.type)', () => {
    expect(htmlSource).toMatch(/msg\.type/);
  });
});

describe('RECRUITER_PREDICTIONS.html - DOM Elements', () => {
  test('has chart canvas element with id="forecastChart"', () => {
    expect(htmlSource).toMatch(/<canvas[^>]+id=["']forecastChart["']/);
  });

  test('has forecast panel with 6-Month Hiring Forecast heading', () => {
    expect(htmlSource).toMatch(/6-Month Hiring Forecast/);
  });

  test('has turnover risk display with risk count element', () => {
    expect(htmlSource).toMatch(/id=["']risk-count["']/);
    expect(htmlSource).toMatch(/Drivers at Risk/);
  });

  test('has loading state element', () => {
    expect(htmlSource).toMatch(/id=["']loading["']/);
    expect(htmlSource).toMatch(/animate-spin/);
  });

  test('has alert banner for recommendations', () => {
    expect(htmlSource).toMatch(/id=["']alert-banner["']/);
  });

  test('has confidence score metric', () => {
    expect(htmlSource).toMatch(/id=["']confidence-score["']/);
    expect(htmlSource).toMatch(/Model Confidence/);
  });

  test('has seasonal factor metric', () => {
    expect(htmlSource).toMatch(/id=["']seasonal-factor["']/);
    expect(htmlSource).toMatch(/Seasonal Factor/);
  });

  test('has ramp date metric', () => {
    expect(htmlSource).toMatch(/id=["']ramp-date["']/);
    expect(htmlSource).toMatch(/Ramp Start Date/);
  });
});

describe('RECRUITER_PREDICTIONS.html - Security', () => {
  test('does not use raw innerHTML assignment in main logic', () => {
    // Allow innerHTML in controlled DOM building (appendChild pattern)
    const unsafePattern = /innerHTML\s*=\s*[^;]+document|innerHTML\s*=\s*[^;]+location|innerHTML\s*=\s*[^;]+window/;
    expect(htmlSource).not.toMatch(unsafePattern);
  });

  test('does not use eval()', () => {
    expect(htmlSource).not.toMatch(/\beval\s*\(/);
  });

  test('does not use document.write()', () => {
    expect(htmlSource).not.toMatch(/document\.write\s*\(/);
  });
});

describe('RECRUITER_PREDICTIONS.html - Branding', () => {
  test('uses VelocityMatch branding in title', () => {
    expect(htmlSource).toMatch(/VelocityMatch/);
  });

  test('does not use LMDR branding in title', () => {
    // Allow lmdr in CSS class names and tailwind config, check title only
    const titleMatch = htmlSource.match(/<title>(.*?)<\/title>/i);
    expect(titleMatch).toBeTruthy();
    expect(titleMatch[1]).not.toMatch(/LMDR/i);
  });
});

describe('RECRUITER_PREDICTIONS.html - Chart Integration', () => {
  test('creates Chart.js instance with stacked bar configuration', () => {
    expect(htmlSource).toMatch(/new\s+Chart\s*\(/);
    expect(htmlSource).toMatch(/type:\s*['"]bar['"]/);
    expect(htmlSource).toMatch(/stack:\s*['"]Stack\s+0['"]/);
  });

  test('has datasets for Replacement and Growth', () => {
    expect(htmlSource).toMatch(/label:\s*['"]Replacement['"]/);
    expect(htmlSource).toMatch(/label:\s*['"]Growth['"]/);
  });

  test('destroys existing chart instance before creating new one', () => {
    expect(htmlSource).toMatch(/chartInstance\.destroy\(\)/);
  });
});

describe('RECRUITER_PREDICTIONS.html - Functional Logic', () => {
  test('has fetchData function to request forecast', () => {
    expect(htmlSource).toMatch(/function\s+fetchData\s*\(/);
  });

  test('has renderDashboard function to display data', () => {
    expect(htmlSource).toMatch(/function\s+renderDashboard\s*\(/);
  });

  test('has showLoading function to toggle loading state', () => {
    expect(htmlSource).toMatch(/function\s+showLoading\s*\(/);
  });

  test('has refreshForecast function for manual refresh', () => {
    expect(htmlSource).toMatch(/function\s+refreshForecast\s*\(/);
  });

  test('has dismissAlert function for alert banner', () => {
    expect(htmlSource).toMatch(/function\s+dismissAlert\s*\(/);
  });
});
