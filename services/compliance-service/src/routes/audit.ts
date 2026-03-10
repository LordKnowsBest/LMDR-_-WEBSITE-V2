import { Router, Request, Response } from 'express';
import { authenticate } from '@lmdr/middleware';
import { logAuditEvent, queryAuditEvents, getAuditEvent } from '../services/auditLog';

const router = Router();
router.use(authenticate());

// POST /audit/events — log an audit event
router.post('/events', async (req: Request, res: Response) => {
  try {
    const event = await logAuditEvent(req.body);
    res.status(201).json({ data: event });
  } catch (err) {
    console.error('[audit/events/create]', (err as Error).message);
    res.status(500).json({ error: 'Audit log failed', detail: (err as Error).message });
  }
});

// GET /audit/events — query audit events with filters
router.get('/events', async (req: Request, res: Response) => {
  try {
    const filters = {
      actorId: req.query.actorId as string | undefined,
      resourceType: req.query.resourceType as string | undefined,
      resourceId: req.query.resourceId as string | undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };
    const result = await queryAuditEvents(filters);
    res.json({ data: result });
  } catch (err) {
    console.error('[audit/events/query]', (err as Error).message);
    res.status(500).json({ error: 'Audit query failed', detail: (err as Error).message });
  }
});

// GET /audit/events/:id — get specific audit event
router.get('/events/:id', async (req: Request, res: Response) => {
  try {
    const event = await getAuditEvent(req.params.id);
    if (!event) return res.status(404).json({ error: 'Audit event not found' });
    res.json({ data: event });
  } catch (err) {
    console.error('[audit/events/get]', (err as Error).message);
    res.status(500).json({ error: 'Audit event lookup failed', detail: (err as Error).message });
  }
});

export default router;
