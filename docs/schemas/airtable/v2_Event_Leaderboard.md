# Airtable Schema: v2_Event Leaderboard

## Table Metadata

| Property | Value |
|----------|-------|
| **Table Name** | `v2_Event Leaderboard` |
| **Table ID** | `tblXXXXXXXXXXXXX04` |
| **Base** | Last Mile Driver recruiting |
| **Base ID** | `app9N1YCJ3gdhExA0` |
| **Description** | Snapshot of event rankings at specific points in time. Used for historical leaderboard records and final event standings. |

## Field Definitions

| Field Name | Type | Field ID | Description |
| :--- | :--- | :--- | :--- |
| **Event ID** | Single line text | `fldXXXXXXXXX301` | Reference to Seasonal Events table |
| **Event Name** | Single line text | `fldXXXXXXXXX302` | Denormalized event name |
| **User ID** | Single line text | `fldXXXXXXXXX303` | Participant's user ID |
| **User Type** | Single select | `fldXXXXXXXXX304` | driver, recruiter |
| **Rank** | Number (integer) | `fldXXXXXXXXX305` | Position on leaderboard at snapshot time |
| **Score** | Number (integer) | `fldXXXXXXXXX306` | XP (drivers) or Points (recruiters) at snapshot |
| **Challenges Completed** | Number (integer) | `fldXXXXXXXXX307` | Event challenges completed at snapshot |
| **Snapshot Type** | Single select | `fldXXXXXXXXX308` | daily, weekly, final |
| **Snapshot Date** | Date | `fldXXXXXXXXX309` | Timestamp of the leaderboard snapshot |
| **Is Final** | Checkbox | `fldXXXXXXXXX310` | True if this is the final event standing |
| **Prize Tier** | Single select | `fldXXXXXXXXX311` | 1st, 2nd, 3rd, top10, participant (null if none) |
| **Prize Awarded** | Checkbox | `fldXXXXXXXXX312` | Whether prize has been distributed |
| **Created At** | Date | `fldXXXXXXXXX313` | Record creation timestamp |

## Backend Field Mapping

| Airtable Field | Backend Property |
|----------------|------------------|
| Event ID | `eventId` |
| Event Name | `eventName` |
| User ID | `userId` |
| User Type | `userType` |
| Rank | `rank` |
| Score | `score` |
| Challenges Completed | `challengesCompleted` |
| Snapshot Type | `snapshotType` |
| Snapshot Date | `snapshotDate` |
| Is Final | `isFinal` |
| Prize Tier | `prizeTier` |
| Prize Awarded | `prizeAwarded` |
| Created At | `createdAt` |

## Snapshot Types

| Type | When Generated |
|------|----------------|
| `daily` | End of each day during event |
| `weekly` | End of each week during event |
| `final` | When event ends |

## Prize Tiers

| Tier | Rank Range |
|------|------------|
| `1st` | Rank 1 |
| `2nd` | Rank 2 |
| `3rd` | Rank 3 |
| `top10` | Ranks 4-10 |
| `participant` | All other participants |

## Notes

- Final leaderboard snapshots are created when `endExpiredEvents()` runs
- Live leaderboard is derived from v2_Event Participants; this table stores historical snapshots
- Separate rankings maintained for drivers and recruiters
- Prize distribution tracked via `Prize Awarded` checkbox
