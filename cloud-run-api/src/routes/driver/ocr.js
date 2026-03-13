import { Router } from 'express';

const router = Router();

const PROMPTS = {
  CDL_FRONT: 'Extract from this CDL (Commercial Driver License) image: full name, license number, state, CDL class (A/B/C), endorsements, restrictions, date of birth, expiration date, address. Return valid JSON only.',
  MED_CARD: 'Extract from this DOT medical card image: certificate expiration date, examining doctor name, any restrictions or conditions noted. Return valid JSON only.',
  MVR: 'Extract from this Motor Vehicle Record: violations count, accident history, license status, points. Return valid JSON only.',
};

// POST /v1/driver/ocr/extract
// Body: { image: string (base64 data URL), docType: 'CDL_FRONT'|'MED_CARD'|'MVR' }
router.post('/extract', async (req, res) => {
  const { image, docType } = req.body ?? {};
  if (!image || !docType) {
    return res.status(400).json({ error: 'Missing required fields: image, docType' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  const prompt = PROMPTS[docType] || PROMPTS.CDL_FRONT;

  // Strip data URL prefix to get raw base64
  const base64Data = image.includes(',') ? image.split(',')[1] : image;
  const mimeType = image.match(/data:(.*?);/)?.[1] || 'image/jpeg';

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: base64Data } },
            ],
          }],
          generationConfig: { maxOutputTokens: 1024, temperature: 0.1 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[ocr] Gemini error:', errText);
      return res.status(502).json({ error: 'OCR extraction failed', detail: errText });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from response (Gemini sometimes wraps in markdown code blocks)
    let extracted;
    try {
      const jsonMatch = rawText.match(/```json\n?([\s\S]*?)\n?```/) || rawText.match(/\{[\s\S]*\}/);
      extracted = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : rawText);
    } catch {
      extracted = { raw: rawText };
    }

    return res.json({ success: true, docType, extracted });
  } catch (err) {
    console.error('[ocr] Extraction error:', err);
    return res.status(500).json({ error: 'OCR processing failed', detail: err.message });
  }
});

export default router;
