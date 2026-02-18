# Agentic Orchestration Blueprint (Cross-Role)

## 1) Executive Intent

Build a **platform-wide agentic operating system** (not recruiter-only) where a single operator can trigger end-to-end workflows and role-specialized agents execute with guardrails, auditability, and learning loops.

This blueprint covers:
- Recruiter, Carrier, Driver, and Admin operating domains.
- Interdepartmental data loops (carrier intelligence informs recruiting decisions).
- Recursive knowledge compendiums that shard into references as they grow.
- A 24/7 "development firm in a box" extension for product/security/ops automation.

---

## 2) North Star Outcomes

1. **One-click orchestration:** "Press go" executes approved multi-step plays (call, text, email, update status, log evidence, schedule follow-up).
2. **Human-equivalent task coverage:** agents can invoke every authorized function currently performed by role users.
3. **Cross-role intelligence mesh:** carrier market intel + operational telemetry directly improve recruiting/driver matching decisions.
4. **Recursive learning:** every run contributes structured feedback to role compendiums and model policies.
5. **Controlled autonomy:** bounded by policy, budget, confidence thresholds, and human approvals for high-risk actions.

---

## 3) Current-State Assessment (updated 2026-02-17)

### Execution Plane — DELIVERED
- **Agent orchestration loop** — `agentService.jsw` with 22 tool definitions, 4 role scopes, tool_use iteration loop (max 5 iterations), dynamic service import and dispatch.
- **Conversation persistence** — `agentConversationService.jsw` storing conversations and turns in Airtable (`v2_Agent Conversations`, `v2_Agent Turns`).
- **VAPI voice integration** — `voiceService.jsw` (REST API wrapper), `voiceCampaignService.jsw` (outbound campaigns with chunked parallel processing), webhook handlers in `http-functions.js` for `end-of-call-report`, `function-call`, `assistant-request`.
- **4 surface UIs** — Agent chat overlays (FAB + sliding panel) on Driver (LMDR branding), Recruiter (NLU-enabled ros-chat.js), Admin, B2B (VelocityMatch branding). Voice orbs via reusable `voice-agent-ui.js`.
- **Page code wiring** — All 4 page code files modified with `agentMessage`, `getVoiceConfig` handlers. Recruiter also has `getCampaigns`, `createCampaign`, `startCampaign`, `getCampaignStatus`.
- **6 Airtable tables** — Agent Conversations, Agent Turns, Voice Call Logs, Voice Assistants, Voice Campaigns, Voice Campaign Contacts.
- **6 Claude Code agents** — deploy, test-bridge, seed-data, audit-schema, purge-cdn, create-page.
- **Test coverage** — 7 suites (46 tests) + 1 e2e test.
- **AI router extended** — `agent_orchestration` function in FUNCTION_REGISTRY, `callAnthropic()` supports `tools` param, returns `contentBlocks` + `stopReason`.

### Control Plane — NOT BUILT (Phase 1A target)
- **No policy tags** — All 22 tools are equally callable with no risk classification, approval gates, rate limits, or success metrics.
- **No run ledger** — Agent runs are fire-and-forget. No `AgentRun`/`AgentStep` records, no correlation IDs, no cost tracking.
- **No approval gates** — High-risk actions (send_message, schedule_interview, manage_prompts create/update) execute without human confirmation.
- **No outcome evaluation** — No mechanism to assess whether an agent run produced a good result. "Did this help the driver?" is unanswerable.
- **No cost controls** — No per-run token caps, no per-user daily limits, no spend alerting.

### Knowledge Plane — NOT BUILT (Phase 3 target)
- **No compendium** — No structured capture of patterns, playbooks, or postmortems.
- **No curator agent** — Run outcomes don't produce learning artifacts.
- **No cross-role signal sharing** — Carrier intelligence doesn't inform recruiter decisions and vice versa.
- **No feedback loops** — Tool effectiveness isn't tracked; prompts aren't improved by outcome data.

### Critical Insight
The platform currently automates **activity**, not **outcomes**. Agents execute tool chains that look productive but lack any verification that the results are correct, helpful, or aligned with business goals. The Outcome Verification Spine (Phase 1A) is the immediate priority — without it, scaling automation scales risk.

---

## 4) Target Architecture: Control Plane + Execution Plane + Knowledge Plane

## 4.1 Control Plane (Orchestration)

### Core services
- **Plan Compiler:** converts user intent to executable DAG (tasks, dependencies, timeouts, rollbacks).
- **Policy Engine:** evaluates permissions, compliance rules, PII, spend caps, and escalation requirements.
- **Scheduler/Queue:** handles async fanout (SMS/email/call batches), retries, and dead-letter handling.
- **Run Ledger:** immutable event log (who/what/when/why/outcome) for every agent action.

