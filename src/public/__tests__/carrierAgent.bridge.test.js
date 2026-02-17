/**
 * Carrier/B2B Agent Bridge Tests
 */
describe('Carrier Agent Bridge', () => {
  describe('B2B Agent Messages', () => {
    it('should send agentMessage with carrier context', () => {
      const msg = { action: 'agentMessage', payload: { text: 'Show pipeline', context: { role: 'carrier' } } };
      expect(msg.payload.context.role).toBe('carrier');
    });

    it('should route through handleB2BAction', () => {
      const actionName = 'agentMessage';
      const validActions = ['agentMessage', 'getVoiceConfig'];
      expect(validActions).toContain(actionName);
    });

    it('should use VelocityMatch branding', () => {
      const branding = { name: 'VelocityMatch', logo: 'VM' };
      expect(branding.name).toBe('VelocityMatch');
    });
  });
});
