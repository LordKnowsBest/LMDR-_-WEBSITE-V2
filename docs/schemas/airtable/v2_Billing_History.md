# v2_Billing History

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblm54j2G43COc5o5` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Carrier DOT | Number (precision: 0) | `fldQlMzmcHsyl4ngB` | Linked carrier DOT |
| Event Type | Single Select (`payment_succeeded`, `payment_failed`, `subscription_created`, `subscription_updated`, `subscription_canceled`) | `fldlsXi3HPfZvqm1S` | Billing event type |
| Amount | Currency ($) | `fldbnV0uWTnjwnmer` | Transaction amount |
| Event Date | Date | `fldNXlwyXGiSMjvUf` | When event occurred |
| Stripe Event ID | Single Line Text | `fldHTohIctmVIKmel` | Stripe event ID for reference |
| Legacy Wix ID | Single Line Text | `fldMgFUxeB0UPJaai` | Original Wix _id for migration reference |
| Currency | Single Line Text | `fldnajGnTfm70ALWO` | Currency code (e.g. usd) |
| Invoice ID | Single Line Text | `fld6J5zjFaiB20NoV` | Stripe Invoice ID |
| Description | Long Text / Multiline | `fldXsUkKg2pmBTKF4` | Event description |
| Timestamp | Date | `fldVyCh9Lg5IX5alB` | Event timestamp |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Billing History': {
  'carrier_dot': 'Carrier DOT',
  'event_type': 'Event Type',
  'amount': 'Amount',
  'event_date': 'Event Date',
  'stripe_event_id': 'Stripe Event ID',
  'legacy_wix_id': 'Legacy Wix ID',
  'currency': 'Currency',
  'invoice_id': 'Invoice ID',
  'description': 'Description',
  'timestamp': 'Timestamp',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
