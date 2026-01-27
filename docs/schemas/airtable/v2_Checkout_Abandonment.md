# v2_Checkout Abandonment

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tbl1yQ4eTOEtKmI0k` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Email | Email | `fld2pnWg85kqzRru6` | Customer email |
| Carrier DOT | Number (precision: 0) | `fldhZ4Ka9KfzX1RFs` | Carrier DOT if known |
| Plan | Single Select (`Pro`, `Enterprise`) | `fldX07atR1eN9WAk7` | Abandoned plan |
| Abandoned Date | Date | `fldmlorebkebtNoqo` | When checkout was abandoned |
| Email 1 Sent | Single Select (`Yes`, `No`) | `fldasowLH9RrOxa3e` | 2hr email sent |
| Email 2 Sent | Single Select (`Yes`, `No`) | `fldOD9zpJHUuThUFb` | 3-day email sent |
| Email 3 Sent | Single Select (`Yes`, `No`) | `fldGtJtyawkEqmBsz` | 7-day email sent |
| Recovered | Single Select (`Yes`, `No`) | `fldHAvMygGnWrGMCi` | Did customer complete purchase |
| Legacy Wix ID | Single Line Text | `fldwTUPMHmmpFv5lO` | Original Wix _id for migration reference |
| Stripe Session ID | Single Line Text | `fldpI4VftC71dptMI` | Stripe checkout session ID |
| Last Attempt URL | URL | `fldNBdgU18joXppEN` | URL of the last checkout attempt |
| Email 1 Sent At | Date | `fldHWu5SAbVLm0uIQ` | When email 1 was sent |
| Email 2 Sent At | Date | `fldNwmycsit3z4jiw` | When email 2 was sent |
| Email 3 Sent At | Date | `fldYy5wiUNX3oY7in` | When email 3 was sent |
| Recovered At | Date | `fldXteUSC1DdwYx2z` | When the checkout was recovered |
| Recovery Session ID | Single Line Text | `fldz7XqDoSuvNLUS6` | Stripe session ID of successful recovery checkout |
| Contact Name | Single Line Text | `fldh3MLOnCLUrBH1i` | Contact name from checkout metadata |
| Company Name | Single Line Text | `fldDgH8YY3VmNnd9r` | Company name from checkout metadata |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Checkout Abandonment': {
  'email': 'Email',
  'carrier_dot': 'Carrier DOT',
  'plan': 'Plan',
  'abandoned_date': 'Abandoned Date',
  'email_1_sent': 'Email 1 Sent',
  'email_2_sent': 'Email 2 Sent',
  'email_3_sent': 'Email 3 Sent',
  'recovered': 'Recovered',
  'legacy_wix_id': 'Legacy Wix ID',
  'stripe_session_id': 'Stripe Session ID',
  'last_attempt_url': 'Last Attempt URL',
  'email_1_sent_at': 'Email 1 Sent At',
  'email_2_sent_at': 'Email 2 Sent At',
  'email_3_sent_at': 'Email 3 Sent At',
  'recovered_at': 'Recovered At',
  'recovery_session_id': 'Recovery Session ID',
  'contact_name': 'Contact Name',
  'company_name': 'Company Name',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
