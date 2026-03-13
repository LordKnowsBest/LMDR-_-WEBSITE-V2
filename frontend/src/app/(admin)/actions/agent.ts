'use server';

const AI_SERVICE_URL = process.env.LMDR_AI_SERVICE_URL || 'https://lmdr-ai-service-140035137711.us-central1.run.app';
const INTERNAL_KEY = process.env.LMDR_INTERNAL_KEY || '';

export async function adminAgentTurn(
  userMessage: string,
  context?: { conversationId?: string }
): Promise<{ text: string; conversationId?: string; error?: string }> {
  try {
    // CORRECT PATH: /ai/agent/turn (NOT /agent/turn — see lessons-learned.md)
    const res = await fetch(`${AI_SERVICE_URL}/ai/agent/turn`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INTERNAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'admin',
        userId: 'admin-user',
        message: userMessage,
        context: context || {},
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { text: '', error: body?.error || `AI service returned ${res.status}` };
    }

    const json = await res.json();
    const data = json.data || json;

    return {
      text: data.response || data.text || "I couldn't process that request.",
      conversationId: data.conversationId,
    };
  } catch (err) {
    console.error('[admin-agent] Error:', err);
    return {
      text: "The AI assistant is temporarily unavailable. Try again in a moment.",
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
