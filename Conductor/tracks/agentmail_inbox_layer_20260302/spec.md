# Specification: AgentMail + Twilio Hybrid Communications Architecture

## 1. Objective

Create a communications architecture for LMDR that does four things at once:

- preserves every current communication capability that already works
- adds inbox-native email for agents through AgentMail
- keeps Twilio and VAPI as the realtime phone and SMS layer
- turns communications into a durable external-memory substrate for agents

This is not a "replace email provider" track.

This is a platform architecture track for a hybrid communications mesh.

---

## 2. Design Thesis

LMDR already has internal memory:

- agent conversation history
- Airtable records
- task and workflow state
- voice call logs
- campaign state

AgentMail creates a new category:

- external memory

External memory means memory that exists in a real customer-facing communication channel and persists outside the model's current context window. An inbox thread can become:

- the history of a recruiter's relationship with a driver
- the evidence trail for onboarding or compliance
- the ongoing case file for support or dispute resolution
- the asynchronous working memory for an agent with a human counterpart

This matters because the platform is not building toy chatbots. It is building operating systems for four roles:

- recruiter
- driver
- carrier
- admin

And eventually B2B and customer-service-adjacent surfaces need the same substrate.

---

## 3. Desired-State References

This track should be read against the role OS maps, because those maps define the intended end state.

### 3.1 Recruiter

Reference: `recruiter-os-map-v2.html`

What matters for this track:

- RecruiterOS is already a live shell
- it already has agent, voice, campaign, and webhook surfaces
- it is the correct phase-1 pilot surface
- it already represents the strongest current bridge pattern for a communications console

### 3.2 Driver

Reference: `driver-os-map.html`

What matters for this track:

- DriverOS target state is an always-on LMDR companion with proactive cards and voice
- communications need to become contextual, not isolated
- inbox-backed threads can support mentorship, re-engagement, document collection, offer follow-up, and policy explanation

### 3.3 Carrier

Reference: `carrier-os-map.html`

What matters for this track:

- CarrierOS target state already assumes proactive, sequential, and parallel agent patterns
- carrier workflows will eventually need inbox-backed remediation and operational cases
- Safety Manager, Driver Management, and Customer Service workflows are strong email-thread candidates

### 3.4 Admin

Reference: `admin-os-map-v2.html`

What matters for this track:

- AdminOS target state includes autonomous workflows, DAGs, HITL, and B2B motions
- inbox-backed B2B outreach, support triage, and approval-reviewed communications will fit this surface naturally

Conclusion:

The architecture cannot be recruiter-only. It must start with RecruiterOS and remain portable to DriverOS, CarrierOS, and AdminOS.

---

## 4. Current-State Channel Inventory

The repository already has a multi-lane communications system.

### 4.1 Wix triggered email lane

Current files:

- `src/backend/emailService.jsw`
- `src/backend/abandonmentEmailService.jsw`
- `src/backend/admin_service.jsw`
- `src/backend/surveyService.jsw`

Current usage:

- `wix-users-backend.emailUser(...)` for member-bound triggered emails
- `wix-crm-backend.triggeredEmails.emailContact(...)` for CRM contact-bound triggered emails

Strengths:

- native Wix integration
- good for simple transactional notifications
- reliable fit for member/contact lifecycle messages

Constraints:

- template-based, not thread-based
- tied to a Wix member or CRM contact identity
- poor fit for multi-turn agent conversations
- not an inbox
- not a draft approval workspace
- not a communications memory plane

### 4.2 SendGrid lane

Current file:

- `src/backend/emailCampaignService.jsw`

Strengths:

- bulk outbound
- campaign analytics
- sequence and audience operations

Constraints:

- not designed to be the primary inbox substrate for agents
- best used for campaign delivery, not conversational memory

### 4.3 Twilio lane

Current file:

- `src/backend/smsCampaignService.jsw`

Strengths:

- SMS delivery
- inbound replies
- opt-out handling
- campaign-grade phone outreach

Constraints:

