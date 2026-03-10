import { Router, Request, Response } from 'express';
import { authenticate } from '@lmdr/middleware';
import { getNotificationHistory, markAsRead } from '../services/history';

const router = Router();
router.use(authenticate());

// GET /notifications/:recipientId — get notification history for a user
router.get('/:recipientId', async (req: Request, res: Response) => {
  try {
    const { recipientId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const history = await getNotificationHistory(recipientId, limit);
    res.json({ data: history });
  } catch (err) {
    console.error('[notifications/history]', (err as Error).message);
    res.status(500).json({ error: 'Failed to fetch history', detail: (err as Error).message });
  }
});

// PUT /notifications/:id/read — mark notification as read
router.put('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await markAsRead(id);
    if (!result) return res.status(404).json({ error: 'Notification not found' });
    res.json({ data: result });
  } catch (err) {
    console.error('[notifications/read]', (err as Error).message);
    res.status(500).json({ error: 'Mark as read failed', detail: (err as Error).message });
  }
});

export default router;
