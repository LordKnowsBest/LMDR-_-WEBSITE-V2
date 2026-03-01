# Verification Matrix — RecruiterOS Intelligence Convergence

**Track:** `recruiter_os_convergence_20260228`

---

## How to Use

After each wave, run the tests in the relevant column. After Wave 5, all cells should be green. Senior reviewer signs off on Gate rows before the next wave starts.

---

## Automated Tests

| Test File | Wave | Run Command | Expected |
|-----------|------|-------------|---------|
| `src/public/__tests__/rosContract.test.js` | W1 | Open in browser, check console | All assertions pass |
| `src/public/__tests__/rosNBA.test.js` | W3 | Open in browser, check console | All assertions pass |
| `src/public/__tests__/rosMarketSignals.test.js` | W3 | Open in browser, check console | All assertions pass |
| `src/public/__tests__/rosProactiveAI.test.js` | W4 | Open in browser, check console | All assertions pass |

---

## Gate 1 Manual Checklist

**Sign-off required by senior reviewer after Wave 2, before Wave 3.**

Navigator: use a recruiter account with real carriers and active drivers.

| # | Test | Expected | Pass |
|---|------|---------|------|
| 1 | Navigate to Intel view | Competitor data cards render with real carrier names | ☐ |
| 2 | Navigate to Predict view | Hiring forecast chart renders with non-zero values | ☐ |
| 3 | Navigate to Funnel view | Funnel stages show real applicant counts | ☐ |
| 4 | Navigate to Attribution view | Source channels chart renders with data | ☐ |
| 5 | Navigate to Lifecycle view | Driver stage distribution shows real drivers | ☐ |
| 6 | Navigate to Retention view | At-risk driver cards render (or empty state if no at-risk) | ☐ |
| 7 | Navigate to Onboard view | Onboarding workflow cards render | ☐ |
| 8 | Open browser console on all 7 views | Zero P0 console errors | ☐ |
| 9 | Open `bridge_inventory.md` | All 7 Wave 2 tools show `wired: true` | ☐ |
| 10 | Run `rosContract.test.js` | All assertions pass | ☐ |

**Signed off by:** _____________________ **Date:** _____________

---

## Gate 2 Manual Checklist

**Sign-off required by senior reviewer after Wave 3, before Wave 4.**

| # | Test | Expected | Pass |
|---|------|---------|------|
| 1 | Load RecruiterOS home view | 1-3 NBA chips visible in header within 3s | ☐ |
| 2 | Click an NBA chip | Navigates to the correct view | ☐ |
| 3 | Dismiss an NBA chip (click X) | Chip disappears, stays gone on view refresh | ☐ |
| 4 | Load home view | Market condition pill visible (HOT/SOFT/NEUTRAL) | ☐ |
| 5 | Navigate to Funnel view | Market ticker visible in funnel header | ☐ |
| 6 | Navigate to Cost-Hire view | Market ticker visible | ☐ |
| 7 | Open agent chat on Funnel view | Ask "what's my conversion rate?" | Agent mentions funnel metrics by name | ☐ |
| 8 | Open agent chat on Retention view | Ask "who's at risk?" | Agent mentions at-risk drivers or acknowledges retention context | ☐ |
| 9 | Navigate to Search, Pipeline, Messages | All three views render normally | ☐ |
| 10 | Run `rosNBA.test.js` | All assertions pass | ☐ |
| 11 | Run `rosMarketSignals.test.js` | All assertions pass | ☐ |

**Signed off by:** _____________________ **Date:** _____________

---

## Wave 4 Self-Verification

Completed by J1 and J2 before signaling Wave 5.

| # | Test | Expected | Pass |
|---|------|---------|------|
| 1 | Open chat for a recruiter with prior session history | "Previous sessions" accordion visible | ☐ |
| 2 | Open chat for a recruiter with no prior history | No "Previous sessions" section shown | ☐ |
| 3 | Load home view | Proactive insights appear within 4s | ☐ |
| 4 | Load home view with Railway cold start | Insights appear within 10s OR section stays hidden | ☐ |
| 5 | Trigger proactive insights twice | Only one bridge message sent (loaded guard) | ☐ |
| 6 | Run `rosProactiveAI.test.js` | All assertions pass | ☐ |

---

## Wave 5 — Evidence Pack Critical Paths

Run `claude --agent evidence-pack`. All 7 paths must pass.

| Path | Description | Screenshot Non-blank | Zero P0 Errors | Zero 500s |
|------|-------------|---------------------|----------------|-----------|
| 1 | Home view — NBA + market ticker + proactive insights | ☐ | ☐ | ☐ |
| 2 | Driver search — results render | ☐ | ☐ | ☐ |
| 3 | Pipeline kanban — columns render | ☐ | ☐ | ☐ |
| 4 | Agent chat — view-aware response | ☐ | ☐ | ☐ |
| 5 | Market signals — visible in home + funnel | ☐ | ☐ | ☐ |
| 6 | Intel view — competitor data visible | ☐ | ☐ | ☐ |
| 7 | Retention view — at-risk signals visible | ☐ | ☐ | ☐ |

**Evidence Pack run ID:** _____________________
**`quality_gate.json` pass:** ☐ YES

**Final sign-off:** _____________________ **Date:** _____________
