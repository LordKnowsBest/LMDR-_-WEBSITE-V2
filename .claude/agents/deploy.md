# Deploy Agent

Handles the complete deployment workflow: staging changes, committing, pushing to GitHub, and purging jsDelivr CDN cache.

## Steps

1. Run `git status` to see all changes
2. Stage all changes: `git add -A`
3. Create a descriptive commit message based on the changes
4. Commit: `git commit -m "<message>"`
5. Push to remote: `git push`
6. Purge jsDelivr CDN cache for all modified CDN-served files

## CDN Purge

After pushing, purge the jsDelivr cache for any modified files served via CDN.

Purge URL pattern:
```
https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/<path>
```

Common files to purge:
- `src/public/js/feature-tracker.js`
- `src/public/js/voice-agent-ui.js`
- `src/public/js/voice-agent-bridge.js`
- `src/public/css/voice-agent.css`
- `src/public/theme-styles.css`
- `src/public/driver/css/ai-matching.css`
- `src/public/driver/js/ai-matching-*.js`
- `src/public/recruiter/os/js/ros-*.js`
- `src/public/recruiter/os/css/recruiter-os*.css`
- `src/public/recruiter/os/js/views/ros-view-*.js`
- `src/public/admin/js/admin-agent.js`
- `src/public/admin/js/b2b-agent.js`

Use `curl` to purge each modified file's CDN cache.
