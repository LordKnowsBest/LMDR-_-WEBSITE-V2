# =============================================================================
# LMDR GCP Migration - Script 08b: Cloud SQL Auth Proxy (Windows / ADC)
# Uses Application Default Credentials (no key file needed)
# =============================================================================
# HOW TO RUN:
#   1. Open a NEW PowerShell terminal (keep it open - proxy stays running)
#   2. cd to this script's directory
#   3. Run: .\08b_cloud_sql_proxy_adc.ps1
#   4. In a SEPARATE terminal, run the migration:
#        node scripts\migrate-to-cloudsql.js --all
#   5. When migration is done, stop the proxy with Ctrl+C
# =============================================================================

$PROJECT_ID   = "ldmr-velocitymatch"
$REGION       = "us-central1"
$SQL_INSTANCE = "lmdr-postgres"
$CONNECTION   = "${PROJECT_ID}:${REGION}:${SQL_INSTANCE}"
$PROXY_EXE    = ".\cloud-sql-proxy.exe"
$PROXY_URL    = "https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.x64.exe"

Write-Host "============================================"
Write-Host " LMDR: Cloud SQL Auth Proxy (ADC mode)"
Write-Host " Connection: $CONNECTION"
Write-Host " Local Port: 5432"
Write-Host "============================================"
Write-Host ""

# Step 1: Download proxy binary if not present
if (-not (Test-Path $PROXY_EXE)) {
    Write-Host "Downloading Cloud SQL Auth Proxy for Windows ..."
    Invoke-WebRequest -Uri $PROXY_URL -OutFile $PROXY_EXE
    Write-Host "Downloaded: $PROXY_EXE"
    Write-Host ""
} else {
    Write-Host "Proxy binary already present."
    Write-Host ""
}

# Step 2: Confirm ADC is configured
Write-Host "Verifying Application Default Credentials ..."
$adcPath = "$env:APPDATA\gcloud\application_default_credentials.json"
if (-not (Test-Path $adcPath)) {
    Write-Host ""
    Write-Host "WARNING: ADC not found at: $adcPath"
    Write-Host "Run this first, then re-run this script:"
    Write-Host "  gcloud auth application-default login"
    exit 1
}
Write-Host "ADC credentials found."
Write-Host ""

# Step 3: Print connection settings
Write-Host "Use these env vars when running migrate-to-cloudsql.js:"
Write-Host "  PG_HOST=127.0.0.1"
Write-Host "  PG_PORT=5432"
Write-Host "  PG_DATABASE=lmdr"
Write-Host "  PG_USER=lmdr_user"
Write-Host "  PG_PASSWORD=cht7nLOGcOxpNm2ruPhO6ScqKBeqsF4o"
Write-Host ""
Write-Host "Starting proxy - keep this window open, Ctrl+C to stop ..."
Write-Host ""

# Step 4: Start proxy using ADC
& $PROXY_EXE --gcloud-auth "$CONNECTION"
