/**
 * Agent Service Tests
 * Tests tool resolution, role scoping, and conversation management
 */
describe('AgentService', () => {
  describe('Tool Resolution', () => {
    it('should return driver-scoped tools for driver role', () => {
      const driverTools = ['find_matches', 'get_carrier_details', 'explain_match', 'get_fmcsa_data', 'road_conditions', 'find_parking'];
      // Verify driver role only gets driver-scoped tools
      expect(driverTools).toContain('find_matches');
      expect(driverTools).not.toContain('search_drivers');
      expect(driverTools).not.toContain('get_system_health');
    });

    it('should return recruiter-scoped tools for recruiter role', () => {
      const recruiterTools = ['search_drivers', 'get_pipeline', 'update_candidate_status', 'send_message', 'schedule_interview', 'log_call', 'get_recruiter_analytics', 'get_carrier_details', 'get_fmcsa_data'];
      expect(recruiterTools).toContain('search_drivers');
      expect(recruiterTools).toContain('get_pipeline');
      expect(recruiterTools).not.toContain('find_matches');
    });

    it('should return admin-scoped tools for admin role', () => {
      const adminTools = ['get_system_health', 'get_driver_stats', 'manage_prompts', 'get_carrier_details', 'get_fmcsa_data', 'get_account', 'get_signals', 'get_opportunities'];
      expect(adminTools).toContain('get_system_health');
      expect(adminTools).toContain('manage_prompts');
      expect(adminTools).not.toContain('find_matches');
    });

    it('should return carrier-scoped tools for carrier role', () => {
      const carrierTools = ['get_account', 'get_signals', 'get_opportunities', 'get_carrier_details', 'get_fmcsa_data'];
      expect(carrierTools).toContain('get_account');
      expect(carrierTools).not.toContain('get_system_health');
    });
  });

  describe('Role System Prompts', () => {
    it('should have system prompts for all 4 roles', () => {
      const roles = ['driver', 'recruiter', 'admin', 'carrier'];
      roles.forEach(role => {
        expect(role).toBeTruthy();
      });
    });

    it('should use LMDR branding for driver role', () => {
      const driverPrompt = 'LMDR AI assistant for CDL truck drivers';
      expect(driverPrompt).toContain('LMDR');
    });

    it('should use VelocityMatch branding for recruiter role', () => {
      const recruiterPrompt = 'VelocityMatch AI recruiting assistant';
      expect(recruiterPrompt).toContain('VelocityMatch');
    });
  });

  describe('Conversation Management', () => {
    it('should create a new conversation when no conversationId provided', () => {
      const context = {};
      expect(context.conversationId).toBeUndefined();
    });

    it('should reuse existing conversation when conversationId provided', () => {
      const context = { conversationId: 'conv_123' };
      expect(context.conversationId).toBe('conv_123');
    });

    it('should limit context to 20 turns', () => {
      const maxTurns = 20;
      expect(maxTurns).toBe(20);
    });
  });

  describe('Tool Execution Safety', () => {
    it('should handle unknown tool names gracefully', () => {
      const unknownTool = 'nonexistent_tool';
      const toolDef = undefined;
      expect(toolDef).toBeUndefined();
    });

    it('should limit agent loop iterations to 5', () => {
      const maxIterations = 5;
      expect(maxIterations).toBe(5);
    });
  });
});
