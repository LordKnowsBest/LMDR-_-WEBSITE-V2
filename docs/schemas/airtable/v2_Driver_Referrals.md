# Airtable Schema: v2_Driver Referrals

## Table Metadata

| Property | Value |
|----------|-------|
| **Table Name** | `v2_Driver Referrals` |
| **Table ID** | `tblXXXXXXXXXXXXX05` |
| **Base** | Last Mile Driver recruiting |
| **Base ID** | `app9N1YCJ3gdhExA0` |
| **Description** | Tracks driver referral codes and conversion funnel. Each referrer has a master record plus individual records for each referee. |

## Field Definitions

| Field Name | Type | Field ID | Description |
| :--- | :--- | :--- | :--- |
| **Referrer ID** | Single line text | `fldXXXXXXXXX401` | Driver ID of the person making referrals |
| **Referee ID** | Single line text | `fldXXXXXXXXX402` | Driver ID of the referred user (null for master record) |
| **Referee Email** | Email | `fldXXXXXXXXX403` | Email of referred user for tracking |
| **Referral Code** | Single line text | `fldXXXXXXXXX404` | Unique referral code (format: ref_XXXX1234) |
| **Is Referrer Record** | Single select | `fldXXXXXXXXX405` | Yes = master record, No = individual referral |
| **Status** | Single select | `fldXXXXXXXXX406` | signed_up, applied, hired |
| **Total Referrals** | Number (integer) | `fldXXXXXXXXX407` | Count of all referrals (master record only) |
| **Successful Hires** | Number (integer) | `fldXXXXXXXXX408` | Count of hired referrals (master record only) |
| **Total XP Earned** | Number (integer) | `fldXXXXXXXXX409` | Cumulative XP from referrals (master record only) |
| **XP Earned From Referral** | Number (integer) | `fldXXXXXXXXX410` | XP earned from this specific referral |
| **Signup Date** | Date | `fldXXXXXXXXX411` | When referee signed up |
| **First Application Date** | Date | `fldXXXXXXXXX412` | When referee submitted first application |
| **Hire Date** | Date | `fldXXXXXXXXX413` | When referee was hired |
| **Hired Carrier DOT** | Single line text | `fldXXXXXXXXX414` | DOT of carrier that hired the referee |
| **Created At** | Date | `fldXXXXXXXXX415` | Record creation timestamp |
| **Updated At** | Date | `fldXXXXXXXXX416` | Last modified timestamp |

## Backend Field Mapping

| Airtable Field | Backend Property |
|----------------|------------------|
| Referrer ID | `referrerId` |
| Referee ID | `refereeId` |
| Referee Email | `refereeEmail` |
| Referral Code | `referralCode` |
| Is Referrer Record | `isReferrerRecord` |
| Status | `status` |
| Total Referrals | `totalReferrals` |
| Successful Hires | `successfulHires` |
| Total XP Earned | `totalXPEarned` |
| XP Earned From Referral | `xpEarnedFromReferral` |
| Signup Date | `signupDate` |
| First Application Date | `firstApplicationDate` |
| Hire Date | `hireDate` |
| Hired Carrier DOT | `hiredCarrierDot` |
| Created At | `createdAt` |
| Updated At | `updatedAt` |

## Record Types

| Is Referrer Record | Purpose |
|-------------------|---------|
| `Yes` | Master record for the referrer - stores code and aggregate stats |
| `No` | Individual referral tracking record - one per referee |

## Status Values (Individual Referrals Only)

| Status | XP Awarded to Referrer |
|--------|----------------------|
| `signed_up` | 200 XP |
| `applied` | +100 XP (cumulative) |
| `hired` | +500 XP (cumulative) |

## XP Reward Configuration

| Event | Referrer XP | Referee XP |
|-------|-------------|------------|
| Signup | 200 | 50 (bonus) |
| First Application | 100 | - |
| Hire | 500 | - |

## Notes

- Referral code format: `ref_` + last 4 chars of driver ID + 4 random alphanumeric
- Referral link: `https://www.lastmiledr.app/driver-signup?ref={code}`
- A user can only be referred once (checked on signup)
- Master records track aggregate statistics across all referrals
