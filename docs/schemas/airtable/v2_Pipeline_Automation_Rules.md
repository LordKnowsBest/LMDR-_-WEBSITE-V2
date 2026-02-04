# v2_Pipeline Automation Rules

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblXXXXXX` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Carrier DOT | Single Line Text | `fldXXXXXX` | DOT number of the carrier this rule belongs to |
| Rule Name | Single Line Text | `fldXXXXXX` | Human-readable name for the automation rule |
| Trigger Event | Single Select (`status_change`, `document_uploaded`, `cdl_verified`, `background_check_clear`, `no_response_7d`, `driver_message`) | `fldXXXXXX` | Event that triggers this rule |
| Trigger Conditions JSON | Long Text / Multiline | `fldXXXXXX` | JSON object with additional trigger conditions |
| From Stage | Single Select (`interested`, `applied`, `in_review`, `contacted`, `offer`, `hired`, `rejected`, `withdrawn`) | `fldXXXXXX` | Pipeline stage the candidate must be in (blank = any) |
| To Stage | Single Select (`interested`, `applied`, `in_review`, `contacted`, `offer`, `hired`, `rejected`, `withdrawn`) | `fldXXXXXX` | Pipeline stage to transition to (blank = no transition) |
| Auto Note | Long Text / Multiline | `fldXXXXXX` | Note to add when rule executes |
| Notify Recruiter | Checkbox | `fldXXXXXX` | Whether to notify recruiter when rule fires |
| Is Active | Checkbox | `fldXXXXXX` | Whether this rule is currently active |
| Priority | Number (Integer) | `fldXXXXXX` | Execution order - lower numbers run first |
| Is Default | Checkbox | `fldXXXXXX` | True if this is a system-seeded default rule |
| Legacy Wix ID | Single Line Text | `fldXXXXXX` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Pipeline Automation Rules': {
  'carrier_dot': 'Carrier DOT',
  'rule_name': 'Rule Name',
  'trigger_event': 'Trigger Event',
  'trigger_conditions_json': 'Trigger Conditions JSON',
  'from_stage': 'From Stage',
  'to_stage': 'To Stage',
  'auto_note': 'Auto Note',
  'notify_recruiter': 'Notify Recruiter',
  'is_active': 'Is Active',
  'priority': 'Priority',
  'is_default': 'Is Default',
  'legacy_wix_id': 'Legacy Wix ID',
},
```

## Trigger Events

| Event | Description |
|-------|-------------|
| `status_change` | Candidate pipeline status changed |
| `document_uploaded` | Driver uploaded a document |
| `cdl_verified` | CDL license was verified |
| `background_check_clear` | Background check passed |
| `no_response_7d` | No response from candidate for 7+ days |
| `driver_message` | Driver sent a message to recruiter |

## Pipeline Stages

| Stage | Description |
|-------|-------------|
| `interested` | Driver expressed initial interest |
| `applied` | Driver submitted application |
| `in_review` | Application under review |
| `contacted` | Recruiter has made contact |
| `offer` | Job offer extended |
| `hired` | Driver accepted and hired |
| `rejected` | Application rejected |
| `withdrawn` | Driver withdrew from process |

## Notes

- Rules are evaluated in priority order; only the first matching rule executes
- Conflict detection prevents duplicate rules for same trigger + from_stage combination
- Default rules are seeded via `seedDefaultRules(carrierDot)`
- `no_response_7d` rules are processed by scheduled job `processStaleAutomation()`
- Auto-generated schema documentation
- Generated: 2026-02-04
