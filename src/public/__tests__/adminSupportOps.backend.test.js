jest.mock('backend/dataAccess', () => ({
  insertRecord: jest.fn(),
  updateRecord: jest.fn(),
  getRecord: jest.fn(),
  queryRecords: jest.fn(),
  getAllRecords: jest.fn()
}));

jest.mock('backend/observabilityService', () => ({
  log: jest.fn(() => Promise.resolve())
}));

jest.mock('backend/emailService.jsw', () => ({
  sendMessageNotification: jest.fn()
}));

const { currentMember } = require('wix-members-backend');
const dataAccess = require('backend/dataAccess');

describe('admin support ops critical fixes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentMember.__clearMember();
  });

  test('supportTicketService.createTicket supports admin-created ticket ownership override', async () => {
    currentMember.__setMember({
      _id: 'admin_1',
      loginEmail: 'admin@test.com',
      contactDetails: { customFields: { role: 'admin' } }
    });
    dataAccess.insertRecord.mockResolvedValue({
      success: true,
      record: { _id: 'ticket_1', ticket_number: 'TKT-00000001' }
    });

    const svc = require('backend/supportTicketService.jsw');
    const result = await svc.createTicket({
      subject: 'Escalated from chat',
      description: 'Ticket body',
      user_id: 'driver_123',
      user_email: 'driver@test.com',
      user_role: 'driver'
    });

    expect(result.success).toBe(true);
    expect(dataAccess.insertRecord).toHaveBeenCalledWith(
      'supportTickets',
      expect.objectContaining({
        user_id: 'driver_123',
        user_email: 'driver@test.com',
        user_role: 'driver'
      }),
      expect.any(Object)
    );
  });

  test('chatSupportService.convertChatToTicket carries session user identity into ticket creation', async () => {
    currentMember.__setMember({
      _id: 'admin_2',
      loginEmail: 'admin2@test.com',
      contactDetails: { customFields: { role: 'admin' } }
    });

    dataAccess.getRecord.mockResolvedValue({
      _id: 'chat_1',
      user_id: 'driver_777',
      user_email: 'driver777@test.com',
      user_role: 'driver',
      topic: 'documents',
      created_at: new Date().toISOString()
    });
    dataAccess.queryRecords.mockResolvedValue({ success: true, items: [] });
    dataAccess.insertRecord.mockResolvedValue({ success: true, record: { _id: 'msg_1' } });
    dataAccess.updateRecord.mockResolvedValue({ success: true, record: { _id: 'chat_1' } });

    const ticketService = require('backend/supportTicketService.jsw');
    const createTicketSpy = jest.spyOn(ticketService, 'createTicket');

    const chatSvc = require('backend/chatSupportService.jsw');
    await chatSvc.convertChatToTicket('chat_1');

    expect(createTicketSpy).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'driver_777',
      user_email: 'driver777@test.com',
      user_role: 'driver'
    }));
  });

  test('required support ops API contracts exist', () => {
    const ticketSvc = require('backend/supportTicketService.jsw');
    const kbSvc = require('backend/knowledgeBaseService.jsw');
    const chatSvc = require('backend/chatSupportService.jsw');
    const npsSvc = require('backend/npsService.jsw');

    expect(typeof ticketSvc.submitTicket).toBe('function');
    expect(typeof ticketSvc.getMyTickets).toBe('function');
    expect(typeof ticketSvc.getSLACompliance).toBe('function');
    expect(typeof ticketSvc.getAgentPerformance).toBe('function');
    expect(typeof ticketSvc.mergeTickets).toBe('function');

    expect(typeof kbSvc.reorderCategories).toBe('function');
    expect(typeof kbSvc.getPopularArticles).toBe('function');
    expect(typeof kbSvc.getRelatedArticles).toBe('function');
    expect(typeof kbSvc.getArticleAnalytics).toBe('function');
    expect(typeof kbSvc.getArticleVersions).toBe('function');
    expect(typeof kbSvc.revertToVersion).toBe('function');

    expect(typeof chatSvc.getChatHistory).toBe('function');
    expect(typeof chatSvc.updateCannedResponse).toBe('function');
    expect(typeof chatSvc.getChatMetrics).toBe('function');
    expect(typeof chatSvc.getAgentChatStats).toBe('function');

    expect(typeof npsSvc.getSegmentBreakdown).toBe('function');
    expect(typeof npsSvc.getRecentFeedback).toBe('function');
  });
});
