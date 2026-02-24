# Intent Audit

Evaluate every system prompt in a backend service file against the
intent-first standard and generate rewrites for any that fail.

## Usage

```
/intent-audit [service-file-name-or-path]
```

**Examples:**
- `/intent-audit b2bContentAIService` — audit the B2B content AI service
- `/intent-audit agentService` — audit the agent orchestration service
- `/intent-audit src/backend/b2bResearchAgentService.jsw` — full path also works
- `/intent-audit` — (no argument) scan all LLM-calling backend services

---

## What This Audit Does

### Step 1 — Locate Prompts

Read the target file(s) and find every system prompt:
- Variables named `systemPrompt`, `system_prompt`, `SYSTEM_PROMPT`
- Variables assigned template literals containing AI instruction patterns
- Constants in `BRAND_VOICE`, `PROMPTS`, or similar objects that become
  the body of system prompts

### Step 2 — Identify Surface

Determine which LMDR surface each prompt serves:

| Filename pattern | Surface |
|-----------------|---------|
| `b2b*` | B2B / Account Executive |
| `agent*` with `driver` role | Driver |
| `agent*` with `recruiter` role | Recruiter |
| `agent*` with `carrier` role | Carrier |
| `agent*` with `admin` role | Admin |
| `voice*`, `voiceCampaign*` | B2B (recruiter outbound) |
| `matchExplanation*` | Driver |
| `recruiter*` | Recruiter |
| `carrier*` | Carrier |
| `admin*` | Admin |
| `observability*`, `aiRouter*` | Admin |

### Step 3 — Score Each Prompt

Score each prompt against the five intent criteria from
`.claude/docs/prompt-standards.md`:

| Criterion | 0 pts | 1 pt | 2 pts |
|-----------|-------|------|-------|
| **Consumer Defined** | Not described | Role mentioned | Role + state of mind + workflow context |
| **Decision Anchored** | No decision named | Task named as decision | Specific decision with success condition |
| **Conditional Reasoning** | No conditionals | 1-2 conditions | 3+ conditions keyed to context signals |
| **Surface vs. Deep** | Not addressed | Surface addressed | Explicit surface/deep tension named |
| **Listening Instructions** | Absent | Mentioned | Specific when/how to gather input |

### Step 4 — Diagnose Each Gap

