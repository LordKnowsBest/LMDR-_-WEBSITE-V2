/* eslint-disable */
import { getMarketIntelligenceSnapshot } from '../../backend/marketIntelligenceService.jsw';

jest.mock('backend/dataAccess', () => ({
  queryRecords: jest.fn()
}));

const dataAccess = require('backend/dataAccess');

describe('marketIntelligenceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('caches daily snapshot by filter key', async () => {
    dataAccess.queryRecords.mockResolvedValue({
      items: [
        {
          dot_number: '111111',
          legal_name: 'Carrier One',
          pay_cpm_range: '$0.60-$0.70 CPM',
          sign_on_bonus: '$2,000',
          hiring_status: 'Actively Hiring',
          data_confidence: 'high',
          phy_state: 'TN',
          freight_types: 'dry_van',
          route_types: 'otr'
        },
        {
          dot_number: '222222',
          legal_name: 'Carrier Two',
          pay_cpm_range: '$0.55-$0.65 CPM',
          sign_on_bonus: '$1,000',
          hiring_status: 'Actively Hiring',
          data_confidence: 'medium',
          phy_state: 'GA',
          freight_types: 'dry_van',
          route_types: 'otr'
        }
      ]
    });

    const filters = { region: 'TN', freight_type: 'dry_van', operation_type: 'otr' };
    const first = await getMarketIntelligenceSnapshot(filters);
    const second = await getMarketIntelligenceSnapshot(filters);

    expect(first.success).toBe(true);
    expect(first.data.market_data.avg_cpm).toBe(0.7);
    expect(first.data.market_data.avg_sign_on_bonus).toBe(2000);
    expect(first.data.top_hiring_carriers.length).toBe(1);
    expect(second.success).toBe(true);
    expect(dataAccess.queryRecords).toHaveBeenCalledTimes(1);
  });

  test('returns empty snapshot when no records match filters', async () => {
    dataAccess.queryRecords.mockResolvedValue({
      items: [
        {
          dot_number: '333333',
          pay_cpm_range: '$0.50-$0.58 CPM',
          phy_state: 'WA',
          freight_types: 'reefer',
          route_types: 'regional'
        }
      ]
    });

    const result = await getMarketIntelligenceSnapshot({
      region: 'southeast',
      freight_type: 'flatbed',
      operation_type: 'otr'
    });

    expect(result.success).toBe(true);
    expect(result.data.market_data.avg_cpm).toBeNull();
    expect(result.data.top_hiring_carriers).toEqual([]);
  });
});
