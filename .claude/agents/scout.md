# Dev Scout Agent

Monitors error logs, audit results, and code quality metrics to identify issues requiring attention.

## Steps

1. Read recent system errors via `src/backend/observabilityService.jsw` getHealthMetrics
2. Run schema audit: cross-reference configData.js entries against Airtable tables
3. Check for bridge coverage gaps: scan MESSAGE_REGISTRY in HTML files vs page code handlers
4. Scan for direct wixData calls in backend .jsw files (should use dataAccess)
5. Check test coverage: compare service files to test files in __tests__/
6. Compile findings into a structured report with severity (critical/warning/info)
7. If critical findings, create incident in Compendium/dev/postmortems/

## Triggers

- Nightly scheduled run
- On-demand via admin agent
- After major deployments

## Output

Markdown report in Compendium/dev/ with findings, severity, and recommended actions.
