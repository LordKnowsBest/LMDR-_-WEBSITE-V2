/* eslint-disable */
jest.mock('uuid', () => ({
  v4: jest.fn(() => '00000000-0000-0000-0000-000000000001')
}), { virtual: true });

jest.mock('backend/dataAccess', () => ({
  getRecord: jest.fn(),
  queryRecords: jest.fn(),
  insertRecord: jest.fn(),
  updateRecord: jest.fn()
}));

jest.mock('backend/emailService', () => ({
  sendDocumentReminderEmail: jest.fn(async () => ({ success: true }))
}));

jest.mock('backend/ocrService', () => ({
  extractInfoFromDocument: jest.fn(async () => ({
    fullName: 'John Driver',
    licenseNumber: 'CDL12345',
    state: 'TX',
    cdlClass: 'A',
    endorsements: ['T']
  }))
}));

describe('documentCollectionService', () => {
  let service;
  let dataAccess;

  beforeEach(() => {
    jest.resetModules();
    service = require('backend/documentCollectionService');
    dataAccess = require('backend/dataAccess');
    jest.clearAllMocks();
  });

  test('requestDocuments rejects invalid document type', async () => {
    const result = await service.requestDocuments('wf-1', ['not_real_type']);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid document type');
  });

  test('requestDocuments returns production upload portal URL', async () => {
    dataAccess.getRecord.mockResolvedValue({ _id: 'wf-1', driver_id: 'driver-1' });
    dataAccess.insertRecord.mockResolvedValue({ success: true, record: { _id: 'doc-1' } });
    dataAccess.updateRecord.mockResolvedValue({ success: true, record: {} });

    const result = await service.requestDocuments('wf-1', ['cdl_front']);

    expect(result.success).toBe(true);
    expect(result.uploadPortalUrl).toContain('https://www.lastmiledr.app/document-upload?token=');
  });

  test('uploadDocument extracts OCR data for CDL uploads with base64 content', async () => {
    dataAccess.queryRecords.mockResolvedValue({
      success: true,
      items: [{
        _id: 'doc-1',
        driver_id: 'driver-1',
        workflow_id: 'wf-1',
        document_type: 'cdl_front',
        status: 'requested',
        upload_token: 'tok-1',
        upload_token_expiry: new Date(Date.now() + 3600000).toISOString()
      }]
    });

    dataAccess.getRecord.mockResolvedValue({ _id: 'driver-1', display_name: 'John Driver', license_number: 'CDL12345' });
    dataAccess.updateRecord.mockResolvedValue({ success: true, record: {} });

    const result = await service.uploadDocument('tok-1', 'cdl_front', {
      mimeType: 'image/jpeg',
      size: 2000,
      content: 'ZmFrZS1iYXNlNjQ='
    });

    expect(result.success).toBe(true);
    expect(result.ocrExtracted).toBe(true);
    expect(dataAccess.updateRecord).toHaveBeenCalledWith(
      'documentRequests',
      expect.objectContaining({
        ocr_data: expect.any(Object),
        auto_verification: expect.objectContaining({ autoVerified: true })
      }),
      expect.any(Object)
    );
  });

  test('sendAutoReminders sends due reminder notifications', async () => {
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
    const doc = {
      _id: 'doc-1',
      driver_id: 'driver-1',
      display_name: 'CDL Front',
      status: 'requested',
      reminder_sent_count: 0,
      upload_token: 'tok-old',
      upload_token_expiry: new Date(Date.now() + 3600000).toISOString(),
      _createdDate: sixDaysAgo
    };

    dataAccess.queryRecords.mockResolvedValue({ success: true, items: [doc] });
    dataAccess.getRecord.mockImplementation(async (key, id) => {
      if (key === 'documentRequests' && id === 'doc-1') return doc;
      if (key === 'driverProfiles' && id === 'driver-1') return { _id: 'driver-1', wix_member_id: 'member-1', display_name: 'John Driver' };
      return null;
    });
    dataAccess.updateRecord.mockResolvedValue({ success: true, record: {} });

    const result = await service.sendAutoReminders();

    expect(result.success).toBe(true);
    expect(result.remindersSent).toBe(1);
  });
});
