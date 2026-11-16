import { byId, deleteById, insertRow, many, updateRow } from "./_shared";

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
const CREATE_COLUMNS = ["booking_number", "client_id", "photographer_id", "title", "description", "photography_type", "location", "booking_date", "start_time", "end_time", "budget", "status"] as const;
const UPDATE_COLUMNS = ["title", "description", "photography_type", "location", "booking_date", "start_time", "end_time", "budget", "status"] as const;

export function getBookingById(id: string) {
  return byId<Booking>(TABLE, id);
}

export function listBookings(limit = 50, offset = 0) {
  return many<Booking>(`SELECT * FROM ${TABLE} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
}

export function listBookingsForClient(clientId: string, limit = 50, offset = 0) {
  return many<Booking>(`SELECT * FROM ${TABLE} WHERE client_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, [clientId, limit, offset]);
}

export function listBookingsForPhotographer(photographerId: string, limit = 50, offset = 0) {
  return many<Booking>(`SELECT * FROM ${TABLE} WHERE photographer_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, [photographerId, limit, offset]);
}

export function createBooking(input: Pick<Booking, "booking_number" | "client_id" | "photographer_id" | "title" | "description" | "photography_type" | "location" | "booking_date" | "start_time" | "end_time" | "budget" | "status">) {
  return insertRow<Booking>(TABLE, input as Record<string, unknown>, CREATE_COLUMNS);
}

export function updateBooking(id: string, patch: Partial<Pick<Booking, "title" | "description" | "photography_type" | "location" | "booking_date" | "start_time" | "end_time" | "budget" | "status">>) {
  return updateRow<Booking>(TABLE, id, patch as Record<string, unknown>, UPDATE_COLUMNS);
}

export function deleteBooking(id: string) {
  return deleteById(TABLE, id);
}