- SMS is high-attention but low-context
- limited fit for attachments, long-form review, and rich multi-step documentation

### 4.4 VAPI lane

Current file:

- `src/backend/voiceService.jsw`

Strengths:

- voice agent interaction
- outbound calls
- transcripts

Constraints:

- synchronous channel
- not suited to structured inbox state or rich attachments

### 4.5 Agent memory lane

Current files and tables:

- `src/backend/agentService.jsw`
- `src/backend/agentConversationService.jsw`
- `v2_Agent Conversations`
- `v2_Agent Turns`
- `v2_Voice Call Logs`

Strengths:

- preserves agent interaction context
- supports internal reasoning continuity

Constraints:

- mostly internal to LMDR
- not the same as a customer-facing identity
- does not itself create external communications state

---

## 5. Official External Findings

Reviewed as of March 2, 2026.

### 5.1 AgentMail

AgentMail appears strongest in:

- pod-based tenant isolation
- inbox creation
- thread-centric message history
- draft creation and send
- webhooks and realtime event ingestion
- attachments
- idempotent resource creation using `client_id`

Important finding:

- no public official `agentmail-go` repository was found in the `agentmail-to` GitHub organization during this review
- public repos found included `agentmail-node`, `agentmail-python`, `agentmail-mcp`, `agentmail-toolkit`, and docs/examples

Implication:

- this Wix/Velo repository should integrate to AgentMail over the HTTP API
- do not block architecture on a Go SDK

### 5.2 Wix triggered email

The official Wix model remains aligned to triggered sends to:

- members
- contacts

Implication:

- Wix triggered email should stay in the transactional lane
- it should not be forced into conversational agent workflows

---

## 6. Channel Governance Model

This is the core architectural decision. Every channel must have a clearly bounded job.

| Lane | System | Primary Job | Secondary Job | Do Not Use For |
|------|--------|-------------|---------------|----------------|
| Transactional email | Wix triggered email | member/contact notifications | lightweight lifecycle sends | inbox threads, draft review, agent memory |
| Campaign email | SendGrid | bulk outbound, drips, analytics | segmented outbound experiments | conversational inbox ownership |
| Conversational email | AgentMail | agent inboxes, threads, drafts, replies, attachments | external memory and workflow cases | bulk blast campaigns in phase 1 |
| SMS | Twilio | urgent or high-attention outreach, short replies | escalation, reminders, opt-out aware follow-up | rich document exchange, long-form case memory |
| Voice | VAPI plus existing telephony path | calls, spoken agent interaction, voice transcripts | synchronous escalation | durable thread ownership |

Rule:

- no provider should be made to impersonate another provider's best-fit lane

This is how functionality is preserved while capability expands.

---

## 7. Platform North Star

The target architecture is a communications mesh composed of five coordinated layers:

### 7.1 Identity layer

Each agent can own one or more externally reachable identities:

- email identity via AgentMail
- SMS identity via Twilio
- voice identity via VAPI and the existing phone configuration path

### 7.2 Channel policy layer

A policy engine decides which channel should be used based on:

- urgency
- sensitivity
- richness required
- attachment requirement
- existing relationship thread
- opt-in or opt-out state
- approval requirement

### 7.3 Execution layer

The canonical action surface remains:

- `src/backend/agentService.jsw`

Agent actions should not bypass this plane when they become material communications actions.

### 7.4 Memory layer

Memory becomes layered:

- internal short-term memory: run context
- internal medium-term memory: agent conversations and task state
- external memory: inbox threads, SMS history, voice transcripts, attached documents
- distilled long-term memory: normalized facts and summaries written back into LMDR data stores

### 7.5 Observability and approval layer

Every meaningful communication action should support:

- audit logging
- approval gates where required
- idempotency
- raw event capture
- replayable webhooks where possible

---

## 8. External Memory Model

This track should explicitly treat AgentMail as an external-memory substrate.

### 8.1 Definition

An inbox thread is a durable memory object with:

- counterpart identity
- subject continuity
- message chronology
- attachments
- human edits
- AI drafts
- business-state linkage

