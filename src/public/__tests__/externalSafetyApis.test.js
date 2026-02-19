/* eslint-disable */

jest.mock('backend/fmcsaService', () => ({
  getCarrierSafetyData: jest.fn()
}));

jest.mock('backend/csaMonitorService', () => ({
  getCSAScoreHistory: jest.fn(),
  getCSAScoresWithTrends: jest.fn(),
  getCSARecommendations: jest.fn()
}));

jest.mock('backend/utils/arrayUtils', () => ({
  chunkArray: jest.fn((arr, size) => {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  })
}));

const { getCarrierSafetyData } = require('backend/fmcsaService');
const {
  getCSAScoreHistory,
  getCSAScoresWithTrends,
  getCSARecommendations
} = require('backend/csaMonitorService');

const { getExternalCarrierSafety, batchExternalCarrierSafety } = require('../../backend/externalFmcsaApi.jsw');
const { getExternalCurrentCSA, getExternalCSAHistory } = require('../../backend/externalCsaApi.jsw');

describe('external safety APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fmcsa wrapper returns mapped carrier payload', async () => {
    getCarrierSafetyData.mockResolvedValueOnce({
      dot_number: '1234567',
      legal_name: 'Acme Freight',
      basics: { unsafe_driving: { score: 65, percentile: 74, alert: true } },
      inspections: { driver_inspections: 10, vehicle_inspections: 20 },
      crashes: { total: 2, fatal: 0, injury: 1, tow: 1 },
      fetched_date: '2026-02-01T00:00:00.000Z'
    });

    const result = await getExternalCarrierSafety('1234567');
    expect(result.success).toBe(true);
    expect(result.data.dot_number).toBe(1234567);
    expect(result.data.basic_scores.unsafe_driving.percentile).toBe(74);
  });

  test('fmcsa batch validates max and returns partial success payload', async () => {
    const tooMany = await batchExternalCarrierSafety(Array.from({ length: 101 }, (_v, i) => i + 1));
    expect(tooMany.success).toBe(false);
    expect(tooMany.message).toContain('Maximum 100');

    getCarrierSafetyData
      .mockResolvedValueOnce({ dot_number: '1', legal_name: 'One', basics: {}, inspections: {}, crashes: {} })
      .mockResolvedValueOnce({ error: 'not found', userMessage: 'not found' });

    const mixed = await batchExternalCarrierSafety([1, 2]);
    expect(mixed.success).toBe(true);
    expect(mixed.data.total_requested).toBe(2);
    expect(mixed.data.failed).toBe(1);
    expect(mixed.data.succeeded).toBe(1);
  });

  test('csa current + history wrappers return structured response', async () => {
    getCSAScoresWithTrends.mockResolvedValueOnce({
      basics: JSON.stringify({ unsafe_driving: { score: 70, percentile: 80, alert: true } }),
      alerts_active: JSON.stringify(['unsafe_driving']),
      snapshot_date: '2026-02-01T00:00:00.000Z'
    });

    getCSAScoreHistory.mockResolvedValueOnce([
      {
        snapshot_date: '2026-01-01T00:00:00.000Z',
        basics: JSON.stringify({ unsafe_driving: { percentile: 85 } }),
        alerts_active: JSON.stringify(['unsafe_driving'])
      },
      {
        snapshot_date: '2026-02-01T00:00:00.000Z',
        basics: JSON.stringify({ unsafe_driving: { percentile: 70 } }),
        alerts_active: JSON.stringify([])
      }
    ]);
    getCSARecommendations.mockResolvedValueOnce([{ category: 'unsafe_driving', action: 'reduce hard braking' }]);

    const current = await getExternalCurrentCSA('1234567');
    const history = await getExternalCSAHistory('1234567', 6);

    expect(current.success).toBe(true);
    expect(current.data.alert_status.has_alerts).toBe(true);
    expect(history.success).toBe(true);
    expect(Array.isArray(history.data.history)).toBe(true);
    expect(history.data.trends.unsafe_driving.direction).toBe('improving');
  });
});
