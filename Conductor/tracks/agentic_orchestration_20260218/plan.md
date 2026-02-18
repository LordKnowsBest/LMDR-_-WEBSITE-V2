# Plan — Agentic Orchestration (Cross-Role)

## Status: Phase 3 COMPLETE — Phase 4 Next

**Execution Plane delivered 2026-02-17.** Agent orchestration, voice integration, and 4-surface UI are live. **Control Plane Phase 1A+1B delivered 2026-02-18.** Policy-tagged tools, run ledger, approval gates, outcome evaluator, cost controls, E2E tests, and KPI dashboard are live. Phase 2 (Cross-Role Intelligence Mesh) is next.

---

## Current State (delivered)

| Component | Status | Files |
|-----------|--------|-------|
| Agent orchestration loop | LIVE | `agentService.jsw` (22 tools, 4 roles, tool_use loop) |
| Conversation persistence | LIVE | `agentConversationService.jsw` (conversations + turns) |
| VAPI voice integration | LIVE | `voiceService.jsw`, `voiceCampaignService.jsw` |
| Webhook tool execution | LIVE | `http-functions.js` (VAPI webhook → tool dispatch) |
| 4 surface UIs | LIVE | Driver, Recruiter, Admin, B2B agent chat + voice orbs |
| 6 Airtable tables | LIVE | Agent Conversations/Turns, Voice Call Logs/Assistants/Campaigns/Contacts |
| Claude Code agents | LIVE | 6 agent definitions (deploy, test-bridge, seed-data, audit-schema, purge-cdn, create-page) |
| Test coverage | LIVE | 7 suites, 46 tests + 1 e2e test |

---

## What's Missing: The Outcome Verification Spine

The execution plane works — agents can call tools and return responses. But nothing verifies whether those responses produce *good outcomes*. Three critical layers are absent:

### 1. Policy Layer (Control Plane)
- Tools have no risk classification → high-risk actions execute without approval
- No per-run cost/token budgets → agents can burn resources on low-value conversations
- No rate limits per tool → no protection against runaway loops

### 2. Outcome Layer (Run Ledger)
- Runs are fire-and-forget → no structured record of what happened and whether it worked
- No correlation IDs → can't trace a user request through conversation → tools → data changes
- No success metrics → "did this help the driver?" is unanswerable
- No follow-up task generation → runs don't produce actionable next steps

### 3. Learning Layer (Knowledge Plane)
- No feedback loops → run outcomes don't improve future tool selection or prompts
- No cross-role signal sharing → carrier intelligence doesn't inform recruiting decisions
- No compendium → patterns and failures aren't captured systematically

---

## Phase 1A — Outcome Verification Spine (COMPLETE — 2026-02-18)

**Goal:** Every agent action is classified, tracked, outcome-scored, and approval-gated.

### 1A.1 Policy-Tagged Tool Registry

Add metadata to every tool in `TOOL_DEFINITIONS`:

```javascript
find_matches: {
  // ... existing fields ...
  policy: {
    risk_level: 'read',           // read | suggest | execute_low | execute_high
    requires_approval: false,      // pause and ask user before executing
    rate_limit: 30,                // max calls per minute per user
    success_metric: 'matches_returned > 0 && user_clicks_result',
    rollback_strategy: null,       // read-only, no rollback needed
    audit_fields: ['zip', 'maxDistance']  // fields to log for compliance
  }
}

update_candidate_status: {
  // ... existing fields ...
  policy: {
    risk_level: 'execute_low',
    requires_approval: false,
    rate_limit: 20,
    success_metric: 'status_changed && pipeline_progressed',
    rollback_strategy: 'revert_to_previous_status',
    audit_fields: ['interestId', 'newStatus']
  }
}

send_message: {
  // ... existing fields ...
  policy: {
    risk_level: 'execute_high',
    requires_approval: true,       // BLOCKS until user confirms
    rate_limit: 10,
    success_metric: 'message_delivered && recipient_responded_within_48h',
    rollback_strategy: null,       // can't unsend
    audit_fields: ['receiverId', 'content']
  }
}
```

**Risk classification for all 22 current tools:**

