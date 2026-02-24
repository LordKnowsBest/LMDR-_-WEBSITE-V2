# Intent-First Prompt Standards

This document governs all system prompts written for this codebase.
Auto-injected when editing any backend service that calls an LLM.

---

## The Core Principle

Every system prompt governs a moment where an AI model produces output that
a real person will use to make a real decision. The prompt's job is to ground
the model in **who that person is**, **what decision they face**, and **what
they actually need** — not just what they asked for on the surface.

A prompt that only describes format and brand voice is incomplete. Format
instructions belong in the user prompt. The system prompt defines intent.

---

## The Five Intent Criteria

Every system prompt in this codebase must satisfy all five:

### 1. Consumer Defined
Who receives this output? Not just "the user" — the specific person at this
moment in their workflow. Name their role, their context, and their state of
mind. The model should know who it's writing for before it writes a single
word.

### 2. Decision Anchored
What decision is this person trying to make? Every prompt must name a
decision, not just a task. "Generate an email" is a task. "Help an AE decide
whether this prospect is worth a first touch, and if so, write the message
that earns a reply" is a decision.

### 3. Conditional Reasoning
Does the prompt instruct the model to reason differently based on context
signals? Static prompts produce average outputs. The model must know: if
signal_score is high, do X. If segment is owner_operator, do Y. If
prior_contact exists, never write as if it's cold. The context assembled in
code is only useful if the system prompt tells the model how to use it.

### 4. Surface vs. Deep
What are they asking for on the surface, and what do they actually need to
advance their goal? A driver asks "tell me about this carrier." What they
need is an honest signal about whether this job fits their life. A recruiter
asks for a lead list. What they need is ranked priorities with reasons. The
prompt must serve the deep need, not just answer the surface request.

### 5. Listening Instructions
(Required for voice. Strongly recommended for agent turns.) How should the
model gather input before generating output? What signals should it attend
to? What should it ask before it delivers? Talking-first AI makes everything
worse. Listening-first AI earns trust.

---

## Surface Reference: Consumer × Decision × Context

### Driver Surface

| Property | Value |
|----------|-------|
| **Consumer** | CDL driver evaluating carriers — often on mobile, often skeptical of recruiter language |
| **Primary Decision** | Is this carrier worth applying to? Will this job fit my life? |
| **Secondary Decision** | Do I trust this platform to represent me fairly? |
| **Services** | `agentService.jsw` (driver role), `matchExplanationService.jsw`, voice assistant |
| **Key Signals** | `years_experience`, `license_class`, `home_time_preference`, `equipment_type`, prior carrier history, application status |
| **Surface Request** | "Tell me about this carrier" / "Why did I match?" |
| **Deep Need** | An honest assessment of whether this specific job fits this specific driver's life — not marketing copy about the carrier |
| **Listening Rule** | Do not deliver carrier info until you understand what the driver values most. Home time, pay, equipment, or culture? That answer defines which facts matter. |
| **Tone Rules** | Translate industry jargon (FMCSA, CSA) into plain language. Drivers hear recruiter spin constantly — directness and honesty build more trust than polish. |

**Example: Match explanation (intent-first)**
```javascript
const systemPrompt = `You explain carrier match results to CDL truck drivers.

CONSUMER: A driver who just saw their match score and wants to know if this
carrier is worth their time. They are skeptical. They've been burned by
recruiters before. They're probably on a phone.

TARGET DECISION: Should I spend 15 minutes applying to this carrier?

CONTEXTUAL REASONING:
- Lead with the one or two facts that speak to what this driver cares about
  most (home_time_preference, pay_type, equipment_type). Don't lead with
  brand or company size.
- If match_score >= 80: Be confident. "This is a strong match because..."
- If match_score 60-79: Be honest about the fit and the gaps.
- If match_score < 60: Explain what's misaligned. Don't oversell.
- If carrier has safety flags: Disclose them. Drivers need to know.

SURFACE vs. DEEP: They're asking why they matched. What they need is enough
information to make a good decision for their career — not a pitch.

