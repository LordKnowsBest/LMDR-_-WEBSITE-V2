# Progress — AI Intelligence Layer

## Status: PLANNED — not started

| Phase | Name | Priority | Status |
|-------|------|----------|--------|
| 1 | Semantic Search Microservice | YES | Not started |
| 2 | LangSmith Agent Tracing | YES | Not started |
| 3 | Streaming Agent Responses | LOW | Not started |
| 4 | B2B Parallel Research Agents | MAYBE | Not started |

## Log

### 2026-02-19 — Track Created
- Track created from LangChain framework analysis session
- All 4 phases defined and scoped
- Architecture constraint documented: Velo cannot run LangChain/LlamaIndex natively → external microservice required
- Phase 1 (semantic search) and Phase 2 (LangSmith) marked HIGH VALUE — start next sprint
- Phase 3 (streaming) marked LOW PRIORITY — depends on Velo streaming API confirmation
- Phase 4 (B2B multi-agent) marked MAYBE — build only if B2B usage exceeds 50 lookups/month and Phase 1 infra is already deployed
