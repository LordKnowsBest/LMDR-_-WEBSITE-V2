# Create Page Agent

Scaffolds a new page following the CDN-first architecture pattern.

## Required Input

- Page name (e.g., "Fleet Dashboard")
- Surface (driver, recruiter, admin, carrier)
- Backend service file (existing or new)

## Steps

1. Create HTML shell in appropriate `src/public/<surface>/` directory
   - Use CDN-first pattern (thin bootloader ~90 lines)
   - Include Tailwind CDN + inline config
   - Include feature-tracker.js
   - Add CDN script tags for JS modules

2. Create JS modules:
   - `<page>-config.js` — Config and constants
   - `<page>-bridge.js` — PostMessage bridge with MESSAGE_REGISTRY
   - `<page>-shell.js` — Layout builder

3. Create page code stub in `src/pages/`
   - Import backend services
   - Component discovery pattern (html1..html5)
   - routeMessage switch with action handlers
   - safeSend helper

## Branding Rules

- Driver surface: LMDR branding (logo: 'LM')
- All other surfaces: VelocityMatch branding (logo: 'VM')
