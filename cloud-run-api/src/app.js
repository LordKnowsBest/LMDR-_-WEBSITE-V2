import express from 'express';
import healthRouter from './routes/health.js';
import collectionRouter from './routes/collection.js';
import filesRouter from './routes/files.js';
import searchRouter from './routes/search.js';
import jobsRouter from './routes/jobs.js';
import adminRouter from './routes/admin/index.js';
import driverRouter from './routes/driver/index.js';
import voiceRouter from './routes/voice.js';
import publicRouter from './routes/public.js';
import { authenticate } from './middleware/auth.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { observability } from './middleware/observability.js';
import { flush as flushBigQuery } from './db/bigquery.js';

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Observability — traces and logs every request to BigQuery
  app.use(observability());

  // Public routes (no auth required)
  app.use('/health', healthRouter);
  app.use('/v1/public', rateLimiter(), publicRouter);

  // Authenticated API routes
  const protectedRouter = express.Router();
  // Mount specific routers BEFORE the catch-all collection router
  protectedRouter.use('/files', filesRouter);
  protectedRouter.use('/search', searchRouter);
  protectedRouter.use('/jobs', jobsRouter);
  protectedRouter.use('/admin', adminRouter);
  protectedRouter.use('/driver', driverRouter);
  protectedRouter.use('/voice', voiceRouter);
  protectedRouter.use('/', collectionRouter);
  app.use('/v1', authenticate(), rateLimiter(), protectedRouter);

  // 404 catch-all
  app.use((req, res) => res.status(404).json({ error: 'Not found' }));

  // Error handler
  app.use((err, req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  });

  // Graceful shutdown — flush BigQuery buffers
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received — flushing BigQuery buffers...');
    await flushBigQuery();
    process.exit(0);
  });

  return app;
}
