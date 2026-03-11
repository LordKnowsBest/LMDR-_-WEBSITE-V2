import { scoreMatch, rankMatches, DEFAULT_WEIGHTS } from '../../src/lib/driver-scoring.js';

describe('driver-scoring', () => {
  const mockDriver = {
    home_state: 'TX',
    home_city: 'Dallas',
    min_cpm: '0.55',
    preferred_route: 'OTR',
  };

  const mockCarrier = {
    state: 'TX',
    city: 'Dallas',
    avg_cpm: '0.65',
    vehicle_oos_rate: '3',
    sentiment_score: '85',
    route_types: 'OTR, Regional',
    avg_truck_age: '3',
  };

  test('scoreMatch returns score 0-100 with factor breakdown', () => {
    const result = scoreMatch(mockDriver, mockCarrier, DEFAULT_WEIGHTS);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.factors).toHaveProperty('location');
    expect(result.factors).toHaveProperty('pay');
    expect(result.factors).toHaveProperty('safety');
    expect(result.factors).toHaveProperty('culture');
    expect(result.factors).toHaveProperty('routeType');
    expect(result.factors).toHaveProperty('fleetAge');
  });

  test('perfect match scores high', () => {
    const result = scoreMatch(mockDriver, mockCarrier, DEFAULT_WEIGHTS);
    expect(result.score).toBeGreaterThan(80);
  });

  test('rankMatches returns sorted array', () => {
    const carriers = [
      { ...mockCarrier, avg_cpm: '0.40' },
      { ...mockCarrier, avg_cpm: '0.70' },
      mockCarrier,
    ];
    const ranked = rankMatches(mockDriver, carriers, DEFAULT_WEIGHTS);
    expect(ranked.length).toBe(3);
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
    expect(ranked[1].score).toBeGreaterThanOrEqual(ranked[2].score);
  });
});
