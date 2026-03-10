import express from 'express';
import { requestLogger, errorHandler } from '@lmdr/middleware';
import healthRouter from './routes/health';
import analyticsRouter from './routes/analytics';
import authRouter from './routes/auth';

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestLogger);

  app.use('/health', healthRouter);
  app.use('/analytics', analyticsRouter);
  app.use('/auth', authRouter);

  app.use(errorHandler);

  return app;
}
