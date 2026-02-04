# Airtable Schema: v2_Retention Risk Logs

**Table Name:** `v2_Retention Risk Logs`
**Description:** Logs retention risk assessments for drivers, tracking risk scores, levels, and contributing factors over time.

## Table Metadata

| Property | Value |
| :--- | :--- |
| Table ID | `tblXXXXXX` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Field Definitions

| Field Name | Type | Role | Accepted Values / Notes |
| :--- | :--- | :--- | :--- |
| **Driver ID** | Single line text | Primary | Unique identifier of the driver |
| **Carrier DOT** | Single line text | Required | DOT number of the carrier |
| **Risk Level** | Single select | Required | CRITICAL, HIGH, MEDIUM, LOW |
| **Risk Score** | Number (integer) | Required | Numeric score 0-100 |
| **Primary Factor** | Single line text | Optional | Main contributing factor to risk score |
| **Assessment Date** | Date | Required | Timestamp when risk was assessed |
| **Source** | Single select | Optional | Origin of the risk log: SURVEY, SCHEDULED, MANUAL |
| **Created At** | Date | Optional | Record creation timestamp |

## Backend Field Mapping

| Airtable Field | Backend Property |
| :--- | :--- |
| Driver ID | `driver_id` |
| Carrier DOT | `carrier_dot` |
| Risk Level | `risk_level` |
| Risk Score | `risk_score` |
| Primary Factor | `primary_factor` |
| Assessment Date | `assessment_date` |
| Source | `source` |
| Created At | `created_at` |
