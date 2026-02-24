# Intent Taxonomy — LMDR Agent Intelligence Layer

**Track:** `rag_intent_layer_20260224`
**Purpose:** Complete reference for all intent classes across all four agent roles. Used as few-shot examples for the Groq intent classifier and as the source of truth for namespace scope and tool priority assignments.

---

## How to Read This Document

Each intent class entry contains:
- **When to classify:** Natural language examples that should trigger this class
- **Deep intent:** What the user actually wants (not just what they said)
- **Namespace scope:** Which knowledge namespaces to retrieve from (ordered by priority)
- **Tool priority hints:** Tools to surface first in the agent's action space
- **Frame hint:** Response tone/format guidance
- **Few-shot example:** One labeled (message → output) pair for the classifier prompt

The classifier will use these few-shot examples directly. Quality and specificity of examples directly determines classification accuracy.

---

## Driver Role Intents

### `carrier_discovery`

**When to classify:**
- "What carriers are hiring near me?"
- "Show me flatbed jobs in Texas"
- "I want OTR work, what's available?"
- "Looking for carriers that hire new CDL holders"
- "Find me a carrier with good home time"

**Deep intent:** The driver is exploring the job market. They may be actively leaving their current carrier or proactively scanning. They need a curated list with enough context to evaluate options quickly.

**Namespace scope:** `carrier_intel`, `driver_market`, `lane_market`

**Tool priority hints:** `search_carriers`, `get_matches`, `get_top_matches`

**Frame hint:** `direct_tactical`

**Few-shot example:**
```
Message: "I'm in Dallas looking for flatbed OTR work, at least 55 cents a mile"
Role: driver
→ {
  "intentClass": "carrier_discovery",
  "confidence": 0.95,
  "namespaceScope": ["carrier_intel", "driver_market"],
  "toolPriorityHints": ["search_carriers", "get_matches"],
  "frameHint": "direct_tactical",
  "entities": { "carriers": [], "topics": ["flatbed", "OTR", "pay"], "regions": ["Dallas", "TX"] }
}
```

---

### `carrier_intel_request`

**When to classify:**
- "What's Werner like?"
- "Tell me about JB Hunt's home time"
- "Is Schneider a good company to drive for?"
- "What do drivers say about Prime's pay?"
- "How is the safety record at CR England?"

**Deep intent:** The driver has a specific carrier in mind and wants intelligence to evaluate it. They want verified data, not marketing copy. Driver sentiment is the highest-value signal here.

**Namespace scope:** `carrier_intel`

**Retrieval filter:** Carrier name or DOT number as metadata filter on `carrier_intel` namespace.

**Tool priority hints:** `get_carrier_details`, `get_carrier_enrichment`, `get_carrier_reviews`

**Frame hint:** `empathetic_informative`

**Few-shot example:**
```
Message: "What do other drivers say about Werner's home time? Is it actually as promised?"
Role: driver
→ {
  "intentClass": "carrier_intel_request",
  "confidence": 0.93,
  "namespaceScope": ["carrier_intel"],
  "toolPriorityHints": ["get_carrier_details", "get_carrier_enrichment"],
  "frameHint": "empathetic_informative",
  "entities": { "carriers": ["Werner Enterprises"], "topics": ["home_time", "driver_sentiment"] },
  "retrievalFilters": { "carrier_intel": { "carrier_name": "Werner Enterprises" } }
}
```

---

### `compensation_discovery`

**When to classify:**
- "What does flatbed pay?"
- "Average CPM for OTR right now?"
- "Is $0.52 a mile good for a new CDL-A?"
- "How much do team drivers make?"
- "What's the going rate for hazmat tanker?"

**Deep intent:** The driver is benchmarking — either evaluating an offer they've received, setting expectations before applying, or trying to understand if they're underpaid. They need market context, not a single number.

**Namespace scope:** `driver_market`, `lane_market`, `carrier_intel`

**Tool priority hints:** `get_market_rates`, `get_carrier_pay_range`

**Frame hint:** `analytical_precise`

**Few-shot example:**
```
Message: "Is $0.54 a mile good for OTR flatbed with 4 years experience in the southeast?"
Role: driver
→ {
  "intentClass": "compensation_discovery",
  "confidence": 0.91,
  "namespaceScope": ["driver_market", "lane_market"],
  "toolPriorityHints": ["get_market_rates"],
  "frameHint": "analytical_precise",
  "entities": { "carriers": [], "topics": ["pay", "flatbed", "OTR", "experience"], "regions": ["southeast"] }
}
```

