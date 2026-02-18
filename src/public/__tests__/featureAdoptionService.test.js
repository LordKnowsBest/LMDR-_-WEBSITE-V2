import { logFeatureInteraction, logFeatureError, registerFeature, updateFeatureStatus, getFeatureStats } from '../../backend/featureAdoptionService';
import * as dataAccess from '../../backend/dataAccess';

// Mock dataAccess
jest.mock('../../backend/dataAccess', () => ({
    insertRecord: jest.fn(),
    queryRecords: jest.fn(),
    updateRecord: jest.fn()
}));

// Mock wix-members-backend
jest.mock('wix-members-backend', () => ({
    currentMember: {
        getMember: jest.fn().mockResolvedValue({ _id: 'test-member-id', contactDetails: { customFields: { role: 'admin' } } })
    }
}));

describe('Feature Adoption Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default mock responses
        dataAccess.insertRecord.mockResolvedValue({ success: true, record: { _id: 'rec123', feature_id: 'test_feature' } });
        dataAccess.queryRecords.mockResolvedValue({ items: [], totalCount: 0 });
        dataAccess.updateRecord.mockResolvedValue({ success: true });
    });

    describe('logFeatureInteraction', () => {
        it('should log a valid interaction', async () => {
            const result = await logFeatureInteraction('test_feature', 'user123', 'view', { deviceType: 'mobile' });
            expect(result.success).toBe(true);
            expect(dataAccess.insertRecord).toHaveBeenCalledWith(
                'featureAdoptionLogs',
                expect.objectContaining({
                    feature_id: 'test_feature',
                    user_id: 'user123',
                    action: 'view',
                    device_type: 'mobile'
                }),
                expect.any(Object)
            );
        });

        it('should fail with invalid action', async () => {
            const result = await logFeatureInteraction('test_feature', 'user123', 'invalid_action');
            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('FAL_002');
            expect(dataAccess.insertRecord).not.toHaveBeenCalled();
        });

        it('should fail with missing fields', async () => {
            const result = await logFeatureInteraction(null, 'user123', 'view');
            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('FAL_003');
        });
    });

    describe('registerFeature', () => {
        it('should register a new feature', async () => {
            const featureData = {
                featureId: 'new_feature',
                displayName: 'New Feature',
                category: 'core',
                status: 'beta'
            };
            const result = await registerFeature(featureData);
            expect(result.success).toBe(true);
            expect(dataAccess.insertRecord).toHaveBeenCalledWith(
                'featureRegistry',
                expect.objectContaining({
                    feature_id: 'new_feature',
                    display_name: 'New Feature'
                }),
                expect.any(Object)
            );
        });

        it('should fail if feature already exists', async () => {
            dataAccess.queryRecords.mockResolvedValueOnce({ items: [{ feature_id: 'existing_feature' }] });
            const result = await registerFeature({ featureId: 'existing_feature', displayName: 'Existing', category: 'core' });
            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('FAL_009');
        });
    });

    describe('updateFeatureStatus', () => {
        it('should update status successfully', async () => {
            dataAccess.queryRecords.mockResolvedValueOnce({ items: [{ _id: 'rec123', feature_id: 'test_feature', status: 'beta' }] });
            const result = await updateFeatureStatus('test_feature', 'active', 'Launch day');
            expect(result.success).toBe(true);
            expect(dataAccess.updateRecord).toHaveBeenCalledWith(
                'featureRegistry',
                'rec123',
                expect.objectContaining({ status: 'active', status_change_reason: 'Launch day' }),
                expect.any(Object)
            );
        });

        it('should fail if feature not found', async () => {
            dataAccess.queryRecords.mockResolvedValueOnce({ items: [] });
            const result = await updateFeatureStatus('unknown_feature', 'active');
            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('FAL_001');
        });
    });
});
