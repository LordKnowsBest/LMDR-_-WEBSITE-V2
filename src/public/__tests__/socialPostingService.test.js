/* eslint-disable */
/**
 * Tests for socialPostingService.jsw
 * Covers: character limit validation per platform, OAuth token management, scheduled post processing, content generation
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
    status: 200,
    json: async () => ({ id: 'fb-post-123', access_token: 'new-token', expires_in: 5183944 }),
    text: async () => '',
});

describe('socialPostingService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockDataAccess.insertRecord.mockResolvedValue({ _id: 'social-mock-id' });
        mockDataAccess.queryRecords.mockResolvedValue({ items: [], totalCount: 0 });
        mockDataAccess.updateRecord.mockResolvedValue({ _id: 'social-mock-id' });
        mockDataAccess.getRecord.mockResolvedValue(null);
    });

    // ─── createSocialPost ───────────────────────────────────────────────────────

    describe('createSocialPost', () => {
        const validPost = {
            content: 'Now hiring CDL-A drivers! Great pay and benefits.',
            platforms: ['facebook'],
            scheduleType: 'immediate',
        };

        it('should create post with status=draft', async () => {
            const { createSocialPost } = require('backend/socialPostingService');
            const result = await createSocialPost('123456', validPost);
            expect(result.success).toBe(true);
            expect(result.postId).toBe('social-mock-id');
            expect(mockDataAccess.insertRecord).toHaveBeenCalledWith(
                'socialPosts',
                expect.objectContaining({ status: 'draft', carrier_dot: '123456' })
            );
        });

        it('should reject empty content', async () => {
            const { createSocialPost } = require('backend/socialPostingService');
            const result = await createSocialPost('123456', { ...validPost, content: '' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('content');
        });

        it('should reject empty platforms array', async () => {
            const { createSocialPost } = require('backend/socialPostingService');
            const result = await createSocialPost('123456', { ...validPost, platforms: [] });
            expect(result.success).toBe(false);
        });

        it('should reject unsupported platform names', async () => {
            const { createSocialPost } = require('backend/socialPostingService');
            const result = await createSocialPost('123456', { ...validPost, platforms: ['twitter'] });
            expect(result.success).toBe(false);
        });

        it('should enforce LinkedIn 3,000 char limit', async () => {
            const { createSocialPost } = require('backend/socialPostingService');
            const tooLong = 'A'.repeat(3001);
            const result = await createSocialPost('123456', { ...validPost, content: tooLong, platforms: ['linkedin'] });
            expect(result.success).toBe(false);
            expect(result.error).toMatch(/character|limit|long/i);
        });

        it('should accept content within LinkedIn 3,000 char limit', async () => {
            const { createSocialPost } = require('backend/socialPostingService');
            const okContent = 'A'.repeat(3000);
            const result = await createSocialPost('123456', { ...validPost, content: okContent, platforms: ['linkedin'] });
            expect(result.success).toBe(true);
        });

        it('should always create with status=draft regardless of scheduleType', async () => {
            // createSocialPost always saves as draft; scheduling is a separate step
            const { createSocialPost } = require('backend/socialPostingService');
            const result = await createSocialPost('123456', {
                ...validPost,
                scheduleType: 'scheduled',
                scheduledTime: '2026-03-01T14:00:00Z',
            });
            expect(result.success).toBe(true);
            expect(mockDataAccess.insertRecord).toHaveBeenCalledWith(
                'socialPosts',
                expect.objectContaining({ status: 'draft' })
            );
        });

        it('should store scheduleType and scheduledTime in record', async () => {
            const { createSocialPost } = require('backend/socialPostingService');
            await createSocialPost('123456', {
                ...validPost,
                scheduleType: 'scheduled',
                scheduledTime: '2026-03-01T14:00:00Z',
            });
            const call = mockDataAccess.insertRecord.mock.calls[0][1];
            expect(call.schedule_type).toBe('scheduled');
            expect(call.scheduled_time).toBe('2026-03-01T14:00:00Z');
        });
    });

    // ─── scheduleSocialPost ─────────────────────────────────────────────────────

    describe('scheduleSocialPost', () => {
        it('should update status to scheduled with future time', async () => {
            const { scheduleSocialPost } = require('backend/socialPostingService');
            const futureTime = new Date(Date.now() + 3600000).toISOString();
            const result = await scheduleSocialPost('post-1', futureTime);
            expect(result.success).toBe(true);
            expect(mockDataAccess.updateRecord).toHaveBeenCalledWith(
                'socialPosts',
                'post-1',
                expect.objectContaining({ status: 'scheduled', scheduled_time: futureTime })
            );
        });

        it('should reject past scheduledTime', async () => {
            const { scheduleSocialPost } = require('backend/socialPostingService');
            const pastTime = new Date(Date.now() - 1000).toISOString();
            const result = await scheduleSocialPost('post-1', pastTime);
            expect(result.success).toBe(false);
            expect(result.error).toContain('future');
        });

        it('should reject missing scheduledTime', async () => {
            const { scheduleSocialPost } = require('backend/socialPostingService');
            const result = await scheduleSocialPost('post-1', '');
            expect(result.success).toBe(false);
        });
    });

    // ─── getSocialPosts ─────────────────────────────────────────────────────────

    describe('getSocialPosts', () => {
        it('should filter by carrier_dot', async () => {
            const { getSocialPosts } = require('backend/socialPostingService');
            const result = await getSocialPosts('123456', {});
            expect(result.success).toBe(true);
            expect(mockDataAccess.queryRecords).toHaveBeenCalledWith(
                'socialPosts',
                expect.objectContaining({ filter: expect.objectContaining({ carrier_dot: '123456' }) })
            );
        });

        it('should return empty posts array when none exist', async () => {
            const { getSocialPosts } = require('backend/socialPostingService');
            const result = await getSocialPosts('999999', {});
            expect(result.success).toBe(true);
            expect(result.posts).toEqual([]);
        });
    });

    // ─── publishSocialPost ──────────────────────────────────────────────────────

    describe('publishSocialPost', () => {
        const mockPost = {
            _id: 'post-1',
            carrier_dot: '123456',
            content: 'Now hiring CDL-A drivers!',
            platforms: JSON.stringify(['facebook']),
            media_urls: JSON.stringify([]),
            link_url: '',
            status: 'draft',
        };
        const mockAccount = {
            _id: 'acct-1',
            platform: 'facebook',
            access_token: 'fb-token-xyz',
            account_id: 'page-123',
            page_id: 'page-123',
            is_active: true,
        };

        it('should update post status to published on success', async () => {
            mockDataAccess.getRecord.mockResolvedValueOnce(mockPost);
            // _getConnectedAccount query
            mockDataAccess.queryRecords.mockResolvedValueOnce({ items: [mockAccount] });
            const { publishSocialPost } = require('backend/socialPostingService');
            const result = await publishSocialPost('post-1');
            expect(result.success).toBe(true);
            expect(mockDataAccess.updateRecord).toHaveBeenCalledWith(
                'socialPosts',
                'post-1',
                expect.objectContaining({ status: 'published' })
            );
        });

        it('should return error when post not found', async () => {
            mockDataAccess.getRecord.mockResolvedValueOnce(null);
            const { publishSocialPost } = require('backend/socialPostingService');
            const result = await publishSocialPost('nonexistent');
            expect(result.success).toBe(false);
        });

        it('should return failed status when no connected account for platform', async () => {
            mockDataAccess.getRecord.mockResolvedValueOnce(mockPost);
            mockDataAccess.queryRecords.mockResolvedValueOnce({ items: [] }); // no account
            const { publishSocialPost } = require('backend/socialPostingService');
            const result = await publishSocialPost('post-1');
            // anySuccess=false → status=failed, result.success=false
            expect(result.success).toBe(false);
            expect(mockDataAccess.updateRecord).toHaveBeenCalledWith(
                'socialPosts',
                'post-1',
                expect.objectContaining({ status: 'failed' })
            );
        });

        it('should not publish an already-published post', async () => {
            mockDataAccess.getRecord.mockResolvedValueOnce({ ...mockPost, status: 'published' });
            const { publishSocialPost } = require('backend/socialPostingService');
            const result = await publishSocialPost('post-1');
            expect(result.success).toBe(false);
        });
    });

    // ─── processScheduledPosts ──────────────────────────────────────────────────

    describe('processScheduledPosts', () => {
        it('should return success with 0 published when no posts are due', async () => {
            mockDataAccess.queryRecords.mockResolvedValueOnce({ items: [] });
            const { processScheduledPosts } = require('backend/socialPostingService');
            const result = await processScheduledPosts();
            expect(result.success).toBe(true);
            expect(result.published).toBe(0);
            expect(result.failed).toBe(0);
        });

        it('should skip posts whose scheduled_time is in the future', async () => {
            const futureTime = new Date(Date.now() + 60000).toISOString();
            mockDataAccess.queryRecords.mockResolvedValueOnce({
                items: [{ _id: 'post-future', status: 'scheduled', scheduled_time: futureTime }]
            });
            const { processScheduledPosts } = require('backend/socialPostingService');
            const result = await processScheduledPosts();
            expect(result.success).toBe(true);
            expect(result.published).toBe(0);
        });
    });

    // ─── connectSocialAccount ───────────────────────────────────────────────────

    describe('connectSocialAccount', () => {
        it('should save account with is_active=true after token exchange', async () => {
            // _exchangeOAuthCode → fetch for token, then fetch for user info
            global.fetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ access_token: 'new-token', expires_in: 5183944 }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ id: 'fb-user-123', name: 'Test Page' }),
                });
            // No existing account
            mockDataAccess.queryRecords.mockResolvedValueOnce({ items: [] });
            const { connectSocialAccount } = require('backend/socialPostingService');
            const result = await connectSocialAccount('123456', 'facebook', 'auth-code-xyz');
            expect(result.success).toBe(true);
            expect(mockDataAccess.insertRecord).toHaveBeenCalledWith(
                'socialAccounts',
                expect.objectContaining({
                    carrier_dot: '123456',
                    platform: 'facebook',
                    is_active: true,
                })
            );
        });

        it('should reject unsupported platforms', async () => {
            const { connectSocialAccount } = require('backend/socialPostingService');
            const result = await connectSocialAccount('123456', 'twitter', 'auth-code');
            expect(result.success).toBe(false);
        });

        it('should return error when token exchange fails', async () => {
            // LinkedIn token exchange fails
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ error: 'invalid_grant', error_description: 'Code expired' }),
            });
            const { connectSocialAccount } = require('backend/socialPostingService');
            const result = await connectSocialAccount('123456', 'linkedin', 'bad-code');
            expect(result.success).toBe(false);
        });

        it('should update existing account record instead of inserting', async () => {
            global.fetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ access_token: 'new-token', expires_in: 5183944 }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ id: 'fb-user-123', name: 'Test Page' }),
                });
            // Existing account found
            mockDataAccess.queryRecords.mockResolvedValueOnce({
                items: [{ _id: 'acct-1', carrier_dot: '123456', platform: 'facebook' }],
            });
            const { connectSocialAccount } = require('backend/socialPostingService');
            const result = await connectSocialAccount('123456', 'facebook', 'auth-code-2');
            expect(result.success).toBe(true);
            expect(mockDataAccess.updateRecord).toHaveBeenCalledWith(
                'socialAccounts',
                'acct-1',
                expect.objectContaining({ is_active: true })
            );
            expect(mockDataAccess.insertRecord).not.toHaveBeenCalled();
        });
    });

    // ─── refreshSocialToken ─────────────────────────────────────────────────────

    describe('refreshSocialToken', () => {
        it('should update access_token in socialAccounts on success', async () => {
            mockDataAccess.getRecord.mockResolvedValueOnce({
                _id: 'acct-1',
                platform: 'linkedin',
                refresh_token: 'old-refresh-token',
                is_active: true,
            });
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ access_token: 'new-access-token', expires_in: 5183944 }),
            });
            const { refreshSocialToken } = require('backend/socialPostingService');
            const result = await refreshSocialToken('acct-1');
            expect(result.success).toBe(true);
            expect(mockDataAccess.updateRecord).toHaveBeenCalledWith(
                'socialAccounts',
                'acct-1',
                expect.objectContaining({ access_token: 'new-access-token' })
            );
        });

        it('should return error when refresh fails (does not mark inactive)', async () => {
            mockDataAccess.getRecord.mockResolvedValueOnce({
                _id: 'acct-2',
                platform: 'linkedin',
                refresh_token: 'expired-token',
                is_active: true,
            });
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ error: 'invalid_token', error_description: 'Token expired' }),
            });
            const { refreshSocialToken } = require('backend/socialPostingService');
            const result = await refreshSocialToken('acct-2');
            // Service returns error but does NOT mark inactive
            expect(result.success).toBe(false);
            expect(mockDataAccess.updateRecord).not.toHaveBeenCalled();
        });

        it('should return error when account not found', async () => {
            mockDataAccess.getRecord.mockResolvedValueOnce(null);
            const { refreshSocialToken } = require('backend/socialPostingService');
            const result = await refreshSocialToken('nonexistent');
            expect(result.success).toBe(false);
        });

        it('should return error for facebook (no refresh token flow)', async () => {
            mockDataAccess.getRecord.mockResolvedValueOnce({
                _id: 'acct-3',
                platform: 'facebook',
                refresh_token: 'fb-token',
                is_active: true,
            });
            const { refreshSocialToken } = require('backend/socialPostingService');
            const result = await refreshSocialToken('acct-3');
            expect(result.success).toBe(false);
            expect(result.error).toContain('not supported');
        });
    });

    // ─── generateJobPostContent ─────────────────────────────────────────────────

    describe('generateJobPostContent', () => {
        const mockJob = {
            _id: 'job-1',
            title: 'CDL-A OTR Driver',
            location: 'Dallas, TX',
            description: 'Great opportunity for experienced drivers.',
            pay_rate: '$0.55/mile',
            route_type: 'OTR',
            cdl_class_required: 'A',
            experience_years: 2,
            home_time: 'Weekly',
        };

        it('should return template-based content for facebook', async () => {
            mockDataAccess.getRecord.mockResolvedValueOnce(mockJob);
            const { generateJobPostContent } = require('backend/socialPostingService');
            const result = await generateJobPostContent('job-1', 'facebook');
            expect(result.success).toBe(true);
            expect(typeof result.content).toBe('string');
            expect(result.content.length).toBeGreaterThan(0);
            expect(result.platform).toBe('facebook');
        });

        it('should return template-based content for linkedin', async () => {
            mockDataAccess.getRecord.mockResolvedValueOnce(mockJob);
            const { generateJobPostContent } = require('backend/socialPostingService');
            const result = await generateJobPostContent('job-1', 'linkedin');
            expect(result.success).toBe(true);
            expect(typeof result.content).toBe('string');
            expect(result.content.length).toBeGreaterThan(0);
            expect(result.characterCount).toBeLessThanOrEqual(3000);
        });

        it('should return error when job not found', async () => {
            mockDataAccess.getRecord.mockResolvedValueOnce(null);
            const { generateJobPostContent } = require('backend/socialPostingService');
            const result = await generateJobPostContent('nonexistent', 'facebook');
            expect(result.success).toBe(false);
        });

        it('should include characterCount and limit in response', async () => {
            mockDataAccess.getRecord.mockResolvedValueOnce(mockJob);
            const { generateJobPostContent } = require('backend/socialPostingService');
            const result = await generateJobPostContent('job-1', 'linkedin');
            expect(result.success).toBe(true);
            expect(typeof result.characterCount).toBe('number');
            expect(typeof result.limit).toBe('number');
            expect(result.limit).toBe(3000);
        });
    });

});
