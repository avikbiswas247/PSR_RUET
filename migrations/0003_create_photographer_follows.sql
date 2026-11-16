-- Migration: create photographer_follows table
-- Enables users to follow photographers for portfolio discovery.
-- Additive only: does not modify existing tables or data.

CREATE TABLE IF NOT EXISTS "photographer_follows" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  photographer_id uuid NOT NULL REFERENCES "photographer_profiles"(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, photographer_id)
);

CREATE INDEX IF NOT EXISTS idx_photographer_follows_follower_id ON "photographer_follows"(follower_id);
CREATE INDEX IF NOT EXISTS idx_photographer_follows_photographer_id ON "photographer_follows"(photographer_id);
