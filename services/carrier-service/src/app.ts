import express from 'express';
import { requestLogger, errorHandler } from '@lmdr/middleware';
import healthRouter from './routes/health';
import carriersRouter from './routes/carriers';
import dispatchRouter from './routes/dispatch';

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestLogger);

  app.use('/health', healthRouter);
  app.use('/carriers', carriersRouter);
  app.use('/dispatch', dispatchRouter);

  app.use(errorHandler);

  return app;
}
