# Phase 0 Bridge Inventory - AI Matching

## Purpose

This document captures the **current** postMessage bridge surface for the AI Matching page as implemented on 2026-02-28.

It is a baseline inventory, not an idealized contract.

The goals are:

- enumerate every known message traveling between the HTML component and Wix page code
- document the current message envelope
- capture payload shapes as they exist today
- identify which controller or feature flow each message currently touches
- provide a stable baseline for Phase 1 contract extraction

---

## Canonical Message Envelope Today

### HTML -> Wix page

Current sender:

- `src/public/driver/js/ai-matching-bridge.js`

Envelope shape:

```json
{
  "type": "carrierMatching",
  "action": "<message-name>",
  "data": {}
}
```

Notes:

- `type` is currently always `"carrierMatching"` for outbound HTML messages.
- `action` is the operational message name consumed by page code.
- page code resolves `msg.action || msg.type`, so some direct messages can still work if `action` is absent.

### Wix page -> HTML

Current sender:

- `src/pages/AI - MATCHING.rof4w.js`

Envelope shape:

```json
{
  "type": "<message-name>",
  "data": {},
  "timestamp": 1700000000000
}
```

Notes:

- page code sends the message name as `type`
- page code always wraps payload under `data`
- browser bridge validates `type` and `data`

---

## Current Routing Model

### HTML dispatch

- Primary outbound sender: `sendToWix(action, data)`
- Primary inbound listener:
  - `src/public/driver/js/ai-matching-bridge.js`
  - plus additional inline listeners in `AI_MATCHING.html`

### Page dispatch

- Primary inbound router: `handleHtmlMessage(msg)`
- Primary outbound sender: `sendToHtml(type, data)`

---

## HTML -> Wix Messages

## 1. `carrierMatchingReady`

### Direction

- HTML -> Wix

### Current sender

- inline startup in `AI_MATCHING.html`

### Current payload

```json
{}
```

### Current behavior

- signals that the HTML iframe is ready
- page responds with `pageReady` immediately if Wix bootstrap is complete
- otherwise page defers the response until async bootstrap finishes

### Downstream effects

- readiness handshake
- prevents initial state from being sent before cached profile and interests are loaded

---

## 2. `ping`

### Direction

- HTML -> Wix

### Current sender

- `verifyConnection()` in `ai-matching-bridge.js`

### Current payload

```json
{
  "timestamp": 1700000000000
}
```

### Current behavior

- health check from HTML to page code
- expects `pong`

### Downstream effects

- connection verification only

---

## 3. `findMatches`

### Direction

- HTML -> Wix

### Current sender

- form submit flow in `AI_MATCHING.html`

### Current payload shape

```json
{
  "homeZip": "75001",
  "maxDistance": 100,
  "minCPM": 0.55,
  "operationType": "Regional",
  "maxTurnover": 90,
  "maxTruckAge": 5,
  "fleetSize": "any",
  "driverName": "Driver",
  "customWeights": {
    "location": 25,
    "pay": 20,
    "operationType": 15,
    "safety": 10,
    "turnover": 12,
    "truckAge": 8
  }
}
```

### Current behavior

- page refreshes user status
- async semantic path is attempted first via `handleFindMatchesAsync`
- sync fallback path via `handleFindMatches` if async kickoff fails

### Downstream effects

- can trigger:
  - `searchJobStarted`
  - `searchJobStatus`
  - `matchResults`
  - `matchError`
  - `enrichmentUpdate`
  - `enrichmentComplete`

---

## 4. `pollSearchJob`

### Direction

- HTML -> Wix

### Current sender

- async polling loop in `ai-matching-results.js`

### Current payload shape

```json
{
  "jobId": "job_abc123"
}
```

### Current behavior

- page checks async search job status through `checkSearchStatus`
- page emits `searchJobStatus` while processing
- page emits `matchResults` when complete

### Downstream effects

- async polling lifecycle only

---

## 5. `logInterest`

### Direction

- HTML -> Wix

### Current sender

- interest CTA flow from results list

### Current payload shape

