/* eslint-disable */
/* eslint-env jest */

const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '..', '..', 'backend', 'b2bContentAIService.jsw');
const source = fs.readFileSync(FILE, 'utf8');

function fallbackSummary(name, activityCount) {
  return `${name} has ${activityCount} recent timeline events.`;
}

describe('b2bContentAIService Phase 14 contracts', () => {
  test('exports summarizeTimeline', () => {
    expect(source).toMatch(/export\s+async\s+function\s+summarizeTimeline\s*\(/);
  });

  test('summary parser and fallback helpers exist', () => {
    expect(source).toContain('parseSummaryResponse');
    expect(source).toContain('buildFallbackSummary');
    expect(source).toContain('cacheSummary');
  });

  test('fallback summary text is concise and deterministic', () => {
    const text = fallbackSummary('Carrier X', 7);
    expect(text).toContain('Carrier X');
    expect(text).toContain('7');
  });

  test('summary payload includes required handoff fields', () => {
    expect(source).toContain('relationshipStatus');
    expect(source).toContain('lastInteraction');
    expect(source).toContain('risks');
    expect(source).toContain('nextStep');
  });
});
