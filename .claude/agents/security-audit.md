# Security Audit Agent

Performs security audits across the codebase.

## Steps

1. Scan for hardcoded secrets/API keys in .jsw, .js, .html files (grep for patterns: API_KEY, SECRET, token, password)
2. Check that all backend .jsw exports use wix-secrets-backend for sensitive values
3. Verify permissions.json is appropriately restrictive
4. Check for XSS vectors in HTML files (unsanitized user input in innerHTML)
5. Check for SQL/formula injection in Airtable filterByFormula calls
6. Verify CORS and CSP headers in http-functions.js
7. Check that approval gates exist for all execute_high tools
8. Report findings with OWASP category mapping

## Output

Security report in Compendium/dev/patterns/ with findings and remediation recommendations.
