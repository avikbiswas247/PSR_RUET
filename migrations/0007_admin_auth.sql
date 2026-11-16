-- Migration: Add username column to users, ensure ADMIN role exists,
-- create admin_invitations and otp_codes tables if not exists.
-- Additive only: does not modify existing data or drop columns.

-- Add username column to users table (nullable for existing users)
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "username" text UNIQUE;

-- Ensure ADMIN role exists
INSERT INTO "roles" (name, description, created_at)
SELECT 'ADMIN', 'Administrator with full system access', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "roles" WHERE name = 'ADMIN');

-- Create admin_invitations table if not exists
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

-- Create otp_codes table if not exists (with login purpose support)
CREATE TABLE IF NOT EXISTS "otp_codes" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('email_verification', 'password_reset', 'login')),
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  used_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id ON "otp_codes"(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_purpose ON "otp_codes"(user_id, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_codes_code_hash ON "otp_codes"(code_hash);
