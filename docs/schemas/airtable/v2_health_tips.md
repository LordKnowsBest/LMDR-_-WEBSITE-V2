# Health Tips Schema Reference

This document defines the schema for the Community Health Tips system table in Airtable.
All tables should be created in the **Last Mile Driver recruiting** base.

## Table: v2_Health Tips
**Purpose:** Community-submitted health tips pending moderation.

| Field Name | Type | Options / Notes |
|------------|------|-----------------|
| _id | Single line text | Primary field (RECORD_ID()) |
| author_id | Single line text | Wix Member ID |
| category | Single select | "exercise", "nutrition", "mental_health", "sleep", "telemedicine" |
| title | Single line text | |
| tip_text | Long text | Max 500 chars |
| helpful_count | Number | |
| status | Single select | "pending", "approved", "rejected" |
| moderator_notes | Long text | |
| created_at | Created time | |
| approved_at | Date | |