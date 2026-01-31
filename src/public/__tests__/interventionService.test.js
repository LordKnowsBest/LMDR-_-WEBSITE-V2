/**
 * Tests for interventionService.jsw
 * Covers template CRUD, variable substitution, default seeding, outcome tracking
 */

const mockAirtable = {
  queryRecords: jest.fn(),
  createRecord: jest.fn(),
  updateRecord: jest.fn(),
  getRecord: jest.fn()
};

jest.mock('backend/airtableClient', () => mockAirtable);
jest.mock('backend/config', () => ({
  usesAirtable: jest.fn(() => true),
  getAirtableTableName: jest.fn((key) => `v2_${key}`),
  getWixCollectionName: jest.fn((key) => key)
}));
jest.mock('wix-data', () => ({ query: jest.fn(), insert: jest.fn(), update: jest.fn(), get: jest.fn() }));
jest.mock('wix-users-backend', () => ({ currentUser: { loggedIn: true, id: 'recruiter-123' } }));
jest.mock('backend/featureAdoptionService', () => ({ logFeatureInteraction: jest.fn(() => Promise.resolve()) }));
jest.mock('backend/emailService', () => ({ sendInterventionEmail: jest.fn(() => Promise.resolve({ success: true })) }));

describe('InterventionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAirtable.queryRecords.mockResolvedValue({ records: [] });
    mockAirtable.createRecord.mockResolvedValue({ _id: 'template-1' });
  });

  describe('createTemplate', () => {
    it('should create a template with valid data', async () => {
      const { createTemplate } = require('backend/interventionService');
      const result = await createTemplate('12345', {
        templateName: 'Test Template',
        riskType: 'SILENCE_SIGNAL',
        channel: 'sms',
        bodyTemplate: 'Hello {{firstName}}'
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid risk type', async () => {
      const { createTemplate } = require('backend/interventionService');
      const result = await createTemplate('12345', {
        templateName: 'Test',
        riskType: 'INVALID',
        channel: 'sms'
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid channel', async () => {
      const { createTemplate } = require('backend/interventionService');
      const result = await createTemplate('12345', {
        templateName: 'Test',
        riskType: 'SILENCE_SIGNAL',
        channel: 'telegram'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateTemplate', () => {
    it('should not allow editing default templates', async () => {
      mockAirtable.getRecord.mockResolvedValueOnce({ _id: 'tmpl-1', is_default: true });
      const { updateTemplate } = require('backend/interventionService');
      const result = await updateTemplate('tmpl-1', { templateName: 'New Name' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('default');
    });
  });

  describe('deleteTemplate', () => {
    it('should soft delete non-default templates', async () => {
      mockAirtable.getRecord.mockResolvedValueOnce({ _id: 'tmpl-1', is_default: false });
      const { deleteTemplate } = require('backend/interventionService');
      const result = await deleteTemplate('tmpl-1');
      expect(result.success).toBe(true);
    });

    it('should not delete default templates', async () => {
      mockAirtable.getRecord.mockResolvedValueOnce({ _id: 'tmpl-1', is_default: true });
      const { deleteTemplate } = require('backend/interventionService');
      const result = await deleteTemplate('tmpl-1');
      expect(result.success).toBe(false);
    });
  });

  describe('sendIntervention', () => {
    it('should render template variables', async () => {
      mockAirtable.getRecord.mockResolvedValueOnce({
        _id: 'tmpl-1',
        body_template: 'Hello {{firstName}} from {{carrierName}}',
        subject_line: 'Hi {{firstName}}',
        channel: 'email',
        usage_count: 5
      });
      const { sendIntervention } = require('backend/interventionService');
      const result = await sendIntervention('tmpl-1', 'driver-1', {
        firstName: 'John',
        carrierName: 'ABC Trucking'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('logInterventionOutcome', () => {
    it('should reject invalid outcomes', async () => {
      const { logInterventionOutcome } = require('backend/interventionService');
      const result = await logInterventionOutcome('int-1', 'invalid');
      expect(result.success).toBe(false);
    });
  });

  describe('seedDefaultTemplates', () => {
    it('should create 10 default templates', async () => {
      const { seedDefaultTemplates } = require('backend/interventionService');
      const result = await seedDefaultTemplates();
      expect(result.success).toBe(true);
      expect(result.total).toBe(10);
    });
  });
});
