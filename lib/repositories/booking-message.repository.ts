import { insertRow, many, run } from "./_shared";
export interface BookingMessage {
  id: string; booking_id: string; sender_user_id: string; sender_name?: string | null; message: string; created_at: string | Date;
}
export function listMessagesForBooking(bookingId: string, limit = 100, offset = 0) {
  return many<BookingMessage>(
    `SELECT bm.*, u.full_name AS sender_name
     FROM booking_messages bm
     LEFT JOIN users u ON u.id = bm.sender_user_id
     WHERE bm.booking_id = $1
     ORDER BY bm.created_at ASC LIMIT $2 OFFSET $3`,
    [bookingId, limit, offset],
  );
}
export function createBookingMessage(input: Pick<BookingMessage, "booking_id" | "sender_user_id" | "message">) {
  return insertRow<BookingMessage>("booking_messages", input, ["booking_id","sender_user_id","message"]);
}
export function deleteBookingMessage(id: string) { return run("DELETE FROM booking_messages WHERE id = $1", [id]); }
