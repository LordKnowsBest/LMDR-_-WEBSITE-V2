# Airtable Schema: v2_Interviews

## Table Metadata

| Property | Value |
|----------|-------|
| **Table Name** | `v2_Interviews` |
| **Table ID** | `tblXXXXXXXXXXXXX01` |
| **Base** | Last Mile Driver recruiting |
| **Base ID** | `app9N1YCJ3gdhExA0` |
| **Description** | Tracks interview scheduling between drivers and recruiters through the REQUESTED -> PROPOSED -> CONFIRMED/CANCELLED workflow. |

## Field Definitions

| Field Name | Type | Field ID | Description |
| :--- | :--- | :--- | :--- |
| **Application ID** | Single line text | `fldXXXXXXXXX001` | Reference to DriverCarrierInterests record |
| **Driver ID** | Single line text | `fldXXXXXXXXX002` | Reference to driver's user ID |
| **Carrier DOT** | Single line text | `fldXXXXXXXXX003` | USDOT number of the carrier |
| **Status** | Single select | `fldXXXXXXXXX004` | Interview state: REQUESTED, PROPOSED, CONFIRMED, CANCELLED |
| **Requested By** | Single line text | `fldXXXXXXXXX005` | User ID who initiated the availability request |
| **Requested At** | Date | `fldXXXXXXXXX006` | Timestamp when availability was first requested |
| **Proposed Slots** | Long text | `fldXXXXXXXXX007` | JSON array of proposed time slots [{id, start, end}] |
| **Last Proposer ID** | Single line text | `fldXXXXXXXXX008` | User ID who last proposed time slots |
| **Last Proposal At** | Date | `fldXXXXXXXXX009` | Timestamp of most recent slot proposal |
| **Confirmed Slot** | Long text | `fldXXXXXXXXX010` | JSON object of the selected time slot {id, start, end} |
| **Confirmed At** | Date | `fldXXXXXXXXX011` | Timestamp when slot was confirmed |
| **Confirmed By** | Single line text | `fldXXXXXXXXX012` | User ID who confirmed the slot |
| **Created At** | Date | `fldXXXXXXXXX013` | Record creation timestamp |
| **Updated At** | Date | `fldXXXXXXXXX014` | Last modified timestamp |

## Backend Field Mapping

| Airtable Field | Backend Property |
|----------------|------------------|
| Application ID | `application_id` |
| Driver ID | `driver_id` |
| Carrier DOT | `carrier_dot` |
| Status | `status` |
| Requested By | `requested_by` |
| Requested At | `requested_at` |
| Proposed Slots | `proposed_slots` |
| Last Proposer ID | `last_proposer_id` |
| Last Proposal At | `last_proposal_at` |
| Confirmed Slot | `confirmed_slot` |
| Confirmed At | `confirmed_at` |
| Confirmed By | `confirmed_by` |
| Created At | `created_at` |
| Updated At | `updated_at` |

## Status Values

| Status | Description |
|--------|-------------|
| `REQUESTED` | Recruiter requested driver to provide availability |
| `PROPOSED` | One party suggested specific time slots |
| `CONFIRMED` | Both parties agreed on a time slot |
| `CANCELLED` | Interview appointment was cancelled |

## Notes

- The `Proposed Slots` and `Confirmed Slot` fields store JSON strings that need to be parsed/stringified when reading/writing.
- Status workflow: REQUESTED -> PROPOSED -> CONFIRMED or CANCELLED
- Interview confirmation triggers lifecycle event logging and gamification XP awards.
