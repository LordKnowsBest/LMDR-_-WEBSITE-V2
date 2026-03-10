-- =============================================================================
-- Phase 4 Service 5: PostgreSQL Full-Text Search + PostGIS + pgvector
-- Run: psql -h 127.0.0.1 -p 5432 -U lmdr_user -d lmdr -f scripts/sql/phase4-search-full.sql
-- Requires: Cloud SQL Auth Proxy running on localhost:5432
-- =============================================================================

-- 1. Enable extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- 2. Carriers table — already typed, add search + geo columns
-- =============================================================================

-- Full-text search vector
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS idx_carriers_search ON carriers USING GIN(search_vector);

-- Trigram index for fuzzy name matching
CREATE INDEX IF NOT EXISTS idx_carriers_name_trgm ON carriers USING GIN(company_name gin_trgm_ops);

-- Geography column for geo-radius search
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS location geography(Point, 4326);
CREATE INDEX IF NOT EXISTS idx_carriers_location ON carriers USING GIST(location);

-- Trigger: auto-update search_vector on INSERT/UPDATE
CREATE OR REPLACE FUNCTION update_carrier_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.company_name, '') || ' ' ||
    coalesce(NEW.state, '') || ' ' ||
    coalesce(NEW.city, '') || ' ' ||
    coalesce(NEW.freight_type, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_carrier_search ON carriers;
CREATE TRIGGER trg_carrier_search
  BEFORE INSERT OR UPDATE ON carriers
  FOR EACH ROW EXECUTE FUNCTION update_carrier_search_vector();

-- Backfill existing rows
UPDATE carriers SET search_vector = to_tsvector('english',
  coalesce(company_name, '') || ' ' ||
  coalesce(state, '') || ' ' ||
  coalesce(city, '') || ' ' ||
  coalesce(freight_type, '')
);

-- =============================================================================
-- 3. JSONB tables — add search_vector to airtable_driver_profiles
-- =============================================================================

ALTER TABLE airtable_driver_profiles ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS idx_driver_profiles_search ON airtable_driver_profiles USING GIN(search_vector);

-- Trigram index on first_name in JSONB
CREATE INDEX IF NOT EXISTS idx_driver_profiles_name_trgm ON airtable_driver_profiles USING GIN(
  (data->>'first_name') gin_trgm_ops
);

-- Trigger: auto-update search_vector from JSONB data
CREATE OR REPLACE FUNCTION update_driver_profile_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.data->>'first_name', '') || ' ' ||
    coalesce(NEW.data->>'last_name', '') || ' ' ||
    coalesce(NEW.data->>'cdl_class', '') || ' ' ||
    coalesce(NEW.data->>'endorsements', '') || ' ' ||
    coalesce(NEW.data->>'state', '') || ' ' ||
    coalesce(NEW.data->>'city', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_driver_profile_search ON airtable_driver_profiles;
CREATE TRIGGER trg_driver_profile_search
  BEFORE INSERT OR UPDATE ON airtable_driver_profiles
  FOR EACH ROW EXECUTE FUNCTION update_driver_profile_search_vector();

-- Backfill existing rows
UPDATE airtable_driver_profiles SET search_vector = to_tsvector('english',
  coalesce(data->>'first_name', '') || ' ' ||
  coalesce(data->>'last_name', '') || ' ' ||
  coalesce(data->>'cdl_class', '') || ' ' ||
  coalesce(data->>'endorsements', '') || ' ' ||
  coalesce(data->>'state', '') || ' ' ||
  coalesce(data->>'city', '')
);

-- =============================================================================
-- 4. pgvector: Embeddings table for AI similarity search
-- =============================================================================

CREATE TABLE IF NOT EXISTS document_embeddings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  source_collection TEXT NOT NULL,
  source_id TEXT NOT NULL,
  chunk_index INTEGER DEFAULT 0,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_embeddings_source ON document_embeddings(source_collection, source_id);

-- IVFFlat index for approximate nearest neighbor (requires rows to exist first)
-- Will be created after initial data load:
-- CREATE INDEX idx_embeddings_vector ON document_embeddings USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- =============================================================================
-- 5. Verification queries
-- =============================================================================

-- Verify extensions
SELECT extname, extversion FROM pg_extension WHERE extname IN ('pg_trgm', 'unaccent', 'postgis', 'vector') ORDER BY extname;

-- Verify columns added
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE (table_name = 'carriers' AND column_name IN ('search_vector', 'location'))
   OR (table_name = 'airtable_driver_profiles' AND column_name = 'search_vector')
   OR (table_name = 'document_embeddings' AND column_name = 'embedding')
ORDER BY table_name, column_name;

-- Verify indexes
SELECT indexname, tablename FROM pg_indexes
WHERE indexname LIKE 'idx_%search%' OR indexname LIKE 'idx_%trgm%' OR indexname LIKE 'idx_%location%' OR indexname LIKE 'idx_%embed%'
ORDER BY tablename, indexname;

-- Count backfilled search vectors
SELECT 'carriers' as tbl, COUNT(*) as total, COUNT(search_vector) as with_search FROM carriers
UNION ALL
SELECT 'driver_profiles', COUNT(*), COUNT(search_vector) FROM airtable_driver_profiles;
