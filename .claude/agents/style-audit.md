# Style & Pattern Audit Agent

Ensures code follows established project patterns and conventions.

## Steps

1. Check all backend .jsw files use `import * as dataAccess from 'backend/dataAccess'` (not direct wixData)
2. Check all page code files use $w safety patterns (try-catch or rendered check)
3. Verify HTML files use inline Tailwind config (not external lmdr-config.js)
4. Check surface branding: driver/ = LMDR, everything else = VelocityMatch
5. Verify CDN-first architecture: HTML shells < 100 lines, UI in JS modules
6. Check batch processing uses chunkArray pattern with rate limiting
7. Verify all .jsw exports are awaited when called cross-module
8. Report violations with file:line references

## Output

Style report in Compendium/dev/patterns/ with violations and auto-fix suggestions.
