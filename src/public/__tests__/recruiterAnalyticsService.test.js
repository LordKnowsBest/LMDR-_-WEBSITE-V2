
import {
    recordTouchpoint,
    convertSessionToDriver,
    recordHireAttribution,
    getAttributionBreakdown,
    recordRecruitingSpend,
    bulkImportSpend,
    calculateCostPerHire,
    getChannelROI,
    getSpendTrend,
    recordStageChange,
    getFunnelMetrics,
    getBottleneckAnalysis,
    addCompetitorIntel,
    getCompetitorComparison,
    generateHiringForecast
} from 'backend/recruiterAnalyticsService';

import * as dataAccess from 'backend/dataAccess';

// Mock dataAccess
jest.mock('backend/dataAccess', () => ({
    findByField: jest.fn(),
    insertRecord: jest.fn(),
    updateRecord: jest.fn(),
    getAllRecords: jest.fn(),
    queryRecords: jest.fn(),
    getRecord: jest.fn(),
    bulkInsert: jest.fn()
}));

// Mock config to avoid issues
jest.mock('backend/configData', () => ({
    usesAirtable: jest.fn(() => false),
    getWixCollectionName: jest.fn(name => name)
}));

describe('Recruiter Analytics Service', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ============================================================================
    // SOURCE ATTRIBUTION
    // ============================================================================
    describe('Source Attribution', () => {
        
        test('recordTouchpoint should create new record if none exists', async () => {
            dataAccess.findByField.mockResolvedValue(null);
            dataAccess.insertRecord.mockResolvedValue({ record: { _id: '123' } });

            const result = await recordTouchpoint('user1', { source: 'google' }, 'home', null);

            expect(result.success).toBe(true);
            expect(dataAccess.insertRecord).toHaveBeenCalled();
            const insertCall = dataAccess.insertRecord.mock.calls[0][1];
            expect(insertCall.driver_id).toBe('user1');
            expect(insertCall.first_touch_source).toBe('google');
        });

        test('recordTouchpoint should update existing record but preserve first touch', async () => {
            dataAccess.findByField.mockResolvedValue({
                _id: '123',
                first_touch_source: 'organic', // Original source
                touchpoint_history: [{ source: 'organic', date: '2025-01-01' }]
            });
            dataAccess.updateRecord.mockResolvedValue({ record: { _id: '123' } });

            const result = await recordTouchpoint('user1', { source: 'google' }, 'home', null);

            expect(result.success).toBe(true);
            expect(dataAccess.updateRecord).toHaveBeenCalled();
            const updateCall = dataAccess.updateRecord.mock.calls[0][1];
            
            // Should update last touch
            expect(updateCall.last_touch_source).toBe('google');
            // Should NOT change first touch (it's not even in the update object usually, but let's ensure logic holds)
            expect(updateCall.first_touch_source).toBeUndefined(); 
            expect(updateCall.touchpoint_count).toBe(2);
        });

        test('convertSessionToDriver should link session to driver', async () => {
            dataAccess.findByField.mockResolvedValue({ _id: '123', session_id: 'sess1' });
            dataAccess.updateRecord.mockResolvedValue({});

            const result = await convertSessionToDriver('sess1', 'user1');

            expect(result.success).toBe(true);
            expect(dataAccess.updateRecord).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ _id: '123', driver_id: 'user1' })
            );
        });

        test('recordHireAttribution should link carrier and set hire date', async () => {
            dataAccess.findByField.mockResolvedValue({ _id: '123', driver_id: 'user1' });
            dataAccess.updateRecord.mockResolvedValue({});

            const result = await recordHireAttribution('user1', 'DOT123', 'last_touch');

            expect(result.success).toBe(true);
            expect(dataAccess.updateRecord).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ 
                    _id: '123', 
                    carrier_dot: 'DOT123',
                    hire_date: expect.any(Date),
                    attribution_model: 'last_touch'
                })
            );
        });

        test('getAttributionBreakdown should aggregate correctly', async () => {
            dataAccess.getAllRecords.mockResolvedValue([
                { first_touch_source: 'google', last_touch_source: 'google', attribution_model: 'first_touch' },
                { first_touch_source: 'google', last_touch_source: 'direct', attribution_model: 'first_touch' },
                { first_touch_source: 'facebook', last_touch_source: 'indeed', attribution_model: 'last_touch' }
            ]);

            const result = await getAttributionBreakdown('DOT123', {}, 'applications');

            expect(result.success).toBe(true);
            // 1. Google (first touch)
            // 2. Google (first touch)
            // 3. Indeed (last touch chosen)
            
            expect(result.bySource['google']).toBe(2);
            expect(result.bySource['indeed']).toBe(1);
            expect(result.total).toBe(3);
        });
    });

    // ============================================================================
    // COST PER HIRE
    // ============================================================================
    describe('Cost Per Hire', () => {
        test('recordRecruitingSpend should validate and save', async () => {
            dataAccess.insertRecord.mockResolvedValue({ record: { _id: 'spend1' } });

            const result = await recordRecruitingSpend({
                carrier_dot: 'DOT123',
                channel: 'indeed',
                spend_amount: 10000, // $100
                hires: 1
            });

            expect(result.success).toBe(true);
            expect(dataAccess.insertRecord).toHaveBeenCalled();
            const record = dataAccess.insertRecord.mock.calls[0][1];
            expect(record.cost_per_hire).toBe(100);
        });

        test('bulkImportSpend should handle multiple records', async () => {
            const records = [
                { channel: 'indeed', spend_amount: 5000 },
                { channel: 'facebook', spend_amount: 2000 }
            ];

            const result = await bulkImportSpend('DOT123', records);

            expect(result.success).toBe(true);
            expect(result.importedCount).toBe(2);
            expect(dataAccess.bulkInsert).toHaveBeenCalled();
        });

        test('calculateCostPerHire should aggregate spend correctly', async () => {
            dataAccess.getAllRecords.mockResolvedValue([
                { channel: 'indeed', spend_amount: 50000, hires: 2, applications: 10 },
                { channel: 'indeed', spend_amount: 25000, hires: 1, applications: 5 },
                { channel: 'facebook', spend_amount: 10000, hires: 0, applications: 20 }
            ]);

            const result = await calculateCostPerHire('DOT123', {});

            expect(result.success).toBe(true);
            
            const indeed = result.byChannel.indeed;
            expect(indeed.spend).toBe(75000); // 500+250
            expect(indeed.hires).toBe(3);
            expect(indeed.spendDollars).toBe(750); // 75000 / 100
            expect(indeed.cph).toBe(250); // 750 / 3

            const facebook = result.byChannel.facebook;
            expect(facebook.spend).toBe(10000);
            expect(facebook.hires).toBe(0);
            expect(facebook.cph).toBe(0);
        });

        test('getChannelROI should rank channels by ROI score', async () => {
            dataAccess.getAllRecords.mockResolvedValue([
                { channel: 'referral', spend_amount: 10000, hires: 5 }, // CPH 20 - High Score
                { channel: 'indeed', spend_amount: 100000, hires: 2 }   // CPH 500 - Low Score
            ]);

            const result = await getChannelROI('DOT123', {});

            expect(result.success).toBe(true);
            expect(result.channels[0].name).toBe('referral');
            expect(result.channels[1].name).toBe('indeed');
            expect(result.channels[0].roi_score).toBeGreaterThan(result.channels[1].roi_score);
        });

        test('getSpendTrend should aggregate by month', async () => {
            dataAccess.getAllRecords.mockResolvedValue([
                { period_start: new Date('2025-01-15'), spend_amount: 50000, hires: 2 },
                { period_start: new Date('2025-01-20'), spend_amount: 50000, hires: 3 },
                { period_start: new Date('2025-02-10'), spend_amount: 30000, hires: 1 }
            ]);

            const result = await getSpendTrend('DOT123', 2);

            expect(result.success).toBe(true);
            // Result should be sorted by month and zero-filled if needed (though we only mocked 2 months)
            // Expect Jan to have 100000 spend, 5 hires
            const jan = result.trends.find(t => t.month.includes('-01'));
            expect(jan.spend).toBe(1000);
            expect(jan.hires).toBe(5);
        });
    });

    // ============================================================================
    // FUNNEL ANALYTICS
    // ============================================================================
    describe('Funnel Analytics', () => {
        test('recordStageChange should close previous stage', async () => {
            // Mock existing open stage
            dataAccess.queryRecords.mockResolvedValue({
                items: [{
                    _id: 'prev1',
                    to_stage: 'lead',
                    entered_at: new Date(Date.now() - 3600000) // 1 hour ago
                }]
            });
            dataAccess.insertRecord.mockResolvedValue({ record: { _id: 'new1' } });

            await recordStageChange('user1', 'DOT123', 'screening');

            // Should close previous
            expect(dataAccess.updateRecord).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ _id: 'prev1', exited_at: expect.any(Date) })
            );

            // Should open new
            expect(dataAccess.insertRecord).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ 
                    from_stage: 'lead',
                    to_stage: 'screening',
                    exited_at: null
                })
            );
        });

        test('getFunnelMetrics should calculate conversion rates', async () => {
            dataAccess.getAllRecords.mockResolvedValue([
                { to_stage: 'lead' },
                { to_stage: 'lead' },
                { to_stage: 'lead' },
                { to_stage: 'screening' },
                { to_stage: 'screening' },
                { to_stage: 'hired' }
            ]);

            const result = await getFunnelMetrics('DOT123', {});

            expect(result.success).toBe(true);
            const stages = result.stages;
            
            // lead: 3, screening: 2, hired: 1
            const lead = stages.find(s => s.stage === 'lead');
            const screening = stages.find(s => s.stage === 'screening');
            
            expect(lead.count).toBe(3);
            expect(screening.count).toBe(2);

            // Check conversions
            const leadToScreening = result.conversions.find(c => c.from === 'lead');
            // 2/3 = 66.7%
            expect(leadToScreening.rate).toBeCloseTo(66.7, 1);
        });

        test('recordStageChange should calculate time_in_stage correctly', async () => {
            const enteredAt = new Date(Date.now() - 7200000); // 2 hours ago
            dataAccess.queryRecords.mockResolvedValue({
                items: [{
                    _id: 'prev1',
                    to_stage: 'lead',
                    entered_at: enteredAt
                }]
            });
            dataAccess.insertRecord.mockResolvedValue({ record: { _id: 'new1' } });

            await recordStageChange('user1', 'DOT123', 'screening');

            expect(dataAccess.updateRecord).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ 
                    _id: 'prev1', 
                    time_in_stage_hours: 2.00 
                })
            );
        });

        test('recordStageChange should link source attribution', async () => {
            dataAccess.queryRecords.mockResolvedValue({ items: [] }); // No previous stage
            dataAccess.findByField.mockResolvedValue({ _id: 'attr123' }); // Found attribution
            dataAccess.insertRecord.mockResolvedValue({ record: { _id: 'new1' } });

            await recordStageChange('user1', 'DOT123', 'lead');

            expect(dataAccess.insertRecord).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ 
                    source_attribution_id: 'attr123' 
                })
            );
        });

        test('getBottleneckAnalysis should identify high drop-off stages', async () => {
            // Mock getFunnelMetrics response logic internally or mock the function if possible
            // Since we can't easily mock the internal call in this integration style test, 
            // we mock the dataAccess to return data that produces a bottleneck.
            
            // 10 leads -> 1 screening (90% drop off)
            const events = [];
            for(let i=0; i<10; i++) events.push({ to_stage: 'lead' });
            events.push({ to_stage: 'screening' });

            dataAccess.getAllRecords.mockResolvedValue(events);

            const { getBottleneckAnalysis } = require('backend/recruiterAnalyticsService');
            const result = await getBottleneckAnalysis('DOT123', {});

            expect(result.success).toBe(true);
            const bottleneck = result.bottlenecks.find(b => b.stage === 'lead');
            expect(bottleneck).toBeDefined();
            expect(bottleneck.dropRate).toBe('90.0%');
        });
    });

    // ============================================================================
    // COMPETITOR INTEL
    // ============================================================================
    describe('Competitor Intel', () => {
        test('getCompetitorComparison should format data', async () => {
            dataAccess.getAllRecords.mockResolvedValue([
                { 
                    _id: '1', 
                    competitor_name: 'Test Carrier', 
                    cpm_min: 50, 
                    cpm_max: 60,
                    sign_on_bonus: 5000
                }
            ]);

            const result = await getCompetitorComparison('South', 'OTR');
            
            expect(result.success).toBe(true);
            expect(result.competitors[0].name).toBe('Test Carrier');
            expect(result.competitors[0].cpmRange).toBe('$50-60');
            expect(result.competitors[0].signOn).toBe('$5,000');
        });
    });

    // ============================================================================
    // PREDICTIVE HIRING
    // ============================================================================
    describe('Predictive Hiring', () => {
        test('generateHiringForecast should create forecast record', async () => {
            // Mock empty/basic responses for helpers
            dataAccess.getAllRecords.mockResolvedValue([]); // for turnover calc
            dataAccess.insertRecord.mockResolvedValue({ record: {} });

            const result = await generateHiringForecast('DOT123', 6);

            expect(result.success).toBe(true);
            expect(dataAccess.insertRecord).toHaveBeenCalled();
            const call = dataAccess.insertRecord.mock.calls[0][1];
            expect(call.predicted_hires_needed).toBeGreaterThan(0);
            expect(call.confidence_level).toBeGreaterThan(0);
        });
    });

});
