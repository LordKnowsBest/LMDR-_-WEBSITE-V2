#!/bin/bash
# Run Phase 2 custom table SQL against Cloud SQL
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SQL_FILE="$SCRIPT_DIR/sql/phase2-custom-tables.sql"

echo "Running Phase 2 custom table migrations..."
echo "Connecting via Cloud SQL Proxy on localhost:5432..."

PGPASSWORD="${PG_PASSWORD:-}" psql \
  -h 127.0.0.1 \
  -p 5432 \
  -U lmdr_user \
  -d lmdr \
  -f "$SQL_FILE"

echo "Done. Custom tables created."
