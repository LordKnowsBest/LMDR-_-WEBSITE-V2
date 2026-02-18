# Agentic Recruitment & Retention Blueprint

## Objective
Design a near-fully agentic CDL recruitment and retention operating model where humans are only required for compliance-sensitive approvals, exception handling, and high-risk edge cases.

## Core Design Principles
- **Event-driven orchestration first:** agents react to funnel, onboarding, performance, and communication events in real time.
- **Role-specialized agents:** each agent owns a narrow outcome and exposes explicit handoff contracts.
- **Human-in-the-loop only at risk boundaries:** approvals are required for legal, compensation, policy, or adverse-action decisions.
- **Closed-loop learning:** every intervention records outcome quality, conversion impact, and time-to-resolution for continuous optimization.
- **Fallback determinism:** if LLM confidence is below threshold, route to deterministic workflow or human queue.

## Agent Catalog (Recommended Additions)

### 1) Candidate Intake & Qualification Agent
**Purpose:** Autonomously triage inbound applicants, normalize profile data, and classify qualification readiness.

**Primary outcomes**
- Intake completeness score >= 95%.
- Time-to-qualified-candidate under 15 minutes.

**Key responsibilities**
- Parse documents and profile data.
- Detect missing requirements (CDL class, endorsements, med card, experience).
- Initiate missing-item requests automatically.

**Inputs**
- Job applications, OCR outputs, profile updates, document upload events.

**Outputs**
- Qualification status (`qualified`, `needs_docs`, `needs_verification`, `reject_reasons`).
- Next required action package.

**Escalation rules**
- Human review for ambiguous eligibility, conflicting identity records, or fraud indicators.

---

### 2) Match Strategy Agent
**Purpose:** Maximize fit and acceptance probability by selecting the optimal carrier/job set for each driver.

**Primary outcomes**
- Higher apply-to-interview conversion.
- Lower early-stage fallout (0-7 days).

**Key responsibilities**
- Generate ranked match list using pay, lane, home-time, equipment, safety, and tenure predictors.
- Explain match rationale in plain language.
- Continuously rerank as new signals arrive.

**Inputs**
- Driver profile, carrier requirements, historic conversion outcomes, market intel.

**Outputs**
- Ranked opportunities with confidence and rationale.
- Auto-personalized outreach snippets.

**Escalation rules**
- Human override on priority placements and strategic accounts.

---

### 3) Pipeline Execution Agent
**Purpose:** Run the full outreach cadence and stage progression with minimal recruiter touch.

**Primary outcomes**
- Contact SLA under 5 minutes.
- Stage progression adherence >= 90%.

**Key responsibilities**
- Trigger multi-channel outreach sequences.
- Move candidates between stages based on verified events.
- Auto-schedule interviews and follow-ups.
- Create structured notes and call summaries.

**Inputs**
- Pipeline stage changes, messaging events, call outcomes, no-response timers.

**Outputs**
- Updated stage state.
- Executed communication log.
- Recruiter exception queue for stalled candidates.

**Escalation rules**
- Approval gate for outbound content with legal/offer implications.

---

### 4) Offer & Compensation Guardrail Agent
**Purpose:** Enforce compensation guardrails and approve/route offer packages.

**Primary outcomes**
- Offer policy compliance >= 99%.
- Offer turnaround under 30 minutes.

**Key responsibilities**
- Compare proposed compensation against benchmark and policy bounds.
- Detect anomalies (outlier sign-on, conflicting pay components).
- Generate policy-compliant offer recommendations.

**Inputs**
- Candidate profile, carrier comp policy, market compensation benchmarks.

**Outputs**
- Offer recommendation package (`approve`, `revise`, `escalate`).
- Audit-ready decision trace.

**Escalation rules**
- Mandatory human approval for final offers and exceptions.

---

### 5) Onboarding Orchestration Agent
**Purpose:** Drive post-acceptance workflows to day-1 readiness without manual coordination.

**Primary outcomes**
- Offer-accepted to ready-to-start cycle time reduced by 40%.
- Compliance completion rate >= 98% before orientation.

**Key responsibilities**
- Manage documents, background checks, drug tests, and orientation scheduling.
- Predict blockers and preemptively nudge participants.
- Reprioritize workflow for aging tasks.

**Inputs**
- Workflow status events, compliance checklist state, vendor callbacks.

**Outputs**
- Current readiness status.
- Blocker list with ETA and mitigation plan.

**Escalation rules**
- Human intervention for failed checks, adverse action, or legal holds.

---

### 6) Retention Risk Detection Agent
**Purpose:** Continuously detect churn risk and trigger interventions before resignation intent solidifies.

**Primary outcomes**
- At-risk-to-retained conversion uplift.
- 30/60/90-day retention improvement.

**Key responsibilities**
- Calculate risk from engagement, safety, pay volatility, home-time, and sentiment.
- Label risk type and confidence.
- Trigger best-next intervention play.

**Inputs**
- Driver performance metrics, app activity deltas, NPS, incident logs.

