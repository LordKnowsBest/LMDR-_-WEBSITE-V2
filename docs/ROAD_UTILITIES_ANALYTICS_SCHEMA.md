# Road Utilities Analytics Schema

This document defines the event tracking schema for the Driver Road Utilities suite. All events are logged using the `logFeatureInteraction` function in `featureAdoptionService.jsw`.

## Core Event Structure

| Field | Description |
|-------|-------------|
| `featureId` | The specific utility feature (e.g., `parking_finder`, `fuel_optimizer`) |
| `userId` | Driver ID or 'anonymous' |
| `action` | The type of interaction (`view`, `click`, `report`, `submit`, `filter`) |
| `metadata` | JSON object with context-specific details |

## Feature Events

### 1. Unified Dashboard (`unified_dashboard`)

| Action | Trigger | Metadata |
|--------|---------|----------|
| `view` | Dashboard tab loaded | `{ initial_load: boolean }` |
| `click` | Quick action button clicked | `{ target_feature: string }` |
| `plan_route`| Quick route check initiated | `{ dest: string }` |

### 2. Parking Finder (`parking_finder`)

| Action | Trigger | Metadata |
|--------|---------|----------|
| `click` | Search initiated | `{ query: string, radius: number, filters: object }` |
| `report` | Availability report submitted | `{ locationId: string, spacesAvailable: number }` |
| `view_details`| Location details expanded | `{ locationId: string }` |
| `navigate` | Navigate button clicked | `{ locationId: string }` |

### 3. Fuel Optimizer (`fuel_optimizer`)

| Action | Trigger | Metadata |
|--------|---------|----------|
| `click` | Price search initiated | `{ query: string, radius: number, fuelCardType: string }` |
| `link_card` | Fuel card linked | `{ cardType: string }` |
| `calculate` | Savings calculated | `{ gallons: number, cardType: string }` |

### 4. Weigh Station Finder (`weigh_station_finder`)

| Action | Trigger | Metadata |
|--------|---------|----------|
| `click` | Search initiated | `{ state: string, radius: number, bypassServices: object }` |
| `report` | Status report submitted | `{ stationId: string, reportType: string, waitMinutes: number }` |

### 5. Rest Stop Ratings (`rest_stop_ratings`)

| Action | Trigger | Metadata |
|--------|---------|----------|
| `view` | Reviews loaded for location | `{ locationId: string, sort: string }` |
| `submit` | Review submitted | `{ locationId: string, rating: number }` |
| `report` | Issue report submitted | `{ locationId: string, type: string }` |
| `vote` | Review helpful vote | `{ reviewId: string, helpful: boolean }` |

### 6. Weather Alerts (`weather_alerts`)

| Action | Trigger | Metadata |
|--------|---------|----------|
| `view` | Weather tab loaded / refreshed | `{ routePoints_count: number }` |
| `subscribe` | Alert preferences updated | `{ types: array }` |

### 7. Road Conditions (`road_conditions`)

| Action | Trigger | Metadata |
|--------|---------|----------|
| `view` | Conditions checked along route | `{ routePoints_count: number }` |
| `filter` | Truck restrictions checked | `{ truckSpecs: object }` |
| `report` | Condition report submitted | `{ type: string, highway: string }` |
| `verify` | Report verification | `{ reportId: string }` |
