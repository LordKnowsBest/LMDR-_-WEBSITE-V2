
$files = @(
  "origin/stripe-webhook-security-fix-15741628033287885468",
  "origin/audit-w-selector-safety-11642552525683272572",
  "origin/brand-update-velocitymatch-16903377507735383648",
  "origin/dependency-audit-fix-18315912568037021369",
  "origin/audit-permissions-cors-13045792798716135475",
  "origin/audit/api-gateway-security-check-4035232439563428897",
  "origin/audit/secrets-scan-6182642100753033471",
  "origin/create-compliance-alert-email-9932707077117319439",
  "origin/feature/forum-admin-updates-4678153434378988260",
  "origin/refactor-airtable-routing-1755838664506583815",
  "origin/update-conductor-tracks-6794337467394162469"
)
foreach ($b in $files) {
  Write-Output "--- $b ---" | Out-File -Append -FilePath diffs.txt
  git diff origin/main..$b --stat | Out-File -Append -FilePath diffs.txt
}

