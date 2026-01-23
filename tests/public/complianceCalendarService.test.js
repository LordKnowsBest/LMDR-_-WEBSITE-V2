import {
  getComplianceEvents,
  createComplianceEvent,
  updateComplianceEvent,
  processComplianceReminders
} from '../../backend/complianceCalendarService';

// Mock wix-data
jest.mock('wix-data', () => {
  const _data = [];
  return {
    query: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ne: jest.fn().mockReturnThis(),
    ge: jest.fn().mockReturnThis(),
    le: jest.fn().mockReturnThis(),
    ascending: jest.fn().mockReturnThis(),
    find: jest.fn().mockResolvedValue({ items: [] }),
    insert: jest.fn().mockImplementation((col, item) => Promise.resolve({ ...item, _id: 'new_id' })),
    update: jest.fn().mockImplementation((col, item) => Promise.resolve(item)),
    get: jest.fn().mockResolvedValue({ _id: '1', carrier_dot: '123' }),
    remove: jest.fn().mockResolvedValue(true)
  };
});

// Mock wix-auth
jest.mock('wix-auth', () => ({
  currentUser: { id: 'user123' }
}));

// Mock wix-users-backend (used by emailService which is called by reminder service)
jest.mock('wix-users-backend', () => ({
  emailUser: jest.fn().mockResolvedValue(true)
}));

describe('Compliance Calendar Service', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createComplianceEvent', () => {
    it('should calculate status as OVERDUE if date is in past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      
      const event = {
        carrier_dot: '123456',
        event_type: 'drug_test',
        due_date: pastDate
      };
      
      const result = await createComplianceEvent(event);
      expect(result.status).toBe('overdue');
    });

    it('should calculate status as DUE_SOON if date is within 7 days', async () => {
      const soonDate = new Date();
      soonDate.setDate(soonDate.getDate() + 3);
      
      const event = {
        carrier_dot: '123456',
        event_type: 'drug_test',
        due_date: soonDate
      };
      
      const result = await createComplianceEvent(event);
      expect(result.status).toBe('due_soon');
    });

    it('should calculate status as UPCOMING if date is within 30 days', async () => {
      const upcomingDate = new Date();
      upcomingDate.setDate(upcomingDate.getDate() + 15);
      
      const event = {
        carrier_dot: '123456',
        event_type: 'drug_test',
        due_date: upcomingDate
      };
      
      const result = await createComplianceEvent(event);
      expect(result.status).toBe('upcoming');
    });

    it('should calculate status as PENDING if date is far future', async () => {
      const farDate = new Date();
      farDate.setDate(farDate.getDate() + 60);
      
      const event = {
        carrier_dot: '123456',
        event_type: 'drug_test',
        due_date: farDate
      };
      
      const result = await createComplianceEvent(event);
      expect(result.status).toBe('pending');
    });
  });

  describe('processComplianceReminders', () => {
    it('should process reminders', async () => {
        // Mock query return for active events
        const mockEvents = [
            { _id: '1', due_date: new Date(), status: 'pending', reminder_due_sent: false }
        ];
        
        require('wix-data').find.mockResolvedValueOnce({ items: mockEvents });
        
        const result = await processComplianceReminders();
        
        // Should have processed 1 item
        expect(result.processed).toBe(1);
    });
  });

});
