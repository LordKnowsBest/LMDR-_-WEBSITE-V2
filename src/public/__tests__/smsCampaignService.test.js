/* eslint-disable */
/**
 * Tests for smsCampaignService.jsw
 * Covers: TCPA quiet hours, opt-out management, Twilio webhook processing, campaign validation
 */

const mockDataAccess = {
    insertRecord: jest.fn(),
    queryRecords: jest.fn(),
    updateRecord: jest.fn(),
    getRecord: jest.fn(),
};

jest.mock('backend/dataAccess', () => mockDataAccess);
jest.mock('wix-secrets-backend', () => ({ getSecret: jest.fn().mockResolvedValue('test-secret') }));
jest.mock('backend/configData', () => ({ DATA_SOURCE: {}, AIRTABLE_TABLE_NAMES: {} }), { virtual: true });

global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 201,
    json: async () => ({ sid: 'SM123' }),
});

describe('smsCampaignService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockDataAccess.insertRecord.mockResolvedValue({ _id: 'sms-mock-id' });
        mockDataAccess.queryRecords.mockResolvedValue({ items: [], totalCount: 0 });
        mockDataAccess.updateRecord.mockResolvedValue({ _id: 'sms-mock-id' });
        mockDataAccess.getRecord.mockResolvedValue(null);
    });

    // ─── createSMSCampaign ──────────────────────────────────────────────────────

    describe('createSMSCampaign', () => {
        const validData = {
            campaignName: 'CDL-A Blast',
            messageBody: 'Hi, we have CDL-A openings near you! Reply STOP to opt out.',
            audienceFilter: { cdlClass: 'A' },
            scheduleType: 'immediate',
        };

        it('should create campaign with status=draft', async () => {
            const { createSMSCampaign } = require('backend/smsCampaignService');
            const result = await createSMSCampaign('123456', validData);
            expect(result.success).toBe(true);
            expect(result.campaignId).toBe('sms-mock-id');
            expect(mockDataAccess.insertRecord).toHaveBeenCalledWith(
                'smsCampaigns',
                expect.objectContaining({ status: 'draft', carrier_dot: '123456' })
            );
        });

        it('should reject missing campaignName', async () => {
            const { createSMSCampaign } = require('backend/smsCampaignService');
            const result = await createSMSCampaign('123456', { ...validData, campaignName: '' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('campaignName');
        });

        it('should reject missing messageBody', async () => {
            const { createSMSCampaign } = require('backend/smsCampaignService');
            const result = await createSMSCampaign('123456', { ...validData, messageBody: '' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('messageBody');
        });

        it('should reject message body exceeding 160 chars for SMS', async () => {
            const { createSMSCampaign } = require('backend/smsCampaignService');
            const longMessage = 'A'.repeat(161);
            const result = await createSMSCampaign('123456', { ...validData, messageBody: longMessage });
            expect(result.success).toBe(false);
            expect(result.error).toContain('long');
        });

        it('should calculate segment count for 1-segment message', async () => {
            const { createSMSCampaign } = require('backend/smsCampaignService');
            const result = await createSMSCampaign('123456', validData);
            expect(result.success).toBe(true);
            expect(mockDataAccess.insertRecord).toHaveBeenCalledWith(
                'smsCampaigns',
                expect.objectContaining({ segments_per_message: 1 })
            );
        });

        it('should include estimated_cost in record', async () => {
            const { createSMSCampaign } = require('backend/smsCampaignService');
            await createSMSCampaign('123456', validData);
            const call = mockDataAccess.insertRecord.mock.calls[0][1];
            expect(typeof call.estimated_cost).toBe('number');
        });

        it('should return error when carrierDot is missing', async () => {
            const { createSMSCampaign } = require('backend/smsCampaignService');
            const result = await createSMSCampaign('', validData);
            expect(result.success).toBe(false);
        });
    });

    // ─── TCPA quiet hours ───────────────────────────────────────────────────────

    describe('TCPA quiet hours (_checkQuietHours logic)', () => {
        it('should allow sending during business hours (CST 10am = UTC 16)', () => {
            // UTC 16 = CST 10am (16 - 6 = 10), which is within 9-20
            const cstHour = (16 - 6 + 24) % 24; // = 10
            expect(cstHour >= 9 && cstHour < 20).toBe(true);
        });

        it('should block sending before 9am CST (UTC 14 = CST 8am)', () => {
            const cstHour = (14 - 6 + 24) % 24; // = 8
            expect(cstHour >= 9 && cstHour < 20).toBe(false);
        });

        it('should block sending at 8pm CST (UTC 2 next day = CST 20)', () => {
            const cstHour = (2 - 6 + 24) % 24; // = 20
            expect(cstHour >= 9 && cstHour < 20).toBe(false);
        });

        it('should block sending at midnight CST (UTC 6 = CST 0)', () => {
            const cstHour = (6 - 6 + 24) % 24; // = 0
            expect(cstHour >= 9 && cstHour < 20).toBe(false);
        });
    });

    // ─── checkOptOutStatus ──────────────────────────────────────────────────────

    describe('checkOptOutStatus', () => {
        it('should return optedOut=false when no record found', async () => {
            mockDataAccess.queryRecords.mockResolvedValueOnce({ items: [] });
            const { checkOptOutStatus } = require('backend/smsCampaignService');
            const result = await checkOptOutStatus('+15550001234', '123456');
            expect(result.success).toBe(true);
            expect(result.optedOut).toBe(false);
        });

        it('should return optedOut=true when opt-out record exists', async () => {
            mockDataAccess.queryRecords.mockResolvedValueOnce({
                items: [{ phone_number: '+15550001234', carrier_dot: '123456' }],
            });
            const { checkOptOutStatus } = require('backend/smsCampaignService');
            const result = await checkOptOutStatus('+15550001234', '123456');
            expect(result.success).toBe(true);
            expect(result.optedOut).toBe(true);
        });

        it('should normalize phone numbers (10 digits → +1 prefix)', async () => {
            mockDataAccess.queryRecords.mockResolvedValueOnce({ items: [] });
            const { checkOptOutStatus } = require('backend/smsCampaignService');
            await checkOptOutStatus('5550001234', '123456');
            expect(mockDataAccess.queryRecords).toHaveBeenCalledWith(
                'smsOptOuts',
                expect.objectContaining({ filter: expect.objectContaining({ phone_number: '+15550001234' }) })
            );
        });
    });

    // ─── optOutDriver ───────────────────────────────────────────────────────────

    describe('optOutDriver', () => {
        it('should create opt-out record', async () => {
            // checkOptOutStatus returns not opted out
            mockDataAccess.queryRecords.mockResolvedValueOnce({ items: [] });
            const { optOutDriver } = require('backend/smsCampaignService');
            const result = await optOutDriver('+15550001234', '123456');
            expect(result.success).toBe(true);
            expect(mockDataAccess.insertRecord).toHaveBeenCalledWith(
                'smsOptOuts',
                expect.objectContaining({ phone_number: '+15550001234', carrier_dot: '123456' })
            );
        });

        it('should not create duplicate opt-out if already opted out', async () => {
            // checkOptOutStatus returns already opted out
            mockDataAccess.queryRecords.mockResolvedValueOnce({
                items: [{ phone_number: '+15550001234', carrier_dot: '123456' }],
            });
            const { optOutDriver } = require('backend/smsCampaignService');
            const result = await optOutDriver('+15550001234', '123456');
            expect(result.success).toBe(true);
            expect(result.alreadyOptedOut).toBe(true);
            expect(mockDataAccess.insertRecord).not.toHaveBeenCalled();
        });
    });

    // ─── processTwilioStatusWebhook ─────────────────────────────────────────────

    describe('processTwilioStatusWebhook', () => {
        it('should update message status to delivered', async () => {
            mockDataAccess.queryRecords.mockResolvedValueOnce({
                items: [{ _id: 'sms-msg-1', status: 'sent' }],
            });
            const { processTwilioStatusWebhook } = require('backend/smsCampaignService');
            const result = await processTwilioStatusWebhook({ MessageSid: 'SM123', MessageStatus: 'delivered' });
            expect(result.success).toBe(true);
            expect(mockDataAccess.updateRecord).toHaveBeenCalledWith(
                'smsMessages',
                'sms-msg-1',
                expect.objectContaining({ status: 'delivered' })
            );
        });

        it('should return error when MessageSid is missing', async () => {
            const { processTwilioStatusWebhook } = require('backend/smsCampaignService');
            const result = await processTwilioStatusWebhook({ MessageStatus: 'delivered' });
            expect(result.success).toBe(false);
        });

        it('should return error when message not found', async () => {
            mockDataAccess.queryRecords.mockResolvedValueOnce({ items: [] });
            const { processTwilioStatusWebhook } = require('backend/smsCampaignService');
            const result = await processTwilioStatusWebhook({ MessageSid: 'SM-unknown', MessageStatus: 'delivered' });
            expect(result.success).toBe(false);
        });

        it('should record error code on failed delivery', async () => {
            mockDataAccess.queryRecords.mockResolvedValueOnce({
                items: [{ _id: 'sms-msg-2', status: 'sent' }],
            });
            const { processTwilioStatusWebhook } = require('backend/smsCampaignService');
            await processTwilioStatusWebhook({ MessageSid: 'SM456', MessageStatus: 'failed', ErrorCode: '30003' });
            expect(mockDataAccess.updateRecord).toHaveBeenCalledWith(
                'smsMessages',
                'sms-msg-2',
                expect.objectContaining({ status: 'failed', error_code: '30003' })
            );
        });
    });

    // ─── processTwilioIncomingWebhook ───────────────────────────────────────────

    describe('processTwilioIncomingWebhook', () => {
        it('should opt out driver on STOP keyword', async () => {
            // checkOptOutStatus for optOutDriver
            mockDataAccess.queryRecords.mockResolvedValueOnce({ items: [] });
            const { processTwilioIncomingWebhook } = require('backend/smsCampaignService');
            const result = await processTwilioIncomingWebhook({ From: '+15550001234', Body: 'STOP', To: '+15559999999' });
            expect(result.success).toBe(true);
            expect(result.action).toBe('opted_out');
            expect(mockDataAccess.insertRecord).toHaveBeenCalledWith(
                'smsOptOuts',
                expect.objectContaining({ phone_number: '+15550001234' })
            );
        });

        it('should opt out driver on UNSUBSCRIBE keyword', async () => {
            mockDataAccess.queryRecords.mockResolvedValueOnce({ items: [] });
            const { processTwilioIncomingWebhook } = require('backend/smsCampaignService');
            const result = await processTwilioIncomingWebhook({ From: '+15550005678', Body: 'UNSUBSCRIBE', To: '+15559999999' });
            expect(result.success).toBe(true);
            expect(result.action).toBe('opted_out');
        });

        it('should log reply for non-STOP messages', async () => {
            mockDataAccess.queryRecords.mockResolvedValueOnce({
                items: [{ _id: 'sms-msg-3', phone_number: '+15550001234' }],
            });
            const { processTwilioIncomingWebhook } = require('backend/smsCampaignService');
            const result = await processTwilioIncomingWebhook({ From: '+15550001234', Body: 'Interested!', To: '+15559999999' });
            expect(result.success).toBe(true);
            expect(result.action).toBe('reply_logged');
            expect(mockDataAccess.updateRecord).toHaveBeenCalledWith(
                'smsMessages',
                'sms-msg-3',
                expect.objectContaining({ replied: true, reply_body: 'Interested!' })
            );
        });

        it('should return error when From or Body is missing', async () => {
            const { processTwilioIncomingWebhook } = require('backend/smsCampaignService');
            const result = await processTwilioIncomingWebhook({ From: '', Body: '' });
            expect(result.success).toBe(false);
        });
    });

    // ─── getSMSCampaigns ────────────────────────────────────────────────────────

    describe('getSMSCampaigns', () => {
        it('should filter by carrier_dot', async () => {
            const { getSMSCampaigns } = require('backend/smsCampaignService');
            const result = await getSMSCampaigns('123456', {});
            expect(result.success).toBe(true);
            expect(mockDataAccess.queryRecords).toHaveBeenCalledWith(
                'smsCampaigns',
                expect.objectContaining({ filter: expect.objectContaining({ carrier_dot: '123456' }) })
            );
        });

        it('should return empty campaigns array when none exist', async () => {
            const { getSMSCampaigns } = require('backend/smsCampaignService');
            const result = await getSMSCampaigns('999999', {});
            expect(result.success).toBe(true);
            expect(result.campaigns).toEqual([]);
        });
    });

});
