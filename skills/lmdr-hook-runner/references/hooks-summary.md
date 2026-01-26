# LMDR Hook Summary (Claude -> Codex)

This reference summarizes the existing hook scripts in `.claude/hooks/` and
their intent. Use with the `run-post-edit-hooks.ps1` and
`run-airtable-create-table-hooks.ps1` helpers.

## Post-Edit Hooks (file content required)

- `enforce-html-location.ps1`
  - Blocks HTML files outside `src/public/`.
- `validate-carrier-form.ps1`
  - Blocks carrier staffing forms missing required fields, postMessage bridge,
    or brand requirements.
- `check-wix-query-types.ps1`
  - Blocks Wix `wixData.query().eq()` calls with NUMBER fields when values
    are not parsed to numbers.
- `validate-html-velo-bridge.ps1`
  - Warns on missing postMessage listeners, missing page code, or weak logging.
  - Requires the file path as a parameter.
- `enforce-airtable-default.ps1`
  - Warns if a backend service imports `wix-data` without dual-source routing.
  - Blocks unauthorized `config.jsw` entries set to `'wix'`.
- `validate-airtable-field-mappings.ps1`
  - Warns if tables used by a service are missing `FIELD_MAPPINGS`.

## Airtable Create-Table Hooks (table name required)

- `enforce-airtable-v2-prefix.ps1`
  - Blocks Airtable table names that do not start with `v2_`.
- `validate-airtable-wix-fields.ps1`
  - Reminds to verify Airtable fields against Wix schema via Wix MCP.

## Doc Reminder Hook

- `update-docs-on-commit.ps1`
  - Prints a documentation reminder for CLAUDE.md / GEMINI.md / tracks.
  - Note: script uses a hardcoded project path and may need adjustment for
    other machines. Run via `run-docs-reminder.ps1` and validate output.

