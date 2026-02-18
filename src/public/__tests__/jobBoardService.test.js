/* eslint-disable */
/**
 * Tests for jobBoardService.jsw
 * Covers: job posting validation, syndication status tracking, application deduplication, webhook handling
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

global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ id: 'external-job-123', status: 'active' }),
    text: async () => '',
});

describe('jobBoardService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockDataAccess.insertRecord.mockResolvedValue({ _id: 'job-mock-id' });
        mockDataAccess.queryRecords.mockResolvedValue({ items: [], totalCount: 0 });
        mockDataAccess.updateRecord.mockResolvedValue({ _id: 'job-mock-id' });
        mockDataAccess.getRecord.mockResolvedValue(null);
    });

    // ─── createJobPosting ───────────────────────────────────────────────────────

    describe('createJobPosting', () => {
        const validJob = {
            title: 'CDL-A OTR Driver',
            location: 'Dallas, TX',
            description: 'We are looking for experienced CDL-A OTR drivers.',
            routeType: 'OTR',
            cdlClassRequired: 'A',
            payRate: '$0.55/mile',
        };

        it('should create job posting with status=active', async () => {
            const { createJobPosting } = require('backend/jobBoardService');
            const result = await createJobPosting('123456', validJob);
            expect(result.success).toBe(true);
            expect(result.jobId).toBe('job-mock-id');
            expect(mockDataAccess.insertRecord).toHaveBeenCalledWith(
                'jobPostings',
                expect.objectContaining({ status: 'active', carrier_dot: '123456' })
            );
        });

        it('should reject missing title', async () => {
            const { createJobPosting } = require('backend/jobBoardService');
            const result = await createJobPosting('123456', { ...validJob, title: '' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('title');
        });

        it('should reject missing location', async () => {
            const { createJobPosting } = require('backend/jobBoardService');
            const result = await createJobPosting('123456', { ...validJob, location: '' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('location');
        });

        it('should reject missing description', async () => {
            const { createJobPosting } = require('backend/jobBoardService');
            const result = await createJobPosting('123456', { ...validJob, description: '' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('description');
        });

        it('should initialize view_count and application_count to 0', async () => {
            const { createJobPosting } = require('backend/jobBoardService');
            await createJobPosting('123456', validJob);
            const call = mockDataAccess.insertRecord.mock.calls[0][1];
            expect(call.view_count).toBe(0);
            expect(call.application_count).toBe(0);
        });

        it('should initialize empty syndication object', async () => {
            const { createJobPosting } = require('backend/jobBoardService');
            await createJobPosting('123456', validJob);
            const call = mockDataAccess.insertRecord.mock.calls[0][1];
            expect(call.syndication).toBeDefined();
        });

        it('should return error when carrierDot is missing', async () => {
            const { createJobPosting } = require('backend/jobBoardService');
            const result = await createJobPosting('', validJob);
            expect(result.success).toBe(false);
        });
    });

    // ─── getJobPostings ─────────────────────────────────────────────────────────

    describe('getJobPostings', () => {
        it('should filter by carrier_dot', async () => {
            const { getJobPostings } = require('backend/jobBoardService');
            const result = await getJobPostings('123456', {});
            expect(result.success).toBe(true);
            expect(mockDataAccess.queryRecords).toHaveBeenCalledWith(
                'jobPostings',
                expect.objectContaining({ filter: expect.objectContaining({ carrier_dot: '123456' }) })
            );
        });

        it('should return empty jobs array when none exist', async () => {
            const { getJobPostings } = require('backend/jobBoardService');
            const result = await getJobPostings('999999', {});
            expect(result.success).toBe(true);
            expect(result.jobs).toEqual([]);
        });

        it('should filter by status when provided', async () => {
            const { getJobPostings } = require('backend/jobBoardService');
            await getJobPostings('123456', { status: 'active' });
            expect(mockDataAccess.queryRecords).toHaveBeenCalledWith(
                'jobPostings',
                expect.objectContaining({ filter: expect.objectContaining({ status: 'active' }) })
            );
        });
    });

    // ─── syndicateJob ───────────────────────────────────────────────────────────

    describe('syndicateJob', () => {
        const mockJob = {
            _id: 'job-1',
            carrier_dot: '123456',
            title: 'CDL-A OTR Driver',
            location: 'Dallas, TX',
            description: 'Great opportunity.',
            route_type: 'OTR',
            cdl_class_required: 'A',
            pay_rate: '$0.55/mile',
            syndication: JSON.stringify({}),
        };

        it('should update syndication field after posting to indeed', async () => {
            mockDataAccess.getRecord.mockResolvedValueOnce(mockJob);
            // _getBoardCredentials query
            mockDataAccess.queryRecords.mockResolvedValueOnce({
                items: [{ _id: 'cred-1', board: 'indeed', api_key: 'test-key', is_active: true }],
            });
            const { syndicateJob } = require('backend/jobBoardService');
            const result = await syndicateJob('job-1', ['indeed']);
            expect(result.success).toBe(true);
            expect(mockDataAccess.updateRecord).toHaveBeenCalledWith(
                'jobPostings',
                'job-1',
                expect.objectContaining({
                    syndication: expect.stringContaining('indeed'),
                })
            );
        });

        it('should return error when job not found', async () => {
            mockDataAccess.getRecord.mockResolvedValueOnce(null);
            const { syndicateJob } = require('backend/jobBoardService');
            const result = await syndicateJob('nonexistent-job', ['indeed']);
            expect(result.success).toBe(false);
        });

        it('should return error for unsupported boards', async () => {
            mockDataAccess.getRecord.mockResolvedValueOnce(mockJob);
            const { syndicateJob } = require('backend/jobBoardService');
            const result = await syndicateJob('job-1', ['monster']);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Unsupported');
        });

        it('should record failed status when no credentials configured', async () => {
            mockDataAccess.getRecord.mockResolvedValueOnce(mockJob);
            // _getBoardCredentials returns null (no credentials)
            mockDataAccess.queryRecords.mockResolvedValueOnce({ items: [] });
            const { syndicateJob } = require('backend/jobBoardService');
            const result = await syndicateJob('job-1', ['indeed']);
            expect(result.success).toBe(true);
            expect(result.results.indeed.status).toBe('failed');
        });
    });

    // ─── processJobBoardWebhook ─────────────────────────────────────────────────

    describe('processJobBoardWebhook', () => {
        it('should return error for unsupported board', async () => {
            const { processJobBoardWebhook } = require('backend/jobBoardService');
            const result = await processJobBoardWebhook('monster', { jobId: 'job-1' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Unsupported');
        });

        it('should return error when no jobId in payload', async () => {
            const { processJobBoardWebhook } = require('backend/jobBoardService');
            // Indeed payload with no jobId → _normalizeApplicationPayload returns jobExternalId=undefined
            const result = await processJobBoardWebhook('indeed', { applicationId: 'app-1' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('No job ID');
        });

        it('should return error when job not found via syndication match', async () => {
            // queryRecords returns jobs with no matching syndication externalId
            mockDataAccess.queryRecords.mockResolvedValueOnce({
                items: [{ _id: 'job-1', syndication: JSON.stringify({}) }],
            });
            const { processJobBoardWebhook } = require('backend/jobBoardService');
            const result = await processJobBoardWebhook('indeed', { jobId: 'ext-job-999', applicationId: 'app-1' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });

        it('should return duplicate:true when application already exists', async () => {
            // jobs query: one job with matching indeed syndication externalId
            mockDataAccess.queryRecords.mockResolvedValueOnce({
                items: [{
                    _id: 'job-1', carrier_dot: '123456', application_count: 0,
                    syndication: JSON.stringify({ indeed: { externalId: 'ext-job-123', status: 'live' } })
                }],
            });
            // dedup check: existing application found
            mockDataAccess.queryRecords.mockResolvedValueOnce({
                items: [{ _id: 'existing-app', external_id: 'app-dup-1', source_board: 'indeed' }],
            });
            const { processJobBoardWebhook } = require('backend/jobBoardService');
            const result = await processJobBoardWebhook('indeed', {
                jobId: 'ext-job-123',
                applicationId: 'app-dup-1',
                email: 'dup@test.com',
            });
            expect(result.success).toBe(true);
            expect(result.duplicate).toBe(true);
            expect(mockDataAccess.insertRecord).not.toHaveBeenCalled();
        });

        it('should insert application record for new Indeed application', async () => {
            // jobs query: matching job
            mockDataAccess.queryRecords.mockResolvedValueOnce({
                items: [{
                    _id: 'job-1', carrier_dot: '123456', application_count: 2,
                    syndication: JSON.stringify({ indeed: { externalId: 'ext-job-123', status: 'live' } })
                }],
            });
            // dedup check: no existing
            mockDataAccess.queryRecords.mockResolvedValueOnce({ items: [] });
            const { processJobBoardWebhook } = require('backend/jobBoardService');
            const result = await processJobBoardWebhook('indeed', {
                jobId: 'ext-job-123',
                applicationId: 'app-new-1',
                email: 'newdriver@test.com',
                phone: '+15550001234',
                resumeUrl: 'https://example.com/resume.pdf',
            });
            expect(result.success).toBe(true);
            expect(mockDataAccess.insertRecord).toHaveBeenCalledWith(
                'jobApplications',
                expect.objectContaining({ source_board: 'indeed', status: 'new' })
            );
        });
    });

    // ─── connectJobBoard ────────────────────────────────────────────────────────

    describe('connectJobBoard', () => {
        it('should save board credentials with is_active=true', async () => {
            // No existing credentials
            mockDataAccess.queryRecords.mockResolvedValueOnce({ items: [] });
            const { connectJobBoard } = require('backend/jobBoardService');
            const result = await connectJobBoard('123456', 'indeed', { apiKey: 'test-key', publisherId: 'pub-123' });
            expect(result.success).toBe(true);
            expect(mockDataAccess.insertRecord).toHaveBeenCalledWith(
                'jobBoardCredentials',
                expect.objectContaining({
                    carrier_dot: '123456',
                    board: 'indeed',
                    is_active: true,
                })
            );
        });

        it('should reject unsupported board names', async () => {
            const { connectJobBoard } = require('backend/jobBoardService');
            const result = await connectJobBoard('123456', 'monster', { apiKey: 'key' });
            expect(result.success).toBe(false);
        });

        it('should reject when neither apiKey nor publisherId provided', async () => {
            const { connectJobBoard } = require('backend/jobBoardService');
            // verifyJobBoardCredentials requires apiKey OR publisherId
            const result = await connectJobBoard('123456', 'indeed', { accountId: 'only-account' });
            expect(result.success).toBe(false);
        });

        it('should update existing credentials record instead of inserting', async () => {
            mockDataAccess.queryRecords.mockResolvedValueOnce({
                items: [{ _id: 'cred-1', carrier_dot: '123456', board: 'indeed' }],
            });
            const { connectJobBoard } = require('backend/jobBoardService');
            const result = await connectJobBoard('123456', 'indeed', { apiKey: 'new-key' });
            expect(result.success).toBe(true);
            expect(mockDataAccess.updateRecord).toHaveBeenCalledWith(
                'jobBoardCredentials',
                'cred-1',
                expect.objectContaining({ is_active: true })
            );
            expect(mockDataAccess.insertRecord).not.toHaveBeenCalled();
        });
    });

    // ─── updateJobPosting ───────────────────────────────────────────────────────

    describe('updateJobPosting', () => {
        it('should return error when job not found', async () => {
            mockDataAccess.getRecord.mockResolvedValueOnce(null);
            const { updateJobPosting } = require('backend/jobBoardService');
            const result = await updateJobPosting('nonexistent', { title: 'New Title' });
            expect(result.success).toBe(false);
        });

        it('should update job posting fields', async () => {
            mockDataAccess.getRecord.mockResolvedValueOnce({
                _id: 'job-1',
                status: 'active',
                syndication: JSON.stringify({}),
            });
            const { updateJobPosting } = require('backend/jobBoardService');
            const result = await updateJobPosting('job-1', { title: 'Updated Title' });
            expect(result.success).toBe(true);
            expect(mockDataAccess.updateRecord).toHaveBeenCalled();
        });
    });

});
