import type { DatabaseClient } from "@/lib/db";
import { byId, many } from "./_shared";

export interface Booking {
  id: string;
  booking_number: string;
  client_id: string;
  photographer_id: string;
  title: string | null;
  description: string | null;
  photography_type: string | null;
  location: string | null;
  booking_date: string | Date;
  start_time: string | Date;
  end_time: string | Date;
  budget: string | number | null;
  status: string;
  created_at: string | Date;
  updated_at: string | Date;
}

const TABLE = "bookings";

export function getBookingById(id: string) {
  return byId<Booking>(TABLE, id);
}

export function listBookings(limit = 50, offset = 0) {
  return many<Booking>(`SELECT * FROM ${TABLE} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
}

export function listBookingsForClient(clientId: string, limit = 50, offset = 0) {
  return many<Booking>(`SELECT * FROM ${TABLE} WHERE client_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, [clientId, limit, offset]);
}

export function listBookingsForClientWithPhotographer(clientId: string, limit = 50, offset = 0) {
  return many<Booking & { photographer_profile: Record<string, unknown> | null }>(
    `SELECT b.*,
       CASE WHEN u.id IS NULL THEN NULL ELSE jsonb_build_object(
         'id', pp.id, 'user_id', pp.user_id, 'full_name', u.full_name,
         'avatar_url', u.avatar_url, 'title', pp.title, 'location', pp.location,
         'photography_genre', pp.photography_genre
       ) END AS photographer_profile
     FROM bookings b
     LEFT JOIN photographer_profiles pp ON pp.user_id = b.photographer_id
     LEFT JOIN users u ON u.id = pp.user_id AND u.is_active = TRUE AND u.deleted_at IS NULL
     WHERE b.client_id = $1
     ORDER BY b.created_at DESC LIMIT $2 OFFSET $3`,
    [clientId, limit, offset],
  );
}

export function listBookingsForPhotographer(photographerId: string, limit = 50, offset = 0) {
  return many<Booking>(`SELECT * FROM ${TABLE} WHERE photographer_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, [photographerId, limit, offset]);
}

export function listBookingsForPhotographerWithClient(photographerId: string, limit = 50, offset = 0) {
  return many<Booking & { client_profile: Record<string, unknown> | null }>(
    `SELECT b.*,
       CASE WHEN u.id IS NULL THEN NULL ELSE jsonb_build_object(
         'id', u.id, 'full_name', u.full_name, 'avatar_url', u.avatar_url,
         'email', u.email, 'phone', u.phone, 'organization_name', cp.organization_name,
         'created_at', u.created_at
       ) END AS client_profile
     FROM bookings b
     LEFT JOIN users u ON u.id = b.client_id AND u.is_active = TRUE AND u.deleted_at IS NULL
     LEFT JOIN client_profiles cp ON cp.user_id = b.client_id
     WHERE b.photographer_id = $1
     ORDER BY b.created_at DESC LIMIT $2 OFFSET $3`,
    [photographerId, limit, offset],
  );
}

/** Serialize booking attempts for the same photographer and date. */
export async function lockPhotographerDate(client: DatabaseClient, photographerId: string, date: string) {
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`booking:${photographerId}:${date}`]);
}

export async function resolveActivePhotographer(client: DatabaseClient, photographerOrProfileId: string) {
  const result = await client.query<{ user_id: string }>(
    `SELECT pp.user_id
     FROM photographer_profiles pp
     INNER JOIN users u ON u.id = pp.user_id
     WHERE (pp.id = $1 OR pp.user_id = $1)
       AND pp.user_id IS NOT NULL
       AND pp.is_available = TRUE
       AND u.is_active = TRUE
       AND u.deleted_at IS NULL
       AND u.email_verified_at IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM user_roles ur
         INNER JOIN roles r ON r.id = ur.role_id
         WHERE ur.user_id = pp.user_id AND r.name = 'PHOTOGRAPHER'
       )
     ORDER BY CASE WHEN pp.user_id = $1 THEN 0 ELSE 1 END
     LIMIT 1`,
    [photographerOrProfileId],
  );
  return result.rows[0]?.user_id ?? null;
}

export async function hasActiveClientRole(client: DatabaseClient, userId: string) {
  const result = await client.query<{ allowed: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM users u
       INNER JOIN user_roles ur ON ur.user_id = u.id
       INNER JOIN roles r ON r.id = ur.role_id
       WHERE u.id = $1 AND u.is_active = TRUE AND u.deleted_at IS NULL
         AND r.name = 'CLIENT'
     ) AS allowed`,
    [userId],
  );
  return result.rows[0]?.allowed ?? false;
}

export async function lockAvailableSlot(client: DatabaseClient, input: {
  photographerId: string;
  date: string;
  startTime: string;
  endTime: string;
}) {
  const result = await client.query<{ id: string }>(
    `SELECT id
     FROM photographer_availability
     WHERE photographer_id = $1 AND available_date = $2 AND is_available = TRUE
       AND start_time <= $3 AND end_time >= $4
     ORDER BY start_time
     LIMIT 1
     FOR UPDATE`,
    [input.photographerId, input.date, input.startTime, input.endTime],
  );
  return result.rows[0] ?? null;
}

export async function hasOverlappingActiveBooking(client: DatabaseClient, input: {
  photographerId: string;
  date: string;
  startTime: string;
  endTime: string;
}) {
  const result = await client.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM bookings
       WHERE photographer_id = $1 AND booking_date = $2
         AND status IN ('PENDING', 'ACCEPTED', 'CONFIRMED')
         AND start_time < $4 AND end_time > $3
     ) AS exists`,
    [input.photographerId, input.date, input.startTime, input.endTime],
  );
  return result.rows[0]?.exists ?? false;
}

export async function createBookingInTransaction(
  client: DatabaseClient,
  input: Pick<Booking, "booking_number" | "client_id" | "photographer_id" | "title" | "description" | "photography_type" | "location" | "booking_date" | "start_time" | "end_time" | "budget" | "status">,
) {
  const result = await client.query<Booking>(
    `INSERT INTO bookings
      (booking_number, client_id, photographer_id, title, description, photography_type,
       location, booking_date, start_time, end_time, budget, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [input.booking_number, input.client_id, input.photographer_id, input.title, input.description,
      input.photography_type, input.location, input.booking_date, input.start_time, input.end_time,
      input.budget, input.status],
  );
  const booking = result.rows[0];
  if (!booking) throw new Error("Booking insert returned no row.");
  return booking;
}

export async function getBookingForUpdate(client: DatabaseClient, bookingId: string) {
  const result = await client.query<Booking>("SELECT * FROM bookings WHERE id = $1 FOR UPDATE", [bookingId]);
  return result.rows[0] ?? null;
}

export async function updateBookingStatusInTransaction(client: DatabaseClient, bookingId: string, status: string) {
  const result = await client.query<Booking>(
    "UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *",
    [status, bookingId],
  );
  return result.rows[0] ?? null;
}
