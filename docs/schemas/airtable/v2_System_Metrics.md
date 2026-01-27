# Airtable Schema: v2_System Metrics

**Table Name:** `v2_System Metrics`
**Description:** System performance metrics for monitoring and analytics. Mirrors Wix SystemMetrics.

## Field Definitions

| Field Name | Type | Role | Accepted Values / Notes |
| :--- | :--- | :--- | :--- |
| **Wix ID** | Single line text | Primary | Unique identifier or Wix `_id` |
| **Timestamp** | Single line text | Optional | ISO timestamp or string representation of time |
| **Metric Name** | Single line text | Optional | The name of the metric being tracked (e.g., "CPU_Usage") |
| **Value** | Number (integer) | Optional | Numerical value of the metric |
| **Source** | Single line text | Optional | Origin of the metric (e.g., "frontend", "backend") |
| **Tags** | Single line text | Optional | Searchable labels for filtering |
| **Metadata** | Long text | Optional | Additional JSON context for the metric |
