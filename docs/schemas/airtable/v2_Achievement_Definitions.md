# Airtable Schema: v2_Achievement Definitions

**Table Name:** `v2_Achievement Definitions`
**Description:** Master list of all achievement definitions for drivers and recruiters.

## Field Definitions

| Field Name | Type | Role | Accepted Values / Notes |
| :--- | :--- | :--- | :--- |
| **Achievement ID** | Single line text | Primary | Unique identifier for the achievement |
| **Name** | Single line text | Optional | Display name of the achievement |
| **Description** | Long text | Optional | Full description of the achievement and how to earn it |
| **Category** | Single select | Optional | "profile", "activity", "milestone", "community" |
| **Icon** | Single line text | Optional | Icon identifier or URL for UI rendering |
| **Color** | Single line text | Optional | Associated hex code or CSS color class |
| **User Type** | Single select | Optional | "driver", "recruiter", "both" |
| **Requirement Type** | Single select | Optional | "count", "threshold", "boolean", "streak" |
| **Requirement Field** | Single line text | Optional | The data field tracked for this achievement |
| **Requirement Value** | Number (integer) | Optional | The target value to trigger completion |
| **XP Reward** | Number (integer) | Optional | Experience points awarded upon earning |
| **Is Hidden** | Single select | Optional | "Yes", "No" (Secret achievements) |
| **Is Active** | Single select | Optional | "Yes", "No" |
| **Display Order** | Number (integer) | Optional | Numerical sort order for UI display |
