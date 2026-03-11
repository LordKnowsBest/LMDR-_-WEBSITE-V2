/**
 * Gemini adapter — implements ProviderAdapter using @google-cloud/vertexai.
 *
 * Executes one AI step per call. The calling layer (routes/agent.js or
 * agentRuntimeService.jsw) manages the multi-step tool-use loop.
 *
 * Messages arrive in Anthropic format and are converted to Gemini format
 * internally. Return values match the StepResult interface from
 * providerInterface.js (Anthropic tool_use blocks with toolu_ IDs).
 */

import { VertexAI } from '@google-cloud/vertexai';
import crypto from 'node:crypto';
import { ProviderAdapter } from './providerInterface.js';

const DEFAULT_MODEL  = 'gemini-2.0-flash';
const DEFAULT_TOKENS = 2048;

const PROJECT_ID = process.env.GCP_PROJECT_ID || 'ldmr-velocitymatch';
const LOCATION   = process.env.GCP_LOCATION   || 'us-central1';

/* ------------------------------------------------------------------ */
/*  Format converters: Anthropic <-> Gemini                           */
/* ------------------------------------------------------------------ */

/**
 * Convert an Anthropic messages array to Gemini contents array.
 *
 * Anthropic format:
 *   { role: 'user'|'assistant', content: string | ContentBlock[] }
 *
 * Gemini format:
 *   { role: 'user'|'model', parts: Part[] }
 */
function toGeminiContents(messages) {
  return messages.map(msg => {
    const role = msg.role === 'assistant' ? 'model' : 'user';

    // Simple string content
    if (typeof msg.content === 'string') {
      return { role, parts: [{ text: msg.content }] };
    }

    // Array of content blocks
    const parts = msg.content.map(block => {
      if (block.type === 'text') {
        return { text: block.text };
      }
      if (block.type === 'tool_use') {
        return {
          functionCall: {
            name: block.name,
            args: block.input,
          },
        };
      }
      if (block.type === 'tool_result') {
        const resultContent = typeof block.content === 'string'
          ? block.content
          : Array.isArray(block.content)
            ? block.content.map(b => b.text || '').join('')
            : JSON.stringify(block.content);
        return {
          functionResponse: {
            name: block.tool_use_id,
            response: { result: resultContent },
          },
        };
      }
      // Fallback: treat as text
      return { text: JSON.stringify(block) };
    });

    return { role, parts };
  });
}

/**
 * Convert Anthropic tool definitions to Gemini functionDeclarations.
 *
 * Anthropic format:
 *   { name, description, input_schema: { type, properties, required } }
 *
 * Gemini format:
 *   { name, description, parameters: { type, properties, required } }
 */
function toGeminiFunctionDeclarations(tools) {
  if (!tools || tools.length === 0) return undefined;
  return [{
    functionDeclarations: tools.map(tool => ({
      name:        tool.name,
      description: tool.description || '',
      parameters:  tool.input_schema || { type: 'object', properties: {} },
    })),
  }];
}

/**
 * Generate a unique tool use ID matching the toolu_ prefix convention.
 */
function generateToolUseId() {
  return `toolu_${crypto.randomBytes(12).toString('hex')}`;
}

/* ------------------------------------------------------------------ */
/*  Adapter                                                           */
/* ------------------------------------------------------------------ */

export class GeminiAdapter extends ProviderAdapter {
  constructor() {
    super();
    this._vertexai = new VertexAI({ project: PROJECT_ID, location: LOCATION });
  }

  async runStep({ systemPrompt, messages, tools = [], modelId, maxTokens }) {
    const start = Date.now();

    const modelParams = {
      model: modelId || DEFAULT_MODEL,
      generationConfig: {
        maxOutputTokens: maxTokens || DEFAULT_TOKENS,
      },
    };

    if (systemPrompt) {
      modelParams.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const geminiTools = toGeminiFunctionDeclarations(tools);
    if (geminiTools) {
      modelParams.tools = geminiTools;
    }

    const generativeModel = this._vertexai.getGenerativeModel(modelParams);

    const contents = toGeminiContents(messages);
    const response = await generativeModel.generateContent({ contents });

    const result   = response.response;
    const candidate = result.candidates?.[0];
    const parts     = candidate?.content?.parts || [];

    const inputTokens  = result.usageMetadata?.promptTokenCount     || 0;
    const outputTokens = result.usageMetadata?.candidatesTokenCount || 0;
    const providerRunId = `gemini-${crypto.randomUUID()}`;
    const stopReason    = candidate?.finishReason || 'STOP';

    // Check for function call parts
    const functionCallParts = parts.filter(p => p.functionCall);
    const textParts         = parts.filter(p => p.text != null);

    if (functionCallParts.length > 0) {
      // Convert Gemini functionCall parts back to Anthropic tool_use blocks
      const toolUseBlocks = functionCallParts.map(p => ({
        type:  'tool_use',
        id:    generateToolUseId(),
        name:  p.functionCall.name,
        input: p.functionCall.args || {},
      }));

      // Build full contentBlocks (text + tool_use) matching ClaudeAdapter shape
      const contentBlocks = [
        ...textParts.map(p => ({ type: 'text', text: p.text })),
        ...toolUseBlocks,
      ];

      return {
        type:          'tool_use',
        toolUseBlocks,
        contentBlocks,
        stopReason,
        inputTokens,
        outputTokens,
        providerRunId,
        latencyMs: Date.now() - start,
      };
    }

    return {
      type:          'text',
      text:          textParts.map(p => p.text).join(''),
      contentBlocks: textParts.map(p => ({ type: 'text', text: p.text })),
      stopReason,
      inputTokens,
      outputTokens,
      providerRunId,
      latencyMs: Date.now() - start,
    };
  }

  async streamStep({ systemPrompt, messages, tools = [], modelId, maxTokens }, onEvent) {
    const modelParams = {
      model: modelId || DEFAULT_MODEL,
      generationConfig: {
        maxOutputTokens: maxTokens || DEFAULT_TOKENS,
      },
    };

    if (systemPrompt) {
      modelParams.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const geminiTools = toGeminiFunctionDeclarations(tools);
    if (geminiTools) {
      modelParams.tools = geminiTools;
    }

    const generativeModel = this._vertexai.getGenerativeModel(modelParams);
    const contents = toGeminiContents(messages);

    const streamResult = await generativeModel.generateContentStream({ contents });

    let totalTokens = 0;

    for await (const chunk of streamResult.stream) {
      const parts = chunk.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.text) {
          onEvent({ type: 'token', token: part.text });
        }
      }
      // Accumulate token counts from each chunk
      if (chunk.usageMetadata) {
        totalTokens = (chunk.usageMetadata.promptTokenCount || 0)
                    + (chunk.usageMetadata.candidatesTokenCount || 0);
      }
    }

    const providerRunId = `gemini-${crypto.randomUUID()}`;

    onEvent({
      type: 'done',
      totalTokens,
      providerRunId,
    });
  }

  async health() {
    const start = Date.now();
    try {
      const model = this._vertexai.getGenerativeModel({ model: DEFAULT_MODEL });
      await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
      });
      return { status: 'ok', latencyMs: Date.now() - start };
    } catch (err) {
      return { status: 'error', latencyMs: Date.now() - start, detail: err.message };
    }
  }
}
