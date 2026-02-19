# v2 API Platform Index Plan

Collection: `v2_Api Partners`
- Unique index: `partner_id`
- Index: `status`
- Index: `updated_at`

Collection: `v2_Api Subscriptions`
- Index: `partner_id`
- Index: `status`
- Compound index: `partner_id + current_period_end`
- Index: `stripe_subscription_id`

Collection: `v2_Api Usage`
- Compound index: `partner_id + period_key`
- Index: `period_key`
- Index: `updated_at`

Collection: `v2_API Request Log`
- Index: `partner_id`
- Index: `created_at`
- Compound index: `partner_id + created_at`
- Compound index: `endpoint + created_at`

Collection: `v2_Api Products`
- Unique index: `product_id`
- Index: `is_active`
- Index: `category`

Collection: `v2_Api Alert Subscriptions`
- Index: `partner_id`
- Index: `is_active`

Collection: `v2_Api Webhook Deliveries`
- Index: `partner_id`
- Index: `subscription_id`
- Index: `status`
- Index: `next_retry_at`
- Compound index: `partner_id + created_at`

Notes
- This index plan is the Phase 1 completion artifact for query efficiency.
- Apply indexes in Airtable for mirrored v2 tables before production scale traffic.
