# Progress — RAG + Intent-Based Agent Intelligence Layer

## Status: **PLANNED** — Track authored, no implementation started

| Phase | Name | Priority | Status |
|-------|------|----------|--------|
| 1 | Knowledge Base Architecture & Corpus Construction | YES | Pending |
| 2 | Intent Classification Service | YES | Pending |
| 3 | RAG Retrieval Integration — Extend /v1/agent/turn | YES | Pending |
| 4 | Agent Injection Layer — All Four Roles | YES | Pending |
| 5 | Knowledge Freshness, Feedback Loop & Admin Analytics | YES | Pending |

## Prerequisites

Before starting Phase 1, confirm:
- [ ] `lmdr-knowledge` Pinecone index created (separate from `lmdr-drivers` and `lmdr-carriers`)
- [ ] `lmdr-memory` Pinecone index created
- [ ] Groq API key added to Railway env vars (`GROQ_API_KEY`)
- [ ] Four new Airtable tables created in `Last Mile Driver recruiting` base:
  - `v2_RAG Documents`
  - `v2_RAG Retrieval Log`
  - `v2_RAG Analytics`
  - `v2_Intent Classification Log`
- [ ] Tables added to `airtableClient.js` TABLE_NAMES and FIELD_MAPPINGS
- [ ] Config keys added to `configData.js`
- [ ] Feature flags added to `configData.js` FEATURE_FLAGS (all defaulting to `false`)

## Log

### 2026-02-24 — Track Created

- Track authored from RAG benefit analysis on branch `claude/evaluate-rag-benefits-mrhcl`
- Plan, spec, intent taxonomy, and metadata written
- Architecture decision: intent classification and RAG retrieval collapsed into a single
  Railway call via optional `ragConfig` on existing `/v1/agent/turn` endpoint — preserves
  Wix 25s latency budget, adds zero extra round trips
- Six knowledge namespaces defined; `lmdr-knowledge` (5 namespaces) + `lmdr-memory` (per-user)
- Full intent taxonomy documented for all 4 roles: 10 driver intents, 8 recruiter intents,
  5 admin intents, 4 carrier intents + `general_inquiry` fallback

## Pending

- Create Pinecone indexes (`lmdr-knowledge`, `lmdr-memory`)
- Create Airtable tables per spec §7 field schemas
- Begin Phase 1 implementation
