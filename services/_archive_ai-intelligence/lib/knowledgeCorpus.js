/**
 * Knowledge Corpus Configuration
 *
 * Defines namespace configurations, chunk builders, and PII scrubbing
 * for the RAG knowledge base.
 *
 * Pinecone indexes:
 *   lmdr-knowledge — carrier_intel, driver_market, platform_ops, industry_regs, lane_market
 *   lmdr-memory    — conversation_memory (per-user, metadata-filtered)
 */

// ── Pinecone Host Configuration ─────────────────────────────────────────────
// These will be set once the indexes are created in Pinecone.
// Placeholder format matches existing lmdr-drivers/lmdr-carriers pattern.
export const PINECONE_HOSTS = {
  knowledge: process.env.PINECONE_KNOWLEDGE_HOST || '',
  memory:    process.env.PINECONE_MEMORY_HOST || '',
};

// ── Namespace Definitions ───────────────────────────────────────────────────

export const NAMESPACES = {
  carrier_intel: {
    index: 'knowledge',
    namespace: 'carrier_intel',
    accessRoles: ['driver', 'recruiter', 'admin', 'carrier', 'b2b'],
    ttlHours: 168, // 7 days
    requiredMetadata: ['dot_number', 'chunk_type', 'enriched_at'],
  },
  driver_market: {
    index: 'knowledge',
    namespace: 'driver_market',
    accessRoles: ['driver', 'recruiter', 'admin', 'carrier'],
    ttlHours: 24,
    requiredMetadata: ['topic_category', 'generated_at'],
  },
  platform_ops: {
    index: 'knowledge',
    namespace: 'platform_ops',
    accessRoles: ['driver', 'recruiter', 'admin', 'carrier'],
    ttlHours: 720, // 30 days
    requiredMetadata: ['doc_type', 'last_updated'],
  },
  industry_regs: {
    index: 'knowledge',
    namespace: 'industry_regs',
    accessRoles: ['driver', 'recruiter'],
    ttlHours: 2160, // 90 days
    requiredMetadata: ['reg_category', 'effective_date'],
  },
  lane_market: {
    index: 'knowledge',
    namespace: 'lane_market',
    accessRoles: ['driver', 'recruiter', 'admin', 'carrier'],
    ttlHours: 6,
    requiredMetadata: ['lane_region', 'data_date'],
  },
  conversation_memory: {
    index: 'memory',
    namespace: 'conversation_memory',
    accessRoles: ['driver', 'recruiter', 'carrier'],
    ttlHours: 2160, // 90 days
    requiredMetadata: ['user_id', 'role', 'conversation_id', 'turn_index', 'created_at'],
    securityNote: 'user_id metadata filter ALWAYS required on queries',
  },
};

// ── Role-to-Default-Namespaces Mapping ──────────────────────────────────────

export const ROLE_DEFAULT_NAMESPACES = {
  driver:    ['carrier_intel', 'driver_market', 'platform_ops', 'industry_regs', 'lane_market'],
  recruiter: ['driver_market', 'carrier_intel', 'lane_market', 'platform_ops', 'industry_regs'],
  admin:     ['platform_ops', 'carrier_intel', 'driver_market', 'lane_market'],
  carrier:   ['driver_market', 'carrier_intel', 'lane_market', 'platform_ops'],
};

// ── Access Control ──────────────────────────────────────────────────────────

/**
 * Check if a role has access to a namespace.
 * @param {string} role
 * @param {string} namespace
 * @returns {boolean}
 */
export function hasNamespaceAccess(role, namespace) {
  const ns = NAMESPACES[namespace];
  if (!ns) return false;
  return ns.accessRoles.includes(role);
}

/**
 * Filter namespace list to only those accessible by the given role.
 * @param {string} role
 * @param {string[]} namespaces
 * @returns {string[]}
 */
export function filterAccessibleNamespaces(role, namespaces) {
  return namespaces.filter(ns => hasNamespaceAccess(role, ns));
}

// ── PII Scrubbing ───────────────────────────────────────────────────────────

const PII_PATTERNS = [
  { pattern: /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g, replacement: '[SSN]' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL]' },
  { pattern: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, replacement: '[PHONE]' },
  { pattern: /\b[A-Z]\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/gi, replacement: '[CDL_NUM]' },
];

/**
 * Scrub PII from text before embedding.
 * @param {string} text
 * @returns {string}
 */
export function scrubPII(text) {
  if (!text) return text;
  let cleaned = text;
  for (const { pattern, replacement } of PII_PATTERNS) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  return cleaned;
}

// ── Freshness Scoring ───────────────────────────────────────────────────────

/**
 * Calculate freshness score for a document.
 * @param {string} ingestedAt - ISO timestamp of last ingestion
 * @param {number} ttlHours - TTL in hours for the namespace
 * @returns {number} Score between 0 and 1 (1 = freshly ingested, 0 = expired)
 */
export function calculateFreshnessScore(ingestedAt, ttlHours) {
  if (!ingestedAt || !ttlHours) return 0;
  const hoursSince = (Date.now() - new Date(ingestedAt).getTime()) / (1000 * 60 * 60);
  return Math.max(0, Math.min(1, 1 - (hoursSince / ttlHours)));
}

/**
 * Determine freshness status label.
 * @param {string} ingestedAt
 * @param {number} ttlHours
 * @returns {'fresh' | 'stale' | 'expired'}
 */
export function getFreshnessStatus(ingestedAt, ttlHours) {
  if (!ingestedAt || !ttlHours) return 'expired';
  const hoursSince = (Date.now() - new Date(ingestedAt).getTime()) / (1000 * 60 * 60);
  if (hoursSince < ttlHours * 0.8) return 'fresh';
  if (hoursSince < ttlHours) return 'stale';
  return 'expired';
}

// ── Chunk Text Validation ───────────────────────────────────────────────────

const MAX_CHUNK_CHARS = 8000;

/**
 * Validate and prepare text for ingestion.
 * @param {string} text
 * @returns {{ valid: boolean, text: string, error?: string }}
 */
export function validateChunkText(text) {
  if (!text || typeof text !== 'string') {
    return { valid: false, text: '', error: 'Text is required and must be a string' };
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { valid: false, text: '', error: 'Text cannot be empty' };
  }
  if (trimmed.length > MAX_CHUNK_CHARS) {
    return { valid: false, text: '', error: `Text exceeds ${MAX_CHUNK_CHARS} character limit (got ${trimmed.length})` };
  }
  return { valid: true, text: scrubPII(trimmed) };
}
