/* eslint-disable */
/* eslint-env jest */
const fs = require('fs');
const path = require('path');

const HTML_FILE = path.resolve(__dirname, '..', 'recruiter', 'RECRUITER_LIFECYCLE_MONITOR.html');

const htmlSource = fs.readFileSync(HTML_FILE, 'utf8');

// ============================================================================
// HTML Structure
// ============================================================================
describe('RECRUITER_LIFECYCLE_MONITOR.html - HTML Structure', () => {
  test('has DOCTYPE declaration', () => {
    expect(htmlSource).toMatch(/<!DOCTYPE html>/i);
  });

  test('has html tag with lang attribute', () => {
    expect(htmlSource).toMatch(/<html[^>]+lang=[\"']en[\"']/i);
  });

  test('has UTF-8 charset meta tag', () => {
    expect(htmlSource).toMatch(/<meta[^>]+charset=[\"']UTF-8[\"']/i);
  });

  test('has viewport meta tag', () => {
    expect(htmlSource).toMatch(/<meta[^>]+name=[\"']viewport[\"']/i);
  });

  test('has correct title', () => {
    expect(htmlSource).toMatch(/<title>Driver Lifecycle Monitor - VelocityMatch<\/title>/i);
  });
});

// ============================================================================
// External Dependencies
// ============================================================================
describe('RECRUITER_LIFECYCLE_MONITOR.html - External Dependencies', () => {
  test('includes Tailwind CSS CDN', () => {
    expect(htmlSource).toMatch(/cdn\.tailwindcss\.com/);
  });

  test('includes Font Awesome CDN', () => {
    expect(htmlSource).toMatch(/cdnjs\.cloudflare\.com.*font-awesome/i);
  });

  test('includes Inter font from Google Fonts', () => {
    expect(htmlSource).toMatch(/fonts\.googleapis\.com.*Inter/);
  });

  test('has inline Tailwind configuration', () => {
    expect(htmlSource).toMatch(/tailwind\.config\s*=/);
  });
});

// ============================================================================
// Tailwind Configuration
// ============================================================================
describe('RECRUITER_LIFECYCLE_MONITOR.html - Tailwind Configuration', () => {
  test('defines lmdr blue color', () => {
    expect(htmlSource).toMatch(/blue:\s*['"]#2563eb['"]/);
  });

  test('defines lmdr dark color', () => {
    expect(htmlSource).toMatch(/dark:\s*['"]#0f172a['"]/);
  });

  test('defines lmdr light color', () => {
    expect(htmlSource).toMatch(/light:\s*['"]#f1f5f9['"]/);
  });

  test('uses Inter font family', () => {
    expect(htmlSource).toMatch(/fontFamily.*Inter/);
  });
});

// ============================================================================
// Message Protocol (Placeholder Bridge)
// ============================================================================
describe('RECRUITER_LIFECYCLE_MONITOR.html - Message Protocol', () => {
  test('sets up message event listener', () => {
    expect(htmlSource).toMatch(/addEventListener\s*\(\s*['"]message['"]/);
  });

  test('handles loadDriver inbound message type', () => {
    expect(htmlSource).toMatch(/['"]loadDriver['"]/);
  });

  test('uses TYPE protocol (event.data.type)', () => {
    expect(htmlSource).toMatch(/event\.data\.type/);
  });
});

// ============================================================================
// DOM Elements - Timeline
// ============================================================================
describe('RECRUITER_LIFECYCLE_MONITOR.html - Timeline', () => {
  test('has timeline container element', () => {
    expect(htmlSource).toMatch(/id=[\"']timeline-container[\"']/);
  });

  test('has loading spinner in timeline container', () => {
    expect(htmlSource).toMatch(/fa-spinner/);
    expect(htmlSource).toMatch(/Loading timeline/);
  });

  test('has timeline-line CSS for vertical connector', () => {
    expect(htmlSource).toMatch(/\.timeline-line::before/);
  });

  test('has timeline-item class in rendered markup', () => {
    expect(htmlSource).toMatch(/timeline-item/);
  });
});

// ============================================================================
// DOM Elements - Risk Alert
// ============================================================================
describe('RECRUITER_LIFECYCLE_MONITOR.html - Risk Alert', () => {
  test('has risk-alert element', () => {
    expect(htmlSource).toMatch(/id=[\"']risk-alert[\"']/);
  });

  test('risk alert starts hidden', () => {
    expect(htmlSource).toMatch(/id=[\"']risk-alert[\"'][^>]*class=[\"'][^\"']*hidden/);
  });

  test('displays Retention Risk Detected heading', () => {
    expect(htmlSource).toMatch(/Retention Risk Detected/);
  });
});

// ============================================================================
// DOM Elements - Sidebar
// ============================================================================
describe('RECRUITER_LIFECYCLE_MONITOR.html - Sidebar', () => {
  test('has sidebar with Driver Stats section', () => {
    expect(htmlSource).toMatch(/Driver Stats/);
  });

  test('displays Days Tenure metric', () => {
    expect(htmlSource).toMatch(/Days Tenure/);
  });

  test('displays Satisfaction Score metric', () => {
    expect(htmlSource).toMatch(/Satisfaction Score/);
  });

  test('displays Positive Events metric', () => {
    expect(htmlSource).toMatch(/Positive Events/);
  });

  test('has Disposition History section', () => {
    expect(htmlSource).toMatch(/Disposition History/);
  });
});

// ============================================================================
// DOM Elements - Log Event Modal
// ============================================================================
describe('RECRUITER_LIFECYCLE_MONITOR.html - Log Event Modal', () => {
  test('has log modal element', () => {
    expect(htmlSource).toMatch(/id=[\"']logModal[\"']/);
  });

  test('has log modal content wrapper', () => {
    expect(htmlSource).toMatch(/id=[\"']logModalContent[\"']/);
  });

  test('has event type select dropdown', () => {
    expect(htmlSource).toMatch(/id=[\"']logEventType[\"']/);
  });

  test('has event type options: Incident, Recognition, Training, Note', () => {
    expect(htmlSource).toMatch(/value=[\"']INCIDENT[\"']/);
    expect(htmlSource).toMatch(/value=[\"']RECOGNITION[\"']/);
    expect(htmlSource).toMatch(/value=[\"']TRAINING[\"']/);
    expect(htmlSource).toMatch(/value=[\"']NOTE[\"']/);
  });

  test('has event note textarea', () => {
    expect(htmlSource).toMatch(/id=[\"']logEventNote[\"']/);
  });

  test('has Save Log button', () => {
    expect(htmlSource).toMatch(/submitLog\(\)/);
    expect(htmlSource).toMatch(/Save\s*\n?\s*Log/i);
  });
});

// ============================================================================
// DOM Elements - Termination Wizard Modal
// ============================================================================
describe('RECRUITER_LIFECYCLE_MONITOR.html - Termination Wizard', () => {
  test('has termination modal element', () => {
    expect(htmlSource).toMatch(/id=[\"']termModal[\"']/);
  });

  test('has termination modal content wrapper', () => {
    expect(htmlSource).toMatch(/id=[\"']termModalContent[\"']/);
  });

  test('has termination step 1', () => {
    expect(htmlSource).toMatch(/id=[\"']termStep1[\"']/);
  });

  test('has four termination category buttons', () => {
    expect(htmlSource).toMatch(/selectCategory\(\s*['"]OPERATIONS['"]/);
    expect(htmlSource).toMatch(/selectCategory\(\s*['"]COMPENSATION['"]/);
    expect(htmlSource).toMatch(/selectCategory\(\s*['"]PERSONAL['"]/);
    expect(htmlSource).toMatch(/selectCategory\(\s*['"]COMPLIANCE['"]/);
  });

  test('has hidden termCategory input', () => {
    expect(htmlSource).toMatch(/id=[\"']termCategory[\"']/);
  });

  test('has reason code select dropdown', () => {
    expect(htmlSource).toMatch(/id=[\"']termReasonCode[\"']/);
  });

  test('has reason detail section (initially hidden)', () => {
    expect(htmlSource).toMatch(/id=[\"']reasonDetailSection[\"']/);
  });

  test('has recruiter notes textarea', () => {
    expect(htmlSource).toMatch(/id=[\"']termNotes[\"']/);
  });

  test('has rehire eligibility checkbox', () => {
    expect(htmlSource).toMatch(/id=[\"']termRehire[\"']/);
    expect(htmlSource).toMatch(/Eligible for Rehire/);
  });

  test('has Confirm Termination button', () => {
    expect(htmlSource).toMatch(/submitTermination\(\)/);
    expect(htmlSource).toMatch(/Confirm\s*\n?\s*Termination/i);
  });
});

// ============================================================================
// Functionality - Mock Data & Functions
// ============================================================================
describe('RECRUITER_LIFECYCLE_MONITOR.html - Functionality', () => {
  test('defines MOCK_TIMELINE data array', () => {
    expect(htmlSource).toMatch(/const\s+MOCK_TIMELINE\s*=/);
  });

  test('MOCK_TIMELINE includes expected lifecycle events', () => {
    expect(htmlSource).toMatch(/APPLICATION_SUBMITTED/);
    expect(htmlSource).toMatch(/INTERVIEW_COMPLETED/);
    expect(htmlSource).toMatch(/HIRED_ACTIVE/);
    expect(htmlSource).toMatch(/ORIENTATION_COMPLETE/);
    expect(htmlSource).toMatch(/FIRST_DISPATCH/);
    expect(htmlSource).toMatch(/SURVEY_SENT/);
    expect(htmlSource).toMatch(/SURVEY_COMPLETED/);
    expect(htmlSource).toMatch(/30_DAY_MILESTONE/);
  });

  test('defines REASON_CODES mapping with four categories', () => {
    expect(htmlSource).toMatch(/const\s+REASON_CODES\s*=/);
    expect(htmlSource).toMatch(/['"]OPERATIONS['"]\s*:/);
    expect(htmlSource).toMatch(/['"]COMPENSATION['"]\s*:/);
    expect(htmlSource).toMatch(/['"]PERSONAL['"]\s*:/);
    expect(htmlSource).toMatch(/['"]COMPLIANCE['"]\s*:/);
  });

  test('defines renderTimeline function', () => {
    expect(htmlSource).toMatch(/function\s+renderTimeline\s*\(/);
  });

  test('defines openLogModal function', () => {
    expect(htmlSource).toMatch(/function\s+openLogModal\s*\(/);
  });

  test('defines closeLogModal function', () => {
    expect(htmlSource).toMatch(/function\s+closeLogModal\s*\(/);
  });

  test('defines openTerminationWizard function', () => {
    expect(htmlSource).toMatch(/function\s+openTerminationWizard\s*\(/);
  });

  test('defines closeTermModal function', () => {
    expect(htmlSource).toMatch(/function\s+closeTermModal\s*\(/);
  });

  test('defines selectCategory function', () => {
    expect(htmlSource).toMatch(/function\s+selectCategory\s*\(/);
  });

  test('defines submitLog function', () => {
    expect(htmlSource).toMatch(/function\s+submitLog\s*\(/);
  });

  test('defines submitTermination function', () => {
    expect(htmlSource).toMatch(/function\s+submitTermination\s*\(/);
  });

  test('renders timeline on DOMContentLoaded', () => {
    expect(htmlSource).toMatch(/DOMContentLoaded/);
    expect(htmlSource).toMatch(/renderTimeline\s*\(\s*MOCK_TIMELINE\s*\)/);
  });

  test('shows risk alert if any timeline event has alert flag', () => {
    expect(htmlSource).toMatch(/MOCK_TIMELINE\.some\s*\(\s*e\s*=>\s*e\.alert\s*\)/);
  });
});

// ============================================================================
// Security
// ============================================================================
describe('RECRUITER_LIFECYCLE_MONITOR.html - Security', () => {
  test('does not use eval()', () => {
    expect(htmlSource).not.toMatch(/\beval\s*\(/);
  });

  test('does not use document.write()', () => {
    expect(htmlSource).not.toMatch(/document\.write\s*\(/);
  });
});

// ============================================================================
// Branding
// ============================================================================
describe('RECRUITER_LIFECYCLE_MONITOR.html - Branding', () => {
  test('uses VelocityMatch branding in title', () => {
    expect(htmlSource).toMatch(/VelocityMatch/);
  });

  test('does not use LMDR branding in title', () => {
    const titleMatch = htmlSource.match(/<title>([^<]+)<\/title>/i);
    expect(titleMatch).toBeTruthy();
    expect(titleMatch[1]).not.toMatch(/LMDR/i);
  });

  test('uses VM logo mark in header', () => {
    expect(htmlSource).toMatch(/>VM<\/div>/);
  });
});
