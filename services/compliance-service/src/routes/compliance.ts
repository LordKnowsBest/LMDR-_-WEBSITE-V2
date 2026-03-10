import { Router, Request, Response } from 'express';
import { authenticate } from '@lmdr/middleware';
import { triggerMvrCheck, getMvrCheckResult } from '../services/mvrCheck';
import { triggerBackgroundCheck, getBackgroundCheckResult } from '../services/backgroundCheck';
import { getDriverComplianceStatus } from '../services/complianceStatus';

const router = Router();
router.use(authenticate());

// POST /compliance/mvr-check — trigger MVR check for a driver
router.post('/mvr-check', async (req: Request, res: Response) => {
  try {
    const { driverId } = req.body;
    if (!driverId) return res.status(400).json({ error: 'driverId is required' });
    const result = await triggerMvrCheck(driverId);
    res.status(202).json({ data: result });
  } catch (err) {
    console.error('[compliance/mvr-check]', (err as Error).message);
    res.status(500).json({ error: 'MVR check trigger failed', detail: (err as Error).message });
  }
});

// POST /compliance/background-check — trigger background check
router.post('/background-check', async (req: Request, res: Response) => {
  try {
    const { driverId } = req.body;
    if (!driverId) return res.status(400).json({ error: 'driverId is required' });
    const result = await triggerBackgroundCheck(driverId);
    res.status(202).json({ data: result });
  } catch (err) {
    console.error('[compliance/background-check]', (err as Error).message);
    res.status(500).json({ error: 'Background check trigger failed', detail: (err as Error).message });
  }
});

// GET /compliance/status/:driverId — get compliance status for driver
router.get('/status/:driverId', async (req: Request, res: Response) => {
  try {
    const status = await getDriverComplianceStatus(req.params.driverId);
    res.json({ data: status });
  } catch (err) {
    console.error('[compliance/status]', (err as Error).message);
    res.status(500).json({ error: 'Status check failed', detail: (err as Error).message });
  }
});

// GET /compliance/checks/:checkId — get specific check result
router.get('/checks/:checkId', async (req: Request, res: Response) => {
  try {
    // Try MVR first, then background check
    let result = await getMvrCheckResult(req.params.checkId);
    if (!result) {
      result = await getBackgroundCheckResult(req.params.checkId);
    }
    if (!result) return res.status(404).json({ error: 'Check not found' });
    res.json({ data: result });
  } catch (err) {
    console.error('[compliance/checks]', (err as Error).message);
    res.status(500).json({ error: 'Check lookup failed', detail: (err as Error).message });
  }
});

export default router;
