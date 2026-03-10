-- Phase 4: Full-Text Search + Fuzzy Matching Extensions
-- Run against Cloud SQL lmdr-postgres / database: lmdr
--
-- Part 1: Extensions (run immediately)
-- Part 2: Table alterations (run AFTER application tables exist)

-- ===== Part 1: Extensions =====
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ===== Part 2: Search columns + indexes =====
-- NOTE: These require the drivers/carriers/jobs tables to exist.
-- Run this section after application migrations have created the tables.
-- The extensions above (Part 1) were confirmed installed on 2026-03-09.

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- GIN indexes for full-text search
CREATE INDEX IF NOT EXISTS idx_drivers_search ON drivers USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_carriers_search ON carriers USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_jobs_search ON jobs USING GIN(search_vector);

-- Trigram indexes for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_drivers_name_trgm ON drivers USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_carriers_name_trgm ON carriers USING GIN(name gin_trgm_ops);
