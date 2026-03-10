import { Router, Request, Response } from 'express';
import { findJobsForDriver, findDriversForJob } from '../services/matchingAlgorithm';
import { getMatchExplanation } from '../services/matchExplanation';
import { authenticate } from '@lmdr/middleware';

const router = Router();
router.use(authenticate());

router.post('/find-jobs', async (req: Request, res: Response) => {
  try {
    const { driverProfile, limit = 20 } = req.body;
    if (!driverProfile) {
      return res.status(400).json({ error: 'driverProfile required', code: 'MISSING_PARAM' });
    }
    const matches = await findJobsForDriver(driverProfile, limit);
    res.json({ data: matches, meta: { total: matches.length } });
  } catch (err) {
    console.error('[match/find-jobs]', (err as Error).message);
    res.status(500).json({ error: 'Match search failed', detail: (err as Error).message });
  }
});

router.post('/find-drivers', async (req: Request, res: Response) => {
  try {
    const { jobSpec, limit = 20 } = req.body;
    if (!jobSpec) {
      return res.status(400).json({ error: 'jobSpec required', code: 'MISSING_PARAM' });
    }
    const results = await findDriversForJob(jobSpec, limit);
    res.json({ data: results, meta: { total: results.length } });
  } catch (err) {
    console.error('[match/find-drivers]', (err as Error).message);
    res.status(500).json({ error: 'Driver search failed', detail: (err as Error).message });
  }
});

router.get('/explain/:driverId/:carrierId', async (req: Request, res: Response) => {
  try {
    const explanation = await getMatchExplanation(req.params.driverId, req.params.carrierId);
    if (!explanation) {
      return res.status(404).json({ error: 'No match found', code: 'NOT_FOUND' });
    }
    res.json({ data: explanation });
  } catch (err) {
    console.error('[match/explain]', (err as Error).message);
    res.status(500).json({ error: 'Explanation failed', detail: (err as Error).message });
  }
});

export default router;
