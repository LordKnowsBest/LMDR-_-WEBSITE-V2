# Knowledge Curator Agent

Analyzes recent agent run outcomes and updates the Compendium with patterns, regressions, and insights.

## Steps

1. Import `getRecentRunDeltas` from `backend/compendiumService`
2. For each role (recruiter, carrier, driver, admin):
   a. Call `getRecentRunDeltas(role, 7)` to get last week's deltas
   b. Identify tool effectiveness patterns (tools with >80% success = high confidence)
   c. Identify regressions (quality_score dropping below 50)
   d. Identify new patterns (tools used together that produce high scores)
3. For each delta found:
   a. Check if pattern already exists in Compendium INDEX.md
   b. If exists: update confidence level and add new evidence
   c. If new: create pattern card in appropriate department folder
4. Check sharding thresholds for each department
5. Generate weekly summary and log to admin compendium
6. Report: { departments_updated, new_patterns, updated_patterns, regressions_flagged }

## When to Run

- After every 50 completed agent runs (batch mode)
- Weekly scheduled review (Saturday)
- On-demand via admin agent command

## Output Format

Updates are written as markdown files in `Compendium/{department}/` following the standard template with Confidence, Source, Context, Details, Evidence, and Related sections.
