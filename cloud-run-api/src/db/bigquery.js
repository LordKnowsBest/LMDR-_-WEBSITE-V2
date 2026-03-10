import { BigQuery } from '@google-cloud/bigquery';
import crypto from 'crypto';

const PROJECT_ID = 'ldmr-velocitymatch';
const DATASET_ID = 'lmdr_analytics';

const TABLES = {
  systemLogs: 'system_logs',
  systemTraces: 'system_traces',
  aiUsageLog: 'ai_usage_log',
  auditLog: 'audit_log',
};

const FLUSH_INTERVAL_MS = 5_000;
const FLUSH_THRESHOLD = 50;

let bq = null;
let dataset = null;

/** Per-table row buffers */
const buffers = {
  [TABLES.systemLogs]: [],
  [TABLES.systemTraces]: [],
  [TABLES.aiUsageLog]: [],
  [TABLES.auditLog]: [],
};

let flushTimer = null;
let flushing = false;

// ────────────────────────────────────────
// Lazy init
// ────────────────────────────────────────

function ensureClient() {
  if (!bq) {
    bq = new BigQuery({ projectId: PROJECT_ID });
    dataset = bq.dataset(DATASET_ID);
  }
  return dataset;
}

// ────────────────────────────────────────
// Internal helpers
// ────────────────────────────────────────

function enqueue(table, row) {
  buffers[table].push(row);

  // Start the periodic flush timer on first enqueue
  if (!flushTimer) {
    flushTimer = setInterval(() => flushAll(), FLUSH_INTERVAL_MS);
    // Allow process to exit even if timer is pending
    if (flushTimer.unref) flushTimer.unref();
  }

  // Flush immediately if any single buffer hits threshold
  const total = Object.values(buffers).reduce((s, b) => s + b.length, 0);
  if (total >= FLUSH_THRESHOLD) {
    flushAll();
  }
}

async function flushTable(tableName, rows) {
  if (rows.length === 0) return;
  try {
    const ds = ensureClient();
    await ds.table(tableName).insert(rows, {
      skipInvalidRows: true,
      ignoreUnknownValues: true,
    });
  } catch (err) {
    // BigQuery insert can return partial errors in err.response
    if (err.name === 'PartialFailureError') {
      const failed = err.errors?.length ?? 0;
      console.error(`[bigquery] ${tableName}: ${failed} row(s) failed — ${JSON.stringify(err.errors?.[0]?.errors?.[0])}`);
    } else {
      console.error(`[bigquery] ${tableName} insert error:`, err.message);
    }
  }
}

async function flushAll() {
  if (flushing) return;
  flushing = true;
  try {
    const work = Object.entries(buffers).map(([table, rows]) => {
      if (rows.length === 0) return Promise.resolve();
      const batch = rows.splice(0, rows.length); // drain
      return flushTable(table, batch);
    });
    await Promise.all(work);
  } catch (err) {
    console.error('[bigquery] flushAll unexpected error:', err.message);
  } finally {
    flushing = false;
  }
}

// ────────────────────────────────────────
// Public API
// ────────────────────────────────────────

function uuid() {
  return crypto.randomUUID();
}

/**
 * Stream a log row to `system_logs`.
 * @param {object} logData
 */
export function insertLog(logData) {
  try {
    enqueue(TABLES.systemLogs, {
      log_id: logData.log_id || uuid(),
      timestamp: logData.timestamp || new Date().toISOString(),
      level: logData.level || 'INFO',
      service: logData.service || 'cloud-run-api',
      message: logData.message || '',
      data: logData.data ? JSON.stringify(logData.data) : null,
      trace_id: logData.trace_id || null,
      duration_ms: logData.duration_ms ?? null,
      is_error: logData.is_error ?? (logData.level === 'ERROR'),
    });
  } catch (err) {
    console.error('[bigquery] insertLog prep error:', err.message);
  }
}

/**
 * Stream a trace span to `system_traces`.
 * @param {object} traceData
 */
export function insertTrace(traceData) {
  try {
    enqueue(TABLES.systemTraces, {
      trace_id: traceData.trace_id || uuid(),
      span_id: traceData.span_id || uuid(),
      parent_span_id: traceData.parent_span_id || null,
      operation: traceData.operation || '',
      service: traceData.service || 'cloud-run-api',
      started_at: traceData.started_at || new Date().toISOString(),
      ended_at: traceData.ended_at || null,
      duration_ms: traceData.duration_ms ?? null,
      status: traceData.status || 'OK',
      metadata: traceData.metadata ? JSON.stringify(traceData.metadata) : null,
    });
  } catch (err) {
    console.error('[bigquery] insertTrace prep error:', err.message);
  }
}

/**
 * Stream an AI usage row to `ai_usage_log`.
 * @param {object} usageData
 */
export function insertAiUsage(usageData) {
  try {
    enqueue(TABLES.aiUsageLog, {
      log_id: usageData.log_id || uuid(),
      timestamp: usageData.timestamp || new Date().toISOString(),
      provider: usageData.provider || '',
      model: usageData.model || '',
      function_name: usageData.function_name || '',
      input_tokens: usageData.input_tokens ?? 0,
      output_tokens: usageData.output_tokens ?? 0,
      cost_usd: usageData.cost_usd ?? 0,
      latency_ms: usageData.latency_ms ?? 0,
      success: usageData.success ?? true,
      carrier_dot: usageData.carrier_dot || null,
      driver_id: usageData.driver_id || null,
    });
  } catch (err) {
    console.error('[bigquery] insertAiUsage prep error:', err.message);
  }
}

/**
 * Stream an audit event to `audit_log`.
 * @param {object} auditData
 */
export function insertAuditEvent(auditData) {
  try {
    enqueue(TABLES.auditLog, {
      audit_id: auditData.audit_id || uuid(),
      timestamp: auditData.timestamp || new Date().toISOString(),
      actor_id: auditData.actor_id || '',
      actor_role: auditData.actor_role || '',
      action: auditData.action || '',
      resource_type: auditData.resource_type || '',
      resource_id: auditData.resource_id || '',
      before_state: auditData.before_state ? JSON.stringify(auditData.before_state) : null,
      after_state: auditData.after_state ? JSON.stringify(auditData.after_state) : null,
      ip_address: auditData.ip_address || null,
      success: auditData.success ?? true,
    });
  } catch (err) {
    console.error('[bigquery] insertAuditEvent prep error:', err.message);
  }
}

/**
 * Flush all buffered rows immediately. Call during graceful shutdown.
 * @returns {Promise<void>}
 */
export async function flush() {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  await flushAll();
}