```json
{
  "carrierDOT": "1234567",
  "carrierName": "Carrier Name",
  "matchScore": 84,
  "driverZip": "75001",
  "driverName": "Driver"
}
```

### Current behavior

- page calls `logMatchEvent`
- uses new driver-linked flow when available, legacy fallback when needed

### Downstream effects

- emits `interestLogged`

---

## 6. `retryEnrichment`

### Direction

- HTML -> Wix

### Current sender

- retry button in results UI

### Current payload shape

```json
{
  "dot_number": "1234567"
}
```

### Current behavior

- page re-runs enrichment for a carrier
- can use async Railway enrichment or Wix-side fallback

### Downstream effects

- emits one or more `enrichmentUpdate`

---

## 7. `navigateToSignup`

### Direction

- HTML -> Wix

### Current sender

- guest banner and login prompt flows

### Current payload

```json
{}
```

### Current behavior

- page initiates Wix signup/login flow

### Downstream effects

- emits `loginSuccess` or `loginCancelled`

---

## 8. `navigateToLogin`

### Direction

- HTML -> Wix

### Current sender

- guest banner and login prompt flows

### Current payload

```json
{}
```

### Current behavior

- page initiates Wix login flow

### Downstream effects

- emits `loginSuccess` or `loginCancelled`

---

## 9. `loginForApplication`

### Direction

- HTML -> Wix

### Current sender

- application modal login prompt

### Current payload shape

```json
{
  "mode": "signup"
}
```

or

```json
{
  "mode": "login"
}
```

### Current behavior

- page routes to signup or login handler
- intended for application recovery flow

### Downstream effects

- emits `loginSuccess` or `loginCancelled`

---

## 10. `checkUserStatus`

### Direction

- HTML -> Wix

### Current sender

- initialization and state refresh flows

### Current payload

```json
{}
```

### Current behavior

- page checks current auth state

### Downstream effects

- emits `userStatusUpdate`

---

## 11. `getDriverProfile`

### Direction

- HTML -> Wix

### Current sender

- initialization and profile refresh flows

### Current payload

```json
{}
```

### Current behavior

- page loads or creates driver profile and sends a normalized profile object

### Downstream effects

- emits `driverProfileLoaded`

---

## 12. `navigateToSavedCarriers`

### Direction

- HTML -> Wix

### Current sender

- saved carriers navigation action

### Current payload

```json
{}
```

### Current behavior

- page redirects to saved carriers route

### Downstream effects

- navigation only

---

## 13. `submitApplication`

### Direction

- HTML -> Wix

### Current sender

- application modal submit flow

### Current payload shape

Representative current fields:

```json
{
  "carrierDOT": "1234567",
  "carrierName": "Carrier Name",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "5551234567",
  "email": "john@example.com",
  "city": "Dallas",
  "state": "TX",
  "zip": "75001",
  "dob": "1990-01-01",
  "cdlClass": "A",
  "cdlNumber": "TX123456",
  "cdlState": "TX",
  "cdlExpiration": "2027-01-01",
  "endorsements": ["hazmat", "tanker"],
  "restrictions": [],
  "medCardExpiration": "2026-12-31",
  "cleanMVR": true,
  "drivingExperienceYears": 3,
  "companiesCount": 2,
  "employerHistory": [],
  "message": "Interested in this opportunity",
  "cdlFrontImage": "data:*/*;base64,...",
  "cdlBackImage": "data:*/*;base64,...",
  "medCardImage": "data:*/*;base64,...",
  "resumeFile": "data:*/*;base64,..."
}
```

### Current behavior

- page validates carrier identity presence
- page forwards data to `submitApplication`
- page can update profile docs as part of the flow

### Downstream effects

- emits `applicationSubmitted`

---

## 14. `saveProfileDocs`

### Direction

- HTML -> Wix

### Current sender

- profile/document save flows

### Current payload shape

```json
{
  "cdlFrontImage": "data:*/*;base64,...",
  "cdlBackImage": "data:*/*;base64,...",
  "medCardImage": "data:*/*;base64,...",
  "resumeFile": "data:*/*;base64,..."
}
```

