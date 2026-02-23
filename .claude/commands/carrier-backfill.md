# /carrier-backfill — Trigger Railway Airtable → Pinecone backfill

Trigger the Railway job that finds Airtable carriers missing from Pinecone and embeds them.

Railway URL: `https://lmdr-ai-intelligence-production.up.railway.app`
Internal key: read from `services/ai-intelligence/.env` (LMDR_INTERNAL_KEY)

## Steps

1. Read `services/ai-intelligence/.env` to get LMDR_INTERNAL_KEY.

2. Ask the user how many pages to process if not specified:
   - **Quick check** (default): `page_limit=3` — 300 carriers, ~15 seconds
   - **Full sweep**: `page_limit=230` — all ~23,000 Airtable carriers, ~20 minutes
   - **Custom**: any number the user specifies

3. Fire the job via Bash curl:
   ```bash
   curl -s -X POST https://lmdr-ai-intelligence-production.up.railway.app/v1/jobs/fmcsa-mass-embed \
     -H "x-lmdr-internal-key: <LMDR_INTERNAL_KEY>" \
     -H "x-lmdr-timestamp: $(date +%s)000" \
     -H "Content-Type: application/json" \
     -d '{"page_limit": <N>}'
   ```

4. Parse and display the JSON response:
   - `pages` — Airtable pages processed
   - `checked` — total carriers checked
   - `already_embedded` — already in Pinecone (skipped)
   - `embedded` — newly embedded this run
   - `failed` — errors
   - `exhausted` — true if all Airtable carriers have been processed (will restart from beginning next run)
   - `next_offset` — where the daily cron will resume

5. If `page_limit=230` (full sweep), note that the job runs synchronously on Railway and may take 20–30 minutes. Suggest running it during off-hours or using smaller page_limit batches instead.

## Notes
- Runs automatically every day at 01:00 UTC (300 carriers/run)
- Vector IDs: Airtable record IDs (`recXXX`) — distinct from `dot:{number}` vectors from local script
- Safe to run multiple times — already-embedded carriers are skipped via Pinecone batch-fetch check
- To restart from the beginning: add `"reset_progress": true` to the request body
