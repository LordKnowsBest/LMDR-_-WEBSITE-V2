import express from 'express';
import { requestLogger, errorHandler } from '@lmdr/middleware';
import healthRouter from './routes/health';
import driversRouter from './routes/drivers';
import documentsRouter from './routes/documents';

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestLogger);

  app.use('/health', healthRouter);
  app.use('/drivers', driversRouter);
  app.use('/drivers', documentsRouter);

  app.use(errorHandler);

  return app;
}
