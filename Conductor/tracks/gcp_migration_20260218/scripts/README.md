# GCP Migration Scripts

> All scripts for migrating LMDR from Airtable → Google Cloud Platform  
> Run in order. Each script tells you what to run next.

---

## Prerequisites

- A Google account with billing enabled
- Your Airtable API key (from [airtable.com/create/tokens](https://airtable.com/create/tokens))
- Node.js 18+ for backfill scripts

---

## Execution Order

| Script | Where to Run | Phase | Duration |
|--------|-------------|-------|----------|
| `01_gcp_project_iam.sh` | Google Cloud Shell | 1.1 | ~10 min |
| `02_secret_manager.sh` | Google Cloud Shell | 1.2 | ~2 min |
| `03_cloud_run_deploy.sh` | Google Cloud Shell | 1.3 | ~5 min |
| `04_test_adaptors.sh` | Google Cloud Shell | 1.3 Test | ~1 min |
| **Manual Step** | Wix Editor | 1.4 | ~5 min |
| `05_sql_schema.sql` | Cloud SQL Studio | 3 | ~2 min |
| `06_bigquery_schema.sql` | BigQuery Console | 3 | ~1 min |
| `08_cloud_sql_proxy.sh` | Your local terminal | Before 07 | stays running |
| `07_backfill_airtable_to_sql.js` | Your local terminal | 4 & 5 | 30–60 min |

---

## Manual Step After Script 04

In the **Wix Editor**:
1. Code Sidebar → External Databases → **Add external database**
2. Choose **Google Cloud** → Next
3. Register Postgres namespace:
   - Namespace: `gcp_core`
   - URL: *(Postgres Cloud Run URL from script 03)*
   - Secret Key: *(SECRET_KEY from script 02)*
4. Register BigQuery namespace:
   - Namespace: `gcp_analytics`
   - URL: *(BigQuery Cloud Run URL from script 03)*
   - Secret Key: *(same SECRET_KEY)*

---

## Running the Backfill

```bash
# Terminal 1 — start the Cloud SQL proxy (keep running)
bash 08_cloud_sql_proxy.sh

# Terminal 2 — install deps then run backfill
cd scripts
npm install airtable pg uuid
export AIRTABLE_API_KEY="your_key"
export PG_PASSWORD="your_password_from_script_01"

# Phase 4: Content first (low risk)
node 07_backfill_airtable_to_sql.js --collection=content

# Phase 5: Core operational data
node 07_backfill_airtable_to_sql.js --collection=carriers
node 07_backfill_airtable_to_sql.js --collection=drivers

# Verify counts
node 07_backfill_airtable_to_sql.js --verify
```

---

## Configuration Values You'll Need

After running script 01, note down:
- `SQL_CONNECTION_NAME` (e.g., `lmdr-prod-db:us-central1:lmdr-postgres`)
- `SQL_DB_PASSWORD` (auto-generated, printed at end of script 01)

After running script 02, note down:
- `SECRET_KEY` (printed at end of script 02 — needed for Wix CMS registration)
