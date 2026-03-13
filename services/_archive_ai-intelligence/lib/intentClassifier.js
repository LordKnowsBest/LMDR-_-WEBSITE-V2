/**
 * Intent Classifier
 *
 * Fast intent classification using Groq llama-3.3-70b-versatile.
 * Returns intent class, confidence, namespace scope, tool priority hints,
 * frame hint, and extracted entities.
 *
 * Target: < 150ms P95 latency.
 * Falls back to general_inquiry on low confidence (< 0.5) or any error.
 */

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';
const MAX_TOKENS = 300;
const TEMPERATURE = 0.1;
const CLASSIFY_TIMEOUT_MS = 3000; // internal timeout (caller uses 150ms)

// ── Role-Specific Intent Classes ────────────────────────────────────────────

const ROLE_INTENTS = {
  driver: [
    'carrier_discovery', 'carrier_intel_request', 'compensation_discovery',
    'application_support', 'compliance_question', 'profile_help',
    'friction_resolution', 'market_research', 'personal_recall', 'onboarding',
  ],
  recruiter: [
    'driver_search', 'pipeline_analysis', 'candidate_intel', 'outreach_help',
    'market_analysis', 'campaign_management', 'compliance_check', 'onboarding_help',
  ],
  admin: [
    'system_health', 'data_analysis', 'ai_performance', 'operational_query',
    'anomaly_investigation',
  ],
  carrier: [
    'driver_acquisition', 'market_benchmarking', 'compliance_ops', 'profile_management',
  ],
};

// ── Namespace Scoping per Intent ────────────────────────────────────────────

const INTENT_NAMESPACE_MAP = {
  // Driver
  carrier_discovery:      ['carrier_intel', 'driver_market', 'lane_market'],
  carrier_intel_request:  ['carrier_intel'],
  compensation_discovery: ['driver_market', 'lane_market', 'carrier_intel'],
  application_support:    ['platform_ops'],
  compliance_question:    ['industry_regs', 'platform_ops'],
  profile_help:           ['driver_market', 'platform_ops'],
  friction_resolution:    ['driver_market', 'platform_ops', 'carrier_intel'],
  market_research:        ['lane_market', 'driver_market'],
  personal_recall:        ['conversation_memory'],
  onboarding:             ['platform_ops'],
  // Recruiter
  driver_search:          ['driver_market'],
  pipeline_analysis:      ['driver_market', 'carrier_intel'],
  candidate_intel:        ['conversation_memory', 'driver_market'],
  outreach_help:          ['driver_market', 'carrier_intel'],
  market_analysis:        ['driver_market', 'lane_market', 'carrier_intel'],
  campaign_management:    ['platform_ops'],
  compliance_check:       ['industry_regs'],
  onboarding_help:        ['platform_ops'],
  // Admin — mostly tool-driven, minimal RAG
  system_health:          [],
  data_analysis:          [],
  ai_performance:         [],
  operational_query:      [],
  anomaly_investigation:  ['platform_ops'],
  // Carrier
  driver_acquisition:     ['driver_market'],
  market_benchmarking:    ['driver_market', 'lane_market', 'carrier_intel'],
  compliance_ops:         ['industry_regs'],
  profile_management:     ['platform_ops'],
  // Fallback
  general_inquiry:        [],
};

// ── Frame Hint Mapping ──────────────────────────────────────────────────────

const INTENT_FRAME_MAP = {
  carrier_discovery:      'direct_tactical',
  carrier_intel_request:  'empathetic_informative',
  compensation_discovery: 'analytical_precise',
  application_support:    'educational_clear',
  compliance_question:    'educational_clear',
  profile_help:           'motivational_action',
  friction_resolution:    'motivational_action',
  market_research:        'analytical_precise',
  personal_recall:        'neutral_helpful',
  onboarding:             'educational_clear',
  driver_search:          'direct_tactical',
  pipeline_analysis:      'analytical_precise',
  candidate_intel:        'direct_tactical',
  outreach_help:          'direct_tactical',
  market_analysis:        'analytical_precise',
  campaign_management:    'direct_tactical',
  compliance_check:       'analytical_precise',
  onboarding_help:        'educational_clear',
  system_health:          'analytical_precise',
  data_analysis:          'analytical_precise',
  ai_performance:         'analytical_precise',
  operational_query:      'direct_tactical',
  anomaly_investigation:  'analytical_precise',
  driver_acquisition:     'direct_tactical',
  market_benchmarking:    'analytical_precise',
  compliance_ops:         'educational_clear',
  profile_management:     'direct_tactical',
  general_inquiry:        'neutral_helpful',
};

// ── Role Default Namespaces (for fallback) ──────────────────────────────────

