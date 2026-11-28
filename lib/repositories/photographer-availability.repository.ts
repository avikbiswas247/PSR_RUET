import { many, one, run } from "./_shared";
export interface PhotographerAvailability {
  id: string; photographer_id: string; available_date: string | Date;
  start_time: string; end_time: string; is_available: boolean; created_at: string | Date;
}
export function listPhotographerAvailability(photographerId: string, fromDate: string, toDate: string) {
  return many<PhotographerAvailability>(
    `SELECT * FROM photographer_availability
     WHERE photographer_id = $1 AND available_date BETWEEN $2 AND $3
     ORDER BY available_date, start_time`, [photographerId, fromDate, toDate],
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
