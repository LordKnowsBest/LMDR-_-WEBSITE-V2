import { Router, Request, Response } from 'express';
import { authenticate } from '@lmdr/middleware';
import { ragQuery, indexDocument } from '../services/ragPipeline';

const router = Router();
router.use(authenticate());

// POST /ai/rag/query — RAG query (question + optional context)
router.post('/query', async (req: Request, res: Response) => {
  try {
    const { question, context } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }
    const result = await ragQuery(question, context);
    res.json({ data: result });
  } catch (err) {
    console.error('[rag/query]', (err as Error).message);
    res.status(500).json({ error: 'RAG query failed', detail: (err as Error).message });
  }
});

// POST /ai/rag/index — index a document for RAG
router.post('/index', async (req: Request, res: Response) => {
  try {
    const { docId, content } = req.body;
    if (!docId || !content) {
      return res.status(400).json({ error: 'docId and content are required' });
    }
    const result = await indexDocument(docId, content);
    res.json({ data: result });
  } catch (err) {
    console.error('[rag/index]', (err as Error).message);
    res.status(500).json({ error: 'Indexing failed', detail: (err as Error).message });
  }
});

export default router;