const ROLE_DEFAULT_NAMESPACES = {
  driver:    ['carrier_intel', 'driver_market', 'platform_ops', 'industry_regs', 'lane_market'],
  recruiter: ['driver_market', 'carrier_intel', 'lane_market', 'platform_ops', 'industry_regs'],
  admin:     ['platform_ops', 'carrier_intel', 'driver_market', 'lane_market'],
  carrier:   ['driver_market', 'carrier_intel', 'lane_market', 'platform_ops'],
};

// ── Few-Shot Examples ───────────────────────────────────────────────────────

const DRIVER_EXAMPLES = `
Message: "I'm in Dallas looking for flatbed OTR work, at least 55 cents a mile"
→ {"intentClass":"carrier_discovery","confidence":0.95,"namespaceScope":["carrier_intel","driver_market"],"toolPriorityHints":["search_carriers","get_matches"],"frameHint":"direct_tactical","entities":{"carriers":[],"topics":["flatbed","OTR","pay"],"regions":["Dallas","TX"]}}

Message: "What do other drivers say about Werner's home time?"
→ {"intentClass":"carrier_intel_request","confidence":0.93,"namespaceScope":["carrier_intel"],"toolPriorityHints":["get_carrier_details","get_carrier_enrichment"],"frameHint":"empathetic_informative","entities":{"carriers":["Werner Enterprises"],"topics":["home_time","driver_sentiment"]}}

Message: "Is $0.54 a mile good for OTR flatbed with 4 years experience?"
→ {"intentClass":"compensation_discovery","confidence":0.91,"namespaceScope":["driver_market","lane_market"],"toolPriorityHints":["get_market_rates"],"frameHint":"analytical_precise","entities":{"carriers":[],"topics":["pay","flatbed","OTR","experience"]}}

Message: "What does it mean if a carrier has a conditional safety rating?"
→ {"intentClass":"compliance_question","confidence":0.94,"namespaceScope":["industry_regs"],"toolPriorityHints":["get_regulatory_info"],"frameHint":"educational_clear","entities":{"carriers":[],"topics":["safety_rating","FMCSA","conditional"]}}
`;

const RECRUITER_EXAMPLES = `
Message: "Find me CDL-A drivers in Dallas with at least 2 years experience"
→ {"intentClass":"driver_search","confidence":0.96,"namespaceScope":["driver_market"],"toolPriorityHints":["search_drivers","get_driver_candidates"],"frameHint":"direct_tactical","entities":{"carriers":[],"topics":["CDL-A","experience"],"regions":["Dallas"]}}

Message: "Why aren't my matches converting? Application to hire rate dropped this month"
→ {"intentClass":"pipeline_analysis","confidence":0.89,"namespaceScope":["driver_market","carrier_intel"],"toolPriorityHints":["get_pipeline_report","analyze_conversion_funnel"],"frameHint":"analytical_precise","entities":{"carriers":[],"topics":["conversion","pipeline","hiring"]}}
`;

const ADMIN_EXAMPLES = `
Message: "Is everything working? Any errors in the last hour?"
→ {"intentClass":"system_health","confidence":0.95,"namespaceScope":[],"toolPriorityHints":["get_health_status","get_active_anomalies"],"frameHint":"analytical_precise","entities":{"carriers":[],"topics":["errors","system_status"]}}

Message: "How many drivers signed up this week? Match rate trend?"
→ {"intentClass":"data_analysis","confidence":0.92,"namespaceScope":[],"toolPriorityHints":["get_platform_analytics","get_match_analytics"],"frameHint":"analytical_precise","entities":{"carriers":[],"topics":["driver_signups","match_rate"]}}
`;

const CARRIER_EXAMPLES = `
Message: "What are competitors paying for OTR drivers right now?"
→ {"intentClass":"market_benchmarking","confidence":0.90,"namespaceScope":["driver_market","lane_market","carrier_intel"],"toolPriorityHints":["get_market_compensation_benchmark"],"frameHint":"analytical_precise","entities":{"carriers":[],"topics":["pay","OTR","competition"]}}

Message: "Find me OTR drivers interested in hazmat work"
→ {"intentClass":"driver_acquisition","confidence":0.94,"namespaceScope":["driver_market"],"toolPriorityHints":["search_drivers","get_matched_drivers"],"frameHint":"direct_tactical","entities":{"carriers":[],"topics":["OTR","hazmat"]}}
`;

const ROLE_EXAMPLES = {
  driver: DRIVER_EXAMPLES,
  recruiter: RECRUITER_EXAMPLES,
  admin: ADMIN_EXAMPLES,
  carrier: CARRIER_EXAMPLES,
};

// ── Classifier ──────────────────────────────────────────────────────────────

/**
 * Build the classifier system prompt for a given role.
 */
