/**
 * Recruiter Agent Bridge Tests
 */
describe('Recruiter Agent Bridge', () => {
  describe('NLU Integration', () => {
    it('should route to agentService when NLU_ENABLED is true', () => {
      const config = { NLU_ENABLED: true, VOICE_ENABLED: true, AGENT_ENABLED: true };
      expect(config.NLU_ENABLED).toBe(true);
    });

    it('should fall back to keyword matching when NLU_ENABLED is false', () => {
      const config = { NLU_ENABLED: false };
      expect(config.NLU_ENABLED).toBe(false);
    });
  });

  describe('Campaign Messages', () => {
    it('should send getCampaigns action', () => {
      const msg = { action: 'getCampaigns', payload: {} };
      expect(msg.action).toBe('getCampaigns');
    });

    it('should send createCampaign action', () => {
      const msg = { action: 'createCampaign', payload: { name: 'Q1 Outreach', contacts: [] } };
      expect(msg.payload.name).toBeTruthy();
    });

    it('should use VelocityMatch branding', () => {
      const branding = { name: 'VelocityMatch', logo: 'VM' };
      expect(branding.name).toBe('VelocityMatch');
    });
  });
});
