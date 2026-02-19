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
jest.mock('backend/marketIntelligenceService', () => ({
  getMarketIntelligenceSnapshot: jest.fn()
}));

const dataAccess = require('backend/dataAccess');
const { getCarrierSafetyData } = require('backend/fmcsaService');
const { scanSocialMedia } = require('backend/socialScanner');
const { enrichCarrier } = require('backend/aiEnrichment');
const { getMarketIntelligenceSnapshot } = require('backend/marketIntelligenceService');

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

  test('rebuilds enrichment when cached record is older than ttl', async () => {
    const staleDate = new Date(Date.now() - (20 * 24 * 60 * 60 * 1000)).toISOString();
    dataAccess.queryRecords.mockResolvedValueOnce({
      items: [{
        dot_number: '123456',
        enriched_date: staleDate
      }]
    });
    getCarrierSafetyData.mockResolvedValue({ legal_name: 'ACME CARRIER' });
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
    expect(enrichCarrier).toHaveBeenCalled();
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

  test('returns market intelligence from aggregation service', async () => {
    getMarketIntelligenceSnapshot.mockResolvedValue({
      success: true,
      data: {
        market_data: { avg_cpm: 0.62 },
        top_hiring_carriers: [{ dot_number: 111111 }]
      }
    });

    const result = await getExternalMarketIntelligence({ region: 'southeast' });

    expect(result.success).toBe(true);
    expect(result.data.top_hiring_carriers.length).toBe(1);
    expect(result.data.market_data.avg_cpm).toBe(0.62);
    expect(getMarketIntelligenceSnapshot).toHaveBeenCalledWith({ region: 'southeast' });
  });
});
