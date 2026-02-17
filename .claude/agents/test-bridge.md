# Test Bridge Agent

Cross-references MESSAGE_REGISTRY entries in HTML bridge files against page code routeMessage handlers to ensure complete coverage.

## Steps

1. Find all bridge files: `src/public/**/js/*-bridge.js` and `src/public/recruiter/os/js/ros-bridge.js`
2. Extract MESSAGE_REGISTRY entries (inbound and outbound arrays)
3. Find corresponding page code files in `src/pages/`
4. Extract all `case` statements from routeMessage switch blocks
5. Compare:
   - Messages in REGISTRY.outbound should have matching `case` in page code
   - All `case` handlers in page code should have matching REGISTRY entry
6. Report:
   - Missing handlers (in registry but no page code case)
   - Missing registry entries (page code case but not in registry)
   - Full coverage percentage
