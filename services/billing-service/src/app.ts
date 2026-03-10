import express from 'express';
import { requestLogger, errorHandler } from '@lmdr/middleware';
import healthRouter from './routes/health';
import billingRouter from './routes/billing';
import webhooksRouter from './routes/webhooks';

export function createApp() {
  const app = express();

  app.use(requestLogger);

  // Mount webhooks BEFORE json parser (Stripe needs raw body)
  app.use('/webhooks', webhooksRouter);

  app.use(express.json());

  // Mount other routes after json parser
  app.use('/health', healthRouter);
  app.use('/billing', billingRouter);

  app.use(errorHandler);

  return app;
}
