import { many, one, run } from "./_shared";
export interface PhotographerAvailability {
  id: string; photographer_id: string; available_date: string | Date;
  start_time: string; end_time: string; is_available: boolean; is_booked?: boolean; created_at: string | Date;
}
export function listPhotographerAvailability(photographerId: string, fromDate: string, toDate: string, limit = 500, openOnly = false) {
  return many<PhotographerAvailability>(
    `SELECT pa.*,
       (pa.is_available AND reservation.has_booking IS DISTINCT FROM TRUE) AS is_available,
       COALESCE(reservation.has_booking, FALSE) AS is_booked
     FROM photographer_availability pa
     LEFT JOIN LATERAL (
       SELECT TRUE AS has_booking
       FROM bookings b
       WHERE b.photographer_id = pa.photographer_id
         AND b.booking_date = pa.available_date
         AND b.status IN ('PENDING', 'ACCEPTED', 'CONFIRMED')
         AND b.start_time < pa.end_time AND b.end_time > pa.start_time
       LIMIT 1
     ) reservation ON TRUE
     WHERE pa.photographer_id = $1 AND pa.available_date BETWEEN $2 AND $3
       AND (NOT $5::boolean OR (pa.is_available = TRUE AND reservation.has_booking IS DISTINCT FROM TRUE))
     ORDER BY pa.available_date, pa.start_time
     LIMIT $4`, [photographerId, fromDate, toDate, limit, openOnly],
  );
}
export function findAvailableSlot(photographerId: string, date: string, startTime: string, endTime: string) {
  return one<PhotographerAvailability>(
    `SELECT * FROM photographer_availability
     WHERE photographer_id = $1 AND available_date = $2 AND is_available = TRUE
       AND start_time <= $3 AND end_time >= $4
     LIMIT 1`, [photographerId, date, startTime, endTime],
  );
}
export function createAvailability(input: {
  photographer_id: string; available_date: string; start_time: string;
  end_time: string; is_available?: boolean;
}) {
  return one<PhotographerAvailability>(
    `INSERT INTO photographer_availability
     (photographer_id, available_date, start_time, end_time, is_available)
     VALUES ($1, $2, $3, $4, COALESCE($5, TRUE)) RETURNING *`,
    [input.photographer_id, input.available_date, input.start_time, input.end_time, input.is_available ?? true],
  );
}
export function setAvailability(id: string, photographerId: string, isAvailable: boolean) {
  return one<PhotographerAvailability>(
    "UPDATE photographer_availability SET is_available = $1 WHERE id = $2 AND photographer_id = $3 RETURNING *",
    [isAvailable, id, photographerId],
  );
}
export function deleteAvailability(id: string) { return run("DELETE FROM photographer_availability WHERE id = $1", [id]); }
