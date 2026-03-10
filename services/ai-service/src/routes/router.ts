import { Router, Request, Response } from 'express';
import { authenticate } from '@lmdr/middleware';
import { selectProvider, complete, getProviderStatus } from '../services/aiRouter';

const router = Router();
router.use(authenticate());

// POST /ai/router/complete — AI router: selects optimal provider, sends completion
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const { task, messages, provider: requestedProvider, options } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }
    const provider = requestedProvider || selectProvider(task || 'general', options);
    const result = await complete(provider, messages, options);
    res.json({ data: { provider, ...result } });
  } catch (err) {
    console.error('[router/complete]', (err as Error).message);
    res.status(500).json({ error: 'Completion failed', detail: (err as Error).message });
  }
});

// GET /ai/router/providers — list available AI providers and their status
router.get('/providers', async (_req: Request, res: Response) => {
  try {
    const providers = getProviderStatus();
    res.json({ data: providers });
  } catch (err) {
    console.error('[router/providers]', (err as Error).message);
    res.status(500).json({ error: 'Provider list failed', detail: (err as Error).message });
  }
});

export default router;