function buildClassifierPrompt(role) {
  const classes = (ROLE_INTENTS[role] || []).concat('general_inquiry');
  const examples = ROLE_EXAMPLES[role] || '';

  return `You are an intent classifier for a CDL truck driver recruitment platform.
Classify the user's message into the most appropriate intent class.
Return ONLY a JSON object with no additional text.

User role: ${role}
Available intent classes for this role:
${classes.join(', ')}

Rules:
- If no class has confidence >= 0.50, use "general_inquiry"
- entities.carriers must contain exact carrier name strings only
- entities.dot_numbers must contain only numeric DOT number strings
- namespaceScope order matters: most relevant namespace first

Few-shot examples:
${examples}

Return JSON with these exact fields:
{
  "intentClass": "<class_name>",
  "confidence": <0.0 to 1.0>,
  "namespaceScope": ["<namespace1>"],
  "toolPriorityHints": ["<tool1>"],
  "frameHint": "<frame_hint_value>",
  "entities": { "carriers": [], "topics": [], "regions": [], "dot_numbers": [] }
}`;
}

/**
 * Classify the intent of a user message.
 *
 * @param {string} message - User's raw message (max 500 chars)
 * @param {string} role - driver | recruiter | admin | carrier
 * @param {string[]} [recentContext=[]] - Last 2-3 turn summaries
 * @returns {Promise<{
 *   intentClass: string,
 *   confidence: number,
 *   namespaceScope: string[],
 *   toolPriorityHints: string[],
 *   frameHint: string,
 *   entities: object,
 *   retrievalFilters: object,
 *   latencyMs: number,
 *   model: string
 * }>}
 */
export async function classifyIntent(message, role, recentContext = []) {
  const startTime = Date.now();

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('[intentClassifier] GROQ_API_KEY not set — using fallback');
    return buildFallback(role, startTime);
  }

  const systemPrompt = buildClassifierPrompt(role);
  const contextStr = recentContext.length > 0
    ? `\n\nRecent conversation context:\n${recentContext.map(c => `- ${c}`).join('\n')}`
    : '';

  const userContent = `${message.substring(0, 500)}${contextStr}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLASSIFY_TIMEOUT_MS);

  try {
    const res = await fetch(GROQ_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.error(`[intentClassifier] Groq API returned ${res.status}`);
      return buildFallback(role, startTime);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return buildFallback(role, startTime);
    }

    const parsed = JSON.parse(content);
    const latencyMs = Date.now() - startTime;

    // Validate intent class
    const validClasses = (ROLE_INTENTS[role] || []).concat('general_inquiry');
    if (!validClasses.includes(parsed.intentClass)) {
      parsed.intentClass = 'general_inquiry';
      parsed.confidence = 0;
    }

    // Force fallback on low confidence
    if ((parsed.confidence || 0) < 0.5) {
      parsed.intentClass = 'general_inquiry';
    }

    // Resolve namespace scope from the intent map if not provided
    const namespaceScope = parsed.namespaceScope?.length > 0
      ? parsed.namespaceScope
      : (INTENT_NAMESPACE_MAP[parsed.intentClass] || ROLE_DEFAULT_NAMESPACES[role] || []);

    // Resolve frame hint
    const frameHint = parsed.frameHint || INTENT_FRAME_MAP[parsed.intentClass] || 'neutral_helpful';

    // Build retrieval filters from entities
    const retrievalFilters = buildRetrievalFilters(parsed.entities, namespaceScope);

    return {
      intentClass: parsed.intentClass,
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0)),
      namespaceScope,
      toolPriorityHints: parsed.toolPriorityHints || [],
      frameHint,
      entities: parsed.entities || {},
      retrievalFilters,
      latencyMs,
      model: MODEL,
    };
  } catch (err) {
    clearTimeout(timer);
    console.error('[intentClassifier] Classification failed:', err.message);
    return buildFallback(role, startTime);
  }
}

/**
 * Build fallback intent result for when classification fails.
 */
function buildFallback(role, startTime) {
  return {
    intentClass: 'general_inquiry',
    confidence: 0,
    namespaceScope: ROLE_DEFAULT_NAMESPACES[role] || [],
    toolPriorityHints: [],
    frameHint: 'neutral_helpful',
    entities: {},
    retrievalFilters: {},
    latencyMs: Date.now() - startTime,
    model: MODEL,
  };
}

/**
 * Build per-namespace retrieval filters from extracted entities.
 */
function buildRetrievalFilters(entities, namespaceScope) {
  if (!entities) return {};
  const filters = {};

  // If carrier names are mentioned and carrier_intel is in scope, add a filter
  if (entities.carriers?.length > 0 && namespaceScope.includes('carrier_intel')) {
    filters.carrier_intel = { carrier_name: entities.carriers[0] };
  }

  // If DOT numbers are present, prefer those as more precise
  if (entities.dot_numbers?.length > 0 && namespaceScope.includes('carrier_intel')) {
    filters.carrier_intel = { dot_number: entities.dot_numbers[0] };
  }

  return filters;
}

export { ROLE_DEFAULT_NAMESPACES, INTENT_NAMESPACE_MAP, INTENT_FRAME_MAP };