### 8.2 Memory flow

Recommended flow:

1. inbound message arrives through AgentMail webhook
2. raw event is stored for audit
3. thread is linked to an LMDR entity if possible
4. a summarizer extracts durable facts
5. facts are written into a normalized LMDR memory store
6. the agent uses the summary first and the raw thread second

### 8.3 Why both stores are needed

AgentMail should remain the source of truth for:

- raw communications artifacts
- actual inbox state
- message-level chronology

LMDR should remain the source of truth for:

- normalized workflow state
- extracted structured facts
- cross-channel summarization
- role-aware agent context

This prevents the system from becoming dependent on large raw thread rehydration for every turn.

---

## 9. Hybrid Architecture

### 9.1 Recommended core services

Create:

- `src/backend/agentMailService.jsw`
- `src/backend/agentMailInboxService.jsw`
- `src/backend/communicationChannelPolicy.jsw`
- `src/backend/communicationOrchestrationService.jsw`
- `src/backend/communicationMemoryService.jsw`

### 9.2 Service responsibilities

#### `agentMailService.jsw`

Low-level AgentMail API wrapper.

Responsibilities:

- authenticated HTTP calls
- pod, inbox, thread, draft, and message requests
- webhook verification helpers
- idempotent `client_id` generation

#### `agentMailInboxService.jsw`

LMDR adapter from platform context to AgentMail objects.

Responsibilities:

- tenant naming conventions
- pod and inbox provisioning
- role-aware identity resolution
- thread to entity linkage
- inbox lifecycle policies

#### `communicationChannelPolicy.jsw`

Pure policy module.

Responsibilities:

- choose lane by intent
- encode allowed channels by role and workflow
- define when Wix triggered email is mandatory
- define when AgentMail is preferred
- define escalation from email to SMS to voice

#### `communicationOrchestrationService.jsw`

Execution coordinator.

Responsibilities:

- choose channel
- create drafts
- send over the correct lane
- maintain cross-channel audit links
- manage handoffs between AgentMail, Twilio, and VAPI

#### `communicationMemoryService.jsw`

Memory fusion layer.

Responsibilities:

- summarize threads
- stitch identities across email, SMS, and voice
- update internal long-term memory
- provide compact context bundles back to agents

---

## 10. Role-by-Role Architecture

### 10.1 Recruiter phase 1

This is the first production wedge.

Use cases:

- recruiter team inbox
- candidate reply handling
- job-detail follow-up
- document requests
- approval-reviewed draft replies

Why first:

- RecruiterOS already exists
- current architecture already includes agent, voice, campaigns, and bridge patterns
- recruiter workflows naturally benefit from persistent email threads

### 10.2 Driver future state

Planned fit:

- mentorship follow-up
- offer follow-up and reactivation
- policy explanation thread
- document collection or status clarification
- retention interventions

Important note:

- DriverOS should not become email-heavy by default
- the inbox layer should support high-value moments, not spam

### 10.3 Carrier future state

Planned fit:

- onboarding inbox
- compliance remediation inbox
- safety incident follow-up
- customer service and account support
- Driver Management and Safety Manager case threads

This aligns strongly with the proactive and sequential pipeline model already defined in `carrier-os-map.html`.

### 10.4 Admin and B2B future state

Planned fit:

- B2B outreach inboxes
- support queues
- escalations and dispute handling
- approval-reviewed billing or contract communication drafts

This aligns with the AdminOS DAG and HITL model.

---

## 11. Pod and Identity Strategy

Recommended hierarchy:

- one AgentMail pod per carrier tenant
- one or more inboxes inside that pod

Examples:

- recruiter inbox per recruiter or recruiter team
- onboarding inbox per carrier workflow
- support inbox per admin or support team

Do not start with one pod per recruiter.

Reason:

- carrier is the natural tenant boundary in the current LMDR model
- carrier-level isolation simplifies compliance, lifecycle management, and access revocation

---

## 12. Data Model

All business records should route through `dataAccess`.

