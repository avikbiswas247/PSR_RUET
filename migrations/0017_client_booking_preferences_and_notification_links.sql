BEGIN;

ALTER TABLE client_profiles
  ADD COLUMN IF NOT EXISTS preferred_services TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT,
  ADD COLUMN IF NOT EXISTS booking_notes TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS client_profiles_user_id_unique_idx
  ON client_profiles (user_id);

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS link_url TEXT;

COMMIT;
