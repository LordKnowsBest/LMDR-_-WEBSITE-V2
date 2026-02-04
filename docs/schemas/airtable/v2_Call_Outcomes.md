# Airtable Schema: v2_Call Outcomes

**Table Name:** `v2_Call Outcomes`
**Description:** Records recruiter call outcomes with drivers including outcome type, sentiment, match score snapshot, and follow-up details.

## Table Metadata

| Property | Value |
| :--- | :--- |
| Table ID | `tblXXXXXX` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Field Definitions

| Field Name | Type | Role | Accepted Values / Notes |
| :--- | :--- | :--- | :--- |
| **Recruiter ID** | Single line text | Required | Wix member ID of the recruiter who made the call |
| **Carrier DOT** | Single line text | Required | DOT number of the carrier |
| **Driver ID** | Single line text | Required | Unique identifier of the driver called |
| **Call Timestamp** | Date | Required | Timestamp when the call occurred |
| **Call Duration Seconds** | Number (integer) | Optional | Duration of the call in seconds |
| **Outcome** | Single select | Required | interested, callback, not_now, wrong_fit, no_answer, voicemail |
| **Outcome Details** | Single line text | Optional | Additional details about the outcome |
| **Follow Up Date** | Date | Optional | Scheduled follow-up date if applicable |
| **Follow Up Type** | Single line text | Optional | Type of follow-up planned (call, email, etc.) |
| **Match Score At Call** | Number (integer) | Optional | Match score snapshot at time of call (0-100) |
| **Source** | Single select | Optional | manual, auto_dialer, crm_import |
| **Sentiment** | Single select | Optional | positive, neutral, negative |
| **Notes** | Long text | Optional | Recruiter notes about the call |
| **Created At** | Date | Optional | Record creation timestamp |

## Backend Field Mapping

| Airtable Field | Backend Property |
| :--- | :--- |
| Recruiter ID | `recruiter_id` |
| Carrier DOT | `carrier_dot` |
| Driver ID | `driver_id` |
| Call Timestamp | `call_timestamp` |
| Call Duration Seconds | `call_duration_seconds` |
| Outcome | `outcome` |
| Outcome Details | `outcome_details` |
| Follow Up Date | `follow_up_date` |
| Follow Up Type | `follow_up_type` |
| Match Score At Call | `match_score_at_call` |
| Source | `source` |
| Sentiment | `sentiment` |
| Notes | `notes` |
| Created At | `created_at` |