### Current behavior

- page saves driver documents and refreshes profile data

### Downstream effects

- emits `profileSaved`
- may also emit `driverProfileLoaded`

---

## 15. `extractDocumentOCR`

### Direction

- HTML -> Wix

### Current sender

- file upload / OCR helper flow

### Current payload shape

```json
{
  "base64DataUrl": "data:*/*;base64,...",
  "docType": "CDL_FRONT"
}
```

### Current behavior

- page invokes OCR extraction and returns extracted fields

### Downstream effects

- emits `ocrResult`

---

## 16. `getMatchExplanation`

### Direction

- HTML -> Wix

### Current sender

- explanation panel expand flow

### Current payload shape

```json
{
  "carrierDot": "1234567",
  "driverId": "CURRENT_USER"
}
```

### Current behavior

- page attempts backend explanation for logged-in users
- falls back to local explanation built from cached search results

### Downstream effects

- emits `matchExplanation`

---

## 17. `getDriverApplications`

### Direction

- HTML -> Wix

### Current sender

- applications tab load and refresh flow

### Current payload

```json
{}
```

### Current behavior

- page loads application history for logged-in driver
- anonymous users receive an empty array

### Downstream effects

- emits `driverApplications`

---

## 18. `getMutualInterest`

### Direction

- HTML -> Wix

### Current sender

- mutual interest refresh flow

### Current payload

```json
{}
```

### Current behavior

- page loads mutual interest records for current driver

### Downstream effects

- emits `mutualInterestData`

---

## 19. `logFeatureInteraction`

### Direction

- HTML -> Wix

### Current sender

- various feature tracking points in shell and modules

### Current payload shape

```json
{
  "featureId": "ai_matching",
  "userId": "optional-user-id",
  "action": "view",
  "...additionalContext": "..."
}
```

### Current behavior

- page forwards tracking event to feature adoption service
- fire-and-forget

### Downstream effects

- no bridge response required

---

## 20. `agentMessage`

### Direction

- HTML -> Wix

### Current sender

- `ai-matching-agent.js`

### Current payload shape

```json
{
  "text": "Help me compare these carriers",
  "context": {}
}
```

### Current behavior

- page sends `agentTyping`
- forwards request to `handleAgentTurn`

### Downstream effects

- emits `agentTyping`
- emits `agentResponse` or `agentApprovalRequired`

---

## 21. `resolveApprovalGate`

### Direction

- HTML -> Wix

### Current sender

- approval UX inside agent flow

### Current payload shape

```json
{
  "approvalContext": {},
  "decision": "approve",
  "decidedBy": "user"
}
```

### Current behavior

- page resumes paused agent workflow

### Downstream effects

- emits `agentTyping`
- emits `agentResponse`

---

## 22. `getVoiceConfig`

### Direction

- HTML -> Wix

### Current sender

- voice bootstrap flow

### Current payload

```json
{}
```

### Current behavior

- page fetches voice configuration from backend

### Downstream effects

- emits `voiceReady`

---

## 23. `startVoiceCall`

### Direction

- HTML -> Wix

### Current sender

- voice UI flow

### Current payload

Current shape is not authoritative in page code because page treats this as client-handled.

### Current behavior

- page intentionally performs no backend action

### Downstream effects

- none through page bridge

---

## 24. `endVoiceCall`

### Direction

- HTML -> Wix

### Current sender

- voice UI flow

### Current payload

Current shape is not authoritative in page code because page treats this as client-handled.

### Current behavior

- page intentionally performs no backend action

### Downstream effects

- none through page bridge

---

## Wix -> HTML Messages

## 1. `pong`

### Direction

- Wix -> HTML

### Current payload shape

```json
{
  "timestamp": 1700000000000,
  "registeredInbound": 23,
  "registeredOutbound": 24
}
```

### Current behavior

- connection health acknowledgement

---

## 2. `pageReady`

### Direction

- Wix -> HTML

### Current payload shape

