# v2_AI Usage Log

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblQ4cNjFrFIX0q4T` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Call ID | Single Line Text | `fld2E7JJIucwDaY68` | Unique call identifier |
| Provider | Single Select (`claude`, `perplexity`, `gemini`, `openai`) | `fldjcHFruHTDwj1BH` | AI provider |
| Model | Single Line Text | `fldJJDw5bSbo0NMbb` | Model used |
| Tokens In | Number (precision: 0) | `fld7rMO925DLcDqVI` | Input tokens |
| Tokens Out | Number (precision: 0) | `fld6xzydztkOlfBgF` | Output tokens |
| Cost USD | Currency ($) | `fldxsS4bDpTiSZrr2` | Estimated cost |
| Purpose | Single Line Text | `fldVK5WK2xfyZOLns` | What the call was for |
| Call Date | Date | `fldnTs8tBJ1uuPrDC` | When API was called |
| Legacy Wix ID | Single Line Text | `fldA8gbaQ3CmrHp6m` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_AI Usage Log': {
  'call_id': 'Call ID',
  'provider': 'Provider',
  'model': 'Model',
  'tokens_in': 'Tokens In',
  'tokens_out': 'Tokens Out',
  'cost_usd': 'Cost USD',
  'purpose': 'Purpose',
  'call_date': 'Call Date',
  'legacy_wix_id': 'Legacy Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
