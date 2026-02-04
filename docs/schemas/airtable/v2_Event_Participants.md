# Airtable Schema: v2_Event Participants

## Table Metadata

| Property | Value |
|----------|-------|
| **Table Name** | `v2_Event Participants` |
| **Table ID** | `tblXXXXXXXXXXXXX03` |
| **Base** | Last Mile Driver recruiting |
| **Base ID** | `app9N1YCJ3gdhExA0` |
| **Description** | Tracks user participation in seasonal/promotional events, including earned XP/points and completed challenges during the event. |

## Field Definitions

| Field Name | Type | Field ID | Description |
| :--- | :--- | :--- | :--- |
| **User ID** | Single line text | `fldXXXXXXXXX201` | Participant's user ID |
| **User Type** | Single select | `fldXXXXXXXXX202` | driver, recruiter |
| **Event ID** | Single line text | `fldXXXXXXXXX203` | Reference to Seasonal Events table |
| **Event Name** | Single line text | `fldXXXXXXXXX204` | Denormalized event name for display |
| **XP Earned** | Number (integer) | `fldXXXXXXXXX205` | Total XP earned during event (drivers) |
| **Points Earned** | Number (integer) | `fldXXXXXXXXX206` | Total points earned during event (recruiters) |
| **Challenges Completed** | Number (integer) | `fldXXXXXXXXX207` | Count of event challenges completed |
| **Joined At** | Date | `fldXXXXXXXXX208` | Timestamp when user joined the event |
| **Created At** | Date | `fldXXXXXXXXX209` | Record creation timestamp |
| **Updated At** | Date | `fldXXXXXXXXX210` | Last modified timestamp |

## Backend Field Mapping

| Airtable Field | Backend Property |
|----------------|------------------|
| User ID | `userId` |
| User Type | `userType` |
| Event ID | `eventId` |
| Event Name | `eventName` |
| XP Earned | `xpEarned` |
| Points Earned | `pointsEarned` |
| Challenges Completed | `challengesCompleted` |
| Joined At | `joinedAt` |
| Created At | `createdAt` |
| Updated At | `updatedAt` |

## User Types

| Type | Score Field |
|------|-------------|
| `driver` | XP Earned |
| `recruiter` | Points Earned |

## Notes

- A user can only have one participation record per event
- Stats are updated incrementally via `updateEventStats()` when user earns XP/points during an active event
- Used to generate event leaderboards (sorted by XP for drivers, Points for recruiters)
- Top 3 participants receive notifications when event ends
