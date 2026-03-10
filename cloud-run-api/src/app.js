import express from 'express';
import healthRouter from './routes/health.js';
import collectionRouter from './routes/collection.js';
import { authenticate } from './middleware/auth.js';
import { rateLimiter } from './middleware/rateLimiter.js';

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Public routes
  app.use('/health', healthRouter);

  // Authenticated API routes
  app.use('/v1', authenticate(), rateLimiter(), collectionRouter);

  // 404 catch-all
  app.use((req, res) => res.status(404).json({ error: 'Not found' }));

  // Error handler
  app.use((err, req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  });

  return app;
}