### Required records
- `AgentRun` (run id, initiator, role, goal, status, cost, SLA)
- `AgentStep` (tool, args hash, result hash, retries, latency)
- `ApprovalGate` (reason, approver, decision, timestamp)
- `RunOutcome` (objective met, deltas, follow-up tasks)

## 4.2 Execution Plane (Specialized Sub-Agents)

### Agent taxonomy
1. **Role Orchestrators**
   - Recruiter-Orchestrator
   - Carrier-Orchestrator
   - Driver-Orchestrator
   - Admin-Orchestrator
2. **Functional Swarms**
   - Outreach swarm (voice/SMS/email cadence)
   - Pipeline swarm (status transitions, SLA timers)
   - Intelligence swarm (spot rate, capacity, disruption ingest)
   - Reliability swarm (incident triage, maintenance checks)
   - Dev swarm (feature proposal, code generation, security audit)
3. **Quality/Guardrail agents**
   - Policy QA agent
   - Data quality agent
   - Regression/test verifier

### Sub-agent contract (mandatory)
Each agent implements:
- `intent_schema`
- `tool_allowlist`
- `risk_profile` (low/medium/high)
- `handoff_contract` (input/output schemas)
- `success_metrics`
- `rollback_strategy`

## 4.3 Knowledge Plane (Recursive Compendium System)

### Compendium design
Each department owns a root markdown plus sharded references:

- `Compendium/<department>/INDEX.md`
- `Compendium/<department>/playbooks/*.md`
- `Compendium/<department>/patterns/*.md`
- `Compendium/<department>/postmortems/*.md`
- `Compendium/<department>/metrics/*.md`

### Auto-sharding policy
When a file exceeds threshold (for example 1,500 lines or 80 KB):
1. Freeze prior version.
2. Generate section-level summary.
3. Split by headings into topic files.
4. Update `INDEX.md` with links + ownership + freshness timestamp.
5. Persist embeddings + keyword index for retrieval.

### Recursive learning loop
- After each run, a "Knowledge Curator" agent:
  1. Extracts deltas (what worked/failed).
  2. Updates pattern cards.
  3. Marks confidence shifts.
  4. Opens a review task if policy or outcomes regress.

---

## 5) Cross-Role Data Flywheel (Recruiter + Carrier + Driver + Admin)

## 5.1 Carrier → Recruiter signal sharing
Carrier intelligence (spot rates, lane volatility, capacity constraints, service failures) should update recruiter scoring features:
- Priority endorsements by lane demand.
- Availability windows by expected surge periods.
- Compensation competitiveness by market movement.
- Hiring urgency and campaign spend allocation.

## 5.2 Recruiter → Carrier signal sharing
Recruiter outcomes improve carrier operating playbooks:
- Conversion drop-off reasons by lane/equipment/profile.
- Contact channel effectiveness by driver segment.
- Offer acceptance predictors.
- Time-to-fill benchmarks and bottleneck stages.

## 5.3 Admin operational loop
Admin agents continuously:
- Detect anomalies/errors and auto-open remediation tasks.
- Run maintenance checks and compliance scans.
- Produce health summaries and recommended policy changes.
- Enforce data quality and permission audits.

## 5.4 Driver autonomy loop
Driver-side autonomous assistant can:
- Discover suitable opportunities from preferences and live market context.
- Prepare applications, outreach, and follow-up plans.
- Execute approved communication actions.
- Learn from responses and improve targeting.

---

## 6) Best-Practice Research: Specialized Sub-Agents for CLAUDE/CLAWD-Style Operations

The strongest patterns across modern agent frameworks and autonomous coding systems converge on:

1. **Graph orchestration over monolithic prompting**
   - Use explicit state graphs (plan -> act -> verify -> reflect) instead of one-shot prompts.
2. **Tool contracts with strict schemas**
   - JSON schemas for every tool; deterministic validation before invocation.
3. **Verifier separation**
   - A different agent validates output/tests before merge/dispatch.
4. **Memory layering**
   - Short-term run memory, medium-term case memory, long-term compendium memory.
5. **Human-in-the-loop risk gates**
   - Auto-execute low-risk steps; require approval for high-impact actions.
6. **Continuous audit pipelines**
   - Scheduled security/style/performance regressions with machine-proposed PRs.

### Practical mapping to this repository
- Expand `.claude/agents/` into explicit operational roles with contracts and runbooks.
- Add a `Compendium/` root for recursive department memory.
- Introduce a run ledger collection for every agentic action chain.
- Implement policy labels on every callable backend function.

