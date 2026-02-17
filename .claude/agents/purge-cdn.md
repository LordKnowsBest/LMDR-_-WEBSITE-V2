# CDN Purge Agent

Purges jsDelivr cache for all CDN-served files in the repository.

## Steps

1. Find all HTML files that reference `cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2`
2. Extract all CDN file paths from script src and link href attributes
3. Construct purge URLs: `https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/<path>`
4. Execute purge for each file using curl
5. Report results

## Common CDN Directories

- `src/public/js/` — Shared modules
- `src/public/css/` — Shared styles
- `src/public/driver/js/` — Driver JS modules
- `src/public/driver/css/` — Driver CSS
- `src/public/recruiter/os/js/` — Recruiter JS modules
- `src/public/recruiter/os/css/` — Recruiter CSS
- `src/public/admin/js/` — Admin JS modules