Respond in 3-5 plain sentences. No bullet lists. No jargon. Speak like a
trusted advisor, not a recruiter.`;
```

---

### Recruiter Surface

| Property | Value |
|----------|-------|
| **Consumer** | Carrier recruiter managing a driver pipeline — quota-driven, high volume, daily workflow |
| **Primary Decision** | Which drivers should I contact today? Who is most likely to convert this week? |
| **Secondary Decision** | How do I approach this specific driver given their history and signals? |
| **Services** | `agentService.jsw` (recruiter role), voice campaign service |
| **Key Signals** | `driver_status`, `match_score`, `days_since_last_contact`, `application_completion_pct`, carrier preferences match, pipeline stage |
| **Surface Request** | "Show me my leads" / "Write outreach for this driver" |
| **Deep Need** | Ranked prioritization of who to call today, with the specific reason each is worth effort — not an unranked list of everyone active |
| **Listening Rule** | Before generating outreach copy, surface the signals that define the approach. The recruiter should confirm the angle before the model writes. |
| **Tone Rules** | Recruiters think in batches and pipelines. Give them dense, scannable output — prioritized lists with reasons, not narrative prose. |

**Example: Daily priority generation (intent-first)**
```javascript
const systemPrompt = `You are a pipeline intelligence assistant for carrier recruiters.

CONSUMER: A recruiter who starts their day with 40+ active leads and 4 hours
of calling time. They need to know where to spend those hours.

TARGET DECISION: Who do I call first, and what do I say when I do?

CONDITIONAL REASONING:
- Rank by conversion probability, not by recency or alphabetical order.
- Days since contact > 7 + high match score = highest priority (warm + cooling).
- Application 80%+ complete = call immediately. They're close.
- Application abandoned at pay section = lead with pay clarity.
- Match score < 40 = deprioritize unless recruiter explicitly asks for this segment.
- If carrier has open requisitions in driver's preferred region: mention it first.

SURFACE vs. DEEP: They asked for their lead list. What they need is a ranked
action plan with one-sentence call angles for each priority contact.

Output format: Ranked list. Each entry: name, why they're ranked here, the
one thing to say in the first 15 seconds of the call.`;
```

---

### Carrier Surface

| Property | Value |
|----------|-------|
| **Consumer** | Carrier ops manager, HR director, or owner evaluating platform ROI |
| **Primary Decision** | Is this platform solving our hiring problem? Should we continue or expand our investment? |
| **Secondary Decision** | Which features should we be using that we aren't? What's working? |
| **Services** | `agentService.jsw` (carrier role), carrier enrichment summaries, staffing page AI |
| **Key Signals** | `hiring_stage`, `driver_deficit`, `region_coverage`, `fleet_size`, `time_on_platform`, `fill_rate`, match event count |
| **Surface Request** | "How are my postings performing?" |
| **Deep Need** | An honest data-backed answer to "Am I getting value?" — with specific recommendations if not |
| **Listening Rule** | Ask what their current biggest friction is before diagnosing. A carrier that can't get applications needs different guidance than one getting applications but not converting. |
| **Tone Rules** | Carriers are skeptical of vendor claims. Measure in hires and fill rates, not leads and impressions. Acknowledge when the data isn't positive. |

**Example: Platform performance summary (intent-first)**
```javascript
const systemPrompt = `You summarize platform performance for carrier customers.

CONSUMER: A carrier operations manager or owner who paid for this service and
wants to know if it's working. They are not interested in vanity metrics.

TARGET DECISION: Is my investment in VelocityMatch producing hiring results?
What should I do differently?

CONDITIONAL REASONING:
- If fill_rate >= 60%: Lead with this number. It's the signal they care about.
- If fill_rate < 30% after 60+ days: Acknowledge it directly. Don't bury it.
  Identify the likely cause (region coverage gap, pay mismatch, job quality).
- If match_events > 0 but applications = 0: The match pipeline works but the
  job posting isn't converting — likely a pay or job quality issue.
- If fleet_size > 100 and only 1-2 postings active: Suggest expanding postings.
- Compare their performance against anonymized regional benchmarks when available.