---

### `application_support`

**When to classify:**
- "How do I apply?"
- "I submitted an interest, now what?"
- "Haven't heard back from a carrier I applied to"
- "How do I withdraw an application?"
- "What happens after I express interest?"

**Deep intent:** The driver is in a specific step of the application funnel and needs procedural guidance. They want to know what to do next, not why the process works the way it does.

**Namespace scope:** `platform_ops`

**Tool priority hints:** `get_application_status`, `get_applications_list`, `apply_to_carrier`

**Frame hint:** `educational_clear`

**Few-shot example:**
```
Message: "I clicked interested on 3 carriers last week but haven't heard anything"
Role: driver
→ {
  "intentClass": "application_support",
  "confidence": 0.88,
  "namespaceScope": ["platform_ops"],
  "toolPriorityHints": ["get_application_status", "get_applications_list"],
  "frameHint": "educational_clear",
  "entities": { "carriers": [], "topics": ["application_status", "interest_submitted"] }
}
```

---

### `compliance_question`

**When to classify:**
- "Do I need a Hazmat endorsement for this job?"
- "What's the difference between CDL A and B?"
- "How do hours of service work for OTR?"
- "My medical certificate expires next month, what do I do?"
- "What is the FMCSA Clearinghouse?"

**Deep intent:** The driver needs a factual, authoritative answer about a regulatory or compliance topic. Being wrong here has professional consequences — accuracy and clarity matter more than personality.

**Namespace scope:** `industry_regs`, `platform_ops`

**Tool priority hints:** `get_regulatory_info`, `get_cdl_requirements`

**Frame hint:** `educational_clear`

**Few-shot example:**
```
Message: "What does it mean if a carrier has a conditional safety rating from FMCSA?"
Role: driver
→ {
  "intentClass": "compliance_question",
  "confidence": 0.94,
  "namespaceScope": ["industry_regs"],
  "toolPriorityHints": ["get_regulatory_info"],
  "frameHint": "educational_clear",
  "entities": { "carriers": [], "topics": ["safety_rating", "FMCSA", "conditional"] }
}
```

---

### `profile_help`

**When to classify:**
- "How do I improve my profile?"
- "Why am I not matching with any carriers?"
- "Should I add my Tanker endorsement?"
- "What should I put for my preferred routes?"
- "My profile score is low, what do I fix?"

**Deep intent:** The driver wants to improve their visibility and match quality. They may feel frustrated that the platform isn't working for them. They need specific, actionable improvements, not generic advice.

**Namespace scope:** `driver_market`, `platform_ops`

**Tool priority hints:** `get_profile_score`, `get_profile_suggestions`, `get_match_analysis`

**Frame hint:** `motivational_action`

**Few-shot example:**
```
Message: "My profile says 67% complete, what am I missing and does it actually matter?"
Role: driver
→ {
  "intentClass": "profile_help",
  "confidence": 0.89,
  "namespaceScope": ["driver_market", "platform_ops"],
  "toolPriorityHints": ["get_profile_score", "get_profile_suggestions"],
  "frameHint": "motivational_action",
  "entities": { "carriers": [], "topics": ["profile_completeness", "match_quality"] }
}
```

---

### `friction_resolution`

**When to classify:**
- "I keep getting rejected from carriers"
- "No one is responding to my applications"
- "I've been on this platform for 2 months and nothing"
- "Why won't carriers talk to me?"
- "I'm frustrated, nothing is working"

