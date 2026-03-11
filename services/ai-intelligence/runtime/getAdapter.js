/**
 * Provider adapter factory.
 * Returns a singleton adapter based on RUNTIME_PROVIDER env var.
 * Default: gemini (Vertex AI). Set to 'claude' when Anthropic API is funded.
 */

import { ClaudeAdapter } from './claudeAdapter.js';
import { GeminiAdapter } from './geminiAdapter.js';

let _adapter;

export function getAdapter() {
  if (_adapter) return _adapter;

  const provider = (process.env.RUNTIME_PROVIDER || 'gemini').toLowerCase();

  switch (provider) {
    case 'claude':
    case 'anthropic':
      _adapter = new ClaudeAdapter();
      break;
    case 'gemini':
    case 'vertex':
      _adapter = new GeminiAdapter();
      break;
    default:
      console.warn(`[getAdapter] Unknown provider "${provider}", defaulting to gemini`);
      _adapter = new GeminiAdapter();
  }

  console.log(`[getAdapter] Using provider: ${provider}`);
  return _adapter;
}
