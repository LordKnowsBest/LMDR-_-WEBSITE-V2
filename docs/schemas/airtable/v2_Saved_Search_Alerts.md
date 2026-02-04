# Airtable Schema: v2_Saved Search Alerts

**Table Name:** `v2_Saved Search Alerts`
**Description:** Stores alert records generated when saved searches find new matching drivers.

## Table Metadata

| Property | Value |
| :--- | :--- |
| Table ID | `tblXXXXXX` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Field Definitions

| Field Name | Type | Role | Accepted Values / Notes |
| :--- | :--- | :--- | :--- |
| **Saved Search ID** | Single line text | Required | Reference to the parent saved search record |
| **Recruiter ID** | Single line text | Required | Wix member ID of the recruiter |
| **Driver IDs JSON** | Long text | Required | JSON array of driver IDs that matched |
| **Alert Status** | Single select | Required | pending, sent, failed, dismissed |
| **Sent At** | Date | Required | Timestamp when alert was generated |
| **Channel Used** | Single select | Optional | email, in_app, both |
| **Created At** | Date | Optional | Record creation timestamp |

## Backend Field Mapping

| Airtable Field | Backend Property |
| :--- | :--- |
| Saved Search ID | `saved_search_id` |
| Recruiter ID | `recruiter_id` |
| Driver IDs JSON | `driver_ids_json` |
| Alert Status | `alert_status` |
| Sent At | `sent_at` |
| Channel Used | `channel_used` |
| Created At | `created_at` |
