import { many, one, run } from "./_shared";
export interface EventRegistration {
  id: string; event_id: string; user_id: string;
  status: "REGISTERED" | "CANCELLED" | "ATTENDED" | "ABSENT";
  registered_at: string | Date;
}
export function registerUserForEvent(eventId: string, userId: string) {
  return one<EventRegistration>(
    `INSERT INTO event_registrations (event_id, user_id)
     VALUES ($1, $2) ON CONFLICT (event_id, user_id)
     DO UPDATE SET status = 'REGISTERED' RETURNING *`,
    [eventId, userId],
  );
}
export function listEventRegistrations(eventId: string, limit = 100, offset = 0) {
  return many<EventRegistration>(
    "SELECT * FROM event_registrations WHERE event_id = $1 ORDER BY registered_at DESC LIMIT $2 OFFSET $3",
    [eventId, limit, offset],
  );
}
export function listEventsForUser(userId: string) {
  return many<EventRegistration>(
    `SELECT er.*, e.title, e.slug, e.start_at, e.location
     FROM event_registrations er INNER JOIN events e ON e.id = er.event_id
     WHERE er.user_id = $1 ORDER BY er.registered_at DESC`, [userId],
  );
}
export function updateRegistrationStatus(id: string, status: EventRegistration["status"]) {
  return one<EventRegistration>("UPDATE event_registrations SET status = $1 WHERE id = $2 RETURNING *", [status, id]);
}
export function cancelEventRegistration(eventId: string, userId: string) {
  return run("UPDATE event_registrations SET status = 'CANCELLED' WHERE event_id = $1 AND user_id = $2", [eventId, userId]);
}
