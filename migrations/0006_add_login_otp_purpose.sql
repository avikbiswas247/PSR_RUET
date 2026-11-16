-- Migration: Add 'login' purpose to otp_codes CHECK constraint
-- Supports OTP-based two-factor authentication for admin login.
-- Additive only: does not modify existing data or drop constraints.

ALTER TABLE otp_codes
  DROP CONSTRAINT IF EXISTS otp_codes_purpose_check;

ALTER TABLE otp_codes
  ADD CONSTRAINT otp_codes_purpose_check
  CHECK (purpose IN ('email_verification', 'password_reset', 'login'));
