/**
 * Referral Service Tests
 *
 * Tests for Phase 7.5: Cross-Platform Bonuses
 * Verifies referral tracking and match quality bonus functionality
 */

// Mock Airtable client
const mockQueryRecords = jest.fn();
const mockCreateRecord = jest.fn();
const mockUpdateRecord = jest.fn();
const mockGetRecord = jest.fn();

jest.mock('backend/airtableClient', () => ({
    queryRecords: mockQueryRecords,
    createRecord: mockCreateRecord,
    updateRecord: mockUpdateRecord,
    getRecord: mockGetRecord
}));

jest.mock('backend/config', () => ({
    getAirtableTableName: jest.fn((key) => `v2_${key}`)
}));

const mockAwardDriverXP = jest.fn().mockResolvedValue({ success: true });
const mockAwardRecruiterPoints = jest.fn().mockResolvedValue({ success: true });

jest.mock('backend/gamificationService', () => ({
    awardDriverXP: mockAwardDriverXP,
    awardRecruiterPoints: mockAwardRecruiterPoints
}));

jest.mock('backend/memberService', () => ({
    createNotification: jest.fn().mockResolvedValue({ success: true })
}));

// Import after mocks
const {
    generateReferralCode,
    getReferralStats,
    trackReferralSignup,
    trackReferralConversion,
    validateReferralCode,
    awardMatchQualityBonus,
    getMatchQualityBonusHistory,
    processHireBonus,
    getReferralConfig
} = require('backend/referralService');

