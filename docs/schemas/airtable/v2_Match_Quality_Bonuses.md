# Airtable Schema: v2_Match Quality Bonuses

## Table Metadata

| Property | Value |
|----------|-------|
| **Table Name** | `v2_Match Quality Bonuses` |
| **Table ID** | `tblXXXXXXXXXXXXX06` |
| **Base** | Last Mile Driver recruiting |
| **Base ID** | `app9N1YCJ3gdhExA0` |
| **Description** | Records match quality bonuses awarded to both drivers and recruiters when a hire is made with a high match score. |

## Field Definitions

| Field Name | Type | Field ID | Description |
| :--- | :--- | :--- | :--- |
| **Driver ID** | Single line text | `fldXXXXXXXXX501` | ID of the hired driver |
| **Recruiter ID** | Single line text | `fldXXXXXXXXX502` | ID of the recruiter who made the hire |
| **Match Score** | Number (integer) | `fldXXXXXXXXX503` | Match percentage (0-100) |
| **Bonus Tier** | Single select | `fldXXXXXXXXX504` | excellent, great, good |
| **Driver Bonus XP** | Number (integer) | `fldXXXXXXXXX505` | XP awarded to driver |
| **Recruiter Bonus Points** | Number (integer) | `fldXXXXXXXXX506` | Points awarded to recruiter |
| **Carrier DOT** | Single line text | `fldXXXXXXXXX507` | USDOT number of hiring carrier |
| **Hire Date** | Date | `fldXXXXXXXXX508` | Date of the hire |
| **Created At** | Date | `fldXXXXXXXXX509` | Record creation timestamp |

## Backend Field Mapping

| Airtable Field | Backend Property |
|----------------|------------------|
| Driver ID | `driverId` |
| Recruiter ID | `recruiterId` |
| Match Score | `matchScore` |
| Bonus Tier | `bonusTier` |
| Driver Bonus XP | `driverBonusXP` |
| Recruiter Bonus Points | `recruiterBonusPoints` |
| Carrier DOT | `carrierDot` |
| Hire Date | `hireDate` |
| Created At | `createdAt` |

## Bonus Tiers

| Tier | Min Match Score | Driver XP | Recruiter Points |
|------|-----------------|-----------|------------------|
| `excellent` | 90% | 150 | 200 |
| `great` | 80% | 100 | 150 |
| `good` | 70% | 50 | 75 |

Matches below 70% do not receive a quality bonus.

## Notes

- Both driver and recruiter receive bonuses on the same hire
- Bonuses are awarded via `awardMatchQualityBonus()` in referralService.jsw
- Called automatically when hire status is updated via `processHireBonus()`
- Notifications sent to both parties with tier-appropriate emoji (excellent=star, great=star, good=sparkles)
- History viewable via `getMatchQualityBonusHistory(userId, userType)`
