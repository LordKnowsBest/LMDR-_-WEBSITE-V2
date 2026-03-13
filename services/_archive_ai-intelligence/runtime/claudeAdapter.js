/**
 * Claude adapter — implements ProviderAdapter using @anthropic-ai/sdk.
 *
 * Executes one AI step per call. The calling layer (routes/agent.js or
 * agentRuntimeService.jsw) manages the multi-step tool-use loop.
 */

import Anthropic from '@anthropic-ai/sdk';
import { ProviderAdapter } from './providerInterface.js';

const DEFAULT_MODEL  = 'claude-sonnet-4-6';
const DEFAULT_TOKENS = 2048;

export class ClaudeAdapter extends ProviderAdapter {
  constructor() {
    super();
    this._client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async runStep({ systemPrompt, messages, tools = [], modelId, maxTokens }) {
    const start = Date.now();

    const params = {
      model:      modelId || DEFAULT_MODEL,
      max_tokens: maxTokens || DEFAULT_TOKENS,
      messages,
    };

    if (systemPrompt) params.system = systemPrompt;
    if (tools.length)  params.tools  = tools;

    const response = await this._client.messages.create(params);

    const textBlocks    = response.content.filter(b => b.type === 'text');
    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');

    const providerRunId = response.id;
    const inputTokens   = response.usage?.input_tokens  || 0;
    const outputTokens  = response.usage?.output_tokens || 0;
    const stopReason    = response.stop_reason;

    if (stopReason === 'tool_use' && toolUseBlocks.length > 0) {
      return {
        type:           'tool_use',
        toolUseBlocks,
        contentBlocks:  response.content,
        stopReason,
        inputTokens,
        outputTokens,
        providerRunId,
        latencyMs: Date.now() - start,
      };
    }

    return {
      type:         'text',
      text:         textBlocks.map(b => b.text).join(''),
      contentBlocks: response.content,
      stopReason,
      inputTokens,
      outputTokens,
      providerRunId,
      latencyMs: Date.now() - start,
    };
  }

  async streamStep({ systemPrompt, messages, tools = [], modelId, maxTokens }, onEvent) {
    const params = {
      model:      modelId || DEFAULT_MODEL,
      max_tokens: maxTokens || DEFAULT_TOKENS,
      messages,
      stream:     true,
    };
    if (systemPrompt) params.system = systemPrompt;
    if (tools.length)  params.tools  = tools;

    const stream = this._client.messages.stream(params);

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        onEvent({ type: 'token', token: event.delta.text });
      }
    }

    const finalMsg = await stream.finalMessage();
    onEvent({
      type:         'done',
      totalTokens:  (finalMsg.usage?.input_tokens || 0) + (finalMsg.usage?.output_tokens || 0),
      providerRunId: finalMsg.id,
    });
  }

  async health() {
    const start = Date.now();
    try {
      await this._client.models.list({ limit: 1 });
      return { status: 'ok', latencyMs: Date.now() - start };
    } catch (err) {
      return { status: 'error', latencyMs: Date.now() - start, detail: err.message };
    }
  }
}
