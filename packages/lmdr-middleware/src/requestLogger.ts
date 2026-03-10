import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    const log = {
      severity: res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARNING' : 'INFO',
      httpRequest: {
        requestMethod: req.method,
        requestUrl: req.originalUrl,
        status: res.statusCode,
        latency: `${Date.now() - start}ms`,
        userAgent: req.headers['user-agent'],
      },
      service: process.env.SERVICE_NAME,
    };
    console.log(JSON.stringify(log));
  });
  next();
}