| Risk Level | Tools | Approval Required |
|------------|-------|-------------------|
| `read` | find_matches, get_carrier_details, get_fmcsa_data, road_conditions, find_parking, search_drivers, get_pipeline, get_recruiter_analytics, get_system_health, get_driver_stats, get_account, get_signals, get_opportunities | No |
| `suggest` | explain_match | No |
| `execute_low` | log_call, update_candidate_status | No |
| `execute_high` | send_message, schedule_interview, manage_prompts (create/update), submit_application | **Yes** |

### 1A.2 Run Ledger (AgentRun + AgentStep + RunOutcome)

**New collections (Airtable):**

| Collection | Key Fields | Purpose |
|------------|-----------|---------|
| `agentRuns` / `v2_Agent Runs` | run_id, conversation_id, initiator_id, role, goal_text, status (running/completed/failed/aborted), total_tokens, total_cost_usd, steps_count, started_at, completed_at, sla_ms | Immutable record of every orchestration session |
| `agentSteps` / `v2_Agent Steps` | step_id, run_id, tool_name, risk_level, args_hash, result_summary, latency_ms, retries, status (executed/approved/rejected/skipped), approval_gate_id | Individual tool executions within a run |
| `approvalGates` / `v2_Approval Gates` | gate_id, run_id, step_id, tool_name, reason, risk_level, presented_at, decision (approved/rejected/timeout), decided_by, decided_at | Human-in-the-loop decision points |
| `runOutcomes` / `v2_Run Outcomes` | outcome_id, run_id, objective_met (yes/partial/no/unknown), quality_score (0-100), user_feedback, follow_up_tasks, outcome_deltas, evaluated_at | Post-run assessment |

**Correlation ID flow:**
```
User message → runId generated
  → conversationId linked
    → each tool call gets stepId + runId
      → approval gates get gateId + stepId + runId
        → outcome record gets outcomeId + runId
```

### 1A.3 Approval Gate System

**Backend: Modify `agentService.jsw` `executeTool()` function:**

```
Before executing tool:
1. Check tool.policy.requires_approval
2. If true:
   a. Create ApprovalGate record (status: pending)
   b. Return { type: 'approval_required', gateId, toolName, args, reason }
   c. Agent loop pauses — returns approval request to surface
3. Surface shows confirmation dialog to user
4. User approves/rejects via postMessage → page code → resolveApprovalGate()
5. If approved: execute tool, continue loop
6. If rejected: skip tool, add rejection context, continue loop
```

**Frontend: Approval dialog on all 4 surfaces:**

Each agent chat module (ai-matching-agent.js, admin-agent.js, b2b-agent.js, ros-chat.js) must handle `agentApprovalRequired` message type and render a confirmation card:

```
┌─────────────────────────────────────┐
│ ⚠️ Approval Required                │
│                                     │
│ Send message to driver John D.?     │
│ "Hi John, we have an opening..."    │
│                                     │
│ Tool: send_message                  │
│ Risk: execute_high                  │
│                                     │
│  [Reject]              [Approve ✓]  │
└─────────────────────────────────────┘
```

### 1A.4 Outcome Evaluator

**New service: `agentOutcomeService.jsw`**

After every completed run, evaluate:

```javascript
async function evaluateRun(runId) {
  const run = await getRun(runId);
  const steps = await getSteps(runId);

  // Heuristic scoring v1
  let score = 50; // baseline

  // Did any tool error?
  const errors = steps.filter(s => s.status === 'error');
  score -= errors.length * 15;

  // Did user send follow-up message? (engagement signal)
  const followUp = await checkFollowUpMessage(run.conversationId, run.completedAt);
  if (followUp) score += 20;

  // Were approval gates honored? (no bypasses)
  const gates = await getGatesForRun(runId);
  const bypasses = gates.filter(g => g.decision === 'timeout');
  score -= bypasses.length * 25;

  // Did tool results contain data? (not empty/error)
  const productive = steps.filter(s => s.result_summary !== 'error' && s.result_summary !== 'empty');
  score += Math.min(30, productive.length * 10);

  score = Math.max(0, Math.min(100, score));

  await createOutcome(runId, {
    quality_score: score,
    objective_met: score >= 60 ? 'yes' : score >= 30 ? 'partial' : 'no',
    outcome_deltas: summarizeDeltas(steps),
    follow_up_tasks: generateFollowUps(run, steps, score)
  });
}
```

