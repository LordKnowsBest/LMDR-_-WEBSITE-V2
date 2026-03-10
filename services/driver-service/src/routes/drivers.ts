import { Router, Request, Response } from 'express';
import { authenticate } from '@lmdr/middleware';
import { createDriverProfile, getDriverProfile, updateDriverProfile } from '../services/driverProfile';
import { advanceOnboardingStep, getOnboardingStatus } from '../services/onboarding';

const router = Router();
router.use(authenticate());

// POST /drivers — create driver profile
router.post('/', async (req: Request, res: Response) => {
  try {
    const profile = await createDriverProfile(req.body);
    res.status(201).json({ data: profile });
  } catch (err) {
    console.error('[drivers/create]', (err as Error).message);
    res.status(500).json({ error: 'Create failed', detail: (err as Error).message });
  }
});

// GET /drivers/:id — full driver profile
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const profile = await getDriverProfile(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Driver not found' });
    res.json({ data: profile });
  } catch (err) {
    console.error('[drivers/get]', (err as Error).message);
    res.status(500).json({ error: 'Get failed', detail: (err as Error).message });
  }
});

// PUT /drivers/:id — update profile fields
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await updateDriverProfile(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Driver not found' });
    res.json({ data: updated });
  } catch (err) {
    console.error('[drivers/update]', (err as Error).message);
    res.status(500).json({ error: 'Update failed', detail: (err as Error).message });
  }
});

// PUT /drivers/:id/onboarding-step — advance state machine
router.put('/:id/onboarding-step', async (req: Request, res: Response) => {
  try {
    const result = await advanceOnboardingStep(req.params.id);
    res.json({ data: result });
  } catch (err) {
    console.error('[drivers/onboarding-step]', (err as Error).message);
    res.status(400).json({ error: (err as Error).message });
  }
});

// GET /drivers/:id/onboarding-status
router.get('/:id/onboarding-status', async (req: Request, res: Response) => {
  try {
    const status = await getOnboardingStatus(req.params.id);
    if (!status) return res.status(404).json({ error: 'Driver not found' });
    res.json({ data: status });
  } catch (err) {
    console.error('[drivers/onboarding-status]', (err as Error).message);
    res.status(500).json({ error: 'Status check failed', detail: (err as Error).message });
  }
});

// PUT /drivers/:id/visibility
router.put('/:id/visibility', async (req: Request, res: Response) => {
  try {
    const { visibilityLevel, isSearchable } = req.body;
    const updated = await updateDriverProfile(req.params.id, { visibilityLevel, isSearchable });
    if (!updated) return res.status(404).json({ error: 'Driver not found' });
    res.json({ data: updated });
  } catch (err) {
    console.error('[drivers/visibility]', (err as Error).message);
    res.status(500).json({ error: 'Visibility update failed', detail: (err as Error).message });
  }
});

export default router;
