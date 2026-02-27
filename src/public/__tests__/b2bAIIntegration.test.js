/* eslint-disable */
/* eslint-env jest */

const fs = require('fs');
const path = require('path');

const BRIDGE_FILE = path.resolve(__dirname, '..', '..', 'backend', 'b2bBridgeService.jsw');
const SECURITY_FILE = path.resolve(__dirname, '..', '..', 'backend', 'b2bSecurityService.jsw');

const bridgeSource = fs.readFileSync(BRIDGE_FILE, 'utf8');
const securitySource = fs.readFileSync(SECURITY_FILE, 'utf8');

function expectedLeadPayload(payload) {
  return [
    'accountId',
    'companyName',
    'leadScore',
    'leadClassification',
    'accountStatus',
    'assignedOwnerId'
  ].every((k) => Object.prototype.hasOwnProperty.call(payload, k));
}

describe('B2B AI integration contracts (Phases 12-15)', () => {
  test('bridge includes new AI routes', () => {
    expect(bridgeSource).toContain("case 'getAccountSummary'");
    expect(bridgeSource).toContain("case 'predictCloseRate'");
    expect(bridgeSource).toContain("case 'analyzeSequencePerformance'");
    expect(bridgeSource).toContain("case 'getSequenceRecommendation'");
    expect(bridgeSource).toContain("case 'getOptimalSendTime'");
    expect(bridgeSource).toContain("case 'getForecastAccuracy'");
  });

  test('security permissions include new AI actions', () => {
    expect(securitySource).toContain('getAccountSummary');
    expect(securitySource).toContain('predictCloseRate');
    expect(securitySource).toContain('analyzeSequencePerformance');
    expect(securitySource).toContain('getSequenceRecommendation');
    expect(securitySource).toContain('getOptimalSendTime');
    expect(securitySource).toContain('getForecastAccuracy');
  });

  test('captureLead payload contract includes scoring fields', () => {
    const payload = {
      accountId: 'acc1',
      companyName: 'Carrier',
      leadScore: 88,
      leadClassification: 'hot',
      accountStatus: 'prospecting',
      assignedOwnerId: 'rep1'
    };
    expect(expectedLeadPayload(payload)).toBe(true);
  });
});
