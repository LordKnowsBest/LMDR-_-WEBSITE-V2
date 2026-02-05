# Airtable Schema: v2_Call Feedback

**Table Name:** `v2_Call Feedback`
**Description:** Stores aggregated call outcome feedback per carrier for matching weight adjustments calculated by the feedback batch processor.

## Table Metadata

| Property | Value |
| :--- | :--- |
| Table ID | `tblXXXXXX` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Field Definitions

| Field Name | Type | Role | Accepted Values / Notes |
| :--- | :--- | :--- | :--- |
| **Carrier DOT** | Single line text | Primary | DOT number of the carrier (unique per criteria_key) |
| **Criteria Key** | Single line text | Required | Identifier for the matching criteria being weighted (e.g., 'overall') |
| **Outcome Count** | Number (integer) | Required | Total number of call outcomes analyzed |
| **Positive Weight** | Number (decimal) | Required | Calculated positive weight adjustment (0.00-0.20) |
| **Negative Weight** | Number (decimal) | Required | Calculated negative weight adjustment (0.00-0.20) |
| **Last Calculated** | Date | Required | Timestamp of last batch calculation |
| **Created At** | Date | Optional | Record creation timestamp |
| **Updated At** | Date | Optional | Last modified timestamp |

## Backend Field Mapping

| Airtable Field | Backend Property |
| :--- | :--- |
| Carrier DOT | `carrier_dot` |
| Criteria Key | `criteria_key` |
| Outcome Count | `outcome_count` |
| Positive Weight | `positive_weight` |
| Negative Weight | `negative_weight` |
| Last Calculated | `last_calculated` |
| Created At | `created_at` |
| Updated At | `updated_at` |
