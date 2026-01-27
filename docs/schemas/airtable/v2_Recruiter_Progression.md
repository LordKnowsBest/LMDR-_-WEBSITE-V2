# Airtable Schema: v2_Recruiter Progression

**Table Name:** `v2_Recruiter Progression`
**Description:** Tracks recruiter points, ranks, and performance metrics for gamification and quality assessment.

## Field Definitions

| Field Name | Type | Role | Accepted Values / Notes |
| :--- | :--- | :--- | :--- |
| **Recruiter ID** | Single line text | Primary | Unique identifier of the recruiter |
| **Carrier ID** | Single line text | Optional | Associated Carrier Wix _id |
| **Current Points** | Number (integer) | Optional | Total points accumulated |
| **Rank** | Number (integer) | Optional | Current numerical rank (Level) |
| **Rank Title** | Single line text | Optional | Display title for the current rank |
| **Points To Next Rank** | Number (integer) | Optional | Remaining points required for promotion |
| **Total Hires** | Number (integer) | Optional | Cumulative hires recorded |
| **Total Outreach** | Number (integer) | Optional | Total driver outreach attempts |
| **Avg Response Hours** | Number (decimal) | Optional | Mean time to respond to driver inquiries |
| **Hire Acceptance Rate** | Number (decimal) | Optional | Percentage of offers accepted |
| **Retention 90 Day Rate** | Number (decimal) | Optional | Driver retention rate after 90 days |
| **Driver Satisfaction Avg** | Number (decimal) | Optional | Average rating from driver feedback |
| **Created At** | Date | Optional | Record creation timestamp |
| **Updated At** | Date | Optional | Last modified timestamp |
