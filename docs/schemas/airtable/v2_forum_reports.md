# Forum Schema Reference

This document defines the schema for the Driver Community Forum system tables in Airtable.
All tables should be created in the **Last Mile Driver recruiting** base.

## Table: v2_Forum Reports
**Purpose:** Moderation queue for flagged content.

| Field Name | Type | Options / Notes |
|------------|------|-----------------|
| _id | Single line text | Primary field (use Formula: RECORD_ID()) |
| postId | Link to another record | Links to `v2_Forum Posts` |
| reporterId | Single line text | Wix Member ID of the reporter |
| reason | Single select | "spam", "abuse", "harassment", "other" |
| details | Long text | User-submitted details |
| status | Single select | "pending", "resolved", "dismissed" |
| resolution | Single select | "approve", "hide", "warn", "ban" |
| moderatorId | Single line text | Admin/Mod ID who resolved it |
| adminNotes | Long text | Internal notes |
| resolvedAt | Date | Include time field |
| created_at | Created time | |
