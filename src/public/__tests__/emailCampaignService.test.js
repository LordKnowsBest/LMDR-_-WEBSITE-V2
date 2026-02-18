/* eslint-disable */
/**
 * Tests for emailCampaignService.jsw
 * Covers: campaign creation validation, sequence step advancement, SendGrid webhook processing
 */

const mockDataAccess = {
    insertRecord: jest.fn(),
    queryRecords: jest.fn(),
    updateRecord: jest.fn(),
    getRecord: jest.fn(),
};

jest.mock('backend/dataAccess', () => mockDataAccess);
jest.mock('wix-secrets-backend', () => ({ getSecret: jest.fn().mockResolvedValue('test-api-key') }));
jest.mock('backend/configData', () => ({ DATA_SOURCE: {}, AIRTABLE_TABLE_NAMES: {} }), { virtual: true });

// Mock global fetch (SendGrid HTTP calls)
global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 202,
    text: async () => '',
    json: async () => ({}),
});

describe('emailCampaignService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockDataAccess.insertRecord.mockResolvedValue({ _id: 'mock-id-123' });
        mockDataAccess.queryRecords.mockResolvedValue({ items: [], totalCount: 0 });
        mockDataAccess.updateRecord.mockResolvedValue({ _id: 'mock-id-123' });
        mockDataAccess.getRecord.mockResolvedValue(null);
    });

    // ─── createEmailCampaign ────────────────────────────────────────────────────

    describe('createEmailCampaign', () => {
        const validData = {
            campaignName: 'CDL-A Outreach Q1',
            fromEmail: 'recruiter@carrier.com',
            fromName: 'LMDR Recruiting',
            subjectLine: 'Exciting CDL-A Opportunity Near You',
            htmlContent: '<p>Hello {{firstName}}</p>',
            audienceFilter: { cdlClass: 'A', state: 'TX' },
        };

        it('should create a campaign with status=draft', async () => {
            const { createEmailCampaign } = require('backend/emailCampaignService');
            const result = await createEmailCampaign('123456', validData);
            expect(result.success).toBe(true);
            expect(result.campaignId).toBe('mock-id-123');
            expect(mockDataAccess.insertRecord).toHaveBeenCalledWith(
                'emailCampaigns',
                expect.objectContaining({ status: 'draft', carrier_dot: '123456' })
            );
        });

        it('should reject missing campaignName', async () => {
            const { createEmailCampaign } = require('backend/emailCampaignService');
            const result = await createEmailCampaign('123456', { ...validData, campaignName: '' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('campaignName');
        });

        it('should reject missing fromEmail', async () => {
            const { createEmailCampaign } = require('backend/emailCampaignService');
            const result = await createEmailCampaign('123456', { ...validData, fromEmail: '' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('fromEmail');
        });

        it('should reject missing subjectLine', async () => {
            const { createEmailCampaign } = require('backend/emailCampaignService');
            const result = await createEmailCampaign('123456', { ...validData, subjectLine: '' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('subjectLine');
        });

        it('should return error when carrierDot is missing', async () => {
            const { createEmailCampaign } = require('backend/emailCampaignService');
            const result = await createEmailCampaign('', validData);
            expect(result.success).toBe(false);
        });
    });

    // ─── getEmailCampaigns ──────────────────────────────────────────────────────

    describe('getEmailCampaigns', () => {
        it('should query by carrier_dot', async () => {
            const { getEmailCampaigns } = require('backend/emailCampaignService');
            const result = await getEmailCampaigns('123456', {});
            expect(result.success).toBe(true);
            expect(mockDataAccess.queryRecords).toHaveBeenCalledWith(
                'emailCampaigns',
                expect.objectContaining({ filter: expect.objectContaining({ carrier_dot: '123456' }) })
            );
        });

        it('should return empty campaigns array when none exist', async () => {
            const { getEmailCampaigns } = require('backend/emailCampaignService');
            const result = await getEmailCampaigns('999999', {});
            expect(result.success).toBe(true);
            expect(result.campaigns).toEqual([]);
        });
    });

    // ─── updateEmailCampaign ────────────────────────────────────────────────────

    describe('updateEmailCampaign', () => {
        it('should reject updates to a sent campaign', async () => {
            mockDataAccess.getRecord.mockResolvedValueOnce({ _id: 'c1', status: 'sent' });
            const { updateEmailCampaign } = require('backend/emailCampaignService');
            const result = await updateEmailCampaign('c1', { campaign_name: 'New Name' });
            expect(result.success).toBe(false);
            expect(result.error).toMatch(/sent|sending/i);
        });

        it('should allow updates to draft campaigns', async () => {
            mockDataAccess.getRecord.mockResolvedValueOnce({ _id: 'c2', status: 'draft' });
            const { updateEmailCampaign } = require('backend/emailCampaignService');
            const result = await updateEmailCampaign('c2', { campaign_name: 'Updated' });
            expect(result.success).toBe(true);
            expect(mockDataAccess.updateRecord).toHaveBeenCalled();
        });

        it('should return error when campaign not found', async () => {
            mockDataAccess.getRecord.mockResolvedValueOnce(null);
            const { updateEmailCampaign } = require('backend/emailCampaignService');
            const result = await updateEmailCampaign('nonexistent', {});
            expect(result.success).toBe(false);
        });
    });

    // ─── processSequenceSteps ───────────────────────────────────────────────────

    describe('processSequenceSteps', () => {
        it('should return success with 0 processed when no enrollments are due', async () => {
            mockDataAccess.queryRecords.mockResolvedValueOnce({ items: [] });
            const { processSequenceSteps } = require('backend/emailCampaignService');
            const result = await processSequenceSteps();
            expect(result.success).toBe(true);
            expect(result.processed).toBe(0);
        });

        it('should skip enrollments whose next_step_at is in the future', async () => {
            const futureTime = new Date(Date.now() + 60000).toISOString();
            mockDataAccess.queryRecords.mockResolvedValueOnce({
                items: [{ _id: 'e1', status: 'active', next_step_at: futureTime, current_step: 0, sequence_id: 'seq-1' }]
            });
            const { processSequenceSteps } = require('backend/emailCampaignService');
            const result = await processSequenceSteps();
            expect(result.success).toBe(true);
            expect(result.processed).toBe(0);
        });

        it('should advance enrollment when step is due', async () => {
            const pastTime = new Date(Date.now() - 1000).toISOString();
            mockDataAccess.queryRecords.mockResolvedValueOnce({
                items: [{ _id: 'e2', status: 'active', next_step_at: pastTime, current_step: 0, sequence_id: 'seq-2', step_history: '[]' }]
            });
            mockDataAccess.getRecord
                .mockResolvedValueOnce({
                    _id: 'seq-2',
                    status: 'active',
                    steps: JSON.stringify([
                        { type: 'email', subjectLine: 'Step 1', htmlContent: '<p>Hi</p>' },
                        { type: 'wait', delayMinutes: 1440 }
                    ]),
                    carrier_dot: '123456',
                    active_count: 1,
                    completed_count: 0
                })
                .mockResolvedValueOnce(null); // driver profile (no email = skip send)
            const { processSequenceSteps } = require('backend/emailCampaignService');
            const result = await processSequenceSteps();
            expect(result.success).toBe(true);
            expect(mockDataAccess.updateRecord).toHaveBeenCalledWith(
                'emailSequenceEnrollments',
                'e2',
                expect.objectContaining({ current_step: 1 })
            );
        });
    });

    // ─── processSendGridWebhook ─────────────────────────────────────────────────

    describe('processSendGridWebhook', () => {
        it('should handle empty events array gracefully', async () => {
            const { processSendGridWebhook } = require('backend/emailCampaignService');
            const result = await processSendGridWebhook([]);
            expect(result.success).toBe(true);
            expect(result.processed).toBe(0);
        });

        it('should return error for non-array input', async () => {
            const { processSendGridWebhook } = require('backend/emailCampaignService');
            const result = await processSendGridWebhook(null);
            expect(result.success).toBe(false);
        });

        it('should update message status to delivered', async () => {
            mockDataAccess.queryRecords.mockResolvedValueOnce({
                items: [{ _id: 'msg-1', status: 'sent', open_count: 0, click_count: 0 }],
            });
            const { processSendGridWebhook } = require('backend/emailCampaignService');
            const result = await processSendGridWebhook([
                { event: 'delivered', email: 'test@test.com', sg_message_id: 'sg-123', timestamp: Date.now() / 1000 },
            ]);
            expect(result.success).toBe(true);
            expect(mockDataAccess.updateRecord).toHaveBeenCalledWith(
                'emailMessages',
                'msg-1',
                expect.objectContaining({ status: 'delivered' })
            );
        });

        it('should mark message as opened on open event', async () => {
            mockDataAccess.queryRecords.mockResolvedValueOnce({
                items: [{ _id: 'msg-2', status: 'delivered', open_count: 0 }],
            });
            const { processSendGridWebhook } = require('backend/emailCampaignService');
            await processSendGridWebhook([
                { event: 'open', email: 'test@test.com', sg_message_id: 'sg-456', timestamp: Date.now() / 1000 },
            ]);
            expect(mockDataAccess.updateRecord).toHaveBeenCalledWith(
                'emailMessages',
                'msg-2',
                expect.objectContaining({ opened: true })
            );
        });

        it('should handle bounce event', async () => {
            mockDataAccess.queryRecords.mockResolvedValueOnce({
                items: [{ _id: 'msg-3', status: 'sent' }],
            });
            const { processSendGridWebhook } = require('backend/emailCampaignService');
            await processSendGridWebhook([
                { event: 'bounce', email: 'bad@test.com', sg_message_id: 'sg-789', type: 'bounce', reason: 'User unknown', timestamp: Date.now() / 1000 },
            ]);
            expect(mockDataAccess.updateRecord).toHaveBeenCalledWith(
                'emailMessages',
                'msg-3',
                expect.objectContaining({ status: 'bounced' })
            );
        });

        it('should count errors for events with no matching message', async () => {
            mockDataAccess.queryRecords.mockResolvedValueOnce({ items: [] });
            const { processSendGridWebhook } = require('backend/emailCampaignService');
            const result = await processSendGridWebhook([
                { event: 'delivered', email: 'unknown@test.com', sg_message_id: 'sg-unknown', timestamp: Date.now() / 1000 },
            ]);
            expect(result.success).toBe(true);
            expect(result.errors).toBe(1);
            expect(mockDataAccess.updateRecord).not.toHaveBeenCalled();
        });
    });

    // ─── createEmailSequence ────────────────────────────────────────────────────

    describe('createEmailSequence', () => {
        it('should reject missing sequenceName', async () => {
            const { createEmailSequence } = require('backend/emailCampaignService');
            const result = await createEmailSequence('123456', { steps: [{ type: 'email', subjectLine: 'Hi' }] });
            expect(result.success).toBe(false);
            expect(result.error).toContain('sequenceName');
        });

        it('should reject empty steps array', async () => {
            const { createEmailSequence } = require('backend/emailCampaignService');
            const result = await createEmailSequence('123456', { sequenceName: 'Test', steps: [] });
            expect(result.success).toBe(false);
        });

        it('should reject invalid step type', async () => {
            const { createEmailSequence } = require('backend/emailCampaignService');
            const result = await createEmailSequence('123456', {
                sequenceName: 'Test',
                steps: [{ type: 'invalid' }]
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid step type');
        });

        it('should reject email step without subjectLine', async () => {
            const { createEmailSequence } = require('backend/emailCampaignService');
            const result = await createEmailSequence('123456', {
                sequenceName: 'Test',
                steps: [{ type: 'email', htmlContent: '<p>Hi</p>' }]
            });
            expect(result.success).toBe(false);
        });

        it('should create sequence with valid data', async () => {
            const { createEmailSequence } = require('backend/emailCampaignService');
            const result = await createEmailSequence('123456', {
                sequenceName: 'CDL-A Drip',
                steps: [
                    { type: 'email', subjectLine: 'Welcome', htmlContent: '<p>Hi</p>' },
                    { type: 'wait', delayMinutes: 1440 }
                ]
            });
            expect(result.success).toBe(true);
            expect(result.sequenceId).toBe('mock-id-123');
        });
    });

});
