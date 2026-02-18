# LMDR Compendium

> The Compendium is the project's living knowledge base -- a structured collection of playbooks, patterns, postmortems, and metrics maintained by the Knowledge Curator Agent and human contributors.

## Purpose

The Compendium captures hard-won operational knowledge that would otherwise live only in individual memory or scattered across code comments. It serves three audiences:

1. **Agents** -- Retrieval-augmented context for autonomous decision-making
2. **Developers** -- Onboarding reference and decision-log for architectural choices
3. **Operators** -- Runbooks for incident response, pipeline tuning, and system health

## Structure

```
Compendium/
├── recruiter/   # Outreach cadences, funnel optimization, conversion patterns
├── carrier/     # B2B signals, account segmentation, lane performance
├── driver/      # Match quality, scoring dimensions, engagement patterns
├── admin/       # Observability, incident response, cost optimization
└── dev/         # Code conventions, architecture patterns, quality rules
```

Each department directory contains:
- **INDEX.md** -- Table of contents with confidence ratings and freshness dates
- **playbooks/** -- Step-by-step operational procedures
- **patterns/** -- Recurring solutions and recognized best practices
- **postmortems/** -- Incident analyses and lessons learned
- **metrics/** -- KPI definitions, thresholds, and benchmarks

## How the Knowledge Curator Agent Updates Content

The Knowledge Curator Agent reviews agent run outputs, observation logs, and codebase changes on a weekly cadence. When new knowledge is detected:

1. The curator classifies it by department and type (playbook, pattern, postmortem, metric)
2. Assigns a confidence level based on evidence strength
3. Creates or updates the relevant file
4. Updates the department INDEX.md with the new entry
5. If a file exceeds the sharding threshold, it splits into focused sub-files

## Auto-Sharding Rules

Files are automatically split when they exceed either threshold:
- **1,500 lines** per file
- **80 KB** per file

Sharding produces numbered sub-files (e.g., `outreach-cadence-01.md`, `outreach-cadence-02.md`) with cross-references maintained in INDEX.md.

## Confidence Levels

| Level | Meaning | Evidence Required |
|-------|---------|-------------------|
| **high** | Validated across multiple runs or confirmed by domain expert | 3+ supporting data points or explicit human confirmation |
| **medium** | Observed in production but not yet broadly validated | 1-2 supporting observations |
| **low** | Inferred from code or single observation, needs validation | Code analysis or single agent run |

## How to Manually Contribute

1. Create or edit a file in the appropriate department directory
2. Follow the standard file template (see any existing pattern/playbook file)
3. Set confidence to `low` for new unvalidated contributions
4. Update the department INDEX.md table with your new entry
5. The curator agent will validate and potentially upgrade confidence over time

## Governance

- **Overall owner:** Engineering team
- **Automated curator:** Knowledge Curator Agent
- **Review cadence:** Weekly
- **Staleness threshold:** 30 days without validation triggers a review flag
