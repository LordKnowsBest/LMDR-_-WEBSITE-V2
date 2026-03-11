'use server';

const CLOUD_RUN_URL = process.env.LMDR_API_URL || 'https://lmdr-api-140035137711.us-central1.run.app';
const INTERNAL_KEY = process.env.LMDR_INTERNAL_KEY || '';

/**
 * Convert text to speech using Google Cloud TTS via Cloud Run.
 * Returns base64-encoded MP3 audio.
 */
export async function textToSpeech(text: string): Promise<{ audio: string; contentType: string }> {
  const res = await fetch(`${CLOUD_RUN_URL}/v1/voice/tts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${INTERNAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `TTS failed (${res.status})`);
  }

  return res.json();
}
