# Pet Friendly Schema Reference

This document defines the schema for the Pet-Friendly Database system tables in Airtable.
All tables should be created in the **Last Mile Driver recruiting** base.

## Table: v2_Pet Friendly Locations
**Purpose:** Crowdsourced database of trucker-friendly pet amenities at truck stops and rest areas.

| Field Name | Type | Options / Notes |
|------------|------|-----------------|
| name | Single line text | Primary field (e.g. "Love's #247") |
| address | Single line text | |
| city | Single line text | |
| state | Single line text | |
| zip | Single line text | |
| latitude | Number | Decimal |
| longitude | Number | Decimal |
| location_type | Single select | "truck_stop", "rest_area", "park", "vet", "pet_store" |
| chain | Single line text | "Love's", "Pilot", "TA", "Independent", etc. |
| amenities | Multiple select | "dog_run", "pet_wash", "waste_bags", "water_station", "shade", "grass_area" |
| pet_policy | Single line text | |
| notes | Long text | |
| photos | Multiple attachment | |
| submitted_by | Single line text | Wix Member ID |
| is_verified | Checkbox | Admin verification flag |
| avg_rating | Number | Calculated from reviews |
| review_count | Number | |
| created_at | Created time | |
| updated_at | Last modified time | |

---

## Table: v2_Pet Friendly Reviews
**Purpose:** Driver reviews for pet-friendly locations.

| Field Name | Type | Options / Notes |
|------------|------|-----------------|
| _id | Single line text | Primary field (RECORD_ID()) |
| location_id | Link to another record | Links to `v2_Pet Friendly Locations` |
| author_id | Single line text | Wix Member ID |
| rating | Number | 1-5 |
| pet_type | Single select | "dog", "cat", "other" |
| visit_date | Date | |
| review_text | Long text | |
| amenities_confirmed | Multiple select | Same options as Locations |
| photos | Multiple attachment | |
| helpful_count | Number | |
| created_at | Created time | |
