# Airtable Schema: Carrier Staffing Requests

**Table Name:** `CarrierStaffingRequests` (Recommended)
**Description:** Tracks carrier staffing inquiries and leads.

## Field Definitions

| Field Name | Type | Description | Accepted Values |
| :--- | :--- | :--- | :--- |
| **Company Name** | Single line text | Requesting company name | Any text string |
| **Contact Name** | Single line text | Contact person name | Any text string |
| **Email** | Single line text | Contact email | Any text string (email format) |
| **Phone** | Phone number | Contact phone | Phone number format |
| **DOT Number** | Number (integer) | Carrier DOT if provided | Whole numbers only |
| **Staffing Type** | Single select | Type of staffing need | "emergency" or "strategic" |
| **Drivers Needed** | Number (integer) | Number of drivers needed | Whole numbers only |
| **Notes** | Long text | Additional notes | Any text (multi-line supported) |
| **Status** | Single select | Lead status | "new", "contacted", "qualified", "converted", or "closed" |
| **Submitted Date** | Date | When request was submitted | Date values (YYYY-MM-DD) |
| **Legacy Wix ID** | Single line text | Original Wix _id for migration reference | Any text string |
| **Driver Types** | Single line text | Driver types needed (JSON array as string) | Any text string |
| **Linked Carrier ID** | Single line text | Reference to Carriers table (Wix _id) | Any text string |
| **Last Updated** | Date | Last update timestamp | Date values (YYYY-MM-DD) |
| **Source** | Single line text | Lead source identifier | Any text string |
| **Source URL** | Single line text | URL of the source page | Any text string (URL format) |
| **Status History** | Long text | JSON string of status history | Any text (multi-line supported) |

## Key Notes

*   **Single line text** fields accept short text entries.
*   **Long text** fields support multi-line content and formatting.
*   **Number (integer)** fields only accept whole numbers (no decimals).
*   **Single select** fields are restricted to the specific choices listed above.
*   **Date** fields require proper date formatting.
*   **Phone number** fields are optimized for phone number input.
