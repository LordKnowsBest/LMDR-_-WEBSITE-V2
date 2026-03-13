/**
 * Context Budget Manager
 *
 * Manages token budgets for RAG context injection into system prompts.
 * Ensures retrieved chunks fit within the allocated token budget
 * without truncating mid-chunk.
 *
 * Token estimation uses 4 chars/token heuristic (conservative for English).
 */

const CHARS_PER_TOKEN = 4;

/**
 * Estimate token count for a text string.
 * @param {string} text
 * @returns {number}
 */
export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Assemble retrieved chunks into a context block within the token budget.
 * Never truncates a chunk mid-sentence — includes whole chunks or excludes them.
 * Chunks must be pre-sorted by combinedScore descending.
 *
 * @param {Array<{ documentId: string, namespace: string, text: string, metadata: object, combinedScore: number }>} chunks
 * @param {number} budgetTokens - Maximum tokens for the context block (default: 2000)
 * @returns {{ contextBlock: string, includedChunks: Array, totalTokens: number }}
 */
export function assembleContextBudget(chunks, budgetTokens = 2000) {
  if (!chunks || chunks.length === 0) {
    return { contextBlock: '', includedChunks: [], totalTokens: 0 };
  }

  const included = [];
  let totalTokens = 0;

  // Reserve tokens for XML wrapper tags
  const wrapperOverhead = estimateTokens('<knowledge_context>\n</knowledge_context>');
  let remainingBudget = budgetTokens - wrapperOverhead;

  for (const chunk of chunks) {
    const header = formatChunkHeader(chunk);
    const chunkText = `${header}\n${chunk.text}\n`;
    const chunkTokens = estimateTokens(chunkText);

    if (chunkTokens > remainingBudget) {
      // Don't truncate — skip this chunk and try the next (smaller) one
      continue;
    }

    included.push(chunk);
    totalTokens += chunkTokens;
    remainingBudget -= chunkTokens;
  }

  if (included.length === 0) {
    return { contextBlock: '', includedChunks: [], totalTokens: 0 };
  }

  const contextBlock = formatContextBlock(included);
  return {
    contextBlock,
    includedChunks: included,
    totalTokens: totalTokens + wrapperOverhead,
  };
}

/**
 * Format a single chunk's header line based on namespace and metadata.
 */
function formatChunkHeader(chunk) {
  const ns = chunk.namespace || 'unknown';
  const meta = chunk.metadata || {};

  switch (ns) {
    case 'carrier_intel': {
      const name = meta.carrier_name || `DOT ${meta.dot_number || '?'}`;
      const date = meta.enriched_at ? new Date(meta.enriched_at).toISOString().split('T')[0] : 'unknown';
      return `[CARRIER INTELLIGENCE — ${name}]\nSource: Enrichment Data | Verified: ${date} | Confidence: High`;
    }
    case 'driver_market': {
      const cat = meta.topic_category || 'General';
      const date = meta.generated_at ? new Date(meta.generated_at).toISOString().split('T')[0] : 'unknown';
      return `[DRIVER MARKET — ${cat}]\nSource: Platform Aggregate | Verified: ${date}`;
    }
    case 'platform_ops': {
      const docType = meta.doc_type || 'Platform Guide';
      return `[PLATFORM — ${docType}]`;
    }
    case 'industry_regs': {
      const regCat = meta.reg_category || 'FMCSA Regulation';
      return `[REGULATION — ${regCat}]`;
    }
    case 'lane_market': {
      const region = meta.lane_region || 'National';
      const date = meta.data_date ? new Date(meta.data_date).toISOString().split('T')[0] : 'unknown';
      return `[LANE MARKET — ${region}]\nSource: Market Data | Date: ${date}`;
    }
    case 'conversation_memory': {
      return `[PREVIOUS CONVERSATION]`;
    }
    default:
      return `[${ns.toUpperCase()}]`;
  }
}

/**
 * Format the full context block with XML wrapping.
 */
function formatContextBlock(chunks) {
  const sections = chunks.map(chunk => {
    const header = formatChunkHeader(chunk);
    return `${header}\n\n${chunk.text}`;
  });

  return `<knowledge_context>\n${sections.join('\n\n')}\n</knowledge_context>`;
}