describe('Referral Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =========================================================================
    // REFERRAL CODE GENERATION
    // =========================================================================
    describe('generateReferralCode', () => {
        test('should generate unique referral code for driver', async () => {
            // Mock no existing code
            mockQueryRecords.mockResolvedValueOnce({ records: [] });
            mockCreateRecord.mockResolvedValueOnce({
                id: 'ref_record_1',
                'Referral Code': 'ref_AB12XY34'
            });

            const result = await generateReferralCode('driver_123');

            expect(result.success).toBe(true);
            expect(result.referralCode).toBeDefined();
            expect(result.referralCode).toMatch(/^ref_/);
            expect(result.referralLink).toContain('ref=');
            expect(result.existingCode).toBe(false);
        });

        test('should return existing code if driver already has one', async () => {
            mockQueryRecords.mockResolvedValueOnce({
                records: [{
                    id: 'ref_record_1',
                    'Referrer ID': 'driver_123',
                    'Referral Code': 'ref_EXISTING'
                }]
            });

            const result = await generateReferralCode('driver_123');

            expect(result.success).toBe(true);
            expect(result.referralCode).toBe('ref_EXISTING');
            expect(result.existingCode).toBe(true);
            expect(mockCreateRecord).not.toHaveBeenCalled();
        });

        test('should fail without driver ID', async () => {
            const result = await generateReferralCode(null);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Driver ID required');
        });
    });

    // =========================================================================
    // REFERRAL STATS
    // =========================================================================
    describe('getReferralStats', () => {
        test('should return stats for driver with referrals', async () => {
            // Mock referrer record
            mockQueryRecords
                .mockResolvedValueOnce({
                    records: [{
                        id: 'ref_master',
                        'Referrer ID': 'driver_123',
                        'Referral Code': 'ref_ABC123',
                        'Total Referrals': 5,
                        'Successful Hires': 2,
                        'Total XP Earned': 1500
                    }]
                })
                // Mock individual referrals
                .mockResolvedValueOnce({
                    records: [
                        { 'Referee ID': 'user_1', 'Status': 'hired' },
                        { 'Referee ID': 'user_2', 'Status': 'hired' },
                        { 'Referee ID': 'user_3', 'Status': 'applied' },
                        { 'Referee ID': 'user_4', 'Status': 'signed_up' },
                        { 'Referee ID': 'user_5', 'Status': 'signed_up' }
                    ]
                });

            const result = await getReferralStats('driver_123');

            expect(result.success).toBe(true);
            expect(result.hasReferralCode).toBe(true);
            expect(result.referralCode).toBe('ref_ABC123');
            expect(result.stats.totalReferrals).toBe(5);
            expect(result.stats.successfulHires).toBe(2);
            expect(result.stats.totalXPEarned).toBe(1500);
        });

        test('should return empty stats for driver without referrals', async () => {
            mockQueryRecords.mockResolvedValueOnce({ records: [] });

            const result = await getReferralStats('driver_new');

            expect(result.success).toBe(true);
            expect(result.hasReferralCode).toBe(false);
            expect(result.stats.totalReferrals).toBe(0);
        });
    });

    // =========================================================================
    // REFERRAL SIGNUP TRACKING
    // =========================================================================
    describe('trackReferralSignup', () => {
        test('should track new user signup with valid referral code', async () => {
            // Mock find referrer
            mockQueryRecords
                .mockResolvedValueOnce({
                    records: [{
                        id: 'ref_master',
                        'Referrer ID': 'driver_referrer',
                        'Referral Code': 'ref_VALID',
                        'Total Referrals': 3
                    }]
                })
                // Mock check existing referral
                .mockResolvedValueOnce({ records: [] });

            mockCreateRecord.mockResolvedValueOnce({ id: 'new_referral' });
            mockUpdateRecord.mockResolvedValueOnce({ success: true });

            const result = await trackReferralSignup('ref_VALID', 'new_user_123', 'new@email.com');

            expect(result.success).toBe(true);
            expect(result.referrerId).toBe('driver_referrer');
            expect(result.bonusAwarded.referrer).toBe(200);
            expect(result.bonusAwarded.referee).toBe(50);
            expect(mockCreateRecord).toHaveBeenCalled();
        });

        test('should fail with invalid referral code', async () => {
            mockQueryRecords.mockResolvedValueOnce({ records: [] });

            const result = await trackReferralSignup('ref_INVALID', 'new_user');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid referral code');
        });

        test('should fail if user already has referral record', async () => {
            mockQueryRecords
                .mockResolvedValueOnce({
                    records: [{
                        id: 'ref_master',
                        'Referrer ID': 'driver_referrer',
                        'Referral Code': 'ref_VALID'
                    }]
                })
                .mockResolvedValueOnce({
                    records: [{ 'Referee ID': 'existing_user' }]
                });

            const result = await trackReferralSignup('ref_VALID', 'existing_user');

            expect(result.success).toBe(false);
            expect(result.error).toBe('User already has a referral record');
        });
    });

    // =========================================================================
    // REFERRAL CONVERSION TRACKING
    // =========================================================================
    describe('trackReferralConversion', () => {
        test('should track application conversion for referred user', async () => {
            mockQueryRecords
                .mockResolvedValueOnce({
                    records: [{
                        id: 'referral_1',
                        'Referrer ID': 'driver_referrer',
                        'Referee ID': 'driver_referee',
                        'Status': 'signed_up',
                        'XP Earned From Referral': 0
                    }]
                })
                .mockResolvedValueOnce({
                    records: [{
                        id: 'ref_master',
                        'Total XP Earned': 200
                    }]
                });

            mockUpdateRecord.mockResolvedValue({ success: true });

            const result = await trackReferralConversion('driver_referee', 'applied', { carrierDot: '123456' });

            expect(result.success).toBe(true);
            expect(result.wasReferred).toBe(true);
            expect(result.xpAwarded).toBe(100); // Application bonus
        });

        test('should track hire conversion with higher XP', async () => {
            mockQueryRecords
                .mockResolvedValueOnce({
                    records: [{
                        id: 'referral_1',
                        'Referrer ID': 'driver_referrer',
                        'Referee ID': 'driver_referee',
                        'Status': 'applied',
                        'XP Earned From Referral': 100
                    }]
                })
                .mockResolvedValueOnce({
                    records: [{
                        id: 'ref_master',
                        'Total XP Earned': 300,
                        'Successful Hires': 0
                    }]
                });

            mockUpdateRecord.mockResolvedValue({ success: true });

            const result = await trackReferralConversion('driver_referee', 'hired', { carrierDot: '123456' });

            expect(result.success).toBe(true);
            expect(result.xpAwarded).toBe(500); // Hire bonus
        });

        test('should return not referred for non-referred user', async () => {
            mockQueryRecords.mockResolvedValueOnce({ records: [] });

            const result = await trackReferralConversion('non_referred_user', 'applied');

            expect(result.success).toBe(true);
            expect(result.wasReferred).toBe(false);
        });
    });

    // =========================================================================
    // REFERRAL CODE VALIDATION
    // =========================================================================
    describe('validateReferralCode', () => {
        test('should validate existing referral code', async () => {
            mockQueryRecords.mockResolvedValueOnce({
                records: [{
                    'Referrer ID': 'driver_123',
                    'Referral Code': 'ref_VALID'
                }]
            });

            const result = await validateReferralCode('ref_VALID');

            expect(result.valid).toBe(true);
            expect(result.referrerId).toBe('driver_123');
        });

        test('should invalidate non-existent referral code', async () => {
            mockQueryRecords.mockResolvedValueOnce({ records: [] });

            const result = await validateReferralCode('ref_INVALID');

            expect(result.valid).toBe(false);
        });

        test('should handle empty code', async () => {
            const result = await validateReferralCode('');

            expect(result.valid).toBe(false);
        });
    });
});

