# Airtable Schema: v2_Recruiter Challenges

## Table Metadata

| Property | Value |
|----------|-------|
| **Table Name** | `v2_Recruiter Challenges` |
| **Table ID** | `tblXXXXXXXXXXXXX02` |
| **Base** | Last Mile Driver recruiting |
| **Base ID** | `app9N1YCJ3gdhExA0` |
| **Description** | Active and completed recruiter challenges with progress tracking. Mirrors v2_Driver Challenges structure for recruiter user type. |

## Field Definitions

| Field Name | Type | Field ID | Description |
| :--- | :--- | :--- | :--- |
| **User ID** | Single line text | `fldXXXXXXXXX101` | Recruiter's user ID |
| **Challenge Definition ID** | Single line text | `fldXXXXXXXXX102` | Reference to Challenge Definitions table |
| **Challenge Name** | Single line text | `fldXXXXXXXXX103` | Denormalized challenge name for display |
| **Challenge Type** | Single select | `fldXXXXXXXXX104` | daily, weekly, monthly, event, onetime |
| **Status** | Single select | `fldXXXXXXXXX105` | available, active, completed, claimed, expired, failed |
| **Current Value** | Number (integer) | `fldXXXXXXXXX106` | Current progress count toward target |
| **Target Value** | Number (integer) | `fldXXXXXXXXX107` | Total actions required for completion |
| **XP Reward** | Number (integer) | `fldXXXXXXXXX108` | XP to award on claim (typically 0 for recruiters) |
| **Points Reward** | Number (integer) | `fldXXXXXXXXX109` | Points to award on claim |
| **Started At** | Date | `fldXXXXXXXXX110` | Timestamp when challenge was started |
| **Expires At** | Date | `fldXXXXXXXXX111` | Deadline for completion |
| **Completed At** | Date | `fldXXXXXXXXX112` | Timestamp when target was reached |
| **Claimed At** | Date | `fldXXXXXXXXX113` | Timestamp when reward was claimed |
| **Expired At** | Date | `fldXXXXXXXXX114` | Timestamp when challenge expired (if applicable) |
| **Reminder Sent** | Single select | `fldXXXXXXXXX115` | Yes/No - tracks if expiring reminder was sent |
| **Created At** | Date | `fldXXXXXXXXX116` | Record creation timestamp |
| **Updated At** | Date | `fldXXXXXXXXX117` | Last modified timestamp |

## Backend Field Mapping

| Airtable Field | Backend Property |
|----------------|------------------|
| User ID | `userId` |
| Challenge Definition ID | `challengeDefinitionId` |
| Challenge Name | `challengeName` |
| Challenge Type | `challengeType` |
| Status | `status` |
| Current Value | `currentValue` |
| Target Value | `targetValue` |
| XP Reward | `xpReward` |
| Points Reward | `pointsReward` |
| Started At | `startedAt` |
| Expires At | `expiresAt` |
| Completed At | `completedAt` |
| Claimed At | `claimedAt` |
| Expired At | `expiredAt` |
| Reminder Sent | `reminderSent` |
| Created At | `createdAt` |
| Updated At | `updatedAt` |

## Status Values

| Status | Description |
|--------|-------------|
| `available` | Challenge can be started |
| `active` | Challenge in progress |
| `completed` | Target reached, reward not yet claimed |
| `claimed` | Reward has been claimed |
| `expired` | Time ran out before completion |
| `failed` | Challenge failed (other reason) |

## Challenge Types

| Type | Duration | Reset |
|------|----------|-------|
| `daily` | 24 hours | Midnight UTC |
| `weekly` | 7 days | Monday UTC |
| `monthly` | ~30 days | 1st of month UTC |
| `event` | Custom | Event end date |
| `onetime` | No expiration | Never (one-time only) |

## Notes

- Recruiters earn Points (not XP) from challenges
- Structure mirrors v2_Driver Challenges for consistency
- Expiration processing runs via scheduled job `processExpiredChallenges`
- Reminder notifications sent 2 hours before expiration
