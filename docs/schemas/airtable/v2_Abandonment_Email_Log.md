# v2_Abandonment Email Log

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblXXXXXX` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Abandonment ID | Single Line Text | `fldXXXXXX` | Reference to the CheckoutAbandonment record |
| Template ID | Single Line Text | `fldXXXXXX` | Wix triggered email template ID (e.g., checkoutAbandonment1) |
| Recipient Email | Email | `fldXXXXXX` | Email address the message was sent to |
| Sent At | Date/Time | `fldXXXXXX` | Timestamp when the email was sent |
| Email Type | Single Select (`checkout_abandonment`) | `fldXXXXXX` | Type of abandonment email sent |
| Legacy Wix ID | Single Line Text | `fldXXXXXX` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Abandonment Email Log': {
  'abandonment_id': 'Abandonment ID',
  'template_id': 'Template ID',
  'recipient_email': 'Recipient Email',
  'sent_at': 'Sent At',
  'email_type': 'Email Type',
  'legacy_wix_id': 'Legacy Wix ID',
},
```

## Notes

- Logs individual email sends for analytics and debugging
- Related to CheckoutAbandonment collection which tracks the overall abandonment state
- Email types: `checkout_abandonment` (3-email sequence over 7 days)
- Auto-generated schema documentation
- Generated: 2026-02-04
