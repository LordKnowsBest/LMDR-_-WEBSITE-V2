import crypto from 'crypto';
import { insertLog, insertTrace } from '../db/bigquery.js';

/**
 * Express middleware that logs every request to BigQuery `system_logs`
 * and generates a trace_id attached to `req.traceId`.
 *
 * Usage:
 *   import { observability } from '../middleware/observability.js';
 *   app.use(observability());
 */
export function observability() {
  return (req, res, next) => {
    const traceId = req.headers['x-trace-id'] || crypto.randomUUID();
    const spanId = crypto.randomUUID();
    const startedAt = new Date();

    // Attach to request so downstream handlers can reference it
    req.traceId = traceId;

    // Capture the original end to hook into response completion
    const originalEnd = res.end;
    res.end = function (...args) {
      res.end = originalEnd;
      res.end(...args);

      const duration = Date.now() - startedAt.getTime();
      const statusCode = res.statusCode;
      const isError = statusCode >= 500;

      // Log the request to system_logs
      insertLog({
        level: isError ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO',
        service: 'cloud-run-api',
        message: `${req.method} ${req.originalUrl || req.url} ${statusCode} ${duration}ms`,
        data: {
          method: req.method,
          path: req.originalUrl || req.url,
          status: statusCode,
          duration_ms: duration,
          user_agent: req.headers['user-agent'],
          auth_type: req.auth?.type || null,
        },
        trace_id: traceId,
        duration_ms: duration,
        is_error: isError,
      });

      // Write a trace span for the full request lifecycle
      insertTrace({
        trace_id: traceId,
        span_id: spanId,
        operation: `${req.method} ${req.route?.path || req.originalUrl || req.url}`,
        service: 'cloud-run-api',
        started_at: startedAt.toISOString(),
        ended_at: new Date().toISOString(),
        duration_ms: duration,
        status: isError ? 'ERROR' : 'OK',
        metadata: {
          http_status: statusCode,
          method: req.method,
          path: req.originalUrl || req.url,
        },
      });
    };

    // Set trace header on response for clients
    res.setHeader('x-trace-id', traceId);
    next();
  };
}
