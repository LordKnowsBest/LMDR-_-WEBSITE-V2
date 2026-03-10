import { Router, Request, Response } from 'express';
import { authenticate } from '@lmdr/middleware';
import { createEmbedding, similaritySearch } from '../services/ragPipeline';

const router = Router();
router.use(authenticate());

// POST /ai/vectors/embed — create embedding for text
router.post('/embed', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }
    const embedding = await createEmbedding(text);
    res.json({ data: { embedding, dimensions: embedding.length } });
  } catch (err) {
    console.error('[vectors/embed]', (err as Error).message);
    res.status(500).json({ error: 'Embedding failed', detail: (err as Error).message });
  }
});

// POST /ai/vectors/search — similarity search
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { text, limit } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }
    const results = await similaritySearch(text, limit || 10);
    res.json({ data: results });
  } catch (err) {
    console.error('[vectors/search]', (err as Error).message);
    res.status(500).json({ error: 'Search failed', detail: (err as Error).message });
  }
});

export default router;
