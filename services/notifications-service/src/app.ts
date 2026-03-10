import express from 'express';
import { requestLogger, errorHandler } from '@lmdr/middleware';
import healthRouter from './routes/health';
import notifyRouter from './routes/notify';
import notificationsRouter from './routes/notifications';
import pubsubRouter from './pubsub/subscriber';

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestLogger);

  app.use('/health', healthRouter);
  app.use('/notify', notifyRouter);
  app.use('/notifications', notificationsRouter);
  app.use('/pubsub', pubsubRouter);

  app.use(errorHandler);

  return app;
}
