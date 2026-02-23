# /mass-embed — Run FMCSA local mass embed

Run the local FMCSA mass-embed script to ingest carriers directly into Pinecone.

The script is at `services/ai-intelligence/scripts/local-mass-embed.js`.
The env file is at `services/ai-intelligence/.env`.

## Steps

1. Ask the user for the DOT range if not provided: "What DOT range? (e.g. 4271001 4281001)"
   - If the user says "continue" or "resume", read `services/ai-intelligence/scripts/.mass-embed-progress.json` to find the `next_dot`, then use that as the start with +10000 as the end.
   - If no range is given and no progress file exists, default to 4270000 4280000.

2. Run the script in the background using Bash:
   ```
   node --env-file=services/ai-intelligence/.env services/ai-intelligence/scripts/local-mass-embed.js <dot_start> <dot_end>
   ```

3. Stream the output so the user can see progress. The script prints `✓ DOT XXXXX — CARRIER NAME (STATE)` for each embedded carrier and stats every 50 DOTs.

4. When complete, report:
   - Total scanned, found, embedded, skipped, failed
   - Next DOT range to run
   - Approximate Pinecone vector count increase

## Notes
- Script runs at ~25 DOTs/sec (5 parallel calls, 200ms delay)
- 10,000 DOTs ≈ 6–8 minutes
- Progress is auto-saved to `.mass-embed-progress.json` every 50 DOTs
- FMCSA only returns active carriers — inactive DOTs return 404 and are skipped silently
- Vector IDs in Pinecone: `dot:{number}` (distinct from Airtable-backed `recXXX` vectors)
