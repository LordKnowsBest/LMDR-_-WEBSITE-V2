/**
 * Provider adapter interface.
 *
 * All AI provider adapters must extend this class and implement:
 *   runStep(request)   — execute one AI step (may return tool_use or text)
 *   health()           — return { status: 'ok'|'error', latencyMs }
 *
 * Wix-side code depends only on this interface, never on provider SDKs directly.
 */

export class ProviderAdapter {
  /**
   * Execute one AI step.
   *
   * @param {object} request
   * @param {string} request.systemPrompt
   * @param {Array}  request.messages        - Anthropic messages format
   * @param {Array}  request.tools           - Anthropic tool definitions
   * @param {string} [request.modelId]
   * @param {number} [request.maxTokens]
   * @returns {Promise<StepResult>}
   */
  async runStep(request) {
    throw new Error('ProviderAdapter.runStep() must be implemented');
  }

  /**
   * Stream one AI step, calling onEvent for each chunk.
   * @param {object}   request  - same shape as runStep
   * @param {Function} onEvent  - called with { type, token?, toolUse?, done }
   */
  async streamStep(request, onEvent) {
    throw new Error('ProviderAdapter.streamStep() must be implemented');
  }

  /**
   * Health check.
   * @returns {Promise<{ status: 'ok'|'error', latencyMs: number, detail?: string }>}
   */
  async health() {
    throw new Error('ProviderAdapter.health() must be implemented');
  }
}

/**
 * @typedef {object} StepResult
 * @property {'text'|'tool_use'} type
 * @property {string}  [text]          - present when type === 'text'
 * @property {Array}   [toolUseBlocks] - present when type === 'tool_use'; Anthropic tool_use content blocks
 * @property {string}  [stopReason]
 * @property {number}  inputTokens
 * @property {number}  outputTokens
 * @property {string}  providerRunId   - provider-specific trace ID
 */
