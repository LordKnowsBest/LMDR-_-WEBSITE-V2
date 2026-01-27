# Airtable Schema: v2_Driver Achievements

**Table Name:** `v2_Driver Achievements`
**Description:** Junction table tracking driver achievement progress and completion.

## Field Definitions

| Field Name | Type | Role | Accepted Values / Notes |
| :--- | :--- | :--- | :--- |
| **Driver ID** | Single line text | Primary | Reference to DriverProfiles |
| **Achievement ID** | Single line text | Optional | Reference to Achievement Definitions |
| **Earned At** | Date | Optional | Timestamp when the achievement was fully earned |
| **Progress** | Number (integer) | Optional | For progressive achievements (e.g., 0-100 or current count) |
| **Is Complete** | Single select | Optional | "Yes", "No" |
| **Notified** | Single select | Optional | "Yes", "No" (Indicates if the user has seen the achievement alert) |
| **Display Order** | Number (integer) | Optional | Numerical order for display on driver profile |
