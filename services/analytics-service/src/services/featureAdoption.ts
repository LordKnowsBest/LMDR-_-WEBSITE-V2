import crypto from 'crypto';
import { query, getTableName, buildInsertQuery } from '@lmdr/db';

const LOGS_TABLE = getTableName('featureAdoptionLogs');
const REGISTRY_TABLE = getTableName('featureRegistry');

export interface FeatureInteraction {
  _id: string;
  featureId: string;
  userId: string;
  action: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface FeatureMetrics {
  featureId: string;
  featureName: string | null;
  totalInteractions: number;
  uniqueUsers: number;
  lastInteraction: string | null;
}

export async function logFeatureInteraction(
  featureId: string,
  userId: string,
  action: string,
  metadata?: Record<string, unknown>
): Promise<FeatureInteraction> {
  const _id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const data = { featureId, userId, action, metadata: metadata || {}, timestamp };

  const { sql, params } = buildInsertQuery(LOGS_TABLE, { _id, data });
  const result = await query(sql, params);
  const row = result.rows[0];
  return { _id: row._id, ...(row.data as Record<string, unknown>) } as FeatureInteraction;
}

export async function getFeatureMetrics(featureId: string): Promise<FeatureMetrics | null> {
  // Check if feature exists in registry
  const registryResult = await query(
    `SELECT _id, data FROM "${REGISTRY_TABLE}" WHERE data->>'featureId' = $1 LIMIT 1`,
    [featureId]
  );

  const featureName = registryResult.rows.length > 0
    ? (registryResult.rows[0].data as Record<string, unknown>).name as string
    : null;

  // Aggregate interaction metrics
  const metricsResult = await query(
    `SELECT
       COUNT(*) as total_interactions,
       COUNT(DISTINCT data->>'userId') as unique_users,
       MAX(data->>'timestamp') as last_interaction
     FROM "${LOGS_TABLE}"
     WHERE data->>'featureId' = $1`,
    [featureId]
  );

  const row = metricsResult.rows[0];
  if (Number(row.total_interactions) === 0 && !featureName) return null;

  return {
    featureId,
    featureName,
    totalInteractions: Number(row.total_interactions),
    uniqueUsers: Number(row.unique_users),
    lastInteraction: row.last_interaction || null,
  };
}

export async function getAdoptionSummary(): Promise<FeatureMetrics[]> {
  const result = await query(
    `SELECT
       data->>'featureId' as feature_id,
       COUNT(*) as total_interactions,
       COUNT(DISTINCT data->>'userId') as unique_users,
       MAX(data->>'timestamp') as last_interaction
     FROM "${LOGS_TABLE}"
     GROUP BY data->>'featureId'
     ORDER BY total_interactions DESC`
  );

  // Fetch all feature names from registry
  const registryResult = await query(
    `SELECT data->>'featureId' as feature_id, data->>'name' as name FROM "${REGISTRY_TABLE}"`
  );
  const nameMap = new Map<string, string>();
  for (const row of registryResult.rows) {
    nameMap.set(row.feature_id, row.name);
  }

  return result.rows.map((row) => ({
    featureId: row.feature_id,
    featureName: nameMap.get(row.feature_id) || null,
    totalInteractions: Number(row.total_interactions),
    uniqueUsers: Number(row.unique_users),
    lastInteraction: row.last_interaction || null,
  }));
}
