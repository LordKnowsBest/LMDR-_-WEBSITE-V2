/**
 * Agent Service End-to-End Tests
 * Verifies orchestration loop behavior with mocked backend dependencies.
 */

jest.mock('backend/aiRouterService', () => ({
  routeAIRequest: jest.fn()
}));

jest.mock('backend/agentConversationService', () => ({
  createConversation: jest.fn(),
  addTurn: jest.fn(),
  getRecentContext: jest.fn()
}));

jest.mock('backend/carrierMatching', () => ({
  findMatchingCarriers: jest.fn()
}));

jest.mock('backend/dataAccess', () => ({}));

const { routeAIRequest } = require('backend/aiRouterService');
const {
  createConversation,
  addTurn,
  getRecentContext
} = require('backend/agentConversationService');
const { findMatchingCarriers } = require('backend/carrierMatching');

const { handleAgentTurn, getAvailableTools } = require('backend/agentService');

describe('AgentService E2E', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createConversation.mockResolvedValue({ conversationId: 'conv-e2e-1' });
    getRecentContext.mockResolvedValue([]);
  });

  it('completes a recruiter turn end-to-end without tool calls', async () => {
    routeAIRequest.mockResolvedValue({
      stopReason: 'end_turn',
      content: 'Recruiter summary ready.',
      contentBlocks: [{ type: 'text', text: 'Recruiter summary ready.' }]
    });

    const result = await handleAgentTurn('recruiter', 'recruiter-123', 'Show pipeline status', {});

    expect(createConversation).toHaveBeenCalledWith('recruiter', 'recruiter-123');
    expect(routeAIRequest).toHaveBeenCalledTimes(1);
    expect(addTurn).toHaveBeenCalledWith('conv-e2e-1', 'user', 'Show pipeline status');
    expect(addTurn).toHaveBeenCalledWith('conv-e2e-1', 'assistant', 'Recruiter summary ready.');
    expect(result).toEqual({
      conversationId: 'conv-e2e-1',
      response: 'Recruiter summary ready.',
      toolsUsed: false,
      role: 'recruiter'
    });
  });

  it('completes a driver turn with a tool-use loop and tool execution', async () => {
    findMatchingCarriers.mockResolvedValue({ success: true, carriers: [{ dot: '1234567' }] });

    routeAIRequest
      .mockResolvedValueOnce({
        stopReason: 'tool_use',
        contentBlocks: [{
          type: 'tool_use',
          id: 'tool_1',
          name: 'find_matches',
          input: {
            zip: '75001',
            maxDistance: 150,
            minCPM: 65,
            operationType: 'Regional'
          }
        }]
      })
      .mockResolvedValueOnce({
        stopReason: 'end_turn',
        content: 'I found 1 match near 75001.',
        contentBlocks: [{ type: 'text', text: 'I found 1 match near 75001.' }]
      });

    const result = await handleAgentTurn('driver', 'driver-42', 'Find me carriers near 75001', {});

    expect(findMatchingCarriers).toHaveBeenCalledWith('75001', 150, 65, 'Regional');
    expect(routeAIRequest).toHaveBeenCalledTimes(2);
    expect(addTurn).toHaveBeenCalledWith(
      'conv-e2e-1',
      'assistant',
      expect.stringContaining('find_matches'),
      expect.any(Array)
    );
    expect(result).toEqual({
      conversationId: 'conv-e2e-1',
      response: 'I found 1 match near 75001.',
      toolsUsed: true,
      role: 'driver'
    });
  });

  it('returns role-scoped tools through getAvailableTools', async () => {
    const carrierTools = await getAvailableTools('carrier');
    const toolNames = carrierTools.map((tool) => tool.name);

    expect(toolNames).toEqual(expect.arrayContaining([
      'get_account',
      'get_signals',
      'get_opportunities'
    ]));
    expect(toolNames).not.toContain('find_matches');
  });

  it('throws for unknown role', async () => {
    await expect(handleAgentTurn('unknown-role', 'user-1', 'hello', {}))
      .rejects
      .toThrow('Unknown role: unknown-role');
  });
});
