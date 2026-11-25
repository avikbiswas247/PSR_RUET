CREATE TABLE IF NOT EXISTS participation_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('event', 'exhibition')),
  target_id UUID NOT NULL,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  bkash_numbers TEXT[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  image_submissions_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  video_submissions_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (target_type, target_id)
);

CREATE TABLE IF NOT EXISTS participation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES participation_forms(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  department TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  transaction_number TEXT,
  photo_urls TEXT[] NOT NULL DEFAULT '{}',
  video_urls TEXT[] NOT NULL DEFAULT '{}',
  selected_photo_urls TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED')),
  is_selected BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE (form_id, email)
);

CREATE INDEX IF NOT EXISTS participation_requests_form_status_idx ON participation_requests(form_id, status, submitted_at DESC);
