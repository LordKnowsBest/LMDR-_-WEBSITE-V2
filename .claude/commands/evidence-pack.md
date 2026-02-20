# Evidence Pack — Runtime Verification

Run the DevTools Evidence Pack against `https://www.lastmiledr.app`.

## Usage

```
/evidence-pack
```

## What It Does

Visits 8 critical paths in Chrome, captures console errors, network failures, and screenshots, then produces a quality gate JSON with pass/fail verdict.

## Execution

Launch a `general-purpose` subagent with `bypassPermissions` mode. The agent must:

1. **Read the full workflow** from `.claude/agents/evidence-pack.md`
2. **Execute all phases** autonomously (Phase 0 through Phase 4)
3. **Write artifacts** to `artifacts/devtools/<RUN_ID>/`
4. **Return the final summary** (quality gate pass/fail, checks table, action items)

### Agent Launch Prompt

```
Execute the full Evidence Pack verification protocol against https://www.lastmiledr.app.

Read the agent workflow file first: <project_root>/.claude/agents/evidence-pack.md

Then execute all phases autonomously:
- Phase 0: Session Guard (validate Chrome tab)
- Phase 1: Per-Path Verification Loop (8 paths)
- Phase 2: Quality Gate Evaluation (6 checks)
- Phase 3: Write Artifacts (quality_gate.json, console_audit.json, network_audit.json, screenshots)
- Phase 4: Final Summary

RUN_ID = current ISO-8601 timestamp with colons replaced by dashes.
ARTIFACT_ROOT = <project_root>/artifacts/devtools/<RUN_ID>
```

## Output

The agent returns a formatted summary:

```
Evidence Pack Complete
Run ID:       <timestamp>
Quality Gate: PASS | FAIL
Checks:       N/6 passed

  [x/fail] zero_p0_errors
  [x/fail] all_critical_selectors_visible
  [x/fail] all_pages_reached_ready_state
  [x/fail] zero_network_500_errors
  [x/fail] screenshots_captured
  [x/fail] zero_velo_worker_fatal_errors
```

## Prerequisites

- Chrome must be open with `https://www.lastmiledr.app` loaded
- Chrome DevTools MCP server must be connected (`chrome-devtools-mcp --autoConnect`)
- No Wix Editor tabs open (causes false positives)
