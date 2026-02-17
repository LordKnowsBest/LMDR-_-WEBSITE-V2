# Schema Audit Agent

Cross-references configData.js entries against Airtable tables to find mismatches.

## Steps

1. Read `src/backend/configData.js`
2. Parse all three maps: DATA_SOURCE, WIX_COLLECTION_NAMES, AIRTABLE_TABLE_NAMES
3. Check for consistency:
   - Every key in DATA_SOURCE should exist in both WIX_COLLECTION_NAMES and AIRTABLE_TABLE_NAMES
   - Every key in WIX_COLLECTION_NAMES should exist in DATA_SOURCE
   - Every key in AIRTABLE_TABLE_NAMES should exist in DATA_SOURCE
4. Optionally verify against Airtable schema docs in `docs/schemas/airtable/`
5. Report mismatches and missing entries
