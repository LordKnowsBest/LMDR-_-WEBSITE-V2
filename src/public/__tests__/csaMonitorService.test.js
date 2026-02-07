jest.mock('backend/dataAccess', () => ({
  queryRecords: jest.fn(),
  insertRecord: jest.fn()
}));
jest.mock('backend/fmcsaService', () => ({
  getDetailedCSAData: jest.fn()
}));
jest.mock('backend/seeds/seedMockData', () => ({
  seedCSAScores: jest.fn().mockResolvedValue({ seeded: false })
}));
jest.mock('backend/apiWebhookService', () => ({
  dispatchSafetyAlertEvent: jest.fn().mockResolvedValue({ success: true })
}));

const dataAccess = require('backend/dataAccess');
const { getDetailedCSAData } = require('backend/fmcsaService');
const { dispatchSafetyAlertEvent } = require('backend/apiWebhookService');

const { snapshotCSAScores } = require('../../backend/csaMonitorService.jsw');

describe('csaMonitorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('dispatches safety webhook alerts and computes trend from previous snapshot json', async () => {
    dataAccess.queryRecords.mockResolvedValueOnce({
      items: [{
        _id: 'prev_1',
        basics: JSON.stringify({
          unsafe_driving: { percentile: 15 },
          vehicle_maintenance: { percentile: 20 }
        }),
        alerts_active: JSON.stringify([])
      }]
    });
    getDetailedCSAData.mockResolvedValue({
      basics: {
        unsafe_driving: { percentile: 15, alert: false },
        vehicle_maintenance: { percentile: 42, alert: false }
      },
      has_basic_alerts: false
    });
    dataAccess.insertRecord.mockImplementation(async (collectionKey, record) => {
      if (collectionKey === 'csaScoreHistory') {
        return {
          record: {
            _id: 'snap_1',
            ...record
          }
        };
      }
      if (collectionKey === 'complianceAlerts') {
        return {
          record: {
            _id: 'alert_1',
            ...record
          }
        };
      }
      return { record: { _id: 'unknown', ...record } };
    });

    const snapshot = await snapshotCSAScores(123456, 'scheduled');

    const trend = JSON.parse(snapshot.trend_vs_prior);
    expect(trend.vehicle_maintenance).toBe(22);
    expect(dataAccess.insertRecord).toHaveBeenCalledWith(
      'complianceAlerts',
      expect.objectContaining({
        carrier_dot: 123456,
        alert_type: 'csa_change'
      }),
      expect.any(Object)
    );
    expect(dispatchSafetyAlertEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        dot_number: 123456,
        alert_type: 'csa_change',
        partner_event_id: 'alert_1'
      })
    );
  });
});