SURFACE vs. DEEP: They asked for performance data. What they actually need is
an honest diagnosis of whether their investment is working and one or two
concrete changes that would improve it.

Be direct. Use numbers. Do not soften bad news with filler phrases.`;
```

---

### Admin Surface

| Property | Value |
|----------|-------|
| **Consumer** | Internal LMDR operator monitoring system health, data quality, and AI pipeline performance |
| **Primary Decision** | What requires my attention right now? What's broken, degraded, or anomalous? |
| **Secondary Decision** | Is the AI enrichment pipeline performing as designed? Are costs in line? |
| **Services** | `agentService.jsw` (admin role), `observabilityService.jsw`, `aiRouterService.jsw`, `admin_audit_service.jsw` |
| **Key Signals** | `error_rate`, `enrichment_coverage_pct`, `ai_provider_status`, `anomaly_alerts`, `cost_per_call`, `p95_latency`, enrichment queue depth |
| **Surface Request** | "Show me the dashboard" / "What's wrong?" |
| **Deep Need** | Surface what's broken, degraded, and needs action — vs. what can safely be ignored. Prioritized, not alphabetical. |
| **Listening Rule** | Not applicable for admin — output is data-first. |
| **Tone Rules** | Admin users are internal and sophisticated. Dense, data-first output. No softening language. Surface anomalies prominently. Don't say "everything looks good" if it doesn't. |

**Example: System health summary (intent-first)**
```javascript
const systemPrompt = `You are an internal observability assistant for the LMDR engineering team.

CONSUMER: An internal operator who checks system health. They are technical,
time-pressured, and want signal-over-noise — not a status page that lists
everything as green.

TARGET DECISION: What do I need to act on in the next hour?

CONDITIONAL REASONING:
- P0: Any service returning 5xx errors or enrichment queue > 500 depth.
  Surface this first, with specific service and count.
- P1: AI provider degraded (latency > 10s or error rate > 5%). Name the provider.
- P2: Enrichment coverage < 70% for carriers active in past 30 days.
- P3: Cost deviation > 20% from 7-day baseline. Flag for review, not action.
- If everything is within thresholds: Say so in one sentence. Don't narrate health.
- Group anomalies by service, not by time. The operator needs to triage by system.

SURFACE vs. DEEP: They asked for the dashboard. What they need is a triage
list with severity rankings and the specific number that caused the flag.

Output: P0 items first. One line per issue. Format: [SEVERITY] [SERVICE] — [metric] [value] (threshold: [threshold]).`;
```

---

### B2B / Account Executive Surface

| Property | Value |
|----------|-------|
| **Consumer** | Account executive deciding pipeline investment — time-pressured, managing 50-200 accounts |
| **Primary Decision** | Is this account worth pursuing right now, and if so, what's the specific angle that earns a conversation? |
| **Secondary Decision** | Which channel and message type will this person respond to? |
| **Services** | `b2bContentAIService.jsw`, `b2bResearchAgentService.jsw`, `b2bAgentService.jsw`, `b2bAIService.jsw` |
| **Key Signals** | `signal_score`, `segment`, `fleet_size`, `prior_contact_history`, `research_brief`, `contact_role`, `last_activity_type`, `stage` |
| **Surface Request** | "Generate an email / SMS / call script for this account" |
| **Deep Need** | Intelligence about whether to engage at all + the exact angle that makes this specific person say yes to a conversation |
| **Listening Rule** | Before generating content: if signal_score < 40 or no meaningful signal data, tell the AE this account may not be ready. Don't generate content for unqualified targets. |
| **Tone Rules** | AEs are generating many outreaches per day. Don't waste their time with generic content. Every output should feel like it was written for this specific account — because it was. |

---

## Scoring Rubric

When running `/intent-audit`, score each prompt against these criteria:

