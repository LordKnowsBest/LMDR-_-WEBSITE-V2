
import { selectOptimalProvider } from 'backend/aiRouterService';
import * as dataAccess from 'backend/dataAccess';

// Mock dataAccess
jest.mock('backend/dataAccess', () => ({
    queryRecords: jest.fn(),
    insertRecord: jest.fn(),
    updateRecord: jest.fn(),
    getRecord: jest.fn()
}));

// Mock wix-members-backend
jest.mock('wix-members-backend', () => ({
    currentMember: {
        getMember: jest.fn().mockResolvedValue({ 
            _id: 'admin-1', 
            loginEmail: 'admin@test.com',
            contactDetails: {
                customFields: {
                    role: 'admin'
                }
            }
        })
    }
}));

// Mock observabilityService
jest.mock('backend/observabilityService', () => ({
    log: jest.fn().mockResolvedValue({}),
    logAIOperation: jest.fn().mockResolvedValue({}),
    startTrace: jest.fn().mockResolvedValue({ traceId: 'test-trace' }),
    endTrace: jest.fn().mockResolvedValue({})
}));

describe('Cost Optimizer Logic', () => {

    const mockMetrics = [
        { providerId: 'openai', modelId: 'gpt-4o', costInput: 0.005, costOutput: 0.015, qualityScore: 0.95, isActive: true },
        { providerId: 'anthropic', modelId: 'claude-3-5-sonnet', costInput: 0.003, costOutput: 0.015, qualityScore: 0.98, isActive: true },
        { providerId: 'google', modelId: 'gemini-1.5-flash', costInput: 0.00001, costOutput: 0.00003, qualityScore: 0.85, isActive: true },
        { providerId: 'groq', modelId: 'llama-3.3-70b-versatile', costInput: 0.0007, costOutput: 0.0009, qualityScore: 0.88, isActive: true }
    ];

    const mockConfig = {
        enabled: true,
        qualityThreshold: 0.8,
        excludedProviders: [],
        preferredProviders: [],
        maxCostPerRequest: 1.0
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock implementation for getProviderCostMetrics inside aiRouterService
        // Since we can't easily mock internal calls in the same module if they aren't exported,
        // we rely on mocking the dataAccess calls that getProviderCostMetrics makes.
        dataAccess.queryRecords.mockImplementation((collection) => {
            if (collection === 'aiProviderCosts') {
                return Promise.resolve({ success: true, items: mockMetrics });
            }
            if (collection === 'costOptimizerConfig') {
                return Promise.resolve({ success: true, items: [mockConfig] });
            }
            return Promise.resolve({ success: true, items: [] });
        });
    });

    test('should select cheapest provider meeting quality threshold', async () => {
        const result = await selectOptimalProvider('carrier_synthesis', {}, mockConfig);
        
        // Gemini Flash is cheapest (0.00004) and has 0.85 quality (> 0.8)
        expect(result).not.toBeNull();
        expect(result.provider).toBe('google');
        expect(result.model).toBe('gemini-1.5-flash');
    });

    test('should respect quality threshold', async () => {
        const highQualityConfig = { ...mockConfig, qualityThreshold: 0.9 };
        const result = await selectOptimalProvider('carrier_synthesis', {}, highQualityConfig);
        
        // Gemini (0.85) and Groq (0.88) are below 0.9
        // Anthropic (0.98) is 0.018
        // OpenAI (0.95) is 0.02
        expect(result.provider).toBe('anthropic');
        expect(result.model).toBe('claude-3-5-sonnet');
    });

    test('should exclude providers in excludedProviders', async () => {
        const excludedConfig = { ...mockConfig, excludedProviders: ['google'] };
        const result = await selectOptimalProvider('carrier_synthesis', {}, excludedConfig);
        
        // Google is excluded. Next cheapest is Groq (0.0016)
        expect(result.provider).toBe('groq');
        expect(result.model).toBe('llama-3.3-70b-versatile');
    });

    test('should return null if no provider meets requirements', async () => {
        const extremeConfig = { ...mockConfig, qualityThreshold: 0.99 };
        const result = await selectOptimalProvider('carrier_synthesis', {}, extremeConfig);
        
        expect(result).toBeNull();
    });

});
