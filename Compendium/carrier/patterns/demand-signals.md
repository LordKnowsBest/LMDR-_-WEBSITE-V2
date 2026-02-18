# Demand Signals

> Confidence: high | Source: manual | Last validated: 2026-02-18

## Context

B2B signal scoring identifies which carrier accounts are most likely to convert to paying customers. The signal score drives account prioritization in the B2B pipeline and determines which accounts receive proactive outreach from the sales team.

## Details

- **Signal score formula:** `signal_score = (driver_count_high_match / 50 * 35) + (has_hiring_prefs * 40)`. A carrier with many high-match drivers and active hiring preferences scores highest.
- **Account segmentation tiers:** Enterprise (500+ fleet), Mid-Market (100-499), Small Fleet (20-99), Owner-Operator (<20). Each tier has different sales motions and pricing models.
- **Pipeline stages with probabilities:** Prospecting (10%) -> Discovery (25%) -> Proposal (50%) -> Negotiation (75%) -> Closed Won/Lost (100%). Stage probability is used for revenue forecasting.
- **High-signal indicators:** Carriers that have set hiring preferences, posted jobs recently, or have multiple drivers expressing interest score highest. FMCSA inspection rates and safety scores are secondary signals.
- **Decay rule:** Signal scores decay by 10% per week if no new activity is detected. This prevents stale accounts from clogging the pipeline.

## Evidence

- Signal scoring implemented in `b2bMatchSignalService.jsw`
- Account segmentation defined by `fleet_size` field in `v2_B2B Accounts` table
- Pipeline stages tracked in `v2_B2B Pipeline` table with `stage` and `probability` fields
- B2B Dashboard (`B2B_DASHBOARD.i5csc.js`) surfaces signal scores via `handleB2BAction` bridge

## Related

- [Lane Performance](../metrics/lane-performance.md)
