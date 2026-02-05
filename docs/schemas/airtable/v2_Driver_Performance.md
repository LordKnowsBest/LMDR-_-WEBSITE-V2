# Airtable Schema: v2_Driver Performance

**Table Name:** `v2_Driver Performance`
**Description:** Tracks driver performance metrics for retention risk analysis including miles, safety, home time, pay, and engagement.

## Table Metadata

| Property | Value |
| :--- | :--- |
| Table ID | `tblXXXXXX` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Field Definitions

| Field Name | Type | Role | Accepted Values / Notes |
| :--- | :--- | :--- | :--- |
| **Driver ID** | Single line text | Primary | Unique identifier of the driver |
| **Driver Name** | Single line text | Optional | Display name of the driver |
| **Carrier DOT** | Single line text | Required | DOT number of the carrier employing this driver |
| **Miles Driven** | Number (integer) | Optional | Total miles driven in current period |
| **Prev Miles Driven** | Number (integer) | Optional | Miles driven in previous period for trend analysis |
| **On Time Delivery Rate** | Number (integer) | Optional | Percentage 0-100 of on-time deliveries |
| **Safety Incidents** | Number (integer) | Optional | Count of safety incidents in period |
| **Home Time Days** | Number (integer) | Optional | Number of home time days in period |
| **Pay Volatility Index** | Number (integer) | Optional | Percentage 0-100 indicating pay stability (higher = more volatile) |
| **Avg Weekly Pay** | Number (decimal) | Optional | Average weekly pay amount in USD |
| **App Sessions Last 7d** | Number (integer) | Optional | Number of app sessions in last 7 days |
| **App Sessions Prev 7d** | Number (integer) | Optional | Number of app sessions in previous 7-day period |
| **DNPS Score** | Number (integer) | Optional | Driver Net Promoter Score (0-10) |
| **Created At** | Date | Optional | Record creation timestamp |
| **Updated At** | Date | Optional | Last modified timestamp |

## Backend Field Mapping

| Airtable Field | Backend Property |
| :--- | :--- |
| Driver ID | `driver_id` |
| Driver Name | `driver_name` |
| Carrier DOT | `carrier_dot` |
| Miles Driven | `miles_driven` |
| Prev Miles Driven | `prev_miles_driven` |
| On Time Delivery Rate | `on_time_delivery_rate` |
| Safety Incidents | `safety_incidents` |
| Home Time Days | `home_time_days` |
| Pay Volatility Index | `pay_volatility_index` |
| Avg Weekly Pay | `avg_weekly_pay` |
| App Sessions Last 7d | `app_sessions_last_7d` |
| App Sessions Prev 7d | `app_sessions_prev_7d` |
| DNPS Score | `dnps_score` |
| Created At | `created_at` |
| Updated At | `updated_at` |
