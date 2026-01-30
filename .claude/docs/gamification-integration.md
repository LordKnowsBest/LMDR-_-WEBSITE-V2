# Gamification Integration Points

> Auto-injected when editing gamification, streak, achievement, challenge, or seasonal service files.

The gamification system hooks into core services using a non-blocking, lazy-loaded pattern to prevent circular dependencies and not block main flows.

## Integration Points

| Service | Function | Action | Reward |
|---------|----------|--------|--------|
| `driverProfiles.jsw` | `updateDriverPreferences()` | `update_profile` | Driver XP |
| `driverProfiles.jsw` | `updateDriverDocuments()` | `upload_document` | Driver XP |
| `driverProfiles.jsw` | `updateDriverQualifications()` | `update_profile` | Driver XP |
| `applicationService.jsw` | `submitApplication()` | `apply_job` | Driver XP |
| `driverMatching.jsw` | `getDriverProfile()` | `view_profile` | Recruiter Points |
| `messaging.jsw` | `sendMessage()` | `send_message` | XP/Points |
| `messaging.jsw` | `sendMessage()` (fast response) | `fast_response` | Recruiter Points |
| `interviewScheduler.jsw` | `scheduleInterview()` | `schedule_interview` | Recruiter Points |
| `interviewScheduler.jsw` | `confirmInterview()` | `complete_interview` | Driver XP |
| `recruiter_service.jsw` | `updateCandidateStatus()` -> HIRED | `get_hired` | Driver XP |
| `recruiter_service.jsw` | `updateCandidateStatus()` -> HIRED | `make_hire` | Recruiter Points |
| `memberService.jsw` | `updateLastActive()` | Daily login | Streak recording |

## Required Integration Pattern

```javascript
// Lazy-load gamification service to avoid circular dependencies
async function getGamificationService() {
  return await import('backend/gamificationService');
}

// Non-blocking award helper (won't block main flow on failure)
async function awardXPNonBlocking(userId, action, metadata = {}) {
  try {
    const gamification = await getGamificationService();
    await gamification.awardDriverXP(userId, action, metadata);
  } catch (err) {
    console.warn(`XP award failed for ${action}:`, err.message);
  }
}
```
