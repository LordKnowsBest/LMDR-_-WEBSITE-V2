import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  console.error(JSON.stringify({
    severity: 'ERROR',
    message: err.message,
    stack: err.stack,
    path: req.path,
  }));
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
}
