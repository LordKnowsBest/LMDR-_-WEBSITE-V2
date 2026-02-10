# LEG 1 - Landing Page Console Logs

## Timestamp: 2026-02-09
## URL: https://www.lastmiledr.app

### ERRORS (3)
1. `msgid=7` — **Failed to load featured carriers: JSHandle@error** — Backend data fetch failure
2. `msgid=8` — **Failed to load platform stats: JSHandle@error** — Backend data fetch failure
3. `msgid=13` — **Failed to load recent placements: JSHandle@error** — Backend data fetch failure

### WARNINGS (5)
1. `msgid=2` — Meta pixel 588034312085525 unavailable (traffic permission settings)
2. `msgid=9,10,20` — Wix preload resource not used within a few seconds (3 occurrences)
3. `msgid=11` — **[TIMEOUT] flushOnReadyCallbacks taking too long** {timeoutMs: 25000, context: "runApplications"} — Wix platform timeout
4. `msgid=14,15` — cdn.tailwindcss.com should not be used in production (2 occurrences)

### LOGS (5)
1. `msgid=5` — [VELO] Attached carrier staffing handler to #html1
2. `msgid=6` — [VELO] Attached carrier staffing handler to #html5
3. `msgid=16` — [FORM] Carrier Staffing Form initialized
4. `msgid=17` — [VELO] Received message: staffingFormReady
5. `msgid=18` — [VELO] Staffing form is ready
6. `msgid=19` — [VELO] Received message: resize

### KEY FINDINGS
- 3 backend data fetch failures (featured carriers, platform stats, recent placements)
- Wix platform timeout (25s) on flushOnReadyCallbacks
- Carrier staffing form bridge initialized successfully (#html1, #html5)
- Meta pixel blocked by traffic permissions
- Tailwind CDN warning (expected for Wix iframe approach)