**Outputs**
- Risk profile (`risk_level`, `factors`, `suggested_actions`).
- Intervention recommendation priority queue.

**Escalation rules**
- Human manager escalation for critical-risk or safety-related cases.

---

### 7) Intervention Execution Agent
**Purpose:** Autonomously deploy and track personalized save actions.

**Primary outcomes**
- Intervention execution SLA under 10 minutes.
- Measurable risk score reduction within 14 days.

**Key responsibilities**
- Select intervention templates by risk type and channel.
- Personalize content and send messages.
- Track outcomes and update effectiveness models.

**Inputs**
- Risk events, intervention templates, channel availability, prior outcomes.

**Outputs**
- Sent interventions and outcome tracking updates.
- Effectiveness ranking per template and channel.

**Escalation rules**
- Human review for sensitive employee-relations language.

---

### 8) Recruiter Coach Agent
**Purpose:** Raise recruiter quality and consistency through proactive recommendations.

**Primary outcomes**
- Improved recruiter conversion and time-to-fill.
- Reduced process variance across recruiters.

**Key responsibilities**
- Detect recruiter bottlenecks and behavior drift.
- Recommend daily priorities and queue ordering.
- Suggest message rewrites and cadence changes.

**Inputs**
- Recruiter funnel metrics, activity logs, cohort benchmarks.

**Outputs**
- Daily action plan.
- Personalized coaching tasks and expected lift.

**Escalation rules**
- Human ops review for repeated underperformance patterns.

---

### 9) Carrier Success & Capacity Agent
**Purpose:** Optimize carrier-side staffing outcomes and prevent account churn.

**Primary outcomes**
- Improved fill rates and speed.
- Lower account churn risk.

**Key responsibilities**
- Monitor account signals, hiring velocity, and demand shifts.
- Trigger account-level next-best-actions.
- Forecast near-term capacity gaps.

**Inputs**
- B2B account KPIs, opportunity pipeline, lane demand and seasonality.

**Outputs**
- Capacity risk forecast and action pack.
- Account-level playbook execution recommendations.

**Escalation rules**
- Human account manager signoff for strategic pricing or contract changes.

---

### 10) Compliance & Policy Sentinel Agent
**Purpose:** Enforce legal, policy, and process controls across every autonomous action.

**Primary outcomes**
- Near-zero non-compliant automated actions.
- Full audit traceability for every decision.

**Key responsibilities**
- Preflight-check outbound actions against policy rules.
- Block and reroute disallowed actions.
- Generate machine-readable audit entries.

**Inputs**
- Proposed agent actions, policy documents, role permissions.

**Outputs**
- `approved`, `blocked`, or `requires_human_approval` decision.
- Audit event with rationale and evidence links.

**Escalation rules**
- Immediate human escalation for legal/regulatory conflicts.

---

### 11) Knowledge Curator & Playbook Evolution Agent
**Purpose:** Convert operational outcomes into reusable best-practice playbooks.

**Primary outcomes**
- Faster policy/playbook iteration.
- Rising agent quality over time.

**Key responsibilities**
- Mine successful/failed runs for patterns.
- Propose prompt, rule, and workflow updates.
- Score confidence before production rollout.

**Inputs**
- Agent outcome logs, intervention results, conversion trends.

**Outputs**
- Candidate playbook updates with confidence tier.
- Controlled rollout recommendations.

**Escalation rules**
- Human approval required for production policy changes.

## Required Cross-Agent Platform Components
- **Unified Event Bus:** all surfaces emit normalized events.
- **Task Graph Orchestrator:** coordinates multi-agent plans and retries.
- **Shared Memory Layer:** per-driver, per-recruiter, per-carrier context windows.
- **Policy Engine:** deterministic gatekeeper before high-risk actions.
- **Evaluation Harness:** offline and shadow-mode scoring before enabling autonomy.
- **Observability:** run ledger, intervention ROI, SLA breaches, and rollback triggers.

## Human Intervention Minimization Model
Target a phased autonomy profile:
- **Phase 1 (Assistive):** 60% autonomous execution, human approvals on outbound + comp.
- **Phase 2 (Supervised Autonomy):** 80% autonomous execution, exceptions only.
- **Phase 3 (Near-fully Agentic):** 95-98% autonomous execution, human role = policy and exception handling.

## Priority Implementation Sequence
1. Pipeline Execution Agent
2. Onboarding Orchestration Agent
3. Retention Risk Detection Agent
4. Intervention Execution Agent
5. Compliance & Policy Sentinel Agent
6. Offer & Compensation Guardrail Agent
7. Recruiter Coach Agent
8. Carrier Success & Capacity Agent
9. Knowledge Curator Agent
10. Candidate Intake & Qualification Agent
11. Match Strategy Agent

## Definition of Done for "100% Agentic Completion" Program
- >= 95% of candidate lifecycle actions executed autonomously.
- < 5% of records require manual touch for non-exception paths.
- < 2% compliance-related action reversals.
- Full audit trail coverage for 100% of agent decisions.
- Demonstrated retention and conversion lift sustained for 2+ quarters.
