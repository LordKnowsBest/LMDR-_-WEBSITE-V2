---
name: lmdr-hook-runner
description: Run LMDR hook-equivalent validations manually in Codex. Use when editing files in this repo, before commits, or when asked to validate HTML placement, carrier form requirements, Wix query type safety, Airtable routing defaults, Airtable field mappings, or HTML/Velo postMessage bridges.
---

# LMDR Hook Runner

Use this skill to manually run the validations that were previously enforced by
Claude hooks. This is the Codex replacement for those checks.

## Quick Start

Run post-edit checks for a single file (from repo root):

```powershell
powershell -ExecutionPolicy Bypass -File .\skills\lmdr-hook-runner\scripts\run-post-edit-hooks.ps1 -FilePath "src\backend\featureAdoptionService.jsw"
```

Run Airtable create-table checks (v2 prefix + Wix schema reminder, from repo root):

```powershell
powershell -ExecutionPolicy Bypass -File .\skills\lmdr-hook-runner\scripts\run-airtable-create-table-hooks.ps1 -TableName "v2_Feature Adoption Logs"
```

Run documentation reminder for a set of changed files (from repo root):

```powershell
powershell -ExecutionPolicy Bypass -File .\skills\lmdr-hook-runner\scripts\run-docs-reminder.ps1 -ChangedFiles "src\backend\jobs.config,src\backend\featureAdoptionService.jsw"
```

## What Gets Checked

- HTML location enforcement (`src/public/` only)
- Carrier staffing form requirements and brand rules
- Wix query type safety for NUMBER fields
- HTML/Velo postMessage bridge warnings
- Airtable default routing enforcement
- Airtable field mappings coverage
- Airtable v2_ table name enforcement and Wix schema reminder
- Docs update reminder for CLAUDE.md / GEMINI.md and tracks

## References

- Hook definitions and intent: `references/hooks-summary.md`
