# LEG 2 - AI Matching Form Fill + Carrier Search Console Logs

## Timestamp: 2026-02-09
## URL: https://www.lastmiledr.app/ai-matching
## Test Data: ZIP=75001, Commute=100mi, CPM=0.55, Regional, Turnover<50%, TruckAge<3yr

### CRITICAL ERROR — 504 GATEWAY TIMEOUT
**Alert dialog:** "Error finding matches: Request failed with status code 504."

### Flow Trace
1. `msgid=29` — [HTML→Velo] findMatches — form data sent to page code
2. `msgid=30` — [Velo received] findMatches
3. `msgid=31` — Checking user login state: **false**
4. `msgid=32` — Running backend search with: (preferences object)
5. `msgid=33` — User tier: **free** | isPremium: **false**
6. `msgid=35` — **SEARCH ERROR: JSHandle@error** (504)
7. `msgid=36` — [Velo→HTML] matchError sent
8. `msgid=37` — [HTML received] matchError → showed alert dialog

### ERRORS (1) — P0 CRITICAL
1. `msgid=35` — **504 Gateway Timeout** on carrier matching backend call
   - The `findMatchingCarriers()` call in `carrierMatching.jsw` timed out
   - Wix Velo backend functions have a ~14s timeout limit
   - Likely cause: Airtable query for carriers collection is too slow or the scoring loop over ~500 carriers exceeds timeout

### WARNINGS (4)
1. Meta pixel unavailable (traffic permissions)
2. Tailwind CDN production warning
3. Wix preload resource warnings (3 occurrences)

### LOGS (bridge healthy before error)
- Bridge lifecycle completed: carrierMatchingReady → pageReady → ping/pong → VERIFIED
- findMatches message routed correctly through bridge
- User correctly identified as free tier

### KEY FINDINGS
- **BLOCKER**: 504 timeout kills the entire search flow — no results, no application possible
- Bridge is healthy — the error is purely backend
- Form data collection + postMessage routing works correctly
- User tier detection works (free/not premium)
- Error handling works (matchError sent back, alert shown) — but alert() is bad UX (blocks page)
