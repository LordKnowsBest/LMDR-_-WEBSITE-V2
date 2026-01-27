# Airtable Schema: v2_Badge Definitions

**Table Name:** `v2_Badge Definitions`
**Description:** Master list of badge definitions with tiered thresholds for achievement tracking.

## Field Definitions

| Field Name | Type | Role | Accepted Values / Notes |
| :--- | :--- | :--- | :--- |
| **Badge ID** | Single line text | Primary | Unique identifier for the badge |
| **Name** | Single line text | Optional | Display name of the badge |
| **Description** | Long text | Optional | Criteria for earning the badge tiers |
| **Icon** | Single line text | Optional | Icon identifier or URL for UI rendering |
| **User Type** | Single select | Optional | "driver", "recruiter" |
| **Bronze Threshold** | Number (integer) | Optional | Count required for Bronze tier |
| **Silver Threshold** | Number (integer) | Optional | Count required for Silver tier |
| **Gold Threshold** | Number (integer) | Optional | Count required for Gold tier |
| **Platinum Threshold** | Number (integer) | Optional | Count required for Platinum tier |
| **Calculation Type** | Single line text | Optional | logic key for calculating progress (e.g., "message_count") |
| **Recalculation Frequency** | Single select | Optional | "realtime", "daily", "weekly" |
| **Is Active** | Single select | Optional | "Yes", "No" |
