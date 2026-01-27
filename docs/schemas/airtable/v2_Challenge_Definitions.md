# Airtable Schema: v2_Challenge Definitions

**Table Name:** `v2_Challenge Definitions`
**Description:** Master list of challenge definitions for daily, weekly, monthly, and event-based challenges.

## Field Definitions

| Field Name | Type | Role | Accepted Values / Notes |
| :--- | :--- | :--- | :--- |
| **Challenge ID** | Single line text | Primary | Unique identifier for the challenge |
| **Name** | Single line text | Optional | Display name of the challenge |
| **Description** | Long text | Optional | Detailed instructions or criteria for completion |
| **User Type** | Single select | Optional | "driver", "recruiter" |
| **Challenge Type** | Single select | Optional | "daily", "weekly", "monthly", "event" |
| **Action Type** | Single line text | Optional | The type of action required (e.g., "apply", "message") |
| **Target Count** | Number (integer) | Optional | Number of actions required to complete |
| **XP Reward** | Number (integer) | Optional | Experience points awarded upon completion |
| **Bonus Reward** | Single line text | Optional | Additional rewards (e.g., badges, multipliers) |
| **Duration Hours** | Number (integer) | Optional | How long the challenge is available |
| **Is Recurring** | Single select | Optional | "Yes", "No" |
| **Is Active** | Single select | Optional | "Yes", "No" |
| **Start Date** | Date | Optional | When the challenge becomes available |
| **End Date** | Date | Optional | When the challenge expires |
