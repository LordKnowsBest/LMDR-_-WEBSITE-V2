-- =============================================================================
-- LMDR GCP Migration — Script 05: Cloud SQL Schema
-- Phase 3 | Run in Cloud SQL Query Editor or via psql
-- =============================================================================
-- HOW TO RUN:
--   Option A (Cloud SQL Studio in Console):
--     1. Go to https://console.cloud.google.com/sql/instances
--     2. Click your instance → Cloud SQL Studio
--     3. Connect to the 'lmdr' database
--     4. Paste and run this script
--
--   Option B (gcloud CLI):
--     gcloud sql connect lmdr-postgres --user=lmdr_user --database=lmdr
--     Then paste SQL below
-- =============================================================================

-- ─────────────────────────────────────────────
-- Enable required extensions
-- ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For full-text search on carrier names

-- =============================================================================
-- CORE OPERATIONAL TABLES
-- NOTE: All read-write tables MUST include _id, _createdDate, _updatedDate, _owner
--       or they will be READ-ONLY in Wix External Collections.
-- =============================================================================

-- ─────────────────────────────────────────────
-- TABLE: carriers
-- Migrated from: Airtable v2_Carriers
-- Wix namespace: gcp_core/carriers
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS carriers (
  -- Wix required fields
  _id               VARCHAR(36)   PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "_createdDate"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "_updatedDate"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  _owner            VARCHAR(128),

  -- Airtable migration fields
  airtable_id       VARCHAR(64)   UNIQUE,  -- Original Airtable record ID (recXXXXX)

  -- Core carrier data
  dot_number        VARCHAR(20)   UNIQUE NOT NULL,
  company_name      VARCHAR(255)  NOT NULL,
  state             VARCHAR(2),
  city              VARCHAR(100),
  num_trucks        INTEGER       DEFAULT 0,
  num_drivers       INTEGER       DEFAULT 0,
  freight_type      VARCHAR(50),
  home_time         VARCHAR(50),
  pay_per_mile      DECIMAL(5,3),
  pay_per_mile_max  DECIMAL(5,3),
  sign_on_bonus     DECIMAL(10,2),

  -- AI Enrichment
  combined_score    DECIMAL(5,2)  DEFAULT 0,
  safety_score      DECIMAL(5,2)  DEFAULT 0,
  is_enriched       BOOLEAN       DEFAULT FALSE,
  last_enriched_at  TIMESTAMPTZ,
  ai_summary        TEXT,
  driver_sentiment  TEXT,

  -- FMCSA data
  unsafe_driving_percentile  DECIMAL(5,2),
  hos_compliance_percentile  DECIMAL(5,2),
  crash_indicator_percentile DECIMAL(5,2),
  out_of_service_rate        DECIMAL(5,4),

  -- Subscription
  subscription_tier VARCHAR(20)   DEFAULT 'free',
  is_active         BOOLEAN       DEFAULT TRUE
);

-- Indexes for carrier search performance
CREATE INDEX IF NOT EXISTS idx_carriers_dot ON carriers(dot_number);
CREATE INDEX IF NOT EXISTS idx_carriers_score ON carriers(combined_score DESC);
CREATE INDEX IF NOT EXISTS idx_carriers_state ON carriers(state);
CREATE INDEX IF NOT EXISTS idx_carriers_enriched ON carriers(is_enriched, last_enriched_at);
CREATE INDEX IF NOT EXISTS idx_carriers_name_trgm ON carriers USING GIN (company_name gin_trgm_ops);

-- Auto-update _updatedDate
CREATE OR REPLACE FUNCTION update_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW."_updatedDate" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER carriers_updated_date
  BEFORE UPDATE ON carriers
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

