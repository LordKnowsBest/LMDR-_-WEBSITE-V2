# Airtable Schema: v2_Seasonal Events

**Table Name:** `v2_Seasonal Events`
**Description:** Manages seasonal platform events, multipliers, and special challenges.

## Field Definitions

| Field Name | Type | Role | Accepted Values / Notes |
| :--- | :--- | :--- | :--- |
| **Event ID** | Single line text | Primary | Unique identifier for the event |
| **Name** | Single line text | Optional | Name of the seasonal event |
| **Description** | Long text | Optional | Detailed event description |
| **Start Date** | Date | Optional | Event start timestamp |
| **End Date** | Date | Optional | Event end timestamp |
| **XP Multiplier** | Number (decimal) | Optional | Multiplier applied to experience points |
| **Points Multiplier** | Number (decimal) | Optional | Multiplier applied to reward points |
| **Special Challenges JSON** | Long text | Optional | JSON string defining event-specific challenges |
| **Special Badges JSON** | Long text | Optional | JSON string defining event-specific badges |
| **Theme Color** | Single line text | Optional | CSS or Hex color for UI branding |
| **Banner Image URL** | Single line text | Optional | URL for event promotional banners |
| **Is Active** | Single select | Optional | "Yes", "No" |
