# LEG 1 - AI Matching Page Console Logs

## Timestamp: 2026-02-09
## URL: https://www.lastmiledr.app/ai-matching

### ERRORS (0)
None

### WARNINGS (3)
1. `msgid=2` — Meta pixel 588034312085525 unavailable (traffic permissions)
2. `msgid=9` — cdn.tailwindcss.com should not be used in production
3. `msgid=27,28` — Wix preload resource not used within timeout (2 occurrences)

### LOGS (19) — Bridge Lifecycle
1. `msgid=5` — Carrier Matching Page Ready
2. `msgid=6` — HTML component found: html4
3. `msgid=7` — Checking user login state: **false** (NOT LOGGED IN)
4. `msgid=8` — Initial user status: JSHandle@object
5. `msgid=10` — OCR Handler initialized (max 1200px, 3 document types)
6. `msgid=11` — File input listeners attached (3 inputs)
7. `msgid=12` — LMDR Carrier Matching **V7 (Message Validation)** Ready
8. `msgid=13` — Message Registry loaded
9. `msgid=14` — [HTML→Velo] carrierMatchingReady
10. `msgid=15` — HTML Embed Ready - Sending initial state
11. `msgid=16` — [Velo→HTML] pageReady
12. `msgid=17` — [Accordion] Initializing mobile-first accordion system
13. `msgid=18` — [Accordion] Accordion system ready
14. `msgid=19` — [HTML→Velo] ping
15. `msgid=20` — [Velo→HTML] pageReady (received in HTML)
16. `msgid=21` — Page code ready - initial state received
17. `msgid=22` — Applied carriers loaded: 0
18. `msgid=23-25` — ping/pong exchange
19. `msgid=26` — **CONNECTION VERIFIED: Velo↔HTML bridge operational**

### KEY FINDINGS
- ZERO ERRORS on AI Matching page
- Bridge lifecycle completed successfully: carrierMatchingReady → pageReady → ping/pong → VERIFIED
- User is NOT logged in (login state: false)
- V7 Message Validation active with registry
- OCR handler ready for document upload
- Applied carriers: 0 (fresh session)