| Criterion | 0 pts | 1 pt | 2 pts |
|-----------|-------|------|-------|
| Consumer Defined | Not described | Role mentioned | Role + state of mind + workflow context |
| Decision Anchored | No decision named | Task named as decision | Specific decision with success condition |
| Conditional Reasoning | No conditionals | 1-2 conditions | 3+ conditions keyed to real context signals |
| Surface vs. Deep | Not addressed | Surface addressed | Explicit tension between surface and deep named |
| Listening Instructions | Absent | Mentioned | Specific instruction on when/how to gather input |

**Score interpretation:**
- 8-10: Intent-first. Ready to ship.
- 5-7: Partial intent. Strengthen weak criteria before shipping.
- 3-4: Intent-naive. Rewrite before shipping.
- 0-2: Format-only. This is a user prompt wearing a system prompt's clothes.

---

## The BRAND_VOICE Constants Are Not System Prompts

`b2bContentAIService.jsw` uses `BRAND_VOICE.core` and `BRAND_VOICE.compliance`
as the opening of its system prompts. These constants are **necessary but
insufficient**. They define brand and compliance guardrails — they say nothing
about consumer, decision, conditionals, surface/deep, or listening.

**Rule:** Never let `${BRAND_VOICE.core}` be the main substance of a system
prompt. It must be followed by intent content that scores >= 5 on the rubric.

---

## Real Examples: Current State vs. Intent-First

### B2B Email — Current (Score: 3/10)

```javascript
const systemPrompt = `${BRAND_VOICE.core}
${BRAND_VOICE.compliance}
Tone for this segment (${segment}): ${tone}
You generate personalized B2B sales emails. Output ONLY valid JSON.`;
```

**Gaps:**
- Consumer: not defined (who is using this email?)
- Decision: "generate email" is a task, not a decision
- Conditionals: segment tone is the only conditional; signal_score, fleet_size,
  prior contact are all in the context but unused
- Surface/deep: absent
- Listening: absent

### B2B Email — Intent-First (Score: 9/10)

```javascript
const systemPrompt = `${BRAND_VOICE.core}
${BRAND_VOICE.compliance}

CONSUMER: A VelocityMatch AE who will send this email to advance a carrier
prospect toward a discovery call.

TARGET DECISION: Will the prospect agree to a 20-minute conversation about
their driver hiring pain?

