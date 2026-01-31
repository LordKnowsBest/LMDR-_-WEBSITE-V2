# Track Spec: Driver Utility Expansion

## Goal
Increase driver engagement and retention by providing visibility into their profile strength, actionable advice, and convenient communication tools. Turn the driver dashboard from a static application list into an active career management hub.

## Components

### 1. Profile Strength Meter
- **Algorithm**: Weighted average of:
  - Base Info (20%): Name, Phone, Email
  - Experience (30%): Years, Endorsements, violations
  - Documents (30%): CDL Front/Back, Medical Card
  - Preferences (20%): Pay, Routes, Home Time
- **Visualization**: Circular progress bar (CSS/SVG) or linear bar.
- **Location**: Top of `DRIVER_DASHBOARD.html`, prominent on mobile.
- **Action**: "Improve Profile" link -> deep links to specific missing fields.

### 2. Quick Response Templates
- **Templates**:
  - "I'm interested, please call me."
  - "Can you share more details about the pay?"
  - "I'm currently not interested, thank you."
  - "Can we schedule a time to talk?"
- **UI**: Horizontal scrolling chips (mobile-friendly) above the text input area in the chat window.
- **Logic**: Clicking a chip populates the text area (allows editing) or sends immediately (with confirmation)? -> *Decision: Populates text area for editing.*

### 3. Reverse Alerts (Carrier Views)
- **Concept**: Notify driver when a recruiter views their full profile or downloads their resume.
- **Mechanism**:
  - Trigger: `getDriverProfile` (recruiter-side function).
  - Frequency: Real-time (in-app notification) + Batched Email (Daily/Weekly digest if multiple, or Immediate if high-intent).
  - *Constraint*: Avoid spam. Limit to 1 notification per carrier per 24h.
- **Content**: "Carrier X viewed your profile" or "Wait list carrier viewed you" (if anonymized).

### 4. Insights Panel
- **Data Points**:
  - **Profile Views**: Number of unique recruiters who viewed the profile in last 30 days.
  - **Search Appearances**: Number of times the driver appeared in search results.
  - **Application Status**: Breakdown of current applications (Applied, Viewed, Contacted).
- **Visualization**: Simple bar charts using CSS or `chart.js` (lightweight version).
- **Location**: New tab "Insights" or section below Applications.

## Technical Details

### Backend Services
- `profileStrengthService.jsw`: Calculates score, returns missing fields.
- `driverInsightsService.jsw`: Aggregates view/search stats.
- `messaging.jsw`: Updates to include template support (if needed) or just frontend constants.
- `matchNotifications.jsw`: Enhance for "Profile Viewed" alerts.

### Database Schema Changes
- **DriverProfiles**: Add `profile_strength_score` (Number), `last_strength_calc` (Date).
- **DriverStats** (new or existing): Track daily views/impressions. *Check `DriverDailyStats` or similar.*

### Frontend
- **DRIVER_DASHBOARD.html**: Major updates to dashboard layout to accommodate new widgets.
- **Mobile Optimization**: Critical for all new components.

## Success Metrics
- Increase in profile completion rate (avg score > 80%).
- Increase in driver response rate to recruiter messages (using templates).
- Increase in daily active users (DAU) due to "Who viewed me" notifications.
