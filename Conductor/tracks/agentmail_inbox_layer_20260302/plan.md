# Plan: AgentMail + Twilio Hybrid Communications Architecture

## Phase 0 - Ratify architecture

- [ ] Confirm AgentMail remains additive, not a replacement migration
- [ ] Confirm phase-1 scope is RecruiterOS inbox pilot
- [ ] Confirm Twilio remains the SMS lane and VAPI remains the voice lane
- [ ] Confirm SendGrid remains the bulk campaign lane in phase 1

## Phase 1 - Channel governance and memory model

- [ ] Create `communicationChannelPolicy.jsw`
- [ ] Write the channel decision matrix into code and tests
- [ ] Define the external-memory model for email, SMS, and voice
- [ ] Define identity stitching rules across channels

## Phase 2 - AgentMail foundation

- [ ] Add `agentMailService.jsw` HTTP wrapper
- [ ] Add `agentMailInboxService.jsw` domain adapter
- [ ] Add new Airtable-routed collection keys for AgentMail and communication-memory entities
- [ ] Add `post_agentmail_webhook()` to `http-functions.js`
- [ ] Add webhook verification and idempotency support

## Phase 3 - Wix triggered email optimization

- [ ] Create a template-registry strategy for Wix triggered emails
- [ ] Centralize member-versus-contact routing logic
- [ ] Standardize variable validation and audit logging
- [ ] Ensure abandonment, notifications, and support mail remain functional

## Phase 4 - RecruiterOS pilot

- [ ] Add recruiter inbox actions to the canonical router
- [ ] Provision recruiter inboxes through backend adapters
- [ ] Expose thread list and thread detail data to RecruiterOS
- [ ] Add draft reply creation
- [ ] Add approval gate before high-risk send
- [ ] Persist thread summaries into communication memory

## Phase 5 - Cross-channel orchestration

- [ ] Add `communicationOrchestrationService.jsw`
- [ ] Define escalation from AgentMail -> Twilio SMS -> VAPI voice
- [ ] Add cross-channel audit links between email, SMS, and voice artifacts
- [ ] Ensure existing Twilio and VAPI services are orchestrated, not replaced

## Phase 6 - Cross-role scaffolding

- [ ] Define DriverOS inbox use cases and action families
- [ ] Define CarrierOS inbox use cases and action families
- [ ] Define AdminOS and B2B inbox use cases and action families
- [ ] Confirm each role maps cleanly to the desired-state OS maps

## Phase 7 - Hardening and rollout

- [ ] Run no-regression verification for Wix, SendGrid, Twilio, and VAPI lanes
- [ ] Run RecruiterOS manual pilot checks
- [ ] Run evidence-pack style verification once inbox UI exists
- [ ] Document rollout, fallback, and rollback procedures

## Exit Criteria

- AgentMail is integrated as the inbox and external-memory lane
- Twilio remains the SMS lane
- VAPI remains the voice lane
- Wix triggered email remains the transactional lane
- SendGrid remains the campaign lane
- RecruiterOS pilot works without regressions
- future DriverOS, CarrierOS, and AdminOS surfaces can reuse the same architecture
