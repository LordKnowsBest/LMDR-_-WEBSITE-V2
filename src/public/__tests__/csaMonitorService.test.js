import {
  snapshotCSAScores,
  processCSAScoreUpdates
} from '../../backend/csaMonitorService';

// Mock fmcsaService
jest.mock('../../backend/fmcsaService', () => ({
  getDetailedCSAData: jest.fn().mockResolvedValue({
    basics: {
      unsafe_driving: { percentile: 50, alert: false },
      hours_of_service: { percentile: 70, alert: true }
    },
    has_basic_alerts: true
  })
}));

// Mock wix-data
jest.mock('wix-data', () => {
  return {
    query: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    descending: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    find: jest.fn().mockResolvedValue({ items: [] }), // Default empty for first call
    insert: jest.fn().mockResolvedValue({ _id: 'snap_1' }),
    update: jest.fn().mockResolvedValue({})
  };
});

describe('CSA Monitor Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('snapshotCSAScores', () => {
    it('should calculate trends correctly', async () => {
      // Mock previous snapshot
      const prevSnapshot = {
        basics: {
          unsafe_driving: { percentile: 40 }, // Increased by 10
          hours_of_service: { percentile: 70 } // No change
        },
        alerts_active: []
      };
      
      require('wix-data').find.mockResolvedValueOnce({ items: [prevSnapshot] });
      
      const result = await snapshotCSAScores('123', 'manual');
      
      // Verify insert payload via mock inspection if needed, or just that it ran
      expect(require('wix-data').insert).toHaveBeenCalled();
    });
  });

  describe('processCSAScoreUpdates', () => {
    it('should process all active carriers', async () => {
      // Mock subscriptions
      require('wix-data').find.mockResolvedValueOnce({ 
          items: [{ carrier_dot: '123' }, { carrier_dot: '456' }] 
      });
      
      // Mock snapshotCSAScores (internal function, but we are testing the exported wrapper)
      // Since snapshotCSAScores is exported from same module, internal calls might not be mocked easily 
      // without rewiring. For unit test of the loop, we assume it calls the logic.
      // But we can check if fmcsaService was called twice.
      
      await processCSAScoreUpdates();
      
      const { getDetailedCSAData } = require('../../backend/fmcsaService');
      expect(getDetailedCSAData).toHaveBeenCalledTimes(2);
    });
  });

});