### 1A.5 KPI Instrumentation

Wire measurable metrics into existing observability:

| KPI | Source | Measurement |
|-----|--------|-------------|
| Time-to-first-action | `agentRuns.started_at` → first `agentSteps.created_at` | Avg latency from user message to first tool execution |
| Workflow success rate | `runOutcomes.objective_met` = 'yes' / total runs | % of runs that achieved their goal |
| Rollback rate | `agentSteps` where rollback executed / total steps | % of actions that needed reversal |
| Human override rate | `approvalGates.decision` = 'rejected' / total gates | % of approval requests rejected by users |
| Approval bypass count | `approvalGates.decision` = 'timeout' | Must be zero — alerts if non-zero |
| Cost per run | `agentRuns.total_cost_usd` | Avg AI spend per agent session |
| Token efficiency | `agentRuns.total_tokens` / `agentRuns.steps_count` | Tokens consumed per productive step |

---

## Phase 1B — Foundation Completion (COMPLETE — 2026-02-18)

### 1B.1 Runtime E2E Tests (1 per role)

| Role | Test Scenario | Verifies |
|------|--------------|----------|
| Driver | "Find carriers near 75001 paying over $0.55 CPM" | find_matches tool executes, results returned, run logged, outcome scored |
| Recruiter | "Show my pipeline and update John to interview stage" | get_pipeline + update_candidate_status chain, approval gate for status change if configured |
| Admin | "Check system health" | get_system_health executes, run ledger populated, no approval needed for read |
| Carrier | "Show signals for account ACC-001" | get_signals tool, result returned, read-level logged |

### 1B.2 Cost Controls

- Per-run token cap: 10,000 tokens (configurable per role)
- Per-run time cap: 30 seconds (5 iterations × 6s each)
- Per-user daily cap: 100 runs (prevents abuse)
- Alert threshold: runs > $0.50 USD trigger admin notification

---

## Phase 2 — Cross-Role Intelligence Mesh (COMPLETE — 2026-02-18)

### 2.1 Carrier → Recruiter Signal Sharing

**New service: `crossRoleIntelService.jsw`**

- Ingest carrier data (spot rates, capacity, disruptions) from B2B signals
- Expose as recruiter-accessible tools: `get_market_intel`, `get_lane_demand`, `get_compensation_benchmarks`
- Inject into recruiter system prompt as context: "Current market shows high demand for OTR drivers in Midwest lanes..."

### 2.2 Recruiter → Carrier Signal Sharing

- Aggregate recruiter outcomes (conversion rates, time-to-fill, drop-off reasons) by lane/equipment
- Expose as carrier-accessible tools: `get_hiring_benchmarks`, `get_conversion_insights`
- Feed back into carrier matching algorithm weights

### 2.3 Admin Observability for Agent Runs

**New admin page or dashboard section:**

- Real-time run monitor (active runs, completion rate, error rate)
- Cost dashboard (daily/weekly spend by role, top token consumers)
- Approval gate audit log (all decisions, who, when, why)
- Outcome quality trend (rolling 7-day quality score by role)

---

## Phase 3 — Recursive Compendium (COMPLETE — 2026-02-18)

### 3.1 Compendium Structure

```
Compendium/
├── recruiter/
│   ├── INDEX.md
│   ├── playbooks/outreach-cadence.md
│   ├── patterns/high-conversion-profiles.md
│   └── postmortems/campaign-failures.md
├── carrier/
│   ├── INDEX.md
│   ├── patterns/demand-signals.md
│   └── metrics/lane-performance.md
├── driver/
│   ├── INDEX.md
│   └── patterns/match-quality-signals.md
├── admin/
│   ├── INDEX.md
│   └── playbooks/incident-response.md
└── dev/
    ├── INDEX.md
    └── patterns/code-quality-rules.md
```

