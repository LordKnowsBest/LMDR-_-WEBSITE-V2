import { Router } from 'express';
import textToSpeech from '@google-cloud/text-to-speech';

const router = Router();
const ttsClient = new textToSpeech.TextToSpeechClient();

// ─── POST /v1/voice/tts ─────────────────────────────────────────────────────
// Convert text to speech audio using Google Cloud TTS.
// Body: { text, languageCode?, voiceName?, speakingRate? }
// Returns: base64-encoded audio/mp3
router.post('/tts', async (req, res) => {
  const {
    text,
    languageCode = 'en-US',
    voiceName = 'en-US-Journey-F',
    speakingRate = 1.0,
  } = req.body ?? {};

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing required field: text' });
  }

  // Limit text length to prevent abuse
  if (text.length > 2000) {
    return res.status(400).json({ error: 'Text too long (max 2000 characters)' });
  }

  try {
    const [response] = await ttsClient.synthesizeSpeech({
      input: { text },
      voice: { languageCode, name: voiceName },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate,
        pitch: 0,
      },
    });

    const audioBase64 = Buffer.from(response.audioContent).toString('base64');

    return res.status(200).json({
      audio: audioBase64,
      contentType: 'audio/mpeg',
      durationEstimate: Math.ceil(text.split(/\s+/).length / 2.5), // rough seconds estimate
    });
  } catch (err) {
    console.error('[voice] TTS error:', err);
    return res.status(500).json({ error: 'TTS synthesis failed', detail: err.message });
  }
});

export default router;
