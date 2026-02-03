# Health Resources Schema Reference

This document defines the schema for the Trucker Health Resources system tables in Airtable.
All tables should be created in the **Last Mile Driver recruiting** base.

## Table: v2_Health Resources
**Purpose:** Curated wellness content for drivers.

| Field Name | Type | Options / Notes |
|------------|------|-----------------|
| title | Single line text | Primary field |
| slug | Single line text | URL-friendly identifier |
| category | Single select | "exercise", "nutrition", "mental_health", "sleep", "telemedicine" |
| content_type | Single select | "article", "video", "infographic", "link" |
| summary | Long text | Short description for cards |
| content | Long text | Full markdown content |
| external_url | URL | For telemedicine links |
| video_url | URL | Embedded video URL |
| thumbnail | Attachment | Preview image |
| author | Single line text | Content creator name |
| tags | Multiple select | e.g. "Strength", "Cardio", "Meal Prep" |
| view_count | Number | Integer |
| helpful_count | Number | User ratings |
| is_featured | Checkbox | Show on homepage |
| is_community | Checkbox | User-submitted tip flag |
| created_at | Created time | |
| updated_at | Last modified time | |

---

## Table: v2_Health Tips
**Purpose:** Community-submitted health tips pending moderation.

| Field Name | Type | Options / Notes |
|------------|------|-----------------|
| _id | Single line text | Primary field (RECORD_ID()) |
| author_id | Single line text | Wix Member ID |
| category | Single select | Same as Health Resources |
| title | Single line text | |
| tip_text | Long text | Max 500 chars |
| helpful_count | Number | |
| status | Single select | "pending", "approved", "rejected" |
| moderator_notes | Long text | |
| created_at | Created time | |
| approved_at | Date | |