-- ─────────────────────────────────────────────
-- TABLE: driver_profiles
-- Migrated from: Airtable v2_Driver Profiles
-- Wix namespace: gcp_core/driver_profiles
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS driver_profiles (
  _id               VARCHAR(36)   PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "_createdDate"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "_updatedDate"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  _owner            VARCHAR(128),

  airtable_id       VARCHAR(64)   UNIQUE,
  member_id         VARCHAR(128)  UNIQUE,  -- Wix Member ID

  -- Driver info
  first_name        VARCHAR(100),
  last_name         VARCHAR(100),
  email             VARCHAR(255),
  phone             VARCHAR(20),
  home_state        VARCHAR(2),
  home_city         VARCHAR(100),

  -- CDL info
  cdl_class         VARCHAR(5),
  cdl_state         VARCHAR(2),
  cdl_expiry        DATE,
  years_experience  INTEGER       DEFAULT 0,
  has_hazmat        BOOLEAN       DEFAULT FALSE,
  has_tanker        BOOLEAN       DEFAULT FALSE,
  has_doubles       BOOLEAN       DEFAULT FALSE,

  -- Preferences
  freight_preference VARCHAR(50),
  home_time_pref    VARCHAR(50),
  pay_min           DECIMAL(5,3),
  willing_to_relocate BOOLEAN    DEFAULT FALSE,
  preferred_states  TEXT[],       -- Array of state codes

  -- Status
  docs_submitted    BOOLEAN       DEFAULT FALSE,
  is_searchable     BOOLEAN       DEFAULT FALSE,
  visibility_level  VARCHAR(20)   DEFAULT 'none',
  profile_score     INTEGER       DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_drivers_member ON driver_profiles(member_id);
CREATE INDEX IF NOT EXISTS idx_drivers_searchable ON driver_profiles(is_searchable);
CREATE INDEX IF NOT EXISTS idx_drivers_cdl ON driver_profiles(cdl_class);
CREATE INDEX IF NOT EXISTS idx_drivers_state ON driver_profiles(home_state);

CREATE TRIGGER driver_profiles_updated_date
  BEFORE UPDATE ON driver_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

-- ─────────────────────────────────────────────
-- TABLE: driver_applications
-- Migrated from: Airtable v2_Applications
-- Wix namespace: gcp_core/driver_applications
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS driver_applications (
  _id               VARCHAR(36)   PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "_createdDate"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "_updatedDate"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  _owner            VARCHAR(128),

  airtable_id       VARCHAR(64)   UNIQUE,

  -- Foreign keys
  driver_id         VARCHAR(36)   REFERENCES driver_profiles(_id),
  carrier_id        VARCHAR(36)   REFERENCES carriers(_id),
  dot_number        VARCHAR(20),

  -- Application data
  status            VARCHAR(30)   DEFAULT 'pending',  -- pending/reviewed/accepted/rejected
  match_score       DECIMAL(5,2),
  applied_at        TIMESTAMPTZ   DEFAULT NOW(),
  reviewed_at       TIMESTAMPTZ,
  notes             TEXT,

  -- Interview
  interview_status  VARCHAR(20),
  interview_date    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_apps_driver ON driver_applications(driver_id);
CREATE INDEX IF NOT EXISTS idx_apps_carrier ON driver_applications(carrier_id);
CREATE INDEX IF NOT EXISTS idx_apps_status ON driver_applications(status);

CREATE TRIGGER driver_applications_updated_date
  BEFORE UPDATE ON driver_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

-- ─────────────────────────────────────────────
-- TABLE: carrier_subscriptions
-- Migrated from: Airtable v2_CarrierSubscriptions
-- Wix namespace: gcp_core/carrier_subscriptions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS carrier_subscriptions (
  _id               VARCHAR(36)   PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "_createdDate"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "_updatedDate"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  _owner            VARCHAR(128),

  airtable_id       VARCHAR(64)   UNIQUE,
  carrier_id        VARCHAR(36)   REFERENCES carriers(_id),
  dot_number        VARCHAR(20),

  -- Stripe
  stripe_customer_id       VARCHAR(64),
  stripe_subscription_id   VARCHAR(64),

  -- Plan
  tier              VARCHAR(20)   DEFAULT 'free',  -- free/pro/enterprise
  status            VARCHAR(20)   DEFAULT 'active', -- active/canceled/past_due
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,

  -- Quotas
  monthly_searches_used  INTEGER  DEFAULT 0,
  monthly_searches_limit INTEGER  DEFAULT 10,
  monthly_contacts_used  INTEGER  DEFAULT 0,
  monthly_contacts_limit INTEGER  DEFAULT 5
);

CREATE INDEX IF NOT EXISTS idx_subs_carrier ON carrier_subscriptions(carrier_id);
CREATE INDEX IF NOT EXISTS idx_subs_stripe ON carrier_subscriptions(stripe_subscription_id);

CREATE TRIGGER carrier_subscriptions_updated_date
  BEFORE UPDATE ON carrier_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

-- ─────────────────────────────────────────────
-- TABLE: messages
-- Migrated from: Airtable v2_Messages
-- Wix namespace: gcp_core/messages
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  _id               VARCHAR(36)   PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "_createdDate"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "_updatedDate"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  _owner            VARCHAR(128),

  airtable_id       VARCHAR(64)   UNIQUE,

  -- Participants
  sender_id         VARCHAR(128)  NOT NULL,
  recipient_id      VARCHAR(128)  NOT NULL,
  thread_id         VARCHAR(36),

  -- Content
  content           TEXT          NOT NULL,
  is_read           BOOLEAN       DEFAULT FALSE,
  read_at           TIMESTAMPTZ,
  message_type      VARCHAR(20)   DEFAULT 'text'
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id, "_createdDate" DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(recipient_id, is_read);

CREATE TRIGGER messages_updated_date
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

-- ─────────────────────────────────────────────
-- TABLE: matching_scores
-- Migrated from: Airtable v2_MatchingScores
-- Wix namespace: gcp_core/matching_scores
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matching_scores (
  _id               VARCHAR(36)   PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "_createdDate"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "_updatedDate"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  _owner            VARCHAR(128),

  driver_id         VARCHAR(36)   REFERENCES driver_profiles(_id),
  carrier_id        VARCHAR(36)   REFERENCES carriers(_id),
  overall_score     DECIMAL(5,2),
  cdl_match         DECIMAL(5,2),
  experience_match  DECIMAL(5,2),
  location_match    DECIMAL(5,2),
  pay_match         DECIMAL(5,2),
  freight_match     DECIMAL(5,2),
  scored_at         TIMESTAMPTZ   DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_scores_unique ON matching_scores(driver_id, carrier_id);
CREATE INDEX IF NOT EXISTS idx_scores_driver ON matching_scores(driver_id, overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_carrier ON matching_scores(carrier_id, overall_score DESC);

-- ─────────────────────────────────────────────
-- CONTENT TABLES (for Phase 4 — low-risk test)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faqs (
  _id               VARCHAR(36)   PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "_createdDate"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "_updatedDate"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  _owner            VARCHAR(128),

  airtable_id       VARCHAR(64)   UNIQUE,
  question          TEXT          NOT NULL,
  answer            TEXT          NOT NULL,
  category          VARCHAR(50),
  is_published      BOOLEAN       DEFAULT TRUE,
  sort_order        INTEGER       DEFAULT 0
);

CREATE TABLE IF NOT EXISTS blog_posts (
  _id               VARCHAR(36)   PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "_createdDate"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "_updatedDate"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  _owner            VARCHAR(128),

  airtable_id       VARCHAR(64)   UNIQUE,
  title             VARCHAR(255)  NOT NULL,
  slug              VARCHAR(255)  UNIQUE,
  content           TEXT,
  excerpt           TEXT,
  category          VARCHAR(50),
  tags              TEXT[],
  is_published      BOOLEAN       DEFAULT FALSE,
  published_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS compliance_guides (
  _id               VARCHAR(36)   PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "_createdDate"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "_updatedDate"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  _owner            VARCHAR(128),

  airtable_id       VARCHAR(64)   UNIQUE,
  title             VARCHAR(255)  NOT NULL,
  content           TEXT,
  regulation_type   VARCHAR(50),
  is_published      BOOLEAN       DEFAULT TRUE
);

-- ─────────────────────────────────────────────
-- ID MAPPING TABLE (Airtable RecordID → GCP UUID)
-- Used during migration — does NOT need Wix columns
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS id_mapping (
  airtable_id       VARCHAR(64)   NOT NULL,
  gcp_uuid          VARCHAR(36)   NOT NULL,
  collection_name   VARCHAR(100)  NOT NULL,
  migrated_at       TIMESTAMPTZ   DEFAULT NOW(),
  PRIMARY KEY (airtable_id, collection_name)
);

CREATE INDEX IF NOT EXISTS idx_mapping_gcp ON id_mapping(gcp_uuid);

-- ─────────────────────────────────────────────
-- VERIFICATION QUERY
-- ─────────────────────────────────────────────
SELECT
  tablename,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = tablename
   AND column_name IN ('_id','_createdDate','_updatedDate','_owner')
  ) AS wix_columns_present
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
