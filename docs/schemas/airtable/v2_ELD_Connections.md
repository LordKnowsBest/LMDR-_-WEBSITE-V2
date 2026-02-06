# v2_ELD_Connections

## Fields

| Field Name | Type | Description |
|------------|------|-------------|
| carrier_dot | Number | FMCSA DOT number - carrier reference |
| provider | Single Select | ELD provider name (motive/samsara/omnitracs/gps_trackit) |
| api_key | Single Line Text | Encrypted API key for ELD provider integration |
| account_id | Single Line Text | Account identifier with ELD provider |
| is_active | Checkbox | Connection is currently active and syncing (must be added manually in Airtable UI) |
| last_sync | Date | Timestamp of most recent successful data sync |
| sync_errors | Multiple Line Text | JSON array of sync error logs |

## Notes

- Auto-generated schema documentation
- Generated: 2026-02-05
- **IMPORTANT:** The `is_active` field is a checkbox type and must be added manually in the Airtable UI
