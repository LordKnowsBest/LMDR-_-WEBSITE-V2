import { Router } from 'express';
import { query } from '@lmdr/db';

const router = Router();

router.get('/', async (_req, res) => {
  let dbStatus = 'ok';
  try {
    await query('SELECT 1');
  } catch (err) {
    dbStatus = 'error';
    console.error('[health] DB check failed:', (err as Error).message);
  }

  res.json({
    service: 'lmdr-matching-engine',
    status: dbStatus === 'ok' ? 'healthy' : 'degraded',
    db: dbStatus,
    uptime: process.uptime(),
  });
});

export default router;
