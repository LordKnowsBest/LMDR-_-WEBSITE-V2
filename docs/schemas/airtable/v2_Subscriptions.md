# v2_Subscriptions

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblEbdA0g0JUaCvje` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Carrier DOT | Number (precision: 0) | `fld6X536DI0aGlveR` | Linked carrier DOT |
| Stripe Customer ID | Single Line Text | `flddlFzjkrFgWO72Z` | Stripe customer ID |
| Stripe Subscription ID | Single Line Text | `fldPdJ5uOrD8MLOlD` | Stripe subscription ID |
| Plan Tier | Single Select (`Free`, `Pro`, `Enterprise`) | `fldJe8Ti08Mz7CNR7` | Subscription tier |
| Status | Single Select (`active`, `past_due`, `canceled`, `trialing`) | `fldSy9q0yeTMhVDUw` | Subscription status |
| Monthly Views Quota | Number (precision: 0) | `fldkCI4gqAKJW8PSZ` | Monthly driver profile views allowed |
| Views Used | Number (precision: 0) | `fldXripCnEPOzT5tf` | Views used this period |
| Period Start | Date | `fld5ajBFI2vjFD2YK` | Current billing period start |
| Period End | Date | `fld7IlE7YIK9QOMa4` | Current billing period end |
| Legacy Wix ID | Single Line Text | `fldxcg4kwJrv6tYo5` | Original Wix _id for migration reference |
| Stripe Price ID | Single Line Text | `fld4hLixhoUUFqTL7` | Stripe price ID for the subscription |
| Cancel At Period End | Single Select (`Yes`, `No`) | `fldSLKpfqIjb2u3A7` | Whether subscription cancels at end of current period |
| Is Active | Single Select (`Yes`, `No`) | `fld0LE97jKu4PgXXR` | Whether subscription is active |
| Quota Reset Date | Date | `fldZwvxyqpk0Uli5w` | Date when view quota resets |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Subscriptions': {
  'carrier_dot': 'Carrier DOT',
  'stripe_customer_id': 'Stripe Customer ID',
  'stripe_subscription_id': 'Stripe Subscription ID',
  'plan_tier': 'Plan Tier',
  'status': 'Status',
  'monthly_views_quota': 'Monthly Views Quota',
  'views_used': 'Views Used',
  'period_start': 'Period Start',
  'period_end': 'Period End',
  'legacy_wix_id': 'Legacy Wix ID',
  'stripe_price_id': 'Stripe Price ID',
  'cancel_at_period_end': 'Cancel At Period End',
  'is_active': 'Is Active',
  'quota_reset_date': 'Quota Reset Date',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
