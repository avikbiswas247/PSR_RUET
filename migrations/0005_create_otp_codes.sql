-- Migration: create otp_codes table
-- Stores 6-digit OTP hashes for email verification and password reset.
-- 10-minute expiry, max 5 attempts, resend cooldown.
-- Additive only: does not modify existing tables or data.

CREATE TABLE IF NOT EXISTS "otp_codes" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('email_verification', 'password_reset')),
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
