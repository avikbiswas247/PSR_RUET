ALTER TABLE "events"
  ADD COLUMN IF NOT EXISTS "cover_image_url" text;

ALTER TABLE "exhibitions"
  ADD COLUMN IF NOT EXISTS "cover_image_url" text;
