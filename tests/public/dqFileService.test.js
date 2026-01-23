import {
  getDQFile,
  updateDQChecklistItem,
  calculateCompleteness,
  generateAuditReport
} from '../../backend/dqFileService';

// Mock wix-data
jest.mock('wix-data', () => {
  return {
    query: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    find: jest.fn().mockResolvedValue({ items: [] }),
    insert: jest.fn().mockImplementation((col, item) => Promise.resolve({ ...item, _id: 'dq_1' })),
    update: jest.fn().mockImplementation((col, item) => Promise.resolve(item)),
    get: jest.fn().mockImplementation((col, id) => {
      if (id === 'dq_1') {
         return Promise.resolve({
             _id: 'dq_1',
             checklist: {
                 item1: { required: true, status: 'missing' },
                 item2: { required: true, status: 'valid', document_id: 'doc_1' }
             },
             completeness_score: 50
         });
      }
      return Promise.resolve(null);
    })
  };
});

describe('DQ File Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDQFile', () => {
    it('should create new file if none exists', async () => {
      const result = await getDQFile('123', 'driver_1');
      expect(result.checklist).toBeDefined();
      expect(result.status).toBe('incomplete');
      expect(result.completeness_score).toBe(0);
    });
  });

  describe('calculateCompleteness', () => {
    it('should calculate percentage correctly', () => {
       const file = {
           checklist: {
               i1: { required: true, status: 'valid', document_id: 'd1' },
               i2: { required: true, status: 'missing' },
               i3: { required: false, status: 'missing' } // Optional shouldn't count
           }
       };
       const score = calculateCompleteness(file);
       expect(score).toBe(50); // 1 of 2 required
    });
  });

  describe('updateDQChecklistItem', () => {
    it('should update item and recalculate completeness', async () => {
      const result = await updateDQChecklistItem('dq_1', 'item1', {
          status: 'valid',
          document_id: 'doc_2'
      });
      
      expect(result.checklist.item1.status).toBe('valid');
      expect(result.completeness_score).toBe(100); // Both required are now valid
      expect(result.status).toBe('audit_ready');
    });
  });

});
