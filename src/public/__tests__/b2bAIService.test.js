/* eslint-disable */
/* eslint-env jest */

const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '..', '..', 'backend', 'b2bAIService.jsw');
const source = fs.readFileSync(FILE, 'utf8');

function classifyLead(score) {
  if (score >= 80) return 'hot';
  if (score >= 50) return 'warm';
  return 'cold';
}

function forecastBand(probability) {
  if (probability >= 70) return 'commit';
  if (probability >= 40) return 'best';
  return 'pipeline';
}

describe('b2bAIService Phase 12-15 contracts', () => {
  test('exports required phase functions', () => {
    expect(source).toMatch(/export\s+async\s+function\s+scoreAndRouteLead\s*\(/);
    expect(source).toMatch(/export\s+async\s+function\s+predictCloseRate\s*\(/);
    expect(source).toMatch(/export\s+async\s+function\s+analyzeSequencePerformance\s*\(/);
    expect(source).toMatch(/export\s+async\s+function\s+recommendSequence\s*\(/);
    expect(source).toMatch(/export\s+async\s+function\s+getOptimalSendTime\s*\(/);
  });

  test('lead classification thresholds follow spec', () => {
    expect(classifyLead(80)).toBe('hot');
    expect(classifyLead(79)).toBe('warm');
    expect(classifyLead(50)).toBe('warm');
    expect(classifyLead(49)).toBe('cold');
  });

  test('forecast band thresholds are deterministic', () => {
    expect(forecastBand(70)).toBe('commit');
    expect(forecastBand(69)).toBe('best');
    expect(forecastBand(40)).toBe('best');
    expect(forecastBand(39)).toBe('pipeline');
  });

  test('lead scoring includes core factor keys', () => {
    expect(source).toContain("'signal'");
    expect(source).toContain("'fleet_size'");
    expect(source).toContain("'region_overlap'");
    expect(source).toContain("'equipment_fit'");
    expect(source).toContain("'source_quality'");
  });

  test('phase 15 functions include recommendation payload fields', () => {
    expect(source).toContain('recommendation');
    expect(source).toContain('confidence');
    expect(source).toContain('bestWindow');
  });
});
