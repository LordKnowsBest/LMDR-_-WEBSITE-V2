import express from 'express';
import { requestLogger, errorHandler } from '@lmdr/middleware';
import healthRouter from './routes/health';
import complianceRouter from './routes/compliance';
import auditRouter from './routes/audit';

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestLogger);

  app.use('/health', healthRouter);
  app.use('/compliance', complianceRouter);
  app.use('/audit', auditRouter);

  app.use(errorHandler);

  return app;
}
