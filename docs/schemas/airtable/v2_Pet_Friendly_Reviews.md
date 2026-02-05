# Pet Friendly Reviews Schema Reference

This document defines the schema for the Pet Friendly Reviews system table in Airtable.
All tables should be created in the **Last Mile Driver recruiting** base.

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
| amenities_confirmed | Multiple select | "dog_run", "pet_wash", "waste_bags", "water_station", "shade", "grass_area" |
| photos | Multiple attachment | |
| helpful_count | Number | |
| created_at | Created time | |