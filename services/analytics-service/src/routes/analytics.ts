import { Router, Request, Response } from 'express';
import { authenticate } from '@lmdr/middleware';
import { getDashboardMetrics } from '../services/dashboardMetrics';
import { getFeatureMetrics, getAdoptionSummary, logFeatureInteraction } from '../services/featureAdoption';
import { listReports, generateReport, getReport } from '../services/reportGenerator';

const router = Router();
router.use(authenticate());

// GET /analytics/dashboard — aggregate dashboard metrics
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const metrics = await getDashboardMetrics();
    res.json({ data: metrics });
  } catch (err) {
    console.error('[analytics/dashboard]', (err as Error).message);
    res.status(500).json({ error: 'Failed to load dashboard metrics', detail: (err as Error).message });
  }
});

// GET /analytics/feature-adoption — all feature adoption metrics
router.get('/feature-adoption', async (_req: Request, res: Response) => {
  try {
    const summary = await getAdoptionSummary();
    res.json({ data: summary });
  } catch (err) {
    console.error('[analytics/feature-adoption]', (err as Error).message);
    res.status(500).json({ error: 'Failed to load adoption metrics', detail: (err as Error).message });
  }
});

// GET /analytics/feature-adoption/:featureId — specific feature metrics
router.get('/feature-adoption/:featureId', async (req: Request, res: Response) => {
  try {
    const metrics = await getFeatureMetrics(req.params.featureId);
    if (!metrics) return res.status(404).json({ error: 'Feature not found' });
    res.json({ data: metrics });
  } catch (err) {
    console.error('[analytics/feature-adoption/:featureId]', (err as Error).message);
    res.status(500).json({ error: 'Failed to load feature metrics', detail: (err as Error).message });
  }
});

// POST /analytics/feature-adoption/log — log a feature interaction
router.post('/feature-adoption/log', async (req: Request, res: Response) => {
  try {
    const { featureId, userId, action, metadata } = req.body;
    if (!featureId || !userId || !action) {
      return res.status(400).json({ error: 'featureId, userId, and action are required' });
    }
    const record = await logFeatureInteraction(featureId, userId, action, metadata);
    res.status(201).json({ data: record });
  } catch (err) {
    console.error('[analytics/feature-adoption/log]', (err as Error).message);
    res.status(500).json({ error: 'Failed to log interaction', detail: (err as Error).message });
  }
});

// GET /analytics/reports — list reports
router.get('/reports', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const reports = await listReports(limit);
    res.json({ data: reports });
  } catch (err) {
    console.error('[analytics/reports]', (err as Error).message);
    res.status(500).json({ error: 'Failed to list reports', detail: (err as Error).message });
  }
});

// POST /analytics/reports/generate — generate a new report
router.post('/reports/generate', async (req: Request, res: Response) => {
  try {
    const { templateId, params } = req.body;
    if (!templateId) {
      return res.status(400).json({ error: 'templateId is required' });
    }
    const report = await generateReport(templateId, params);
    res.status(201).json({ data: report });
  } catch (err) {
    console.error('[analytics/reports/generate]', (err as Error).message);
    res.status(500).json({ error: 'Failed to generate report', detail: (err as Error).message });
  }
});

// GET /analytics/reports/:id — get specific report
router.get('/reports/:id', async (req: Request, res: Response) => {
  try {
    const report = await getReport(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json({ data: report });
  } catch (err) {
    console.error('[analytics/reports/:id]', (err as Error).message);
    res.status(500).json({ error: 'Failed to get report', detail: (err as Error).message });
  }
});

export default router;
