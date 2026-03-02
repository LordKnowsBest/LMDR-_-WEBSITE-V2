# Risk Register - AgentMail + Twilio Hybrid Communications Architecture

**Track:** `agentmail_inbox_layer_20260302`

---

## Risk Matrix

| ID | Risk | Likelihood | Impact | Severity | Mitigation | Owner |
|----|------|-----------|--------|----------|-----------|-------|
| R1 | Channel overlap causes engineers to send the same workflow through Wix, SendGrid, and AgentMail inconsistently | High | High | Critical | Ship `communicationChannelPolicy.jsw` before broad implementation; require explicit routing rules by intent | Senior reviewer |
| R2 | AgentMail webhook spoofing or bad signature handling leads to unauthorized state changes | Medium | High | High | Verify signatures, store raw events, require idempotency, reject unverifiable events | J2 |
| R3 | Duplicate webhook events create duplicate messages, drafts, or memory artifacts | High | Medium | High | Event idempotency table plus deterministic `client_id` keys | J2 |
| R4 | AgentMail becomes a shadow CRM because too much raw thread data is mirrored into Airtable | Medium | High | High | Mirror metadata and selected message bodies only; summarize aggressively into `communicationMemories` | J1 |
| R5 | Wix triggered email behavior regresses while introducing new abstractions | Medium | High | High | Keep Wix lane additive, add no-regression tests around `emailService.jsw` and `abandonmentEmailService.jsw` | J3 |
| R6 | RecruiterOS pilot expands into a full communications rewrite and slips delivery | High | Medium | High | Strict phase-1 scope: thread list, detail, draft, approval, send, memory summary | J4, J5 |
| R7 | Identity stitching between email, phone, and member records becomes unreliable | Medium | High | High | Add `communicationIdentities` model and deterministic matching precedence rules | J1 |
| R8 | Deliverability or domain-reputation issues reduce trust in AgentMail before fit is proven | Medium | Medium | Medium | Start with limited pilot inboxes, track bounce and reply behavior, avoid replacing bulk outbound early | Senior reviewer |
| R9 | Future DriverOS, CarrierOS, and AdminOS needs diverge from the RecruiterOS pilot implementation | Medium | High | High | Use the four OS map files as architectural constraints from day one; document cross-role portability in spec and gates | All devs |
| R10 | SMS and voice follow-up flows become disconnected from email thread context | Medium | Medium | Medium | Add `communicationOrchestrationService.jsw` and `communicationMemoryService.jsw` before cross-channel automation | J6 |
| R11 | Costs sprawl across multiple providers with no policy boundary | Medium | Medium | Medium | Log every outbound action with channel, intent, tenant, and unit cost where available | Senior reviewer |
| R12 | Sensitive compliance or support content is auto-sent without review | Low | High | High | Require approval gates for sensitive drafts, attachments, and first-contact outbound sends | J5 |
| R13 | Team assumes Twilio can be removed because AgentMail covers "communications" broadly | Medium | High | High | Keep Twilio explicitly assigned to SMS and urgent attention workflows in the channel matrix and rollout docs | Senior reviewer |
| R14 | AgentMail public SDK assumptions slow implementation | Medium | Low | Low | Use HTTP API directly; do not depend on a Go SDK or other language SDK availability | J2 |

---

## Monitoring Plan

- Wave 1: approve the channel governance matrix before any implementation begins
- Wave 2: confirm webhook verification and idempotency tests pass before RecruiterOS work starts
- Gate 1: senior review confirms no existing Wix, SendGrid, Twilio, or VAPI lane is being silently replaced
- Wave 3: smoke-test RecruiterOS voice, SMS campaigns, and existing email paths after inbox pilot wiring
- Gate 2: senior review verifies phase-1 inbox flow does not regress current recruiter functionality
- Wave 4: measure summary quality and memory duplication rate
- Gate 3: review DriverOS, CarrierOS, and AdminOS mapping against their target maps
- Wave 6: evidence and no-regression check across all communications lanes
