import {
  createIncidentReport,
  classifyDOTReportability
} from '../../backend/incidentService';

// Mock csaMonitorService
jest.mock('../../backend/csaMonitorService', () => ({
  snapshotCSAScores: jest.fn().mockResolvedValue({})
}));

// Mock wix-data
jest.mock('wix-data', () => {
  return {
    query: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    descending: jest.fn().mockReturnThis(),
    count: jest.fn().mockResolvedValue(10),
    find: jest.fn().mockResolvedValue({ items: [] }),
    insert: jest.fn().mockImplementation((col, item) => Promise.resolve({ ...item, _id: 'inc_1' })),
    update: jest.fn().mockResolvedValue({}),
    get: jest.fn().mockResolvedValue({})
  };
});

describe('Incident Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('classifyDOTReportability', () => {
    it('should classify fatality as reportable', () => {
      const result = classifyDOTReportability({ injuries: { fatalities: 1 } });
      expect(result.reportable).toBe(true);
    });

    it('should classify tow-away as reportable', () => {
      const result = classifyDOTReportability({ tow_required: true, injuries: {} });
      expect(result.reportable).toBe(true);
    });

    it('should classify minor fender bender as not reportable', () => {
      const result = classifyDOTReportability({ tow_required: false, injuries: { fatalities: 0 } });
      expect(result.reportable).toBe(false);
    });
  });

  describe('createIncidentReport', () => {
    it('should generate ID and trigger CSA refresh if critical', async () => {
      const incident = {
        carrier_dot: '123',
        severity: 'critical',
        injuries: {}
      };
      
      const result = await createIncidentReport(incident);
      
      expect(result.incident_number).toBe(`INC-${new Date().getFullYear()}-0011`);
      
      const { snapshotCSAScores } = require('../../backend/csaMonitorService');
      expect(snapshotCSAScores).toHaveBeenCalledWith('123', 'incident_triggered');
    });
  });

});
