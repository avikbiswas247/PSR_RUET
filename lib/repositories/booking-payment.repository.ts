import { insertRow, many, one } from "./_shared";
export interface BookingPayment {
  id: string; booking_id: string; amount: string | number; payment_method: string | null;
  payment_status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  transaction_reference: string | null; paid_at: string | Date | null; created_at: string | Date;
}
export function listPaymentsForBooking(bookingId: string) {
  return many<BookingPayment>("SELECT * FROM booking_payments WHERE booking_id = $1 ORDER BY created_at DESC", [bookingId]);
}
export function createBookingPayment(input: Pick<BookingPayment, "booking_id" | "amount" | "payment_method" | "payment_status" | "transaction_reference" | "paid_at">) {
  return insertRow<BookingPayment>("booking_payments", input, ["booking_id","amount","payment_method","payment_status","transaction_reference","paid_at"]);
}
export function updatePaymentStatus(id: string, status: BookingPayment["payment_status"], transactionReference?: string) {
  return one<BookingPayment>(
    `UPDATE booking_payments
     SET payment_status = $1,
         transaction_reference = COALESCE($2, transaction_reference),
         paid_at = CASE WHEN $1 = 'PAID' THEN NOW() ELSE paid_at END
     WHERE id = $3 RETURNING *`,
    [status, transactionReference ?? null, id],
  );
}
