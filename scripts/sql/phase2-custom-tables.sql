-- Phase 2 custom tables (not JSONB pattern)
-- Run against Cloud SQL lmdr database

-- Dispatch assignments (carrier-service)
CREATE TABLE IF NOT EXISTS dispatch_assignments (
  _id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  job_id       TEXT NOT NULL,
  driver_id    TEXT NOT NULL,
  carrier_id   TEXT NOT NULL,
  assigned_by  TEXT NOT NULL,
  assigned_at  TIMESTAMPTZ DEFAULT NOW(),
  status       TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed'))
);
CREATE INDEX IF NOT EXISTS idx_dispatch_job ON dispatch_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_driver ON dispatch_assignments(driver_id);

-- Compliance checks (compliance-service)
CREATE TABLE IF NOT EXISTS compliance_checks (
  _id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  driver_id    TEXT NOT NULL,
  check_type   TEXT NOT NULL CHECK (check_type IN ('mvr', 'background')),
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'clear', 'flagged', 'failed')),
  result       TEXT,
  details      JSONB,
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_compliance_driver ON compliance_checks(driver_id);
CREATE INDEX IF NOT EXISTS idx_compliance_type ON compliance_checks(check_type, status);

-- Audit events (compliance-service)
CREATE TABLE IF NOT EXISTS audit_events (
  _id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  actor_id      TEXT NOT NULL,
  actor_role    TEXT NOT NULL,
  action        TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   TEXT NOT NULL,
  before_state  JSONB,
  after_state   JSONB,
  ip_address    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_events(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events(created_at DESC);

-- User roles (analytics-service)
CREATE TABLE IF NOT EXISTS user_roles (
  uid        TEXT NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('admin', 'recruiter', 'carrier', 'driver')),
  carrier_id TEXT,
  driver_id  TEXT,
  granted_by TEXT NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (uid, role)
);

-- Notification history (notifications-service)
CREATE TABLE IF NOT EXISTS notification_history (
  _id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  recipient_id  TEXT NOT NULL,
  channel       TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
  subject       TEXT,
  body          TEXT NOT NULL,
  status        TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'read')),
  sent_at       TIMESTAMPTZ DEFAULT NOW(),
  read_at       TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_notif_recipient ON notification_history(recipient_id, sent_at DESC);

-- Rate cards (billing-service)
CREATE TABLE IF NOT EXISTS rate_cards (
  _id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name         TEXT NOT NULL,
  carrier_id   TEXT,
  rate_type    TEXT NOT NULL,
  rate_amount  NUMERIC(10,4) NOT NULL,
  effective_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ
);