```json
{
  "userStatus": {
    "loggedIn": false,
    "isPremium": false,
    "tier": "free"
  },
  "driverProfile": {
    "id": "drv_123",
    "displayName": "Driver Name",
    "homeZip": "75001",
    "maxDistance": 100,
    "minCPM": 0.55,
    "operationType": "Regional",
    "maxTurnover": 90,
    "maxTruckAge": 5,
    "fleetSize": "any",
    "completeness": 80,
    "totalSearches": 3,
    "isComplete": false,
    "missingFields": [],
    "isDiscoverable": true,
    "cdl_front_image": "...",
    "cdl_back_image": "...",
    "med_card_image": "...",
    "resume_file": "..."
  },
  "appliedCarriers": [
    {
      "carrierDOT": "1234567"
    }
  ]
}
```

### Current behavior

- initial hydration of user status, profile state, and applied carriers

---

## 3. `userStatusUpdate`

### Direction

- Wix -> HTML

### Current payload shape

```json
{
  "loggedIn": true,
  "isPremium": true,
  "tier": "premium",
  "email": "user@example.com",
  "userId": "member-id"
}
```

### Current behavior

- updates guest/premium state in UI

---

## 4. `loginSuccess`

### Direction

- Wix -> HTML

### Current payload shape

```json
{
  "userStatus": {
    "loggedIn": true,
    "isPremium": true,
    "tier": "premium"
  },
  "driverProfile": {
    "id": "drv_123",
    "displayName": "Driver Name",
    "homeZip": "75001",
    "completeness": 80
  }
}
```

### Current behavior

- used after signup/login and application recovery login

---

## 5. `loginCancelled`

### Direction

- Wix -> HTML

### Current payload

```json
{}
```

### Current behavior

- closes or resets pending login flows

---

## 6. `searchJobStarted`

### Direction

- Wix -> HTML

### Current payload shape

```json
{
  "jobId": "job_abc123"
}
```

### Current behavior

- starts async polling loop in browser modules

---

## 7. `searchJobStatus`

### Direction

- Wix -> HTML

### Current payload shape

```json
{
  "jobId": "job_abc123",
  "status": "PROCESSING"
}
```

or

```json
{
  "jobId": "job_abc123",
  "status": "FAILED",
  "error": "Search failed"
}
```

### Current behavior

- status updates during async polling

---

## 8. `matchResults`

### Direction

- Wix -> HTML

### Current payload shape

Representative fields across sync and async paths:

```json
{
  "matches": [],
  "totalScored": 100,
  "totalMatches": 25,
  "userTier": "premium",
  "maxAllowed": 10,
  "isPremium": true,
  "upsellMessage": null,
  "driverProfile": {
    "id": "drv_123",
    "displayName": "Driver Name",
    "completeness": 80
  },
  "autoEnrichDot": "1234567",
  "source": "async-option-b"
}
```

### Current match item shape

Representative current fields:

```json
{
  "carrier": {
    "DOT_NUMBER": 1234567,
    "LEGAL_NAME": "Carrier Name",
    "PHY_CITY": "Dallas",
    "PHY_STATE": "TX",
    "PAY_CPM": 0.65,
    "SAFETY_RATING": "Satisfactory"
  },
  "overallScore": 84,
  "score": 84,
  "rationale": {},
  "enrichment": null,
  "needsEnrichment": true,
  "fromCache": false,
  "recruiterStats": null,
  "isMutualMatch": true,
  "mutualStrength": "strong",
  "mutualSignals": ["viewed", "saved"]
}
```

### Current behavior

- primary payload for results rendering

---

## 9. `matchError`

### Direction

- Wix -> HTML

### Current payload shape

```json
{
  "error": "Search timed out. Please try again."
}
```

### Current behavior

- displays blocking search error state

---

## 10. `enrichmentUpdate`

### Direction

- Wix -> HTML

### Current payload shape

Representative fields:

```json
{
  "dot_number": "1234567",
  "status": "loading",
  "position": 1,
  "total": 1,
  "message": "AI Researching..."
}
```

or completion shape:

```json
{
  "dot_number": "1234567",
  "status": "complete",
  "ai_summary": "Carrier summary...",
  "sentiment": "positive",
  "pay_analysis": {},
  "review_summary": {},
  "error": null
}
```

