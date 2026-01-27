# v2_Carrier Enrichments

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblrQx49WPHDfC4HV` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Carrier DOT | Number (precision: 0) | `fld3Yp398KjYgCVXS` | Linked carrier DOT |
| Enrichment Data | Long Text / Multiline | `fldr5yUvejTqnyFkD` | JSON enrichment payload |
| Source | Single Select (`perplexity`, `claude`, `gemini`) | `fldq3CCAreWEhKI8y` | AI source |
| Created Date | Date | `fld6a20UIBJx3SlBn` | When enrichment was created |
| Expires Date | Date | `fld07q4TY3y4DdBcU` | TTL expiration date |
| Legacy Wix ID | Single Line Text | `fldJVsxnUOYlvFItN` | Original Wix _id for migration reference |
| Freight Types | Single Line Text | `fldToe2oyM7FmWz20` | Types of freight handled |
| Route Types | Single Line Text | `fldI352tNlvVGNKfW` | Types of routes offered |
| Home Time | Single Line Text | `flddy2CR3pnWILnmP` | Home time policy |
| Benefits | Single Line Text | `fld1JtfTvksl22V5y` | Benefits offered |
| Sign On Bonus | Single Line Text | `fldOe27fuGNyM68id` | Sign on bonus if any |
| Driver Sentiment | Single Line Text | `fldYket2Z0AfauQAG` | Overall driver sentiment |
| Sentiment Score | Number (precision: 2) | `fldXOZkkeDcyiXD6R` | Numeric sentiment score |
| Hiring Status | Single Line Text | `fld1DKPkthw6SSx1P` | Current hiring status |
| AI Summary | Long Text / Multiline | `fldHqtg52WVqy63WB` | AI-generated carrier summary |
| Source URLs | Single Line Text | `fld2gDV8CBNsYX6RJ` | Source URLs (JSON array as string) |
| Enriched Date | Date | `fldAvEHYTSKj8LpVI` | When enrichment was performed |
| Enrichment Version | Number (precision: 0) | `fldco1ZdYMMeuketG` | Version number of enrichment |
| Match Count | Number (precision: 0) | `fld4pI8i4APmmU7mp` | Number of driver matches |
| Last Matched Date | Date | `fldxhjgxbWEnUCHdi` | Last driver match date |
| Carrier Ref | Single Line Text | `fldeY5NFdLu37JAJO` | Reference to Carriers table (Wix _id) |
| Pay CPM Range | Single Line Text | `fldZQ5NDgzf0d8lPV` | Pay rate range in CPM |
| Sentiment Pros | Long Text / Multiline | `fldLU1VfNacF7C1VZ` | JSON array of positive sentiments |
| Sentiment Cons | Long Text / Multiline | `flda3ZPJAquO8DHMY` | JSON array of negative sentiments |
| Data Confidence | Single Line Text | `fldVYO3EC7VMStOQS` | Confidence level: High/Medium/Low |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Carrier Enrichments': {
  'carrier_dot': 'Carrier DOT',
  'enrichment_data': 'Enrichment Data',
  'source': 'Source',
  'created_date': 'Created Date',
  'expires_date': 'Expires Date',
  'legacy_wix_id': 'Legacy Wix ID',
  'freight_types': 'Freight Types',
  'route_types': 'Route Types',
  'home_time': 'Home Time',
  'benefits': 'Benefits',
  'sign_on_bonus': 'Sign On Bonus',
  'driver_sentiment': 'Driver Sentiment',
  'sentiment_score': 'Sentiment Score',
  'hiring_status': 'Hiring Status',
  'ai_summary': 'AI Summary',
  'source_urls': 'Source URLs',
  'enriched_date': 'Enriched Date',
  'enrichment_version': 'Enrichment Version',
  'match_count': 'Match Count',
  'last_matched_date': 'Last Matched Date',
  'carrier_ref': 'Carrier Ref',
  'pay_cpm_range': 'Pay CPM Range',
  'sentiment_pros': 'Sentiment Pros',
  'sentiment_cons': 'Sentiment Cons',
  'data_confidence': 'Data Confidence',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