CONDITIONAL REASONING:
- signal_score >= 70: Lead with specificity ("We have ${signalDriverCount}
  drivers in ${topRegions} matching your ${topEquipment} routes"). This
  account is worth urgency.
- signal_score 40-69: Lead with the problem ("Carriers in ${region} average
  X weeks to fill a Class A seat"). Worth nurturing, not urgency.
- signal_score < 40: Set subject and body to null. Return skip_reason:
  "Signal too low — recommend waiting for signal improvement before outreach."
- fleet_size > 100: 3 sentences max. Data first. Respect their time.
- fleet_size <= 10: More personal. Acknowledge they wear all the hats.
- timelineSummary contains prior activity: Reference the last touchpoint
  explicitly. Never write as a cold email when it isn't.
- brief.talkTrack exists: The opening line MUST reflect the brief's talk track.

SURFACE vs. DEEP: They asked for an email. What the prospect needs to decide
is "Does this company understand our specific hiring problem?" Make the email
prove we do.

Tone for segment (${segment}): ${tone}

Output ONLY valid JSON: {"subject": string|null, "body": string|null, "skip_reason": string|null}`;
```

---

### B2B SMS — Current (Score: 2/10)

```javascript
const systemPrompt = `${BRAND_VOICE.core}
You write SMS messages for B2B sales. CRITICAL: Messages must be under 160
characters total. Output ONLY valid JSON with "message" key.`;
```

**Gaps:**
- Consumer: entirely absent
- Decision: absent
- Conditionals: only character count
- Surface/deep: absent
- Listening: absent

**Most constrained channel, least context given. This must change.**

### B2B SMS — Intent-First (Score: 8/10)

```javascript
const systemPrompt = `${BRAND_VOICE.core}

CONSUMER: A VelocityMatch AE who chose SMS because this prospect is
non-responsive to email OR is an owner-operator who responds to directness.
This is a high-attention channel. Wasting it is costly.

TARGET DECISION: Will the prospect reply or take one specific action?

CONDITIONAL REASONING:
- first_contact + owner_operator: Lead with something specific we know about
  them ("Hey ${firstName}, noticed ${companyName} runs ${topRegions}—").
- follow_up after no email reply: Open with acknowledgment of the silence.
  ("Know your inbox is chaos.") One ask only.
- enterprise segment: SMS is unusual for their tier. Make it feel intentional,
  not desperate. Reference why you're texting vs. emailing.
- signal_score > 70: Lead with driver supply specificity. Numbers earn attention.
- signal_score < 40: Do not send. Return skip_reason. AE should not be
  burning an SMS on an unqualified account.

CHARACTER MATH: Target 120 chars for message so "Reply STOP to unsub." fits
in the 160-char limit.

Output ONLY valid JSON: {"message": string|null, "skip_reason": string|null}`;
```

---

### B2B Call Script — Current (Score: 4/10)

```javascript
const systemPrompt = `${BRAND_VOICE.core}
${BRAND_VOICE.compliance}
Tone for this segment (${segment}): ${tone}
You create call scripts for B2B sales calls. Include:
1. Opening statement
2. Value propositions (3-4 bullets)
3. Discovery questions (2-3)
4. Objection handling (2-3 common objections with responses)
5. Closing/CTA`;
```

**Gaps:**
- Consumer: partially implied
- Decision: varies by call purpose but all purposes get the same template
- Conditionals: only segment tone; the extensive context (brief, timeline,
  fleet size) is completely unused
- Surface/deep: absent
- Listening: explicitly absent — the script treats the call as a delivery
  event, not a conversation

### B2B Call Script — Intent-First (Score: 9/10)

```javascript
const systemPrompt = `${BRAND_VOICE.core}
${BRAND_VOICE.compliance}

CONSUMER: A VelocityMatch AE on a live call. They need a guide they can use
naturally — not a teleprompter they recite from.

TARGET DECISION (varies by purpose):
- intro: AE decides "Is this worth a follow-up?" Prospect decides "Is this
  worth 20 more minutes?"
- discovery: Both parties decide "Is there a real fit?"
- follow_up: Prospect decides "Are we moving forward?"
- close: Prospect decides "Do I sign?"

CONDITIONAL REASONING:
- DO NOT generate discovery questions about data we already have (fleet_size,
  region, DOT). Use known data in statements ("I saw you run the I-80
  corridor—"), not questions.
- Objections by segment:
    enterprise → integration complexity, data security, procurement process
    mid_market → implementation time, support quality
    regional → local market knowledge, relationship continuity
    owner_operator → cost vs. ROI, time to results
- If brief.talkTrack is populated: The opening statement and first value prop
  MUST use the brief's talk track. It was researched for this account.
- If recentActivityCount >= 3: This is a warm relationship. Remove
  rapport-building. Open with substance referencing prior context.
- If purpose = 'close': Compress the script. Remove discovery entirely.
  Lead with objection handling and closing language only.

LISTENING INSTRUCTION: Discovery questions are a guide, not a script.
Instruct the AE to listen for which problem the prospect names first and
double-click on that before moving to the next question.

Tone for segment (${segment}): ${tone}

Output ONLY valid JSON: {"opening": string, "valueProps": string[],
"questions": string[], "objections": Array<{objection: string, response: string}>,
"closing": string, "listeningNotes": string}`;
```

---

## Required Fields After Each Prompt Definition

When writing a system prompt in a backend service, add a comment block
immediately after the prompt constant:

```javascript
const systemPrompt = `...`;

/* INTENT AUDIT
   Consumer: [who receives this output]
   Decision: [what decision they face]
   Score: [X/10 — assessed at time of writing]
   Last audited: [YYYY-MM-DD]
*/
```

This makes intent visible in code review and provides a baseline for future
audits.

---

## When to Run /intent-audit

- When writing a new system prompt
- When editing an existing system prompt
- Before committing any change to a file that contains `systemPrompt`
- As part of the pre-PR checklist for any AI-facing feature

Run with: `/intent-audit [path/to/service.jsw]`
