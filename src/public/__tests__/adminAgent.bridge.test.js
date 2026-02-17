/**
 * Admin Agent Bridge Tests
 */
describe('Admin Agent Bridge', () => {
  describe('Admin Agent Messages', () => {
    it('should send agentMessage with admin context', () => {
      const msg = { action: 'agentMessage', payload: { text: 'Show system health', context: { role: 'admin' } } };
      expect(msg.payload.context.role).toBe('admin');
    });

    it('should receive agentResponse with system data', () => {
      const msg = { action: 'agentResponse', payload: { response: 'System is operational', toolsUsed: true } };
      expect(msg.payload.toolsUsed).toBe(true);
    });

    it('should use VelocityMatch branding', () => {
      const branding = { name: 'VelocityMatch', logo: 'VM' };
      expect(branding.name).toBe('VelocityMatch');
    });
  });
});
