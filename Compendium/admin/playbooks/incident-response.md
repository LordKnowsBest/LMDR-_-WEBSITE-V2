# Incident Response

> Confidence: high | Source: manual | Last validated: 2026-02-18

## Context

The platform monitors four subsystems (Database, AI, Enrichment, FMCSA) through `observabilityService.jsw` and `recruiterHealthService.jsw`. When any subsystem degrades, the admin team needs a clear runbook to diagnose, mitigate, and resolve the issue.

## Details

- **Health status levels:** Each subsystem reports one of three states: `operational`, `degraded`, or `outage`. The aggregated platform status is the worst individual status (e.g., one `outage` makes the whole platform `outage`).

- **Triage order:**
  1. **Database (Airtable):** Check Airtable API status page, verify record count is below 50,000 per base limit, confirm `dataAccess.jsw` connection. Most common issue: rate limiting from observability tables flooding with log records.
  2. **AI providers:** Check active provider health via `aiRouterService.jsw`. The router supports multiple providers with automatic failover. If primary is down, verify secondary is routing correctly.
  3. **Enrichment pipeline:** Check the hourly `runEnrichmentBatch` scheduled job. If enrichment stalls, carriers lack AI-generated intelligence data. Verify the job's last successful run timestamp.
  4. **FMCSA data feed:** External dependency. If FMCSA API is down, carrier safety data becomes stale but the platform continues operating with cached data.

- **Airtable record flooding mitigation:** Observability tables (`systemLogs`, `systemErrors`, `systemTraces`) are configured to only persist CRITICAL events to Airtable. If record counts spike, verify the severity filter hasn't been accidentally loosened.

- **Escalation path:** Automated alerts surface in the Admin Dashboard (`ADMIN_OBSERVABILITY` page). If automated detection fails, manual health check via `getRecruiterHealthStatus()` with 30-second caching.

- **Post-incident:** Log a postmortem in `Compendium/admin/postmortems/` with root cause, timeline, and prevention measures.

## Evidence

- Health monitoring in `observabilityService.jsw` and `recruiterHealthService.jsw` (30s cache)
- Admin dashboard wired via `ADMIN_OBSERVABILITY.c8pf9.js` page code
- Airtable record limit: 50,000 per base (Team plan)
- AI router config in `v2_AI Router Config` table, managed via `ADMIN_AI_ROUTER.cqkgi.js`

## Related

- [Code Quality Rules](../../dev/patterns/code-quality-rules.md)
