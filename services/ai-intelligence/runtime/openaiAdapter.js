/**
 * OpenAI adapter stub.
 * Not implemented in Phase 1. Placeholder for future provider expansion.
 * Extend ProviderAdapter and implement runStep/streamStep/health when needed.
 */

import { ProviderAdapter } from './providerInterface.js';

export class OpenAIAdapter extends ProviderAdapter {
  async runStep() {
    throw new Error('OpenAIAdapter is not implemented. Use claudeAdapter.');
  }
  async streamStep() {
    throw new Error('OpenAIAdapter is not implemented. Use claudeAdapter.');
  }
  async health() {
    return { status: 'error', latencyMs: 0, detail: 'OpenAIAdapter not implemented' };
  }
}