### 3.2 Knowledge Curator Agent

`.claude/agents/curator.md` — runs after batch of completed runs:

1. Query `runOutcomes` for recent completions
2. Extract deltas: what tools worked, what failed, quality scores
3. Update pattern cards in relevant department compendium
4. Flag regressions (quality score dropping below 50 for a role)
5. Generate weekly summary for admin

### 3.3 Auto-Sharding

When a compendium file exceeds 1,500 lines:
1. Freeze current version
2. Split by H2 headings into topic files
3. Update INDEX.md with links + timestamps
4. Archive frozen version

---

## Phase 4 — Autonomous Operations (Weeks 10-12)

### 4.1 Recruiter Autopilot

1. Recruiter selects campaign objective + approves policy profile
2. Orchestrator pulls candidates + market context
3. Outreach swarm executes call/SMS/email cadence (each send approval-gated)
4. Pipeline swarm auto-updates statuses based on outcomes
5. Curator writes campaign postmortem
6. Admin gets exception summary

### 4.2 Admin Self-Healing

1. Reliability agent detects anomaly via observability metrics
2. Triage agent isolates root cause (maps to known patterns in compendium)
3. Remediation agent proposes fix (approval-gated)
4. Verification agent runs tests after fix
5. Compendium updated with incident + resolution

### 4.3 Dev Swarm

1. Scout agents monitor error logs, audit results, style violations
2. Build agent proposes scoped code changes
3. Test agent validates changes
4. PR agent opens candidate PR with evidence + test results
5. Human reviewer approves merge

---

## Exit Criteria

- [ ] 100% of tools have policy tags (risk_level, requires_approval, success_metric)
- [ ] 100% of high-risk actions are approval-gated (zero bypasses in production)
- [ ] 80%+ of agent runs score quality_score >= 60
- [ ] Run ledger captures every agent action with full correlation chain
- [ ] Cost per run is tracked and within budget caps
- [ ] At least 1 cross-role signal pathway is live (carrier → recruiter)
- [ ] Compendium freshness SLA met (weekly updates per department)
- [ ] Human override rate < 20% (agents mostly make correct decisions)

---

## Team Implementation Plan

### Phase 1A Sprint (Weeks 1-2) — 5 Parallel Workstreams

```
┌──────────────────────────────────────────────────────────────────┐
│                     TEAM LEAD (you)                              │
│  Owns: Task creation, code review, integration testing           │
│  Coordinates: Dependency resolution between workstreams          │
└──────────┬───────────┬───────────┬───────────┬──────────────────┘
           │           │           │           │
    ┌──────┴──┐  ┌─────┴───┐  ┌───┴─────┐  ┌─┴──────────┐
    │   J1    │  │   J2    │  │   J3    │  │    J4      │
    │ Policy  │  │  Ledger │  │  Gates  │  │  Outcome   │
    │ Registry│  │  + Data │  │   UI    │  │  Evaluator │
    └─────────┘  └─────────┘  └─────────┘  └────────────┘
```

#### J1: Policy Registry + Tool Classification
**Agent type:** general-purpose
**Duration:** 2-3 hours
**Depends on:** Nothing (can start immediately)
**Delivers:**
- Modified `agentService.jsw` — add `policy` object to all 22 tool definitions
- Risk classification for every tool (read/suggest/execute_low/execute_high)
- `requires_approval` flags on high-risk tools
- Rate limit values per tool
- `success_metric` strings per tool
- `rollback_strategy` where applicable
- New helper: `getToolPolicy(toolName)` → returns policy object
- New helper: `validateToolExecution(toolName, userId)` → checks rate limits

#### J2: Run Ledger Backend + Airtable Tables
**Agent type:** general-purpose
**Duration:** 2-3 hours
**Depends on:** Nothing (can start immediately)
**Delivers:**
- 4 new Airtable tables: `v2_Agent Runs`, `v2_Agent Steps`, `v2_Approval Gates`, `v2_Run Outcomes`
- 4 new entries in `configData.js` (DATA_SOURCE, WIX_COLLECTION_NAMES, AIRTABLE_TABLE_NAMES)
- New service: `agentRunLedgerService.jsw`
  - `startRun(conversationId, role, userId, goalText)` → returns runId
  - `logStep(runId, toolName, args, result, latencyMs, status)` → returns stepId
  - `completeRun(runId, status, totalTokens, totalCost)`
  - `getRun(runId)`, `getSteps(runId)`, `getRunsByUser(userId, limit)`