### Current behavior

- updates individual match cards with enrichment status and content

---

## 11. `enrichmentComplete`

### Direction

- Wix -> HTML

### Current payload shape

```json
{
  "totalEnriched": 1
}
```

### Current behavior

- signals end of active enrichment wave

---

## 12. `interestLogged`

### Direction

- Wix -> HTML

### Current payload shape

```json
{
  "success": true,
  "carrierDOT": "1234567",
  "isNew": true,
  "error": null
}
```

### Current behavior

- updates result card button/tag state
- may trigger confirmation modal on success

---

## 13. `driverProfileLoaded`

### Direction

- Wix -> HTML

### Current payload shape

Representative fields:

```json
{
  "success": true,
  "profile": {
    "id": "drv_123",
    "displayName": "Driver Name",
    "email": "driver@example.com",
    "homeZip": "75001",
    "maxDistance": 100,
    "minCPM": 0.55,
    "operationType": "Regional",
    "maxTurnover": 90,
    "maxTruckAge": 5,
    "fleetSize": "any",
    "yearsExperience": 3,
    "cdlClass": "A",
    "endorsements": ["hazmat"],
    "cleanMVR": true,
    "completeness": 80,
    "totalSearches": 3,
    "isComplete": false,
    "isDiscoverable": true,
    "missingFields": [],
    "cdl_front_image": "...",
    "cdl_back_image": "...",
    "med_card_image": "...",
    "resume_file": "..."
  }
}
```

### Current behavior

- used for full profile hydration after load and after document changes

---

## 14. `savedCarriersLoaded`

### Direction

- Wix -> HTML

### Current payload shape

```json
{
  "success": true,
  "carriers": [],
  "error": null
}
```

### Current behavior

- currently available for saved carrier flows

---

## 15. `discoverabilityUpdated`

### Direction

- Wix -> HTML

### Current payload shape

```json
{
  "success": true,
  "isDiscoverable": true
}
```

### Current behavior

- updates discoverability UI state

---

## 16. `profileSaved`

### Direction

- Wix -> HTML

### Current payload shape

```json
{
  "success": true,
  "profile": {
    "completeness": 85,
    "missingFields": [],
    "cdl_front_image": "...",
    "cdl_back_image": "...",
    "med_card_image": "...",
    "resume_file": "..."
  }
}
```

### Current behavior

- confirms document/profile save

---

## 17. `ocrResult`

### Direction

- Wix -> HTML

### Current payload shape

Representative fields:

```json
{
  "success": true,
  "docType": "CDL_FRONT",
  "fields": {
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "cdlClass": "A",
    "endorsements": ["hazmat"],
    "state": "TX",
    "dob": "1990-01-01",
    "licenseNumber": "TX123456"
  },
  "error": null
}
```

### Current behavior

- pre-fills application fields and OCR-related state

---

## 18. `applicationSubmitted`

### Direction

- Wix -> HTML

### Current payload shape

Representative fields:

```json
{
  "success": true,
  "carrierDOT": "1234567",
  "carrierName": "Carrier Name",
  "applicationId": "app_123",
  "duplicate": false,
  "error": null
}
```

### Current behavior

- updates modal success state
- updates result card to applied state

---

## 19. `driverApplications`

### Direction

- Wix -> HTML

### Current payload shape

Usually an array:

```json
[
  {
    "_id": "app_123",
    "carrierDOT": "1234567",
    "carrierName": "Carrier Name",
    "status": "submitted",
    "submittedAt": "2026-02-28T00:00:00Z"
  }
]
```

Anonymous fallback:

```json
[]
```

### Current behavior

- hydrates applications tab

---

## 20. `mutualInterestData`

### Direction

- Wix -> HTML

### Current payload shape

```json
{
  "interests": [
    {
      "carrierDot": "1234567",
      "strength": "strong",
      "signals": ["viewed", "saved"]
    }
  ],
  "error": null
}
```

### Current behavior

- overlays mutual indicators onto results

---

## 21. `matchExplanation`

