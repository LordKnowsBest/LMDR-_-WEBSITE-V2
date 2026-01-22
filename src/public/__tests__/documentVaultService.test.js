import {
  uploadDocument,
  uploadNewVersion,
  updateDocumentExpirations,
  getExpiringDocuments
} from '../../backend/documentVaultService';

// Mock complianceCalendarService
jest.mock('../../backend/complianceCalendarService', () => ({
  createComplianceEvent: jest.fn().mockResolvedValue({ _id: 'event_1' })
}));

// Mock wix-data
jest.mock('wix-data', () => {
  return {
    query: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    le: jest.fn().mockReturnThis(),
    descending: jest.fn().mockReturnThis(),
    ascending: jest.fn().mockReturnThis(),
    find: jest.fn().mockResolvedValue({ items: [], hasNext: () => false }),
    insert: jest.fn().mockImplementation((col, item) => Promise.resolve({ ...item, _id: 'new_id' })),
    update: jest.fn().mockImplementation((col, item) => Promise.resolve(item)),
    get: jest.fn().mockImplementation((col, id) => {
      if (id === 'doc_1') return Promise.resolve({ _id: 'doc_1', version: 1, carrier_dot: '123' });
      return Promise.resolve(null);
    })
  };
});

// Mock wix-auth
jest.mock('wix-auth', () => ({
  currentUser: { id: 'user123' }
}));

describe('Document Vault Service', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadDocument', () => {
    it('should calculate expiration status correctly', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      
      const doc = {
        document_type: 'cdl',
        expiration_date: futureDate
      };
      
      const result = await uploadDocument('123', doc);
      expect(result.is_expired).toBe(false);
      expect(result.days_until_expiry).toBeLessThanOrEqual(10);
      expect(result.version).toBe(1);
    });

    it('should mark as expired if date is past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      const doc = {
        document_type: 'cdl',
        expiration_date: pastDate
      };
      
      const result = await uploadDocument('123', doc);
      expect(result.is_expired).toBe(true);
    });
  });

  describe('uploadNewVersion', () => {
    it('should increment version and archive old doc', async () => {
      const newVer = { file_name: 'v2.pdf' };
      
      const result = await uploadNewVersion('doc_1', newVer);
      
      // Verify new doc
      expect(result.version).toBe(2);
      expect(result.previous_version_id).toBe('doc_1');
      expect(result.status).toBe('active');
      
      // Verify old doc update (archived/superseded)
      const wixData = require('wix-data');
      expect(wixData.update).toHaveBeenCalledWith('CarrierDocuments', expect.objectContaining({
        _id: 'doc_1',
        status: 'superseded'
      }), expect.anything());
    });
  });

  describe('updateDocumentExpirations', () => {
    it('should update expiring documents', async () => {
      const now = new Date();
      const expDate = new Date();
      expDate.setDate(now.getDate() - 1); // Expired yesterday
      
      // Mock find return
      const mockDocs = [
        { _id: '1', expiration_date: expDate, is_expired: false } // Wrong status needs update
      ];
      require('wix-data').find.mockResolvedValueOnce({ items: mockDocs, hasNext: () => false });
      
      const result = await updateDocumentExpirations();
      
      expect(result.updated).toBe(1);
      const wixData = require('wix-data');
      expect(wixData.update).toHaveBeenCalledWith('CarrierDocuments', expect.objectContaining({
        _id: '1',
        is_expired: true
      }), expect.anything());
    });
  });

});
