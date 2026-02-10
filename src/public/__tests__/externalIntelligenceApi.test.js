/* eslint-disable */
import {
  getExternalCarrierIntelligence,
  getExternalSentiment,
  getExternalMarketIntelligence
} from '../../backend/externalIntelligenceApi.jsw';

jest.mock('backend/dataAccess', () => ({
  queryRecords: jest.fn()
}));
jest.mock('backend/fmcsaService', () => ({
  getCarrierSafetyData: jest.fn()
}));
jest.mock('backend/socialScanner', () => ({
  scanSocialMedia: jest.fn()
}));
jest.mock('backend/externalFmcsaApi', () => ({
  validateDotNumber: jest.fn((value) => ({ valid: true, value: String(value) }))
}));
jest.mock('backend/aiEnrichment', () => ({
  enrichCarrier: jest.fn()
}));

const dataAccess = require('backend/dataAccess');
const { getCarrierSafetyData } = require('backend/fmcsaService');
const { scanSocialMedia } = require('backend/socialScanner');
const { enrichCarrier } = require('backend/aiEnrichment');

describe('externalIntelligenceApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('builds carrier intelligence using aiEnrichment fallback', async () => {
    dataAccess.queryRecords.mockResolvedValueOnce({ items: [] });
    getCarrierSafetyData.mockResolvedValue({
      legal_name: 'ACME CARRIER'
    });
    enrichCarrier.mockResolvedValue({
      dot_number: '123456',
      pay_cpm_range: '$0.60-$0.75 CPM',
      sign_on_bonus: '$3000',
      home_time: 'weekly',
      benefits: 'health, 401k',
      driver_sentiment: 'Positive',
      hiring_status: 'Actively Hiring',
      sources_found: '["reddit"]',
      data_confidence: 'High',
      enriched_date: new Date().toISOString()
    });

    const result = await getExternalCarrierIntelligence('123456', { accessLevel: 'full' });
    expect(result.success).toBe(true);
    expect(result.data.legal_name).toBe('ACME CARRIER');
    expect(result.data.enrichment.sentiment.overall).toBe('positive');
  });

  test('returns sentiment with platform breakdown and themes', async () => {
    getCarrierSafetyData.mockResolvedValue({ legal_name: 'ACME CARRIER' });
    scanSocialMedia.mockResolvedValue(
      'reddit: pay is solid and dispatch is responsive\n' +
      'truckersreport: home time is mixed\n' +
      'twitter: truck equipment is older'
    );

    const result = await getExternalSentiment('123456');
    expect(result.success).toBe(true);
    expect(result.data.by_platform.reddit.posts_analyzed).toBe(1);
    expect(result.data.by_platform.truckersreport.threads_analyzed).toBe(1);
    expect(result.data.key_themes.length).toBeGreaterThan(0);
    expect(result.data.recent_mentions.length).toBe(3);
  });

  test('returns market intelligence with top hiring carriers and caches daily result', async () => {
    dataAccess.queryRecords.mockResolvedValue({
      items: [
        {
          dot_number: '111111',
          legal_name: 'Carrier One',
          pay_cpm_range: '$0.60-$0.70 CPM',
          sign_on_bonus: '$2000',
          hiring_status: 'Actively Hiring',
          data_confidence: 'high'
        },
        {
          dot_number: '222222',
          legal_name: 'Carrier Two',
          pay_cpm_range: '$0.55-$0.65 CPM',
          sign_on_bonus: '$1000',
          hiring_status: 'Actively Hiring',
          data_confidence: 'medium'
        }
      ]
    });

    const first = await getExternalMarketIntelligence({});
    const second = await getExternalMarketIntelligence({});

    expect(first.success).toBe(true);
    expect(first.data.top_hiring_carriers.length).toBeGreaterThan(0);
    expect(first.data.market_data.avg_sign_on_bonus).toBe(1500);
    expect(second.success).toBe(true);
    expect(dataAccess.queryRecords).toHaveBeenCalledTimes(1);
  });
});
