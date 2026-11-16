-- 0008_create_admin_founders.sql
-- Tracks Founder Admin ownership designation separately from the ADMIN role.
-- Additive migration: does not modify or delete any existing tables or rows.

CREATE TABLE IF NOT EXISTS admin_founders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  designated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  designated_by UUID REFERENCES users(id),
  transferred_at TIMESTAMPTZ,
  transferred_to UUID REFERENCES users(id),
  transfer_reason TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT admin_founders_user_id_unique UNIQUE (user_id)
);

-- Index for fast founder lookups
CREATE INDEX IF NOT EXISTS idx_admin_founders_user_id ON admin_founders(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_founders_is_active ON admin_founders(is_active);

-- Ensure exactly one active founder at any time (enforced at application level too)
-- The unique constraint on (user_id) with is_active = true prevents multiple active founders per user,
-- but we enforce single active founder globally in application logic.
