# Airtable Schema: v2_Member Notifications

**Table Name:** `v2_Member Notifications`
**Description:** In-app notifications for members including new matches, messages, application updates, and system alerts.

## Field Definitions

| Field Name | Type | Role | Accepted Values / Notes |
| :--- | :--- | :--- | :--- |
| **Title** | Single line text | Primary | Short headline for the notification |
| **Message** | Long text | Optional | Detailed notification content |
| **Type** | Single select | Optional | "match", "message", "application", "system", "reminder" |
| **Status** | Single select | Optional | "unread", "read", "archived" |
| **Member ID** | Single line text | Optional | Recipient Wix Member ID |
| **Related Record ID** | Single line text | Optional | ID of the triggering object (e.g., Message ID) |
| **Related Record Type** | Single select | Optional | "match", "message", "application", "carrier", "job" |
| **Action URL** | Single line text | Optional | Deep link to the relevant page in the portal |
| **Legacy Wix ID** | Single line text | Optional | Original Wix _id for migration reference |
| **Created At** | Date | Optional | Timestamp of notification delivery |
| **Read At** | Date | Optional | Timestamp when user marked as read |
