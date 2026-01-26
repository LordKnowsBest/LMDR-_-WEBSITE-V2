---
name: lmdr-audit-airtable
description: Audit LMDR backend services for Airtable routing completeness. Use when reviewing a backend service, adding new collections, or verifying config and field mappings for Airtable migration readiness.
---

# LMDR Airtable Audit

Use this skill to perform the same checks described by the legacy Claude
`/audit-airtable` command, but in Codex.

## How to Use

1. Identify the backend service file name (without `.jsw`), for example:
   `carrierLeadsService`.
2. Follow the audit checklist in `references/audit-airtable.md`.
3. Produce a report with pass/fail items and required fixes.

## Reference

- Full audit checklist and output format: `references/audit-airtable.md`
