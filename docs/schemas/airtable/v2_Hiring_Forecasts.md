# v2_Hiring Forecasts

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tbl_hiring_forecasts` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Description |
|------------|------|-------------|
| Carrier DOT | Single Line Text | Carrier DOT number |
| Forecast Date | Date | Date forecast was generated |
| Forecast Period Start | Date | Start of forecast period |
| Forecast Period End | Date | End of forecast period |
| Predicted Hires Needed | Number | Forecasted hiring need |
| Confidence Level | Number | 0-100 confidence score |
| Drivers At Risk | Number | Predicted turnover |
| Growth Hires | Number | Hires needed for growth |
| Replacement Hires | Number | Hires needed for turnover |
| Seasonal Factor | Number | Seasonality adjustment |
| Model Version | Single Line Text | ML model version used |
| Model Inputs | Long Text / JSON | Input features used |
| Alert Level | Single Line Text | none, info, warning, critical |
| Alert Message | Long Text | Generated alert message |
| Recommended Action | Long Text | Suggested action |
| Ramp Start Date | Date | When to start recruiting ramp |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Hiring Forecasts': {
  'carrier_dot': 'Carrier DOT',
  'forecast_date': 'Forecast Date',
  'forecast_period_start': 'Forecast Period Start',
  'forecast_period_end': 'Forecast Period End',
  'predicted_hires_needed': 'Predicted Hires Needed',
  'confidence_level': 'Confidence Level',
  'drivers_at_risk': 'Drivers At Risk',
  'growth_hires': 'Growth Hires',
  'replacement_hires': 'Replacement Hires',
  'seasonal_factor': 'Seasonal Factor',
  'model_version': 'Model Version',
  'model_inputs': 'Model Inputs',
  'alert_level': 'Alert Level',
  'alert_message': 'Alert Message',
  'recommended_action': 'Recommended Action',
  'ramp_start_date': 'Ramp Start Date',
},
```

## Notes

- Created for Recruiter Analytics Track
- Generated: 2026-01-30
