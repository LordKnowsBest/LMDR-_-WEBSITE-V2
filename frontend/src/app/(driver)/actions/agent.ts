'use server';

const AI_SERVICE_URL = process.env.LMDR_AI_SERVICE_URL || 'https://lmdr-ai-service-140035137711.us-central1.run.app';
const INTERNAL_KEY = process.env.LMDR_INTERNAL_KEY || '';

const DRIVER_ID = 'demo-driver-001';

/**
 * Send a message to the AI agent orchestrator and get a response.
 *
 * The AI service at /ai/agent/turn handles tool orchestration internally —
 * the frontend just sends a plain text message and receives a plain text reply.
 */
export async function agentTurn(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<{ text: string; error?: string }> {
  try {
    const res = await fetch(`${AI_SERVICE_URL}/ai/agent/turn`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INTERNAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'driver',
        userId: DRIVER_ID,
        message: userMessage,
        context: {},
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        text: '',
        error: body?.error || `AI service returned ${res.status}`,
      };
    }

    const json = await res.json();
    const data = json.data || json;

    return {
      text: data.response || data.text || "I'm not sure how to help with that. Could you rephrase?",
    };
  } catch (err) {
    console.error('Agent turn error:', err);
    return {
      text: "I'm having trouble connecting right now. Try again in a moment, or check out your Dashboard for quick stats.",
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
