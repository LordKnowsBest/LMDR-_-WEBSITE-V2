import { Router, Request, Response } from 'express';
import { authenticate } from '@lmdr/middleware';
import { sendEmail } from '../services/email';
import { sendSms } from '../services/sms';
import { sendPush } from '../services/push';

const router = Router();
router.use(authenticate());

// POST /notify/email — send email via SendGrid
router.post('/email', async (req: Request, res: Response) => {
  try {
    const { to, subject, body, templateId, metadata } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
    }
    const result = await sendEmail({ to, subject, body, templateId, metadata });
    res.json({ data: result });
  } catch (err) {
    console.error('[notify/email]', (err as Error).message);
    res.status(500).json({ error: 'Email send failed', detail: (err as Error).message });
  }
});

// POST /notify/sms — send SMS via Twilio
router.post('/sms', async (req: Request, res: Response) => {
  try {
    const { to, body } = req.body;
    if (!to || !body) {
      return res.status(400).json({ error: 'Missing required fields: to, body' });
    }
    const result = await sendSms({ to, body });
    res.json({ data: result });
  } catch (err) {
    console.error('[notify/sms]', (err as Error).message);
    res.status(500).json({ error: 'SMS send failed', detail: (err as Error).message });
  }
});

// POST /notify/push — send push notification via FCM
router.post('/push', async (req: Request, res: Response) => {
  try {
    const { token, title, body, data } = req.body;
    if (!token || !title || !body) {
      return res.status(400).json({ error: 'Missing required fields: token, title, body' });
    }
    const result = await sendPush({ token, title, body, data });
    res.json({ data: result });
  } catch (err) {
    console.error('[notify/push]', (err as Error).message);
    res.status(500).json({ error: 'Push send failed', detail: (err as Error).message });
  }
});

export default router;