### Direction

- Wix -> HTML

### Current payload shape

Representative fields:

```json
{
  "success": true,
  "carrierDot": "1234567",
  "explanation": "Good match because...",
  "summary": "Strong regional fit",
  "details": {},
  "tips": []
}
```

### Current behavior

- populates explanation panel
- can come from backend explanation service or local fallback

---

## 22. `agentTyping`

### Direction

- Wix -> HTML

### Current payload

```json
{}
```

### Current behavior

- indicates active agent processing

---

## 23. `agentResponse`

### Direction

- Wix -> HTML

### Current payload shape

Not rigidly normalized yet. Current shape depends on `handleAgentTurn` result.

Representative fields:

```json
{
  "type": "message",
  "text": "Here are the strongest carriers for your preferences.",
  "data": {},
  "error": null
}
```

### Current behavior

- main agent response surface

---

## 24. `agentToolResult`

### Direction

- Wix -> HTML

### Current payload shape

Not currently central to page code behavior in this file, but listed in registries for tool-result handling.

### Current behavior

- reserved/agent-supporting response type

---

## 25. `agentApprovalRequired`

### Direction

- Wix -> HTML

### Current payload shape

Depends on agent approval gate result.

Representative fields:

```json
{
  "type": "approval_required",
  "approvalContext": {},
  "message": "Approve this action?"
}
```

### Current behavior

- prompts approval UI in agent flow

---

## 26. `voiceReady`

### Direction

- Wix -> HTML

### Current payload shape

Depends on `getVoiceConfig()` output.

Representative fields:

```json
{
  "assistantId": "asst_123",
  "phoneNumberId": "pn_123",
  "provider": "vapi"
}
```

### Current behavior

- hydrates voice assistant bootstrap

---

## Message Ownership Map

| Message | Current owner |
|---------|---------------|
| `carrierMatchingReady` | HTML bootstrap |
| `findMatches` | HTML results/search flow |
| `pollSearchJob` | browser async polling loop |
| `logInterest` | results CTA flow |
| `retryEnrichment` | enrichment retry CTA |
| `submitApplication` | application modal |
| `saveProfileDocs` | profile/docs flow |
| `extractDocumentOCR` | OCR/file upload flow |
| `getMatchExplanation` | explanation panel |
| `getDriverApplications` | applications tab |
| `getMutualInterest` | results overlay refresh |
| `agentMessage` | agent module |
| `resolveApprovalGate` | agent approval UX |
| `getVoiceConfig` | voice bootstrap |
| `pageReady` | page bootstrap controller |
| `matchResults` | search controller |
| `matchError` | search controller |
| `enrichmentUpdate` | enrichment controller |
| `applicationSubmitted` | application controller |
| `ocrResult` | application/profile controller |
| `matchExplanation` | explanation controller |
| `agentResponse` | agent controller |
| `voiceReady` | agent/voice controller |

---

## Known Contract Weaknesses

## 1. Duplicate registry definitions

The HTML bridge and Wix page each define registries. These can drift.

## 2. Weak payload normalization

Some payloads are well-shaped, others are effectively pass-through from backend services.

## 3. Mixed listener ownership on HTML side

The HTML shell and extracted bridge both listen to `message` events.

## 4. Some response types are operationally optional

Examples:

- `agentToolResult`
- `voiceReady`
- `savedCarriersLoaded`

These exist in the contract but are not as structurally enforced as the core match flow.

## 5. Sync and async search result shapes are close but not formally frozen

This must be normalized in Phase 1 or Phase 4.

---

## Phase 1 Freeze Recommendations

The following should be frozen first:

1. message names
2. envelope structure
3. `matchResults` payload shape
4. `applicationSubmitted` payload shape
5. `driverProfileLoaded` payload shape
6. `ocrResult` payload shape
7. `mutualInterestData` payload shape
8. readiness sequencing for `carrierMatchingReady` -> `pageReady`

---

## Recommended Next Artifacts

- `contract_v1.md` or equivalent canonical contract file
- payload schema helpers in code
- route ownership map tied to extracted page controllers
