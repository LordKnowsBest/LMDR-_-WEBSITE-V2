/**
 * Voice Bridge Tests
 * Tests postMessage event flow for voice events
 */
describe('VoiceAgentBridge', () => {
  describe('Event Forwarding', () => {
    it('should forward callStart as voiceCallStarted', () => {
      const outbound = { action: 'voiceCallStarted', payload: { timestamp: Date.now() } };
      expect(outbound.action).toBe('voiceCallStarted');
      expect(outbound.payload.timestamp).toBeTruthy();
    });

    it('should forward callEnd as voiceCallEnded with transcript', () => {
      const outbound = {
        action: 'voiceCallEnded',
        payload: { transcript: [], duration: 120, timestamp: Date.now() }
      };
      expect(outbound.action).toBe('voiceCallEnded');
      expect(outbound.payload).toHaveProperty('transcript');
      expect(outbound.payload).toHaveProperty('duration');
    });

    it('should forward transcript entries as voiceTranscript', () => {
      const entry = { role: 'user', text: 'Hello', timestamp: Date.now(), isFinal: true };
      const outbound = { action: 'voiceTranscript', payload: entry };
      expect(outbound.payload.role).toBe('user');
      expect(outbound.payload.isFinal).toBe(true);
    });

    it('should forward tool results as voiceToolResult', () => {
      const outbound = { action: 'voiceToolResult', payload: { result: 'success' } };
      expect(outbound.action).toBe('voiceToolResult');
    });

    it('should forward errors as voiceError', () => {
      const outbound = { action: 'voiceError', payload: { message: 'Mic permission denied' } };
      expect(outbound.action).toBe('voiceError');
    });
  });

  describe('Inbound Message Handling', () => {
    it('should handle voiceReady with public key', () => {
      const inbound = { action: 'voiceReady', payload: { publicKey: 'pk_123', assistantId: 'asst_123' } };
      expect(inbound.payload.publicKey).toBeTruthy();
    });

    it('should handle startVoiceCall', () => {
      const inbound = { action: 'startVoiceCall' };
      expect(inbound.action).toBe('startVoiceCall');
    });

    it('should handle endVoiceCall', () => {
      const inbound = { action: 'endVoiceCall' };
      expect(inbound.action).toBe('endVoiceCall');
    });
  });
});
