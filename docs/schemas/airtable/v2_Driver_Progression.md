# Airtable Schema: v2_Driver Progression

**Table Name:** `v2_Driver Progression`
**Description:** Tracks driver XP, levels, streaks, and engagement metrics.

## Field Definitions

| Field Name | Type | Role | Accepted Values / Notes |
| :--- | :--- | :--- | :--- |
| **Driver ID** | Single line text | Primary | Unique identifier of the driver |
| **Current XP** | Number (integer) | Optional | Total Experience Points accumulated |
| **Level** | Number (integer) | Optional | Current numerical level |
| **Level Title** | Single line text | Optional | Display title for the current level |
| **XP To Next Level** | Number (integer) | Optional | Remaining XP required for level up |
| **Streak Days** | Number (integer) | Optional | Current consecutive days active |
| **Longest Streak** | Number (integer) | Optional | Personal record for consecutive days active |
| **Last Login Date** | Date | Optional | Timestamp of the most recent activity |
| **Streak Freeze Available** | Number (integer) | Optional | Count of streak freeze power-ups owned |
| **Total Applications** | Number (integer) | Optional | Cumulative job applications submitted |
| **Total Responses** | Number (integer) | Optional | Cumulative recruiter responses received |
| **Avg Response Hours** | Number (decimal) | Optional | Mean time for recruiters to respond to this driver |
| **Profile Completion** | Number (integer) | Optional | Percentage of profile fields completed (0-100) |
| **Created At** | Date | Optional | Record creation timestamp |
| **Updated At** | Date | Optional | Last modified timestamp |