---

## 7) Capability Model: "Any Human Function" via Policy-Tagged Tools

## 7.1 Tool surface standard
For each backend function exposed to agents, require metadata:
- `capability_id`
- `owner_role`
- `risk_level`
- `requires_approval`
- `rate_limit_policy`
- `idempotency_key_strategy`
- `audit_fields`

## 7.2 Action classes
- **Read:** query/search/intel retrieval.
- **Suggest:** draft message/recommendation/next-best-action.
- **Execute-low-risk:** status updates, reminders, non-sensitive outreach.
- **Execute-high-risk:** billing-impacting actions, irreversible updates, sensitive data changes.

## 7.3 Safety defaults
- Deny by default unless allowlisted.
- Mandatory dry-run mode for new workflows.
- Per-run spend/time caps.
- Automatic rollback hooks for write operations where possible.

---

## 8) Orchestrated Workflow Examples (Single-Click)

## 8.1 Recruiter "Autopilot Outreach"
1. Operator chooses campaign objective + policy profile.
2. Orchestrator pulls candidates + carrier constraints + market context.
3. Outreach swarm runs call/SMS/email cadence.
4. Pipeline swarm updates statuses and sets follow-ups.
5. Curator updates compendium pattern cards.
6. Admin receives summary with exceptions.

## 8.2 Carrier "Demand-Aware Hiring"
1. Carrier triggers lane-demand ingest.
2. Intelligence swarm updates required driver profile vectors.
3. Recruiter swarm reprioritizes pipeline and outreach.
4. Driver-facing offers adapt to real-time demand signals.

## 8.3 Admin "Self-Healing Ops"
1. Reliability swarm detects anomaly.
2. Triage agent isolates probable root causes.
3. Remediation agent executes approved fixes.
4. Verification agent runs tests/checks.
5. Incident summary and prevention rule appended to compendium.

## 8.4 Development "24/7 Genic Staff"
1. Dev scout agents monitor backlog, logs, and audits.
2. Build agent proposes scoped code changes.
3. Test/security agents validate.
4. PR agent opens candidate PR with evidence.
5. Human reviewer approves merge.

---

## 9) Implementation Phases (90-Day Practical Path)

## Phase 1 (Weeks 1-3): Foundation hardening
- Introduce centralized Tool Registry with policy tags.
- Add run ledger entities and telemetry IDs.
- Fix direct tool call path for voice/webhook orchestration.
- Add end-to-end tests for at least one workflow per role.

## Phase 2 (Weeks 4-6): Cross-role intelligence mesh
- Build carrier/recruiter shared signal model.
- Add retrieval endpoints for market and operational intelligence.
- Inject shared features into candidate scoring + campaign planning.

## Phase 3 (Weeks 7-9): Recursive compendium system
- Create `Compendium/` structure and curatorial agent.
- Implement auto-sharding and index refresh jobs.
- Add confidence scoring and stale-doc detectors.

## Phase 4 (Weeks 10-12): Autonomous operations expansion
- Launch one-click recruiter autopilot (guarded).
- Launch admin self-healing runbooks (guarded).
- Launch dev-autonomy audit/proposal loop with PR-only mode.

---

## 10) KPI Framework

### Efficiency
- Time-to-first-action
- Time-to-fill / cycle time reduction
- % tasks auto-completed without human intervention

### Quality
- Workflow success rate
- Rollback rate
- Human override rate

### Intelligence
- Cross-role signal utilization rate
- Compendium freshness score
- Pattern reuse lift

### Safety
- Policy violation rate
- High-risk approval bypass count (target: zero)
- Audit completeness rate

---

## 11) Immediate Backlog Recommendations

1. Create `Tool Registry v1` with policy metadata and role mapping.
2. Implement `AgentRun` + `AgentStep` ledger persistence.
3. Add `Compendium/` skeleton for recruiter/carrier/admin/driver/dev.
4. Implement `Knowledge Curator` agent that writes structured markdown updates.
5. Build one canonical end-to-end run: recruiter campaign autopilot with approvals.
6. Add nightly security + reliability + style audits with PR suggestions only.

---

## 12) Definition of "Fully Orchestrated" (Exit Criteria)

The platform is considered fully orchestrated when:
- Every critical role workflow has an executable DAG and policy gates.
- At least 80% of low-risk steps are autonomous with traceable logs.
- High-risk actions require explicit approvals and are fully auditable.
- Cross-role signals materially improve matching/recruiting outcomes.
- Recursive compendiums self-maintain via curator/sharding jobs.
- Dev swarm continuously proposes validated improvements in PR form.

