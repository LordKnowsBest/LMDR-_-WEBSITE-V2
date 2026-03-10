import { Router, Request, Response } from 'express';
import { authenticate } from '@lmdr/middleware';
import { assignDriverToJob, getDispatchQueue, getAssignmentsForJob } from '../services/dispatch';

const router = Router();
router.use(authenticate());

// POST /dispatch/assign — assign driver to job
router.post('/assign', async (req: Request, res: Response) => {
  try {
    const { driverId, jobId, assignedBy } = req.body;
    const assignment = await assignDriverToJob(driverId, jobId, assignedBy);
    res.status(201).json({ data: assignment });
  } catch (err) {
    console.error('[dispatch/assign]', (err as Error).message);
    res.status(500).json({ error: 'Assignment failed', detail: (err as Error).message });
  }
});

// GET /dispatch/queue — get open dispatch queue
router.get('/queue', async (_req: Request, res: Response) => {
  try {
    const queue = await getDispatchQueue();
    res.json({ data: queue });
  } catch (err) {
    console.error('[dispatch/queue]', (err as Error).message);
    res.status(500).json({ error: 'Queue fetch failed', detail: (err as Error).message });
  }
});

// GET /dispatch/assignments/:jobId — get assignments for a job
router.get('/assignments/:jobId', async (req: Request, res: Response) => {
  try {
    const assignments = await getAssignmentsForJob(req.params.jobId);
    res.json({ data: assignments });
  } catch (err) {
    console.error('[dispatch/assignments]', (err as Error).message);
    res.status(500).json({ error: 'Assignments fetch failed', detail: (err as Error).message });
  }
});

export default router;
