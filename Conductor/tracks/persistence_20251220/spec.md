# Track Spec: End-to-End Profile Persistence for AI Matching

## 1. Goal
To transition the "AI Matching" experience from a session-based ephemeral interaction to a fully persistent, personalized system where driver preferences, search history, and application status are saved to their member record.

## 2. Background
*   **Current State:** `AI - Matching.rof4w.js` accepts user inputs via an embedded HTML form and passes them directly to `carrierMatching.jsw`. Data is lost on page refresh.
*   **Desired State:** The system must load the driver's profile from `driverProfiles.jsw` upon page load, pre-fill the form, and save any new changes back to the database.

## 3. Key Requirements
*   **Frontend (AI - Matching.rof4w.js):**
    *   On `onReady`: Call `getOrCreateDriverProfile` to fetch existing data.
    *   Pre-fill the embedded HTML component with saved preferences (Zip, CPM, Equipment, etc.).
    *   On `findMatches` event: Call `updateDriverPreferences` BEFORE running the search.
*   **Backend (carrierMatching.jsw):**
    *   Accept a `profileId` or `userId` to fetch preferences directly from the DB (optional optimization) or continue accepting passed objects but ensure they are validated against the stored profile.
*   **Application Tracking:**
    *   Enhance "Log Interest" to check for existing applications and prevent duplicates.
    *   Provide visual feedback if a driver has already applied to a carrier.

## 4. Design Guidelines
*   **User Feedback:** Show a "Saving..." indicator or toast notification when preferences are updated.
*   **Error Handling:** Gracefully handle "Guest" users (non-logged in) by maintaining the current session-based behavior as a fallback.
*   **Data Privacy:** Ensure we only access the profile of the `currentUser`.
