import { Router, Request, Response } from 'express';
import { searchJobs } from '../services/jobSearch';
import { searchDrivers } from '../services/driverSearch';
import { authenticate } from '@lmdr/middleware';

const router = Router();
router.use(authenticate());

router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radiusMiles = '50', cdlClass, freightType, limit = '25', offset = '0' } = req.query;
    const results = await searchJobs({
      lat: Number(lat),
      lng: Number(lng),
      radiusMiles: Number(radiusMiles),
      cdlClass: String(cdlClass || ''),
      freightType: String(freightType || ''),
      limit: Number(limit),
      offset: Number(offset),
    });
    res.json({ data: results.records, meta: { total: results.total } });
  } catch (err) {
    console.error('[search/jobs]', (err as Error).message);
    res.status(500).json({ error: 'Job search failed', detail: (err as Error).message });
  }
});

router.get('/drivers', async (req: Request, res: Response) => {
  try {
    const { cdlClass, state, freightType, limit = '25', offset = '0' } = req.query;
    const results = await searchDrivers({
      cdlClass: String(cdlClass || ''),
      state: String(state || ''),
      freightType: String(freightType || ''),
      limit: Number(limit),
      offset: Number(offset),
    });
    res.json({ data: results.records, meta: { total: results.total } });
  } catch (err) {
    console.error('[search/drivers]', (err as Error).message);
    res.status(500).json({ error: 'Driver search failed', detail: (err as Error).message });
  }
});

export default router;
