# Recruiter OS Facade Design

**Date:** 2026-03-01
**Problem:** Recruiter OS page code had 40+ imports from 30+ backend `.jsw` modules. The Wix bundler silently failed to load the module, preventing `$w.onReady` from ever firing. Zero page-specific console logs appeared. The HTML component bridge never connected.

**Root cause:** Wix Velo's bundler chokes on page code files with excessive import depth. The AI Matching page solved this months ago with a single facade file (`aiMatchingFacade.jsw`).

## Solution: Single Facade Pattern

**New file:** `src/backend/recruiterOSFacade.jsw`
- Imports from all 30+ backend service modules
- Re-exports ~110 thin async wrapper functions prefixed with `ros*`
- Each wrapper delegates directly to the real service function

**Modified file:** `src/pages/RECRUITER_OS.zriuj.js`
- Replaced 40+ backend imports with ONE import from `recruiterOSFacade.jsw`
- Uses `import { rosFoo as foo }` aliasing so all 65+ handler bodies remain unchanged
- Kept separate: `public/js/gamificationPageHandlers` (public module), `backend/configData` (sync config), `wix-location`, `wix-users`

## What stayed the same
- All 65+ message handler switch cases
- `sendToHtml` / `MESSAGE_REGISTRY` / message validation
- Two-way bridge handshake (proactive ping + recruiterReady push)
- HTML-side bridge (`ros-bridge.js`)
- The `#html8` HTML iframe component

## Prior fixes included in this commit
- Switched from Custom Element to standard HTML iframe (`#html8`)
- Added two-way handshake to prevent race condition (Velo pings HTML, HTML re-announces readiness)
- Bridge responds to `ping` with `recruiterOSReady` re-send
