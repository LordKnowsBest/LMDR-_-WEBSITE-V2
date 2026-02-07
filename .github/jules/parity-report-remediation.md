# Jules Task: Parity Report Remediation — Page Code <-> HTML Gaps

## Context

Read the report at `PARITY_REPORT.md` in the repo root. This report maps Wix Velo page code files (`src/pages/*.js`) to their corresponding HTML component files (`src/public/**/*.html`). It identifies three categories of gaps that need to be closed.

## Your Objective

Implement changes to close the parity gaps identified in the report. Work through each section below in order.

---

## Section 1: Confirm Likely Matches

The report lists 8 "Likely Matches" where page code and HTML files exist but have mismatched names. For each pair:

1. Open both files and verify they correspond to the same feature.
2. If confirmed, add a comment at the top of the page code file referencing its HTML counterpart:
   ```js
   // HTML Component: src/public/<path>/<FILENAME>.html
   ```
3. If the page code file uses `$w('#htmlComponent')` or `postMessage`, verify the message actions in the page code align with the `window.addEventListener('message', ...)` handler in the HTML file. Log any mismatches as TODO comments.

**Likely Match Pairs to Verify:**
| Page Code | HTML | Notes |
|---|---|---|
| AI - Matching.rof4w.js | src/public/driver/AI_MATCHING.html | Hyphen vs Underscore |
| Road Utilities.xzvqe.js | src/public/driver/DRIVER_ROAD_UTILITIES.html | Name mismatch |
| HealthWellness_Bridge_Reference.js | src/public/driver/HEALTH_WELLNESS.html | Bridge reference |
| PetFriendly_Bridge_Reference.js | src/public/driver/PET_FRIENDLY.html | Bridge reference |
| Retention Dashboard.k2ez4.js | src/public/recruiter/Recruiter_Retention_Dashboard.html | Dashboard |
| Recruiter Console.zriuj.js | src/public/recruiter/RecruiterDashboard.html | Console vs Dashboard |
| About.dkz1k.js | src/public/landing/About_page.html | About |
| Truck Drivers .gsx0g.js | src/public/landing/Truck_Driver_Page.html | Space/underscore |

---

## Section 2: Create Missing Page Code for Orphaned HTML Files

The report lists HTML files in `src/public/` that have **no corresponding page code** in `src/pages/`. These HTML components are embedded via Wix `HtmlComponent` elements, and each needs a page code file that:

1. Initializes the page on `$w.onReady()`.
2. Retrieves the current user/session context (role, memberId, carrier_dot, etc.) from `wix-members-backend` or `wix-users`.
3. Sends the session context to the HTML component via `postMessage`.
4. Listens for messages back from the HTML component and routes them to the appropriate backend `.jsw` service.

**Priority — Admin Pages (create page code stubs for each):**
- ADMIN_OBSERVABILITY.html
- ADMIN_FEATURE_ADOPTION.html
- ADMIN_MODERATION.html
- ADMIN_PROMPTS.html
- ADMIN_DRIVERS.html
- ADMIN_CARRIERS.html
- ADMIN_AUDIT_LOG.html
- ADMIN_DASHBOARD.html
- ADMIN_GAMIFICATION_ANALYTICS.html
- ADMIN_AI_ROUTER.html
- ADMIN_CONTENT.html
- ADMIN_MATCHES.html
- Admin_Portal_Dashboard.html

**Priority — B2B Pages:**
- B2B_ACCOUNT_DETAIL.html
- B2B_RESEARCH_PANEL.html
- B2B_ANALYTICS.html
- B2B_PIPELINE.html
- B2B_DASHBOARD.html
- B2B_LEAD_CAPTURE.html
- B2B_CAMPAIGNS.html
- B2B_OUTREACH.html

**Priority — Driver Pages:**
- DRIVER_FORUMS.html
- CHALLENGES.html
- DRIVER_MY_CAREER.html
- DRIVER_DOCUMENT_UPLOAD.html
- DRIVER_POLICIES.html
- DRIVER_GAMIFICATION.html
- DRIVER_BADGES.html

**Priority — Recruiter Pages:**
- Recruiter_Pipeline_Page.html
- Recruiter_Pricing.html
- Recruiter_Pricing_Page.html
- Recruiter_Console_Infograph.html
- Recruiting_Landing_Page.html
- RECRUITER_ONBOARDING_DASHBOARD.html
- RECRUITER_LEADERBOARD.html
- RECRUITER_GAMIFICATION.html
- Recruiter_Telemetry.html
- RECRUITER_LIFECYCLE_MONITOR.html

**Priority — Utility & Landing:**
- Orientation_Scheduler.html
- DQF_Compliance_Portal.html
- GAMIFICATION_HELP.html
- Office_Management.html

### Page Code Stub Pattern

Use this pattern for each new page code file. Adapt the imports, role check, and message handler to match what the HTML file expects:

```js
import { currentMember } from 'wix-members-backend';
// Import relevant backend service(s) based on HTML component actions

$w.onReady(async function () {
  try {
    const member = await currentMember.getMember({ fieldsets: ['FULL'] });
    // TODO: Add role/access verification appropriate for this page

    $w('#htmlComponent1').postMessage({
      type: 'init',
      payload: {
        memberId: member._id,
        // TODO: Add page-specific context fields
      }
    });

    $w('#htmlComponent1').onMessage(async (event) => {
      const { type, payload } = event.data;
      // TODO: Route message types to backend service calls
      // Pattern: switch(type) { case 'ACTION_NAME': ... }
    });
  } catch (err) {
    console.error('Page init failed:', err);
  }
});
```

---

## Section 3: Audit Page-Code-Only Outliers

These page code files have no HTML counterpart. Verify each is intentional:

- **Member Page.k40gh.js** — Standard Wix Members page (no HTML needed, confirm).
- **Post.vjkjy.js** — Standard Wix Blog page (no HTML needed, confirm).
- **masterPage.js** — Global site code (no HTML needed, confirm).
- **Checkout.kbyzk.js** — Wix Stores Checkout (no HTML needed, confirm).
- **Home.c1dmp.js** — Check if this should connect to a landing HTML or is purely Wix native.
- **Driver Jobs (Item).s0js1.js** — Dynamic item page; check if `Driver Jobs.html` in `src/public/driver/` is its match.
- **LMDR Privacy Policy.cb4ub.js** — Confirm no HTML component needed.
- **Blog.b06oz.js** — Standard Wix Blog Feed (no HTML needed, confirm).

For each, add a comment at the top: `// Parity: No HTML component required — <reason>`

---

## Workflow

Follow the project's TDD workflow from `Conductor/workflow.md`:
1. For each group of changes, write tests first (Red phase).
2. Implement changes (Green phase).
3. Commit with format: `feat(parity): <description>`.
4. Attach git notes summarizing changes per the workflow.

## Success Criteria

- All 8 likely matches verified with cross-reference comments.
- Page code stubs created for all orphaned HTML files listed above.
- All page-code-only outliers audited with comments.
- All tests pass. No regressions.
