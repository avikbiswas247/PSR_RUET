-- Support locked slot validation and conflict checks during booking creation.
-- This migration only adds indexes and does not alter existing booking data.

CREATE INDEX IF NOT EXISTS idx_bookings_photographer_schedule_active
  ON bookings (photographer_id, booking_date, start_time, end_time)
  WHERE status IN ('PENDING', 'ACCEPTED', 'CONFIRMED');

CREATE INDEX IF NOT EXISTS idx_photographer_availability_schedule
  ON photographer_availability (photographer_id, available_date, start_time)
  WHERE is_available = TRUE;
