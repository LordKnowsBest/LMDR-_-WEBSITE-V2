# Lane Performance

> Confidence: medium | Source: observation | Last validated: 2026-02-18

## Context

Lane-level metrics track how well the platform matches drivers to specific carrier routes (lanes). Performance varies significantly by geography, freight type, and seasonal demand. These metrics inform both carrier account health and driver match quality.

## Details

- **Key metrics per lane:** Fill rate (% of posted positions matched), time-to-fill (days from posting to hire), match quality score (average 6-dimension score of matched drivers), and retention rate (% of placed drivers still active at 90 days).
- **Geographic clustering:** Lanes originating from major freight hubs (Atlanta, Dallas, Chicago, Los Angeles) have 2-3x the driver pool compared to rural origin lanes. Platform should weight hub-adjacent drivers for rural lanes.
- **Seasonal patterns:** Reefer lanes spike in Q2-Q3 (produce season), flatbed demand peaks in Q1-Q2 (construction), and dry van stays relatively stable year-round.
- **CPM benchmarks:** Cost-per-mile varies by lane distance and freight type. Long-haul OTR lanes pay higher CPM but have lower driver supply. Regional/dedicated lanes have lower CPM but higher fill rates.
- **Carrier health indicator:** Carriers with >70% fill rate across their lanes are healthy accounts. Below 50% triggers a carrier success intervention.

## Evidence

- Match quality score uses 6 dimensions: qualifications (30%), experience (20%), location (20%), availability (15%), salary fit (15%), engagement (bonus)
- Lane data sourced from carrier hiring preferences in `v2_Carrier Job Preferences` and FMCSA authority records
- Fill rate and time-to-fill tracked in `v2_B2B Analytics` table

## Related

- [Demand Signals](../patterns/demand-signals.md)
