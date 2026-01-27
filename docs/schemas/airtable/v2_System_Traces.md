# Airtable Schema: v2_System Traces

**Table Name:** `v2_System Traces`
**Description:** Distributed tracing data for request tracking across services. Mirrors Wix SystemTraces for observability.

## Field Definitions

| Field Name | Type | Role | Accepted Values / Notes |
| :--- | :--- | :--- | :--- |
| **Wix ID** | Single line text | Primary | Unique identifier or Wix `_id` |
| **Trace ID** | Single line text | Optional | Global identifier for a specific request execution path |
| **Name** | Single line text | Optional | Name of the operation or function being traced |
| **Start Time** | Single line text | Optional | Start timestamp of the trace |
| **End Time** | Single line text | Optional | End timestamp of the trace |
| **Status** | Single line text | Optional | Outcome of the trace (e.g., "success", "error") |
| **Spans** | Long text | Optional | JSON string containing individual span data |
| **Metadata** | Long text | Optional | JSON string of additional contextual information |
| **Tags** | Single line text | Optional | Comma-separated or JSON list of searchable tags |
| **Duration** | Number (integer) | Optional | Total execution time in milliseconds |
| **Summary** | Long text | Optional | Human-readable summary of the trace result |
