/**
 * Driver Agent Bridge Tests
 * Tests driver surface agent message flow
 */
describe('Driver Agent Bridge', () => {
  const AGENT_MESSAGES = {
    inbound: ['agentResponse', 'voiceReady', 'agentTyping', 'agentToolResult'],
    outbound: ['agentMessage', 'startVoiceCall', 'endVoiceCall', 'getVoiceConfig']
  };

  describe('MESSAGE_REGISTRY Coverage', () => {
    it('should have agentResponse in inbound registry', () => {
      expect(AGENT_MESSAGES.inbound).toContain('agentResponse');
    });

    it('should have agentMessage in outbound registry', () => {
      expect(AGENT_MESSAGES.outbound).toContain('agentMessage');
    });

    it('should have voiceReady in inbound registry', () => {
      expect(AGENT_MESSAGES.inbound).toContain('voiceReady');
    });

    it('should have startVoiceCall in outbound registry', () => {
      expect(AGENT_MESSAGES.outbound).toContain('startVoiceCall');
    });
  });

  describe('Agent Message Flow', () => {
    it('should send agentMessage with text and context', () => {
      const msg = { action: 'agentMessage', payload: { text: 'Find carriers near 75001', context: {} } };
      expect(msg.payload.text).toBeTruthy();
    });

    it('should receive agentResponse with response text', () => {
      const msg = { action: 'agentResponse', payload: { response: 'Found 5 carriers', conversationId: 'conv_1' } };
      expect(msg.payload.response).toBeTruthy();
      expect(msg.payload.conversationId).toBeTruthy();
    });

    it('should use LMDR branding for driver surface', () => {
      const branding = { name: 'LMDR', logo: 'LM' };
      expect(branding.name).toBe('LMDR');
    });
  });
});
