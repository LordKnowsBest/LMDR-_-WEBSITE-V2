# Airtable Schema: v2_Gamification Events

**Table Name:** `v2_Gamification Events`
**Description:** Audit log of all XP/points awards and gamification events.

## Field Definitions

| Field Name | Type | Role | Accepted Values / Notes |
| :--- | :--- | :--- | :--- |
| **Event ID** | Single line text | Primary | Unique identifier for the event |
| **User ID** | Single line text | Optional | ID of the user (Driver or Recruiter) |
| **User Type** | Single select | Optional | "driver", "recruiter" |
| **Event Type** | Single select | Optional | "xp_earned", "points_earned", "level_up", "rank_up", "achievement_earned", "badge_earned", "challenge_complete", "streak_milestone" |
| **Action** | Single line text | Optional | The specific action performed (e.g., "profile_complete") |
| **XP Earned** | Number (integer) | Optional | Amount of Experience Points awarded |
| **Points Earned** | Number (integer) | Optional | Amount of reward points awarded |
| **Streak Bonus** | Number (decimal) | Optional | Multiplier or flat bonus from current streak |
| **Source ID** | Single line text | Optional | ID of the related object (application ID, message ID, etc.) |
| **Source Type** | Single line text | Optional | Type of the source (e.g., "application", "onboarding") |
| **Metadata JSON** | Long text | Optional | Additional event data stored as JSON |
| **Created At** | Date | Optional | Timestamp of when the event occurred |