Recommended collection keys:

- `agentMailTenants`
- `agentMailInboxes`
- `agentMailThreads`
- `agentMailMessages`
- `agentMailDrafts`
- `agentMailWebhookEvents`
- `communicationIdentities`
- `communicationMemories`
- `communicationLinks`

### 12.1 `communicationIdentities`

Purpose:

- canonical identity stitching across channels

Fields:

- `entity_type`
- `entity_id`
- `role`
- `carrier_dot`
- `email_address`
- `phone_number`
- `agentmail_inbox_id`
- `twilio_phone_key`
- `voice_assistant_id`
- `status`

### 12.2 `communicationMemories`

Purpose:

- distilled long-term memory from external conversations

Fields:

- `entity_type`
- `entity_id`
- `channel`
- `channel_thread_id`
- `summary`
- `facts_json`
- `last_summarized_at`
- `confidence`
- `source_count`

### 12.3 `communicationLinks`

Purpose:

- map messages and threads to business objects

Fields:

- `channel`
- `thread_id`
- `message_id`
- `linked_entity_type`
- `linked_entity_id`
- `linked_by`
- `created_at`

The other AgentMail-specific tables from the initial track remain valid and should be created as the provider mirror.

---

## 13. Wix Triggered Email Optimization Strategy

Wix triggered email should be optimized, not displaced blindly.

### 13.1 Keep Wix for the following

- application confirmations
- status updates
- account lifecycle notifications
- survey sends
- checkout abandonment
- recruiter or member notifications that are not conversational

### 13.2 Improve the Wix lane

Recommended changes:

1. centralize a template registry so template ids are not scattered across services
2. centralize member-vs-contact routing logic
3. standardize variable schemas and validation
4. log every send in a common audit format
5. dedupe contact creation logic
6. add policy rules for "when a send must remain Wix-triggered"

### 13.3 Do not force Wix to do the following

- conversational inbox management
- draft review and approval workflows
- thread retrieval
- attachment-first workflows
- external memory

### 13.4 Practical rule

If the message is:

- one-way
- templated
- transactional
- tied to a member or contact event

then Wix triggered email is probably still the correct lane.

If the message is:

- conversational
- thread-aware
- draft-reviewed
- attachment-heavy
- part of a long-running case

then AgentMail is the correct lane.

---

## 14. Channel Selection Policy

The platform should be able to decide which lane to use.

### 14.1 Suggested intent categories

- `transactional_notice`
- `campaign_outreach`
- `conversation_reply`
- `document_collection`
- `urgent_escalation`
- `voice_call_follow_up`
- `support_case`
- `compliance_case`

### 14.2 Suggested routing defaults

- `transactional_notice` -> Wix triggered email
- `campaign_outreach` -> SendGrid or Twilio depending on channel
- `conversation_reply` -> AgentMail
- `document_collection` -> AgentMail first, Twilio nudge second
- `urgent_escalation` -> Twilio SMS, optional voice follow-up
- `voice_call_follow_up` -> AgentMail or SMS depending on artifact type
- `support_case` -> AgentMail
- `compliance_case` -> AgentMail with approval gate if sensitive

### 14.3 Escalation ladder

Recommended default:

1. AgentMail for rich async thread
2. Twilio SMS for nudge or urgent attention
3. VAPI voice for synchronous escalation

This gives LMDR a coherent multimodal sequence rather than disconnected channels.

---

## 15. RecruiterOS Pilot Scope

### 15.1 Phase-1 UI and backend goals

- provision inbox identity
- list threads
- read thread detail
- create draft reply
- require approval before send where policy demands it
- sync a lightweight thread summary into communication memory

### 15.2 What phase 1 explicitly does not do

- replace SendGrid campaigns
- replace Twilio SMS
- rebuild all recruiter communications UI
- auto-send unrestricted outbound emails

### 15.3 Router actions

Suggested action family in `agentService.jsw`:

