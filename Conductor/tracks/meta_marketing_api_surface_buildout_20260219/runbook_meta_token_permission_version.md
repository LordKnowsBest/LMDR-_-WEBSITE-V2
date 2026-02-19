# Meta Operations Runbook

## Scope
Operational runbook for Meta Marketing API token expiry, permission drift, and API version rollovers.

## Token Expiry
1. Detect expiring/expired tokens from scheduled `runMetaTokenHealthChecks`.
2. Execute `refresh_system_user_token` for impacted integration(s).
3. Validate with `get_token_health` and `list_ad_accounts`.
4. If refresh fails twice, quarantine integration and route execute_high approval for credential rotation.

## Permission Drift
1. Detect permission failures from `get_meta_api_error_digest` (`meta_permission_denied`).
2. Validate app and system-user scopes against required Ads/Insights permissions.
3. Rebind ad account and validate read/write smoke actions.
4. If still failing, disable integration and escalate with owner + access remediation steps.

## Version Rollover
1. Pin target Meta API version and open migration window at least 14 days in advance.
2. Run read smoke tests (account discovery + insights pull) in pre-production.
3. Run mutation smoke tests (draft create/update/pause) using idempotency keys.
4. Promote version only when audit completeness and error posture checks pass.
