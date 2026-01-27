# Airtable Schema: v2_Admin Users

**Table Name:** `v2_Admin Users`
**Description:** Admin user records for content moderation and system access control.

## Field Definitions

| Field Name | Type | Role | Accepted Values / Notes |
| :--- | :--- | :--- | :--- |
| **Name** | Single line text | Primary | Full name of the admin user |
| **Email** | Single line text | Optional | Professional email address |
| **Role** | Single select | Optional | "super_admin", "admin", "moderator", "viewer" |
| **Status** | Single select | Optional | "active", "inactive", "suspended" |
| **Wix Member ID** | Single line text | Optional | Reference to the Wix Member object ID |
| **Permissions** | Long text | Optional | JSON or comma-separated list of specific capability flags |
| **Created By** | Single line text | Optional | ID or Name of the admin who created this record |
| **Legacy Wix ID** | Single line text | Optional | Original Wix _id for migration reference |
| **Last Login** | Date | Optional | Timestamp of the most recent dashboard access |
| **Created At** | Date | Optional | Record creation timestamp |
