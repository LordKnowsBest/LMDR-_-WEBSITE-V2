# Forum Schema Reference

This document defines the schema for the Driver Community Forum system tables in Airtable.
All tables should be created in the **Last Mile Driver recruiting** base.

## Table: v2_Forum Categories
**Purpose:** Top-level categories for forum discussions.

| Field Name | Type | Options / Notes |
|------------|------|-----------------|
| title | Single line text | Primary field |
| slug | Single line text | Unique URL-friendly identifier |
| description | Long text | |
| icon | Single line text | FontAwesome class (e.g., `fa-solid fa-truck`) |
| sortOrder | Number | Integer for display sorting |
| threadCount | Number | Cached count of threads |
| postCount | Number | Cached count of total posts |
| created_at | Created time | |
| updated_at | Last modified time | |