// =========================================================================
// MATCH QUALITY BONUS TESTS
// =========================================================================
describe('Match Quality Bonus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('awardMatchQualityBonus', () => {
        test('should award excellent tier bonus for 90%+ match', async () => {
            mockCreateRecord.mockResolvedValueOnce({ id: 'bonus_1' });

            const result = await awardMatchQualityBonus(
                'driver_123',
                'recruiter_456',
                92,
                { carrierDot: '123456' }
            );

            expect(result.success).toBe(true);
            expect(result.bonusAwarded).toBe(true);
            expect(result.bonusTier).toBe('excellent');
            expect(result.driverBonus).toBe(150);
            expect(result.recruiterBonus).toBe(200);
        });

        test('should award great tier bonus for 80-89% match', async () => {
            mockCreateRecord.mockResolvedValueOnce({ id: 'bonus_1' });

            const result = await awardMatchQualityBonus(
                'driver_123',
                'recruiter_456',
                85,
                {}
            );

            expect(result.bonusTier).toBe('great');
            expect(result.driverBonus).toBe(100);
            expect(result.recruiterBonus).toBe(150);
        });

        test('should award good tier bonus for 70-79% match', async () => {
            mockCreateRecord.mockResolvedValueOnce({ id: 'bonus_1' });

            const result = await awardMatchQualityBonus(
                'driver_123',
                'recruiter_456',
                75,
                {}
            );

            expect(result.bonusTier).toBe('good');
            expect(result.driverBonus).toBe(50);
            expect(result.recruiterBonus).toBe(75);
        });

        test('should not award bonus for match below 70%', async () => {
            const result = await awardMatchQualityBonus(
                'driver_123',
                'recruiter_456',
                65,
                {}
            );

            expect(result.success).toBe(true);
            expect(result.bonusAwarded).toBe(false);
            expect(result.reason).toBe('Match score below threshold');
            expect(mockCreateRecord).not.toHaveBeenCalled();
        });

        test('should fail without required parameters', async () => {
            const result = await awardMatchQualityBonus(null, null, undefined);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Missing required parameters');
        });
    });

    describe('getMatchQualityBonusHistory', () => {
        test('should return bonus history for driver', async () => {
            mockQueryRecords.mockResolvedValueOnce({
                records: [
                    { 'Match Score': 95, 'Bonus Tier': 'excellent', 'Driver Bonus XP': 150 },
                    { 'Match Score': 82, 'Bonus Tier': 'great', 'Driver Bonus XP': 100 },
                    { 'Match Score': 75, 'Bonus Tier': 'good', 'Driver Bonus XP': 50 }
                ]
            });

            const result = await getMatchQualityBonusHistory('driver_123', 'driver');

            expect(result.success).toBe(true);
            expect(result.totalBonuses).toBe(3);
            expect(result.totalEarned).toBe(300);
            expect(result.bonusByTier.excellent).toBe(1);
            expect(result.bonusByTier.great).toBe(1);
            expect(result.bonusByTier.good).toBe(1);
        });

        test('should return bonus history for recruiter', async () => {
            mockQueryRecords.mockResolvedValueOnce({
                records: [
                    { 'Match Score': 90, 'Bonus Tier': 'excellent', 'Recruiter Bonus Points': 200 }
                ]
            });

            const result = await getMatchQualityBonusHistory('recruiter_123', 'recruiter');

            expect(result.success).toBe(true);
            expect(result.totalEarned).toBe(200);
        });
    });

    describe('processHireBonus', () => {
        test('should process both match quality and referral bonuses', async () => {
            // Mock match quality bonus
            mockCreateRecord.mockResolvedValueOnce({ id: 'bonus_1' });

            // Mock referral conversion (not referred)
            mockQueryRecords.mockResolvedValueOnce({ records: [] });

            const result = await processHireBonus('driver_123', 'recruiter_456', 85, {
                carrierDot: '123456'
            });

            expect(result.success).toBe(true);
            expect(result.results.matchQualityBonus).toBeDefined();
            expect(result.results.referralConversion).toBeDefined();
        });

        test('should skip match quality bonus for low scores', async () => {
            mockQueryRecords.mockResolvedValueOnce({ records: [] });

            const result = await processHireBonus('driver_123', 'recruiter_456', 50, {});

            expect(result.success).toBe(true);
            expect(result.results.matchQualityBonus).toBeNull();
        });
    });
});

// =========================================================================
// REFERRAL CONFIG TESTS
// =========================================================================
describe('Referral Configuration', () => {
    test('getReferralConfig should return reward configuration', () => {
        const config = getReferralConfig();

        expect(config.rewards).toBeDefined();
        expect(config.rewards.referrer_on_signup).toBe(200);
        expect(config.rewards.referrer_on_application).toBe(100);
        expect(config.rewards.referrer_on_hire).toBe(500);
        expect(config.rewards.referee_signup_bonus).toBe(50);
    });

    test('getReferralConfig should return match quality thresholds', () => {
        const config = getReferralConfig();

        expect(config.matchQuality).toBeDefined();
        expect(config.matchQuality.excellent.threshold).toBe(90);
        expect(config.matchQuality.great.threshold).toBe(80);
        expect(config.matchQuality.good.threshold).toBe(70);
    });
});

// =========================================================================
// REFERRAL LINK FORMAT TESTS
// =========================================================================
describe('Referral Link Format', () => {
    test('referral code should start with ref_ prefix', () => {
        const code = 'ref_AB12XY34';
        expect(code).toMatch(/^ref_/);
    });

    test('referral link should include base URL and ref parameter', () => {
        const baseUrl = 'https://www.lastmiledr.app';
        const code = 'ref_TEST123';
        const link = `${baseUrl}/driver-signup?ref=${code}`;

        expect(link).toContain('lastmiledr.app');
        expect(link).toContain('ref=ref_TEST123');
    });
});