- Modified `agentService.jsw` — wire `startRun`/`logStep`/`completeRun` into `handleAgentTurn` loop

#### J3: Approval Gate UI (All 4 Surfaces)
**Agent type:** general-purpose
**Duration:** 2-3 hours
**Depends on:** J1 (needs policy flags), J2 (needs gate persistence)
**Delivers:**
- Modified `agentService.jsw` — `executeTool()` checks `requires_approval`, returns `approval_required` response type
- New action in page code (all 4 pages): `agentApprovalRequired` → sends approval dialog to HTML
- New action in page code (all 4 pages): `resolveApprovalGate` → receives user decision, resumes agent loop
- Modified agent chat JS (all 4 surface modules): render approval card with tool name, risk level, args summary, approve/reject buttons
- Modified `agentRunLedgerService.jsw`: `createGate()`, `resolveGate()` persistence

#### J4: Outcome Evaluator + KPI Service
**Agent type:** general-purpose
**Duration:** 2-3 hours
**Depends on:** J2 (needs run ledger to evaluate)
**Delivers:**
- New service: `agentOutcomeService.jsw`
  - `evaluateRun(runId)` — heuristic scoring (errors, engagement, gate compliance, productivity)
  - `createOutcome(runId, data)` — persists RunOutcome record
  - `getOutcomeStats(role, days)` — aggregated quality metrics
  - `generateFollowUps(run, steps, score)` — suggests next actions
- Modified `agentService.jsw` — calls `evaluateRun()` after every completed agent turn
- New admin tool: `get_agent_kpis` added to TOOL_DEFINITIONS (admin role only)
  - Returns: success rate, avg quality score, cost per run, approval stats, error rate

### Phase 1A Execution Order

```
Hour 0:  Launch J1 + J2 in parallel (no dependencies)
Hour 2:  J1 + J2 complete → Launch J3 (needs both)
Hour 2:  Launch J4 in parallel with J3 (only needs J2)
Hour 4:  J3 + J4 complete
Hour 5:  Integration testing — full flow: message → tools → approval → outcome
Hour 6:  CLAUDE.md + track docs updated
```

### Phase 1B Sprint (Week 3) — 2 Workstreams

#### J5: Runtime E2E Tests
**Agent type:** general-purpose
**Depends on:** Phase 1A complete
**Delivers:**
- 4 runtime E2E tests (1 per role) that exercise the full chain: message → agent loop → tool execution → run ledger → outcome evaluation
- Modified existing structural tests to validate policy tags and run ledger fields

#### J6: Cost Controls + Admin Dashboard Section
**Agent type:** general-purpose
**Depends on:** Phase 1A complete
**Delivers:**
- Per-run token cap enforcement in `agentService.jsw`
- Per-user daily run count limiter
- Admin notification when cost threshold exceeded
- Agent KPI section in Admin Dashboard HTML (run stats, quality trend, cost breakdown)

### Dependency Graph (Full)

```
Phase 1A:
  J1 (Policy) ──────────────┐
                             ├──→ J3 (Gates UI)
  J2 (Ledger) ──────────────┤
              └──────────────┴──→ J4 (Outcomes)

Phase 1B:
  J3 + J4 ──→ J5 (E2E Tests)
  J3 + J4 ──→ J6 (Cost Controls + Admin KPIs)

Phase 2:
  Phase 1B ──→ Cross-Role Intel Service
           ──→ Admin Run Monitor Dashboard

Phase 3:
  Phase 2 ──→ Compendium Structure
          ──→ Curator Agent
          ──→ Auto-Sharding Jobs

Phase 4:
  Phase 3 ──→ Recruiter Autopilot
          ──→ Admin Self-Healing
          ──→ Dev Swarm
```
