# Forum Schema Reference

This document defines the schema for the Driver Community Forum system tables in Airtable.
All tables should be created in the **Last Mile Driver recruiting** base.

## Table: v2_Forum Posts
**Purpose:** Individual posts within threads (replies and OPs).

| Field Name | Type | Options / Notes |
|------------|------|-----------------|
| _id | Single line text | Primary field (use Formula: RECORD_ID()) |
| threadId | Link to another record | Links to `v2_Forum Threads` |
| authorId | Single line text | Wix Member ID of the poster |
| content | Long text | Supports Markdown |
| parentPostId | Link to another record | Links to `v2_Forum Posts` (Self-link for nested replies) |
| likeCount | Number | Integer |
| isBestAnswer | Checkbox | |
| isDeleted | Checkbox | Soft delete flag |
| deletedBy | Single line text | Moderator/User ID |
| deletionReason | Long text | |
| created_at | Created time | |
| updated_at | Last modified time | |
