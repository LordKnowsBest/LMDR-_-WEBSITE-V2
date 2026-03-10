import { Router, Request, Response } from 'express';
import { sendEmail } from '../services/email';
import { sendSms } from '../services/sms';
import { sendPush } from '../services/push';

const router = Router();

// POST /pubsub/notifications — receives Pub/Sub push delivery
// No auth — internal VPC only, but validates Pub/Sub message format
router.post('/notifications', async (req: Request, res: Response) => {
  try {
    const pubsubMessage = req.body?.message;
    if (!pubsubMessage || !pubsubMessage.data) {
      return res.status(400).json({ error: 'Invalid Pub/Sub message format' });
    }

    const decoded = Buffer.from(pubsubMessage.data, 'base64').toString();
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(decoded);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON in Pub/Sub message data' });
    }

    const channel = payload.channel as string;

    switch (channel) {
      case 'email':
        await sendEmail({
          to: payload.to as string,
          subject: payload.subject as string,
          body: payload.body as string,
          templateId: payload.templateId as string | undefined,
          metadata: payload.metadata as Record<string, string> | undefined,
        });
        break;

      case 'sms':
        await sendSms({
          to: payload.to as string,
          body: payload.body as string,
        });
        break;

      case 'push':
        await sendPush({
          token: payload.token as string,
          title: payload.title as string,
          body: payload.body as string,
          data: payload.data as Record<string, string> | undefined,
        });
        break;

      default:
        console.warn(`[pubsub/notifications] Unknown channel: ${channel}`);
        return res.status(400).json({ error: `Unknown channel: ${channel}` });
    }

    // Acknowledge message (200 = ack, Pub/Sub won't retry)
    res.status(200).json({ status: 'processed', channel });
  } catch (err) {
    console.error('[pubsub/notifications]', (err as Error).message);
    // Return 500 so Pub/Sub retries
    res.status(500).json({ error: 'Processing failed', detail: (err as Error).message });
  }
});

export default router;
