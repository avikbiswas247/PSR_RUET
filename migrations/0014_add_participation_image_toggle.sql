ALTER TABLE participation_forms
  ADD COLUMN IF NOT EXISTS image_submissions_enabled BOOLEAN NOT NULL DEFAULT TRUE;
