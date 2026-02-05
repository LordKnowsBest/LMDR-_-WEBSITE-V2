# Airtable Schema: v2_Saved Searches

**Table Name:** `v2_Saved Searches`
**Description:** Stores recruiter saved search configurations with criteria, alert preferences, and execution metadata.

## Table Metadata

| Property | Value |
| :--- | :--- |
| Table ID | `tblXXXXXX` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Field Definitions

| Field Name | Type | Role | Accepted Values / Notes |
| :--- | :--- | :--- | :--- |
| **Carrier DOT** | Single line text | Required | DOT number of the carrier |
| **Recruiter ID** | Single line text | Required | Wix member ID of the recruiter |
| **Search Name** | Single line text | Required | User-defined name for the saved search |
| **Criteria JSON** | Long text | Required | JSON string containing search criteria |
| **Alert Frequency** | Single select | Optional | immediate, hourly, daily, weekly |
| **Alert Channel** | Single select | Optional | email, in_app, both |
| **Last Run Date** | Date | Optional | Timestamp of last search execution |
| **Last Match Count** | Number (integer) | Optional | Number of matches at last execution |
| **New Matches Since Last** | Number (integer) | Optional | Delta of new matches since last run |
| **Is Active** | Checkbox | Required | TRUE if search is active, FALSE if soft deleted |
| **Created At** | Date | Optional | Record creation timestamp |
| **Updated At** | Date | Optional | Last modified timestamp |

## Backend Field Mapping

| Airtable Field | Backend Property |
| :--- | :--- |
| Carrier DOT | `carrier_dot` |
| Recruiter ID | `recruiter_id` |
| Search Name | `search_name` |
| Criteria JSON | `criteria_json` |
| Alert Frequency | `alert_frequency` |
| Alert Channel | `alert_channel` |
| Last Run Date | `last_run_date` |
| Last Match Count | `last_match_count` |
| New Matches Since Last | `new_matches_since_last` |
| Is Active | `is_active` |
| Created At | `created_at` |
| Updated At | `updated_at` |
