# Airtable Schema: v2_Recruiter Badges

**Table Name:** `v2_Recruiter Badges`
**Description:** Tracks badges earned by recruiters, including their tier progression and featured status.

## Field Definitions

| Field Name | Type | Role | Accepted Values / Notes |
| :--- | :--- | :--- | :--- |
| **Recruiter ID** | Single line text | Primary | Unique identifier of the recruiter |
| **Badge ID** | Single line text | Optional | Reference to Badge Definitions |
| **Earned At** | Date | Optional | Timestamp when the badge/tier was achieved |
| **Tier** | Single select | Optional | "bronze", "silver", "gold", "platinum" |
| **Expires At** | Date | Optional | For time-limited badges (null = permanent) |
| **Is Featured** | Single select | Optional | "Yes", "No" (Show prominently on profile) |
