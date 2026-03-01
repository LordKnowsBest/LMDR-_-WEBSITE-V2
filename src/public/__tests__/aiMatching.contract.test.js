/* eslint-env jest */

const path = require('path');

describe('AI matching bridge contract', () => {
  const contract = require(path.resolve(
    __dirname,
    '..',
    'driver',
    'js',
    'ai-matching-contract.js'
  ));

  test('registers known HTML -> Wix messages', () => {
    expect(contract.MESSAGE_REGISTRY.outbound).toEqual(expect.arrayContaining([
      'carrierMatchingReady',
      'findMatches',
      'submitApplication',
      'pollSearchJob',
      'resolveApprovalGate'
    ]));
  });

  test('registers known Wix -> HTML messages', () => {
    expect(contract.MESSAGE_REGISTRY.inbound).toEqual(expect.arrayContaining([
      'pageReady',
      'matchResults',
      'applicationSubmitted',
      'searchJobStatus',
      'voiceReady'
    ]));
  });

  test('builds HTML -> Wix envelope using canonical type', () => {
    expect(contract.buildHtmlToPageEnvelope('ping', { ok: true })).toEqual({
      type: 'carrierMatching',
      action: 'ping',
      data: { ok: true }
    });
  });

  test('validates HTML -> Wix envelope shape', () => {
    expect(contract.validateHtmlToPageMessage({
      type: 'carrierMatching',
      action: 'findMatches',
      data: { homeZip: '75001' }
    })).toBe(true);

    expect(contract.validateHtmlToPageMessage({
      type: 'wrong',
      action: 'findMatches',
      data: {}
    })).toBe(false);
  });

  test('validates Wix -> HTML envelope shape', () => {
    expect(contract.validatePageToHtmlMessage({
      type: 'matchResults',
      data: { matches: [] },
      timestamp: Date.now()
    })).toBe(true);

    expect(contract.validatePageToHtmlMessage({
      type: '',
      data: { matches: [] }
    })).toBe(false);
  });
});
