# SDAP Framework — Business Model Architecture
**Captured:** 2026-02-24
**Source:** Levy Rivers (founder, verbal ideation session)

---

## The Pattern

```
Service → Data → Automation → Platform
```

This is not just a product roadmap. It is the strategic sequence for how VelocityMatch builds an unassailable position in transportation workforce acquisition.

---

## What Each Phase Means

### 1. Service
Manual or semi-manual delivery. You are *doing the thing* for clients.

- **Current state:** Carrier pilot on placement service. Levy (or the team) actively facilitating driver-carrier matches.
- **Why it matters strategically:** Every service engagement generates data that nobody else has — real placement outcomes, driver behavior, carrier preference signals, rejection reasons.
- **The trap others fall into:** Staying here. Competing on human effort.

### 2. Data
The service phase accumulates proprietary signal. This is the moat forming.

- **VelocityMatch data assets being built:**
  - Driver profiles enriched with FMCSA, pay, sentiment, social
  - Carrier preference fingerprints (what they actually accept vs. what they post)
  - Match outcomes — accepted, ghosted, declined, completed
  - Driver-carrier interaction patterns
- **Why this is a moat:** You can't buy this data. You can only earn it by doing the service. By the time a competitor tries to replicate, you have months of ground truth they don't.

### 3. Automation
The data trains the system to do what humans were doing in Phase 1.

- **Current build:** Agentic recruiter (autonomous outreach loop), driver-facing AI qualification, match explanation engine.
- **The inflection point:** When the automation performs at or above human-level placement rates, headcount stops scaling with revenue. Margins expand. This is where the business model bends.
- **Agentic infrastructure note (Levy, 2026-02-24):** *"The very nature that it exists and the formation of agent interaction infrastructure — I'm going further than anyone needs to go in a message but this is infrastructure tooling that can be called."* — The implication: the agentic layer is not just an internal tool. It is callable infrastructure. Which means it eventually becomes...

### 4. Platform
Other people's workflows call your infrastructure. You stop being a product and become a layer.

- **What this looks like for VelocityMatch:**
  - Carriers embed the recruiting agent into their own ATS/TMS
  - 3PLs call the match API as part of their capacity planning workflow
  - Staffing agencies white-label the driver acquisition layer
  - Insurance, benefits, equipment vendors build on top of driver profiles
- **Revenue model shift:** From placement fees → subscription → API / seat licensing → data licensing
- **The network effect:** Every new carrier + driver pair on the platform makes matches better for all carriers and drivers. Data compounding.

---

## Why the Pilot Is Strategically Important

The paying carrier pilot is **not just revenue**. It is:

1. The first node of ground-truth match data
2. Proof the service phase works (required to automate it)
3. The story for every subsequent carrier conversation: *"We have a live pilot"*
4. The beginning of the data moat

Framing traction as "a paying pilot" undersells it slightly. The accurate frame: **"We're in the service phase of a deliberate platform play."** The pilot IS the platform strategy executing.

---

## Features / Capabilities This Suggests

> *Levy's instruction: "memos on my ideas because those ideas then later turn into features"*

| Phase | Feature Idea | Status |
|-------|-------------|--------|
| Data | Driver behavior scoring model (from match outcomes) | Possible — data accumulating |
| Data | Carrier preference fingerprinting (implicit signals) | Possible — needs explicit capture |
| Automation | Autonomous outreach loop (recruiter agent) | In build |
| Automation | Driver qualification agent (inbound) | In build |
| Platform | Carrier API — embed match engine in their ATS | Future |
| Platform | Match data licensing to insurers, benefits providers | Future |
| Platform | White-label driver acquisition for staffing agencies | Future |

---

## Related Services in Codebase

- `agentService.jsw` — Agent orchestration (automation layer)
- `agentConversationService.jsw` — Conversation persistence (data layer)
- `voiceCampaignService.jsw` — Outbound calling (automation layer)
- `matchExplanationService.jsw` — Match rationale (bridges data → automation)
- `driverScoring.js` — Scoring model (data → automation)

---

*This memo should be reviewed and updated as the platform evolves through each phase transition.*
