import express from 'express';
import { requestLogger, errorHandler } from '@lmdr/middleware';
import healthRouter from './routes/health';
import matchRouter from './routes/match';
import searchRouter from './routes/search';

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestLogger);

  app.use('/health', healthRouter);
  app.use('/match', matchRouter);
  app.use('/search', searchRouter);

  app.use(errorHandler);

  return app;
}
