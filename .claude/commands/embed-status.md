# /embed-status — Check Pinecone carrier index status

Check the current state of the lmdr-carriers Pinecone index and both embed pipelines.

Railway URL: `https://lmdr-ai-intelligence-production.up.railway.app`

## Steps

1. Call the Railway health endpoint to get Pinecone stats:
   ```bash
   curl -s https://lmdr-ai-intelligence-production.up.railway.app/health
   ```

2. Call Pinecone describe_index_stats directly for vector counts:
   ```bash
   curl -s -X POST https://lmdr-carriers-hmmwwf9.svc.aped-4627-b74a.pinecone.io/describe_index_stats \
     -H "Api-Key: <PINECONE_API_KEY>" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```
   Read PINECONE_API_KEY from `services/ai-intelligence/.env`.

3. Check local mass-embed progress:
   - Read `services/ai-intelligence/scripts/.mass-embed-progress.json`
   - Show `next_dot`, `saved_at`, and stats from last run

4. Display a summary:
   ```
   📊 Pinecone lmdr-carriers
      Total vectors : X,XXX
      Dimension     : 1024 (voyage-3)

   🔄 Airtable backfill (Railway daily cron)
      Next offset   : <from Railway sentinel>
      Runs at       : 01:00 UTC daily (~300 carriers/run)

   🚛 FMCSA universe (local runner)
      Next DOT      : X,XXX,XXX
      Last run      : YYYY-MM-DD HH:MM
      To continue   : /mass-embed resume
   ```

## Notes
- Total vectors = Airtable-backed (`recXXX`) + FMCSA-direct (`dot:XXXXXX`) + 2 progress sentinels
- FMCSA active carrier universe: ~600,000+ DOTs (most are in the 1M–4.5M range)
- Airtable carriers: ~23,000 records
