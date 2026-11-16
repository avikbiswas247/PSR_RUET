-- Migration: create admin_invitations table
-- Enables existing admins to invite the second administrator.
-- Single-use, email-bound, expiring invitation tokens.
-- Additive only: does not modify existing tables or data.

CREATE TABLE IF NOT EXISTS "admin_invitations" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  inviter_id uuid NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_invitations_email ON "admin_invitations"(email);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_token_hash ON "admin_invitations"(token_hash);