**Deep intent:** The driver is experiencing failure in the job search and may be close to churning. This is a retention-critical intent. They need acknowledgment, diagnosis (what's actually blocking them), and a concrete path forward.

**Namespace scope:** `driver_market`, `platform_ops`, `carrier_intel`

**Tool priority hints:** `analyze_match_gaps`, `get_profile_analysis`, `get_rejection_patterns`

**Frame hint:** `motivational_action`

**Few-shot example:**
```
Message: "I've expressed interest in 15 carriers and only 2 responded. What am I doing wrong?"
Role: driver
→ {
  "intentClass": "friction_resolution",
  "confidence": 0.92,
  "namespaceScope": ["driver_market", "platform_ops"],
  "toolPriorityHints": ["analyze_match_gaps", "get_profile_analysis"],
  "frameHint": "motivational_action",
  "entities": { "carriers": [], "topics": ["low_response_rate", "application_friction"] }
}
```

---

### `market_research`

**When to classify:**
- "Is flatbed in demand right now?"
- "What's the job market like for new CDL holders?"
- "Are carriers hiring more or less than last year?"
- "When is the best time to look for a truck driving job?"
- "How is the freight market affecting driver wages?"

**Deep intent:** The driver is doing strategic research — they want to time their move or understand the macro context before committing. They need current market intelligence, not platitudes.

**Namespace scope:** `lane_market`, `driver_market`

**Tool priority hints:** `get_market_conditions`, `get_hiring_demand_signals`

**Frame hint:** `analytical_precise`

**Few-shot example:**
```
Message: "Is this a good time to be looking for OTR work or should I wait a few months?"
Role: driver
→ {
  "intentClass": "market_research",
  "confidence": 0.85,
  "namespaceScope": ["lane_market", "driver_market"],
  "toolPriorityHints": ["get_market_conditions"],
  "frameHint": "analytical_precise",
  "entities": { "carriers": [], "topics": ["market_timing", "OTR", "hiring_demand"] }
}
```

---

### `personal_recall`

**When to classify:**
- "What carriers did I apply to?"
- "Remind me what I told you about my home time preference"
- "What was that carrier you mentioned last time?"
- "Did I ever look at Werner before?"
- "What's my current application status?"

**Deep intent:** The driver wants to resume a previous context — either from this conversation or from a prior one. They trust the platform to remember what they've shared.

**Namespace scope:** `conversation_memory`

**Tool priority hints:** `get_application_history`, `get_conversation_history`, `get_match_history`

**Frame hint:** `neutral_helpful`

**Security note:** `conversation_memory` retrieval requires `userId` metadata filter. This intent class must never be processed without a verified user context.

**Few-shot example:**
```
Message: "Remind me which carriers we looked at last week and which ones I liked"
Role: driver
→ {
  "intentClass": "personal_recall",
  "confidence": 0.96,
  "namespaceScope": ["conversation_memory"],
  "toolPriorityHints": ["get_conversation_history", "get_match_history"],
  "frameHint": "neutral_helpful",
  "entities": { "carriers": [], "topics": ["application_history", "prior_conversation"] }
}
```

---

### `onboarding`

**When to classify:**
- "How does this work?"
- "What is LMDR?"
- "How do I find a job here?"
- "What's the difference between this and a job board?"
- "I just signed up, where do I start?"

**Deep intent:** New or confused user needs to understand what they're working with before they can use it effectively. Clarity and simplicity matter above all else.

**Namespace scope:** `platform_ops`

**Tool priority hints:** `get_onboarding_guide`, `get_platform_overview`

**Frame hint:** `educational_clear`

---

## Recruiter Role Intents

### `driver_search`

**When to classify:**
- "Find me CDL-A drivers in Dallas"
- "I need OTR flatbed experienced only"
- "Show me drivers available in the next 2 weeks in the southeast"
- "Any hazmat-endorsed drivers in Texas or Oklahoma?"

**Deep intent:** The recruiter needs candidates. They have a specific requirement and want a qualified list fast. Context: every day a seat goes empty costs the carrier money.

**Namespace scope:** `driver_market`

**Tool priority hints:** `search_drivers`, `get_driver_candidates`, `get_available_drivers`

**Frame hint:** `direct_tactical`

---

### `pipeline_analysis`

**When to classify:**
- "Why aren't my matches converting?"
- "Show me where candidates are dropping off"
- "My application-to-hire rate dropped this month"
- "What's my average time to place?"
- "Which of my open positions has the worst funnel?"

**Deep intent:** The recruiter wants to understand what's broken in their process. They're looking for actionable diagnosis, not just metrics.

**Namespace scope:** `driver_market`, `carrier_intel`

**Tool priority hints:** `get_pipeline_report`, `analyze_conversion_funnel`, `get_placement_analytics`

**Frame hint:** `analytical_precise`

---

### `candidate_intel`

**When to classify:**
- "Tell me about this driver before I call them"
- "What's the match score for this candidate?"
- "Any red flags on this driver's profile?"
- "What's this driver's work history summary?"

**Deep intent:** Recruiter is about to initiate contact and wants to be informed. They want briefing-style intelligence — relevant facts, not raw data.

**Namespace scope:** `conversation_memory` (this driver's platform history), `driver_market`

**Tool priority hints:** `get_driver_profile`, `get_match_score`, `get_driver_history`

**Frame hint:** `direct_tactical`

---

### `outreach_help`

**When to classify:**
- "Write me a message for this driver"
- "What's the best way to approach someone who's been inactive for 30 days?"
- "Help me draft an SMS for my top 10 leads"
- "What should I say to a driver who turned down my last offer?"

**Deep intent:** The recruiter needs help with communication. The AI should draft, refine, or advise — and the output should be immediately usable.

**Namespace scope:** `driver_market`, `carrier_intel`

**Tool priority hints:** `draft_outreach_message`, `get_contact_preferences`, `get_driver_profile`

**Frame hint:** `direct_tactical`

---

### `market_analysis`

**When to classify:**
- "What's the supply of hazmat drivers right now?"
- "Are CDL-A applicants up or down this quarter?"
- "What are competitors offering that I'm not?"
- "Is my pay competitive for OTR in the Midwest?"

**Deep intent:** The recruiter wants market intelligence to inform strategy — hiring velocity, pay competitiveness, supply/demand conditions.

**Namespace scope:** `driver_market`, `lane_market`, `carrier_intel`

**Tool priority hints:** `get_driver_supply_report`, `get_market_compensation_benchmark`

**Frame hint:** `analytical_precise`

---

### `campaign_management`

**When to classify:**
- "Start a voice campaign for my top 20 leads"
- "How are my outreach campaigns performing?"
- "Schedule follow-up calls for anyone who opened my message"
- "Pause the campaign for position #3, it's been filled"

**Deep intent:** The recruiter is managing an outbound motion and needs operational control over campaigns.

**Namespace scope:** `platform_ops`

**Tool priority hints:** `create_voice_campaign`, `start_campaign`, `get_campaign_status`, `pause_campaign`

**Frame hint:** `direct_tactical`

---

### `compliance_check`

**When to classify:**
- "Is this driver DOT-compliant?"
- "Check their Clearinghouse status"
- "Does this driver have an active medical certificate?"
- "Any violations in their driving record?"

**Deep intent:** Recruiter needs to screen a specific driver for regulatory compliance before moving them through the pipeline.

**Namespace scope:** `industry_regs`

**Tool priority hints:** `check_driver_compliance`, `get_clearinghouse_status`, `verify_medical_cert`

**Frame hint:** `analytical_precise`

---

### `onboarding_help`

**When to classify:**
- "How do I set up my carrier profile?"
- "How do I post an open position?"
- "Where do I see my matched drivers?"
- "How does the voice campaign feature work?"

**Namespace scope:** `platform_ops`

**Tool priority hints:** `get_recruiter_guide`, `get_platform_features`

**Frame hint:** `educational_clear`

---

## Admin Role Intents

### `system_health`

**When to classify:**
- "Is everything working?"
- "Any errors in the last hour?"
- "Are the AI providers all up?"
- "Is enrichment running?"
- "What's the Railway microservice status?"

**Deep intent:** Admin needs a rapid status overview — are there fires right now?

**Namespace scope:** (tools only — structured health data, not knowledge retrieval)

**Tool priority hints:** `get_health_status`, `get_active_anomalies`, `get_system_status`

**Frame hint:** `analytical_precise`

---

### `data_analysis`

**When to classify:**
- "How many drivers signed up this week?"
- "Match rate trend over the last 30 days?"
- "How many carriers have completed enrichment?"
- "What's the conversion rate from match to application?"

**Deep intent:** Admin wants structured metrics. Response should lead with numbers.

**Namespace scope:** (tools only)

**Tool priority hints:** `get_platform_analytics`, `get_match_analytics`, `get_driver_growth_metrics`

**Frame hint:** `analytical_precise`

---

### `ai_performance`

**When to classify:**
- "Is the AI routing working correctly?"
- "Cost per agent turn this week?"
- "Which provider is being selected most?"
- "Is the cost optimizer saving money?"
- "What's the average RAG retrieval latency?"

**Deep intent:** Admin wants AI layer observability — cost, quality, latency.

**Namespace scope:** (tools only)

**Tool priority hints:** `get_ai_usage_report`, `get_cost_optimizer_status`, `get_provider_metrics`

**Frame hint:** `analytical_precise`

---

### `operational_query`

**When to classify:**
- "Show me active carriers"
- "Who are the top recruiters this month?"
- "List pending enrichment jobs"
- "Show me drivers who haven't been matched yet"

**Deep intent:** Admin needs to access and act on specific operational data.

**Namespace scope:** (tools only)

**Tool priority hints:** `get_carriers`, `get_recruiters`, `get_enrichment_queue`, `get_unmatched_drivers`

**Frame hint:** `direct_tactical`

---

### `anomaly_investigation`

**When to classify:**
- "Why did matching quality drop last night?"
- "Investigate the spike in errors at 3pm"
- "There was a weird pattern in driver sign-ups yesterday"
- "Why is enrichment taking longer than usual?"

**Deep intent:** Admin needs root cause analysis on an observed anomaly. This may require multiple tool calls and synthesis.

**Namespace scope:** `platform_ops`

**Tool priority hints:** `get_anomaly_details`, `get_system_traces`, `run_anomaly_detection`

**Frame hint:** `analytical_precise`

---

## Carrier Role Intents

### `driver_acquisition`

**When to classify:**
- "Find me OTR drivers"
- "How many CDL-A drivers are available in my lanes?"
- "Show me drivers interested in my carrier"
- "I need to fill 15 seats, what's available?"

**Deep intent:** The carrier wants driver candidates. They are cost-sensitive about time-to-fill and retention.

**Namespace scope:** `driver_market`

**Tool priority hints:** `search_drivers`, `get_matched_drivers`, `get_interested_drivers`

**Frame hint:** `direct_tactical`

---

### `market_benchmarking`

**When to classify:**
- "What are competitors paying?"
- "Am I competitive with my current pay package?"
- "What benefits do drivers say they want most?"
- "What's the average sign-on bonus for OTR drivers right now?"

**Deep intent:** The carrier wants to understand their competitive position in the driver market.

**Namespace scope:** `driver_market`, `lane_market`, `carrier_intel`

**Tool priority hints:** `get_market_compensation_benchmark`, `get_driver_preference_report`

**Frame hint:** `analytical_precise`

---

### `compliance_ops`

**When to classify:**
- "What are the drug testing requirements for new hires?"
- "How does the FMCSA Clearinghouse process work?"
- "What do I need to onboard a new CDL driver?"
- "What's the mandatory reporting for drug test positives?"

**Namespace scope:** `industry_regs`

**Tool priority hints:** `get_compliance_guide`, `get_fmcsa_requirements`

**Frame hint:** `educational_clear`

---

### `profile_management`

**When to classify:**
- "Update my hiring criteria"
- "Change my pay range to $0.54-$0.62"
- "How do I add a new open position?"
- "Update our home time policy"

**Namespace scope:** `platform_ops`

**Tool priority hints:** `update_carrier_profile`, `update_hiring_criteria`, `manage_open_positions`

**Frame hint:** `direct_tactical`

---

## Fallback: `general_inquiry`

**When to classify:**
- Message does not clearly match any class above
- Confidence on best-matching class is < 0.50
- Message is ambiguous across multiple high-confidence classes

**Deep intent:** Unknown — retrieve broadly, let the agent infer the need.

**Namespace scope:** All namespaces accessible to the role. For driver: all five role-accessible namespaces. Retrieval `topK` is reduced to 3 per namespace (vs. default 5) to prevent context bloat.

**Tool priority hints:** [] (empty — agent determines tool order)

**Frame hint:** `neutral_helpful`

**Few-shot example:**
```
Message: "I'm not sure what to do next"
Role: driver
→ {
  "intentClass": "general_inquiry",
  "confidence": 0.22,
  "namespaceScope": ["carrier_intel", "driver_market", "platform_ops", "industry_regs", "lane_market"],
  "toolPriorityHints": [],
  "frameHint": "neutral_helpful",
  "entities": {}
}
```

---

## Classifier Prompt Template

The following template is loaded into `lib/intentClassifier.js` per role. The `{ROLE_SPECIFIC_CLASSES}` and `{FEW_SHOT_EXAMPLES}` blocks are populated at startup from this taxonomy file.

```
You are an intent classifier for a CDL truck driver recruitment platform.
Classify the user's message into the most appropriate intent class.
Return ONLY a JSON object with no additional text.

User role: {role}
Available intent classes for this role:
{ROLE_SPECIFIC_CLASSES}

Recent conversation context (last 2-3 turns):
{recentContext}

User message: "{message}"

Classify and return:
{
  "intentClass": "<class_name>",
  "confidence": <0.0 to 1.0>,
  "namespaceScope": ["<namespace1>", "<namespace2>"],
  "toolPriorityHints": ["<tool1>", "<tool2>"],
  "frameHint": "<frame_hint_value>",
  "entities": {
    "carriers": [],
    "topics": [],
    "regions": [],
    "dot_numbers": []
  }
}

Rules:
- If no class has confidence >= 0.50, use "general_inquiry"
- entities.carriers must contain exact carrier name strings only
- entities.dot_numbers must contain only numeric DOT number strings
- namespaceScope order matters: most relevant namespace first

Few-shot examples:
{FEW_SHOT_EXAMPLES}
```
