# Verification Matrix - AgentMail + Twilio Hybrid Communications Architecture

**Track:** `agentmail_inbox_layer_20260302`

---

## How to Use

This track has two verification obligations:

1. prove the new AgentMail lane works
2. prove the existing Wix, SendGrid, Twilio, and VAPI lanes do not regress

---

## Automated Tests

| Test File | Wave | Run Command | Expected |
|-----------|------|-------------|---------|
| `src/public/__tests__/communicationChannelPolicy.test.js` | W1 | `npx jest src/public/__tests__/communicationChannelPolicy.test.js --runInBand` | Routing decisions are deterministic and role-safe |
| `src/public/__tests__/agentMailService.test.js` | W2 | `npx jest src/public/__tests__/agentMailService.test.js --runInBand` | Request wrapper, auth, and idempotency assertions pass |
| `src/public/__tests__/agentMailWebhook.test.js` | W2 | `npx jest src/public/__tests__/agentMailWebhook.test.js --runInBand` | Signature, idempotency, and normalization assertions pass |
| `src/public/__tests__/recruiterInboxRouter.test.js` | W3 | `npx jest src/public/__tests__/recruiterInboxRouter.test.js --runInBand` | Recruiter inbox routes exist and risky sends gate correctly |
| `src/public/__tests__/communicationMemoryService.test.js` | W4 | `npx jest src/public/__tests__/communicationMemoryService.test.js --runInBand` | Thread summaries and cross-channel memory stitching pass |

---

## Gate 1 Manual Checklist - Channel Clarity

**Sign-off required after Wave 2, before Wave 3.**

| # | Test | Expected | Pass |
|---|------|---------|------|
| 1 | Review channel matrix in spec | Wix, SendGrid, AgentMail, Twilio, and VAPI have non-overlapping ownership | [ ] |
| 2 | Review `communicationChannelPolicy.jsw` | Transactional notices route to Wix by default | [ ] |
| 3 | Review `communicationChannelPolicy.jsw` | Conversational replies route to AgentMail by default | [ ] |
| 4 | Review `communicationChannelPolicy.jsw` | Urgent escalations route to Twilio SMS by default | [ ] |
| 5 | Review webhook design | All AgentMail events require authenticity verification and idempotency | [ ] |
| 6 | Review current repo services | No existing Wix, SendGrid, Twilio, or VAPI service has been removed | [ ] |

**Signed off by:** _____________________ **Date:** _____________

---

## Gate 2 Manual Checklist - RecruiterOS Pilot

**Sign-off required after Wave 3, before Wave 4.**

Use a recruiter account on the RecruiterOS surface.

| # | Test | Expected | Pass |
|---|------|---------|------|
| 1 | Provision recruiter inbox | Inbox identity resolves successfully | [ ] |
| 2 | Send inbound live email to recruiter inbox | Thread appears in RecruiterOS data layer | [ ] |
| 3 | Open thread detail | Message chronology renders correctly | [ ] |
| 4 | Ask agent to draft a reply | Draft is created without auto-send | [ ] |
| 5 | Attempt risky send | Approval gate appears before send | [ ] |
| 6 | Approve send | Draft sends and thread updates | [ ] |
| 7 | Check communication memory | Summary is written for the linked entity | [ ] |
| 8 | Run existing recruiter SMS campaign smoke test | Existing SMS path still works | [ ] |
| 9 | Run existing recruiter voice smoke test | Existing voice path still works | [ ] |
| 10 | Run existing recruiter email campaign smoke test | SendGrid campaign path still works | [ ] |

**Signed off by:** _____________________ **Date:** _____________

---

## Gate 3 Manual Checklist - Cross-Role Stability

**Sign-off required after Wave 5, before Wave 6.**

| # | Test | Expected | Pass |
|---|------|---------|------|
| 1 | Review DriverOS mapping | Inbox and memory model fit the DriverOS target shell without redesign | [ ] |
| 2 | Review CarrierOS mapping | Inbox and case-thread model fit the proactive and sequential CarrierOS architecture | [ ] |
| 3 | Review AdminOS mapping | Inbox and approval model fit the AdminOS DAG and HITL architecture | [ ] |
| 4 | Review B2B use cases | Architecture supports B2B outreach and account-thread workflows | [ ] |
| 5 | Review cross-channel policy | Same policy model can govern all four role surfaces | [ ] |

**Signed off by:** _____________________ **Date:** _____________

---

## No-Regression Checklist

Run before final sign-off.

| Area | Test | Expected | Pass |
|------|------|---------|------|
| Wix triggered email | Send representative member notification | Send succeeds |
| Wix triggered email | Send representative contact email | Send succeeds |
| SendGrid | Send representative recruiter campaign | Send succeeds |
| Twilio SMS | Send representative SMS and ingest webhook | Send and webhook both succeed |
| VAPI voice | Fetch config and complete representative voice flow | Voice path still succeeds |
| RecruiterOS bridge | Open RecruiterOS and use agent plus voice plus campaigns | No regression on existing bridge surfaces |

---

## Evidence Pack

When UI work exists for the RecruiterOS inbox pilot, run the evidence-pack style verification and attach the run id here.

**Evidence Pack run ID:** _____________________  
**`quality_gate.json` pass:** [ ] YES

**Final sign-off:** _____________________ **Date:** _____________
