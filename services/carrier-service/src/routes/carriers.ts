import { Router, Request, Response } from 'express';
import { authenticate } from '@lmdr/middleware';
import { createCarrier, getCarrier, updateCarrier, getCarrierByDot } from '../services/carrierAccount';
import { getPreferences, updatePreferences } from '../services/carrierPreferences';
import { getCarrierJobs, createJob } from '../services/jobBoard';

const router = Router();
router.use(authenticate());

// POST /carriers — create carrier account
router.post('/', async (req: Request, res: Response) => {
  try {
    const carrier = await createCarrier(req.body);
    res.status(201).json({ data: carrier });
  } catch (err) {
    console.error('[carriers/create]', (err as Error).message);
    res.status(500).json({ error: 'Create failed', detail: (err as Error).message });
  }
});

// GET /carriers/:id — get carrier by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const carrier = await getCarrier(req.params.id);
    if (!carrier) return res.status(404).json({ error: 'Carrier not found' });
    res.json({ data: carrier });
  } catch (err) {
    console.error('[carriers/get]', (err as Error).message);
    res.status(500).json({ error: 'Get failed', detail: (err as Error).message });
  }
});

// PUT /carriers/:id — update carrier
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await updateCarrier(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Carrier not found' });
    res.json({ data: updated });
  } catch (err) {
    console.error('[carriers/update]', (err as Error).message);
    res.status(500).json({ error: 'Update failed', detail: (err as Error).message });
  }
});

// GET /carriers/:id/jobs — list carrier's jobs
router.get('/:id/jobs', async (req: Request, res: Response) => {
  try {
    const jobs = await getCarrierJobs(req.params.id);
    res.json({ data: jobs });
  } catch (err) {
    console.error('[carriers/jobs]', (err as Error).message);
    res.status(500).json({ error: 'List jobs failed', detail: (err as Error).message });
  }
});

// POST /carriers/:id/jobs — create job posting
router.post('/:id/jobs', async (req: Request, res: Response) => {
  try {
    const job = await createJob(req.params.id, req.body);
    res.status(201).json({ data: job });
  } catch (err) {
    console.error('[carriers/jobs/create]', (err as Error).message);
    res.status(500).json({ error: 'Create job failed', detail: (err as Error).message });
  }
});

// PUT /carriers/:id/preferences — update hiring preferences
router.put('/:id/preferences', async (req: Request, res: Response) => {
  try {
    const prefs = await updatePreferences(req.params.id, req.body);
    res.json({ data: prefs });
  } catch (err) {
    console.error('[carriers/preferences]', (err as Error).message);
    res.status(500).json({ error: 'Update preferences failed', detail: (err as Error).message });
  }
});

// GET /carriers/dot/:dotNumber — lookup by DOT number
router.get('/dot/:dotNumber', async (req: Request, res: Response) => {
  try {
    const carrier = await getCarrierByDot(req.params.dotNumber);
    if (!carrier) return res.status(404).json({ error: 'Carrier not found' });
    res.json({ data: carrier });
  } catch (err) {
    console.error('[carriers/dot]', (err as Error).message);
    res.status(500).json({ error: 'DOT lookup failed', detail: (err as Error).message });
  }
});

export default router;
