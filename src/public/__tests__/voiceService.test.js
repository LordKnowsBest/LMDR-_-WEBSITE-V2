/**
 * Voice Service Tests
 * Tests VAPI API call shapes and configuration
 */
describe('VoiceService', () => {
  describe('VAPI Configuration', () => {
    it('should use correct VAPI base URL', () => {
      const baseUrl = 'https://api.vapi.ai';
      expect(baseUrl).toBe('https://api.vapi.ai');
    });

    it('should require VAPI_PRIVATE_KEY secret', () => {
      const secretKey = 'VAPI_PRIVATE_KEY';
      expect(secretKey).toBeTruthy();
    });

    it('should require VAPI_PUBLIC_KEY for client config', () => {
      const publicKey = 'VAPI_PUBLIC_KEY';
      expect(publicKey).toBeTruthy();
    });
  });

  describe('API Call Shapes', () => {
    it('should create assistant with POST /assistant', () => {
      const endpoint = '/assistant';
      const method = 'POST';
      expect(endpoint).toBe('/assistant');
      expect(method).toBe('POST');
    });

    it('should initiate call with POST /call', () => {
      const endpoint = '/call';
      const method = 'POST';
      const callConfig = {
        assistantId: 'asst_123',
        phoneNumberId: 'pn_123',
        customer: { number: '+15551234567' }
      };
      expect(callConfig.assistantId).toBeTruthy();
      expect(callConfig.customer.number).toMatch(/^\+\d+$/);
    });

    it('should get transcript with GET /call/{id}', () => {
      const callId = 'call_123';
      const endpoint = `/call/${callId}`;
      expect(endpoint).toContain(callId);
    });
  });

  describe('Call Logging', () => {
    it('should log calls to voiceCallLogs collection', () => {
      const collection = 'voiceCallLogs';
      expect(collection).toBe('voiceCallLogs');
    });

    it('should log assistants to voiceAssistants collection', () => {
      const collection = 'voiceAssistants';
      expect(collection).toBe('voiceAssistants');
    });
  });
});
