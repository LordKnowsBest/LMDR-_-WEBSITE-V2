/**
 * Gemini adapter stub.
 * Not implemented in Phase 1. Placeholder for future provider expansion.
 */

import { ProviderAdapter } from './providerInterface.js';

export class GeminiAdapter extends ProviderAdapter {
  async runStep() {
    throw new Error('GeminiAdapter is not implemented. Use claudeAdapter.');
  }
  async streamStep() {
    throw new Error('GeminiAdapter is not implemented. Use claudeAdapter.');
  }
  async health() {
    return { status: 'error', latencyMs: 0, detail: 'GeminiAdapter not implemented' };
  }
}
