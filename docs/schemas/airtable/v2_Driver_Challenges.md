# Airtable Schema: v2_Driver Challenges

**Table Name:** `v2_Driver Challenges`
**Description:** Active and completed driver challenges with progress tracking.

## Field Definitions

| Field Name | Type | Role | Accepted Values / Notes |
| :--- | :--- | :--- | :--- |
| **Driver ID** | Single line text | Primary | Reference to DriverProfiles |
| **Challenge ID** | Single line text | Optional | Reference to Challenge Definitions |
| **Status** | Single select | Optional | "active", "completed", "expired", "claimed" |
| **Progress** | Number (integer) | Optional | Current progress count toward completion |
| **Target** | Number (integer) | Optional | Total actions required for completion |
| **Started At** | Date | Optional | Timestamp when challenge was started or assigned |
| **Completed At** | Date | Optional | Timestamp when challenge was finished |
| **Expires At** | Date | Optional | Deadline for completion |
| **XP Reward** | Number (integer) | Optional | Experience points to be awarded |
| **Claimed At** | Date | Optional | Timestamp when user claimed their reward |
