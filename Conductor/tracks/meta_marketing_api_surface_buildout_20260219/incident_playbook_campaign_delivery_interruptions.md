# Meta Campaign Delivery Incident Playbook

## Trigger Conditions
1. Spend or delivery drops below pacing targets across two consecutive polling windows.
2. Campaign/ad set status becomes limited/error unexpectedly.
3. Meta API critical errors or throttles exceed warning thresholds within the last hour.

## Triage
1. Validate integration status and token health.
2. Check rate-limit posture and reduce async polling cadence if needed.
3. Inspect recent campaign/ad-set/ad mutations and optimization actions.
4. Pause auto-optimization actions until delivery stabilizes.

## Mitigation
1. Reapply known-good budget/schedule settings from mirrored records.
2. Roll back recent creative/bid actions when correlated to delivery degradation.
3. Quarantine integration if unresolved after 30 minutes to prevent unsafe writes.
4. Escalate to governance queue with incident context and proposed corrective action.

## Closure Criteria
1. Delivery and spend return to expected pacing bands.
2. No critical Meta API errors for 60+ minutes.
3. Audit log has complete before/after snapshots for incident actions.
4. Root-cause summary and follow-up owner are documented.
