import express from 'express';
import { requestLogger, errorHandler } from '@lmdr/middleware';
import healthRouter from './routes/health';
import recommendRouter from './routes/recommend';
import ragRouter from './routes/rag';
import vectorsRouter from './routes/vectors';
import agentRouter from './routes/agent';
import routerRouter from './routes/router';

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestLogger);

  app.use('/health', healthRouter);
  app.use('/ai/recommend', recommendRouter);
  app.use('/ai/rag', ragRouter);
  app.use('/ai/vectors', vectorsRouter);
  app.use('/ai/agent', agentRouter);
  app.use('/ai/router', routerRouter);

  app.use(errorHandler);

  return app;
}
