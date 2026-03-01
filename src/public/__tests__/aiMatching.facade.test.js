/* eslint-env jest */

const fs = require('fs');
const path = require('path');

describe('AI matching backend facade', () => {
  const facadePath = path.resolve(
    __dirname,
    '..',
    '..',
    'backend',
    'aiMatchingFacade.jsw'
  );

  const facadeSource = fs.readFileSync(facadePath, 'utf8');

  test('exists and imports underlying backend services', () => {
    expect(fs.existsSync(facadePath)).toBe(true);
    expect(facadeSource).toContain("from 'backend/carrierMatching.jsw'");
    expect(facadeSource).toContain("from 'backend/driverProfiles.jsw'");
    expect(facadeSource).toContain("from 'backend/applicationService.jsw'");
    expect(facadeSource).toContain("from 'backend/asyncSearchService.jsw'");
  });

  test('exports page-oriented facade methods', () => {
    expect(facadeSource).toContain('export async function loadDriverBootstrapData()');
    expect(facadeSource).toContain('export async function findCarrierMatchesForPage(');
    expect(facadeSource).toContain('export async function startAsyncCarrierSearchForPage(');
    expect(facadeSource).toContain('export async function getDriverProfileForPage()');
    expect(facadeSource).toContain('export async function submitDriverApplicationForPage(');
  });

  test('normalizes page-facing result shapes', () => {
    expect(facadeSource).toContain('interests: asArray(result?.mutualInterests)');
    expect(facadeSource).toContain('carriers: asArray(result?.carriers)');
    expect(facadeSource).toContain('return asArray(result?.applications || result);');
  });
});
