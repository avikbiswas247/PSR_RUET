-- Migration: add device and photography_genre to photographer_profiles
-- These columns are intended profile attributes requested by product.
-- Additive only: existing rows get NULL for both new columns.

ALTER TABLE "photographer_profiles"
  ADD COLUMN IF NOT EXISTS "device" text,
  ADD COLUMN IF NOT EXISTS "photography_genre" text;
