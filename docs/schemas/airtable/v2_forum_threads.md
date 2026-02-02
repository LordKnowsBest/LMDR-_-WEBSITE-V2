# Forum Schema Reference

This document defines the schema for the Driver Community Forum system tables in Airtable.
All tables should be created in the **Last Mile Driver recruiting** base.

## Table: v2_Forum Threads
**Purpose:** Individual discussion threads.

| Field Name | Type | Options / Notes |
|------------|------|-----------------|
| title | Single line text | Primary field |
| slug | Single line text | Unique URL-friendly identifier |
| categoryId | Link to another record | Links to `v2_Forum Categories` |
| authorId | Single line text | Wix Member ID of the creator |
| contentPreview | Long text | First 200 chars of OP content |
| viewCount | Number | Integer |
| replyCount | Number | Integer |
| isPinned | Checkbox | |
| isLocked | Checkbox | |
| isDeleted | Checkbox | Soft delete flag |
| lastActivityAt | Date | Include time field |
| tags | Multiple select | e.g., "Advice", "Question", "Jobs" |
| created_at | Created time | |
| updated_at | Last modified time | |