For each criterion that scores < 2:
- Name the specific gap (what's missing, not just that something is missing)
- Identify which context variables already assembled by the surrounding code
  are NOT being used in the prompt — and therefore which conditionals are
  possible to add with zero new data

### Step 5 — Generate Rewrite

For any prompt scoring < 7/10, generate a full intent-first rewrite:
- Preserve all brand voice and compliance guardrails from `BRAND_VOICE`
- Use the context variables actually assembled in the function
  (`assembleContext`, local variables, parameters)
- Add the missing consumer, decision, conditionals, and surface/deep
- Keep the output format specification in the system prompt only if it
  cannot be moved to the user prompt

Offer the rewrite inline and ask whether to apply it.

### Step 6 — Generate Report

```
## Intent Audit: [filename]
Audited: [timestamp]
Surface: [driver|recruiter|carrier|admin|b2b]
Prompts found: [N]

---

### [1] [function name] — [prompt variable name]
Score: [X]/10
Surface: [surface]

| Criterion         | Score | Gap |
|-------------------|-------|-----|
| Consumer Defined  | [0-2] | [specific gap or "✓"] |
| Decision Anchored | [0-2] | [specific gap or "✓"] |
| Conditionals      | [0-2] | [specific gap or "✓"] |
| Surface vs. Deep  | [0-2] | [specific gap or "✓"] |
| Listening         | [0-2] | [specific gap or "✓"] |

Context variables available but UNUSED in prompt:
  - [variable] → could enable conditional: [what it would check]
  - [variable] → could enable conditional: [what it would check]

Diagnosis: [1-2 sentence plain-language assessment of the biggest problem]

Rewrite (Score: 9/10):
[full intent-first system prompt]

Apply this rewrite? [Y to apply / N to skip]

---

### Summary
| Prompt | Function | Score | Action |
|--------|----------|-------|--------|
| systemPrompt | generateEmailContent | 3/10 | REWRITE |
| systemPrompt | generateSmsContent | 2/10 | REWRITE |
| systemPrompt | generateCallScript | 4/10 | REWRITE |

Prompts passing (>= 7): [N]
Prompts needing rewrite (< 7): [N]
```

---

## Surface-Specific Evaluation Notes

### B2B / AE Surface (`b2bContentAIService.jsw`, `b2bResearchAgentService.jsw`)

The three current prompts in `b2bContentAIService.jsw` all fail the same
three criteria:
1. Consumer not defined (who is the AE in this moment?)
2. No conditional on `signal_score` — the most important qualifying signal
   is assembled but never used to change the output
3. No skip condition — a score < 40 should return null content, not a generic email

When auditing B2B prompts, always check:
- Is `signal_score` used in conditional logic?
- Is there a skip/disqualify condition?
- Does the prompt vary by `purpose` (intro vs. follow_up vs. close)?
- Is `brief.talkTrack` incorporated if populated?
- Are discovery questions avoided for data already known?

### Driver Surface (`agentService.jsw` driver role, `matchExplanationService.jsw`)

Drivers are skeptical. The most common failure mode is prompts that sound
like recruiter marketing copy — optimistic, vague, full of qualifiers.

When auditing driver prompts, check:
- Does the prompt instruct the model to be honest about mismatches?
- Is there a listening instruction before delivering match information?
- Does the prompt translate jargon (FMCSA, CSA, HOS) into plain language?
- Does it vary by match score (80+ vs. 40-60 vs. below)?

### Recruiter Surface (`agentService.jsw` recruiter role)

Recruiters think in pipelines. The most common failure mode is prompts that
produce narrative output instead of ranked, actionable lists.

When auditing recruiter prompts, check:
- Does the output format produce scannable prioritized output?
- Are drivers ranked by conversion probability, not by recency?
- Does the prompt use `days_since_last_contact` as a conditional?
- Is there a threshold below which a driver should be deprioritized?

### Carrier Surface (`agentService.jsw` carrier role)

Carriers are skeptical of vendor claims. They measure in hires, not leads.

When auditing carrier prompts, check:
- Does the prompt use fill_rate as the primary metric?
- Is there a condition to surface bad news directly (not soften it)?
- Does the prompt compare against benchmarks when available?

### Admin Surface (`agentService.jsw` admin role, `observabilityService.jsw`)

Admins are internal and technical. The most common failure mode is prompts
that soften status reporting.

When auditing admin prompts, check:
- Is there a severity hierarchy (P0/P1/P2)?
- Does the prompt instruct the model to say "everything is healthy" in one
  line rather than narrating each healthy metric?
- Are anomalies surfaced prominently, not buried in lists?

---

## Applying Rewrites

When the user approves a rewrite, apply it using Edit to replace the old
system prompt string with the new one. Then add the intent audit comment
block immediately after:

```javascript
/* INTENT AUDIT
   Consumer: [who receives this output]
   Decision: [what decision they face]
   Score: [X/10]
   Last audited: [YYYY-MM-DD]
*/
```

After applying all approved rewrites, remind the user to sync:
```
Rewrites applied. Run /sync or git push to deploy.
Remember: system prompt changes affect live AI behavior immediately after deploy.
Test in preview before pushing to production.
```

---

## Special Case: BRAND_VOICE Constants

`b2bContentAIService.jsw` uses `${BRAND_VOICE.core}` and
`${BRAND_VOICE.compliance}` as the opening of system prompts.

These constants are **compliance guardrails, not intent**. They must be
followed by intent content. When scoring a prompt that opens with
`${BRAND_VOICE.core}`, score the intent content that follows — not the
brand constants themselves.

If a prompt is ONLY `${BRAND_VOICE.core}` + format instructions, it scores
0 on Consumer, 0 on Decision, 0 on Conditionals, 0 on Surface/Deep, 0 on
Listening = **1/10** (compliance only).

---

## Audit Process (Step by Step)

1. Read the target service file completely
2. Locate all system prompt variables and the functions that contain them
3. For each prompt:
   a. Note what context is assembled in the surrounding code
   b. Score against the 5 criteria
   c. List which assembled context variables are unused by the prompt
   d. Generate the diagnosis
   e. Write the rewrite if score < 7
4. Present the full report
5. For each rewrite offered, wait for user approval before applying
6. After all approved rewrites are applied, suggest syncing

Run the full audit now on the specified file.