- `recruiter_inbox.create_inbox`
- `recruiter_inbox.list_threads`
- `recruiter_inbox.read_thread`
- `recruiter_inbox.create_draft`
- `recruiter_inbox.send_draft`
- `recruiter_inbox.archive_thread`

Approval-gated:

- first outbound send to a new contact
- sensitive attachments
- messages generated from high-risk workflows

---

## 16. Webhook Architecture

Add to `src/backend/http-functions.js`:

- `post_agentmail_webhook(request)`

Requirements:

- verify authenticity
- perform idempotency checks
- store raw payload
- normalize event
- dispatch to adapter layer
- return fast

Recommended event classes:

- `message.received`
- `thread.updated`
- `draft.created`
- `draft.sent`
- `inbox.created`

All inbound communication events should be replayable from `agentMailWebhookEvents`.

---

## 17. No-Loss Functionality Rule

This track must preserve all current capabilities.

That means:

- Wix triggered emails keep working
- SendGrid campaigns keep working
- Twilio SMS keeps working
- VAPI voice keeps working
- RecruiterOS voice and chat remain intact

Implementation rule:

- AgentMail is additive first
- replacement decisions, if any, come only after explicit metrics prove superiority

---

## 18. Test-First Strategy

### 18.1 Unit tests

Create:

- `src/public/__tests__/agentMailService.test.js`
- `src/public/__tests__/agentMailWebhook.test.js`
- `src/public/__tests__/communicationChannelPolicy.test.js`
- `src/public/__tests__/communicationMemoryService.test.js`
- `src/public/__tests__/recruiterInboxRouter.test.js`

### 18.2 What the tests must prove

`agentMailService.test.js`

- authenticated request headers
- path routing
- `client_id` idempotency
- expected error handling

`agentMailWebhook.test.js`

- missing signature rejection
- invalid signature rejection
- duplicate event handling
- raw event persistence
- supported event normalization

`communicationChannelPolicy.test.js`

- transactional notices route to Wix
- campaign outreach routes to SendGrid or Twilio
- conversational replies route to AgentMail
- urgent escalation prefers Twilio

`communicationMemoryService.test.js`

- inbound thread summary extraction
- link to entity
- idempotent updates
- voice plus SMS plus email memory stitching

`recruiterInboxRouter.test.js`

- recruiter inbox action exposure
- approval gate on risky sends
- no regression to existing recruiter messaging and campaign routes

---

## 19. Success Metrics

Phase 1 success metrics:

- recruiter inbox can receive live inbound email
- thread list renders correctly
- draft reply can be created and approval-gated
- send works without breaking current recruiter comms
- thread summary is written into communication memory

Phase 2 and beyond:

- reduced agent context loss across asynchronous conversations
- faster recruiter follow-up cycle time
- measurable reduction in manual copy-paste between inboxes and LMDR
- reusable communications substrate for DriverOS, CarrierOS, and AdminOS

---

## 20. Risks

High-level risks:

- provider overlap and channel confusion
- webhook spoofing or duplicate processing
- deliverability and domain-reputation risk
- over-mirroring raw thread data into Airtable
- cross-channel identity mismatch
- role-specific UI divergence

Detailed mitigations live in `risk_register.md`.

---

## 21. Decision

AgentMail should be added to LMDR as:

- the conversational email lane
- the external-memory lane
- the inbox identity lane for agents

Twilio should remain:

- the SMS lane
- the urgent attention lane

VAPI should remain:

- the voice lane

Wix triggered email should remain:

- the transactional member or contact lane

SendGrid should remain:

- the bulk campaign lane

That is the correct hybrid architecture for this repository.

---

## 22. External References

Official sources reviewed during this track authoring:

- https://www.agentmail.to/
- https://docs.agentmail.to/welcome
- https://docs.agentmail.to/quickstart
- https://docs.agentmail.to/documentation/core-concepts/pods
- https://docs.agentmail.to/idempotency
- https://docs.agentmail.to/webhook-setup
- https://docs.agentmail.to/webhook-verification
- https://github.com/agentmail-to
- official Wix triggered email documentation for `emailMember()` and `emailContact()`
