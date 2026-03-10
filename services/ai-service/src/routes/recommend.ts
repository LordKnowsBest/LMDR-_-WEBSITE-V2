import { Router, Request, Response } from 'express';
import { authenticate } from '@lmdr/middleware';
import { recommendJobsForDriver, recommendDriversForJob } from '../services/aiRouter';

const router = Router();
router.use(authenticate());

// POST /ai/recommend/jobs — recommend jobs for a driver profile
router.post('/jobs', async (req: Request, res: Response) => {
  try {
    const { driverProfile, limit } = req.body;
    if (!driverProfile) {
      return res.status(400).json({ error: 'driverProfile is required' });
    }
    const results = await recommendJobsForDriver(driverProfile, limit || 10);
    res.json({ data: results });
  } catch (err) {
    console.error('[recommend/jobs]', (err as Error).message);
    res.status(500).json({ error: 'Recommendation failed', detail: (err as Error).message });
  }
});

// POST /ai/recommend/drivers — recommend drivers for a job
router.post('/drivers', async (req: Request, res: Response) => {
  try {
    const { jobDescription, limit } = req.body;
    if (!jobDescription) {
      return res.status(400).json({ error: 'jobDescription is required' });
    }
    const results = await recommendDriversForJob(jobDescription, limit || 10);
    res.json({ data: results });
  } catch (err) {
    console.error('[recommend/drivers]', (err as Error).message);
    res.status(500).json({ error: 'Recommendation failed', detail: (err as Error).message });
  }
});

export default router;
