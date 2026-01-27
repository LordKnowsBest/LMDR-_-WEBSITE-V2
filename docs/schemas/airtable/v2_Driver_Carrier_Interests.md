# Airtable Schema: v2_Driver Carrier Interests

**Table Name:** `v2_Driver Carrier Interests`
**Description:** Tracks logged-in driver interests and applications to carriers.

## Field Definitions

| Field Name | Type | Role | Accepted Values / Notes |
| :--- | :--- | :--- | :--- |
| **Driver** | Single line text | Primary | |
| **Carrier** | Single line text | Optional | |
| **Carrier Name** | Single line text | Optional | |
| **Job** | Single line text | Optional | |
| **Interest Type** | Single select | Optional | "interested", "applied", "contacted", "hired" |
| **Status** | Single select | Optional | "new", "viewed", "contacted", "interview", "hired", "declined" |
| **Match Score** | Number (integer) | Optional | |
| **Applied Date** | Date | Optional | |
| **Notes** | Long text | Optional | |
| **Recruiter Notes** | Long text | Optional | |
| **Driver ZIP** | Single line text | Optional | |
