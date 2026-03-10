import { Router, Request, Response } from 'express';
import { authenticate } from '@lmdr/middleware';
import { handleAgentTurn, getConversations, getConversationTurns } from '../services/agentOrchestrator';

const router = Router();
router.use(authenticate());

// POST /ai/agent/turn — handle agent conversation turn
router.post('/turn', async (req: Request, res: Response) => {
  try {
    const { role, userId, message, context } = req.body;
    if (!role || !userId || !message) {
      return res.status(400).json({ error: 'role, userId, and message are required' });
    }
    const result = await handleAgentTurn(role, userId, message, context);
    res.json({ data: result });
  } catch (err) {
    console.error('[agent/turn]', (err as Error).message);
    res.status(500).json({ error: 'Agent turn failed', detail: (err as Error).message });
  }
});

// GET /ai/agent/conversations/:userId — list conversations
router.get('/conversations/:userId', async (req: Request, res: Response) => {
  try {
    const conversations = await getConversations(req.params.userId);
    res.json({ data: conversations });
  } catch (err) {
    console.error('[agent/conversations]', (err as Error).message);
    res.status(500).json({ error: 'List conversations failed', detail: (err as Error).message });
  }
});

// GET /ai/agent/conversations/:conversationId/turns — get conversation turns
router.get('/conversations/:conversationId/turns', async (req: Request, res: Response) => {
  try {
    const turns = await getConversationTurns(req.params.conversationId);
    res.json({ data: turns });
  } catch (err) {
    console.error('[agent/turns]', (err as Error).message);
    res.status(500).json({ error: 'Get turns failed', detail: (err as Error).message });
  }
});

export default router;
