ALTER TABLE participation_forms
  ADD COLUMN IF NOT EXISTS video_submissions_enabled BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE participation_requests
  ADD COLUMN IF NOT EXISTS video_urls TEXT[] NOT NULL DEFAULT '{}';
