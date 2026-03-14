# Agentic Capability Matrix

## Purpose
This matrix summarizes the current agentic roadmap into an execution-oriented view:
- Which capability area is being automated.
- Which primary role owns it.
- Relative tooling scale.
- Expected autonomy level.
- Whether a human approval gate is required.

## Matrix

| Capability Area | Primary Role | Tooling Scale (Current Spec) | Automation Level Target | Human Approval Required |
|---|---|---:|---|---|
| Candidate Intake & Qualification | Recruiter | 65 recruiter tools (shared surface) | Supervised autonomy → near-fully agentic | Yes, for ambiguous eligibility/fraud indicators |
| Match Strategy | Recruiter + Driver | 83 driver + 65 recruiter tools (shared fit logic) | Supervised autonomy → near-fully agentic | Yes, for strategic account overrides |
| Pipeline Execution | Recruiter | 65 recruiter tools | Near-real-time autonomous stage progression | Yes, when outbound content has legal/offer implications |
| Offer & Compensation Guardrails | Recruiter + Admin | 65 recruiter + 147 admin/platform tools | Decision support + guarded automation | Yes, mandatory final offer approval |
| Onboarding Orchestration | Recruiter + Carrier | 65 recruiter + 93 carrier/B2B tools | High automation with exception routing | Yes, for failed checks/adverse action/legal holds |
| Retention Risk Detection | Recruiter + Carrier | 65 recruiter + 93 carrier/B2B tools | Continuous autonomous monitoring | Yes, for critical-risk/safety escalation |
| Intervention Execution | Recruiter + Carrier | 65 recruiter + 93 carrier/B2B tools | Automated intervention dispatch and tracking | Yes, for sensitive employee-relations language |
| Recruiter Coaching | Recruiter | 65 recruiter tools | AI-assisted prioritization and optimization | Yes, for repeated underperformance review |
| Carrier Success & Capacity | Carrier/B2B | 93 carrier/B2B tools | Account-level recommendation automation | Yes, for strategic pricing/contract changes |
| Compliance & Policy Sentinel | Admin/Platform | 147 admin/platform tools | Deterministic policy enforcement on all actions | Yes, immediate escalation on legal/regulatory conflict |
| Knowledge Curator & Playbook Evolution | Admin/Platform | 147 admin/platform tools | Closed-loop learning + controlled rollout | Yes, required for production policy changes |

## Platform-Level Automation Dependencies

| Platform Component | Role in Automation | Owner Surface |
|---|---|---|
| Unified Event Bus | Normalized event ingestion for all agent triggers | Cross-role platform |
| Task Graph Orchestrator | Multi-agent planning, retries, and sequencing | Cross-role platform |
| Shared Memory Layer | Role/entity context persistence for decisions | Cross-role platform |
| Policy Engine | Deterministic gate before high-risk execution | Admin/platform |
| Evaluation Harness | Offline + shadow scoring before autonomy changes | Admin/platform |
| Observability Layer | Run ledger, SLA breaches, ROI tracking, rollback triggers | Admin/platform |

## Tooling Scale by Role (Program Baseline)

| Role | Total Tools |
|---|---:|
| Driver | 83 |
| Recruiter | 65 |
| Carrier + B2B | 93 |
| Admin + Platform | 147 |
| **Program Total** | **388** |

## Autonomy Profile Targets

| Phase | Target Autonomous Execution | Human Involvement Pattern |
|---|---:|---|
| Assistive | 60% | Approvals on outbound + compensation |
| Supervised Autonomy | 80% | Exceptions-only handling |
| Near-Fully Agentic | 95–98% | Policy and exception handling only |

## Definition-of-Done Program Metrics

- >=95% of candidate lifecycle actions executed autonomously.
- <5% of records require manual touch on non-exception paths.
- <2% compliance-related action reversals.
- 100% audit-trail coverage for agent decisions.
- Sustained retention and conversion lift for 2+ quarters.
