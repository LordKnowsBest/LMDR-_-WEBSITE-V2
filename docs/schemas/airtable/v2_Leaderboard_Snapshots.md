# Airtable Schema: v2_Leaderboard Snapshots

**Table Name:** `v2_Leaderboard Snapshots`
**Description:** Historical leaderboard rankings for weekly/monthly periods.

## Field Definitions

| Field Name | Type | Role | Accepted Values / Notes |
| :--- | :--- | :--- | :--- |
| **Snapshot ID** | Single line text | Primary | Unique identifier for this snapshot |
| **Period Type** | Single select | Optional | "weekly", "monthly", "quarterly" |
| **Period Start** | Date | Optional | Start date of the leaderboard period |
| **Period End** | Date | Optional | End date of the leaderboard period |
| **Leaderboard Type** | Single select | Optional | "hires", "response_time", "retention", "overall" |
| **Rankings JSON** | Long text | Optional | JSON array of rankings with rank, recruiter_id, score, change |
| **Generated At** | Date | Optional | Timestamp of when the snapshot was generated |
