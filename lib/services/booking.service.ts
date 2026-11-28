import * as BookingRepo from "@/lib/repositories/booking.repository";
import * as AvailabilityRepo from "@/lib/repositories/photographer-availability.repository";
import * as MessageRepo from "@/lib/repositories/booking-message.repository";
import * as PaymentRepo from "@/lib/repositories/booking-payment.repository";
import * as NotificationRepo from "@/lib/repositories/notification.repository";
import * as UserRepo from "@/lib/repositories/user.repository";
import * as PhotographerProfileRepo from "@/lib/repositories/photographer-profile.repository";
export class BookingServiceError extends Error { constructor(message: string, public code: string) { super(message); this.name = "BookingServiceError"; } }
export async function requestBooking(i: { authenticatedClientId: string; photographerId: string; title: string; description?: string|null; photographyType?: string|null; location?: string|null; bookingDate: string; startTime: string; endTime: string; budget?: number|null; bookingNumber: string }) {
  if (!i.title.trim()) throw new BookingServiceError("Title is required.","INVALID_TITLE");
  if (i.endTime <= i.startTime) throw new BookingServiceError("End time must be later than start time.","INVALID_TIME");
  if (i.budget != null && (!Number.isFinite(i.budget)||i.budget<0)) throw new BookingServiceError("Budget cannot be negative.","INVALID_BUDGET");
  const profile = await PhotographerProfileRepo.getPhotographerProfileByUserId(i.photographerId);
  if (!profile || !profile.is_available) throw new BookingServiceError("Photographer is not accepting bookings.","PHOTOGRAPHER_UNAVAILABLE");
  const slot=await AvailabilityRepo.findAvailableSlot(i.photographerId,i.bookingDate,i.startTime,i.endTime);
  if(!slot) throw new BookingServiceError("Photographer has no matching available slot.","SLOT_UNAVAILABLE");
  const booking = await BookingRepo.createBooking({booking_number:i.bookingNumber,client_id:i.authenticatedClientId,photographer_id:i.photographerId,title:i.title.trim(),description:i.description??null,photography_type:i.photographyType??null,location:i.location??null,booking_date:i.bookingDate,start_time:i.startTime,end_time:i.endTime,budget:i.budget??null,status:"PENDING"});
  // Notify the photographer of the new booking request
  try {
    const client = await UserRepo.getUserById(i.authenticatedClientId);
    const clientName = client?.full_name ?? "A client";
    await NotificationRepo.createNotification({
      user_id: i.photographerId,
      title: "New Booking Request",
      message: `${clientName} has requested a photography session: "${i.title.trim()}" on ${i.bookingDate}.`,
      notification_type: "booking_request",
      is_read: false,
      read_at: null,
    });
  } catch {
    // Notification failure should not roll back the booking
  }
  return booking;
}
export async function setBookingStatus(i:{bookingId:string; actorUserId:string; actorRole:"CLIENT"|"PHOTOGRAPHER"|"ADMIN"; status:"ACCEPTED"|"CONFIRMED"|"REJECTED"|"CANCELLED"|"COMPLETED"}) {
 const b=await BookingRepo.getBookingById(i.bookingId); if(!b) throw new BookingServiceError("Booking not found.","NOT_FOUND");
 const client=b.client_id===i.actorUserId, photographer=b.photographer_id===i.actorUserId;
 if(i.actorRole!=="ADMIN"&&!client&&!photographer) throw new BookingServiceError("Forbidden.","FORBIDDEN");
 const transitions:Record<string,string[]>={PENDING:["ACCEPTED","REJECTED","CANCELLED"],ACCEPTED:["CONFIRMED","CANCELLED"],CONFIRMED:["COMPLETED","CANCELLED"]};
 if(!transitions[b.status]?.includes(i.status)) throw new BookingServiceError("Invalid booking status transition.","INVALID_TRANSITION");
 if(["ACCEPTED","REJECTED"].includes(i.status)&&!photographer&&i.actorRole!=="ADMIN") throw new BookingServiceError("Only the photographer can respond.","FORBIDDEN");
 if(i.status==="COMPLETED"&&!photographer&&i.actorRole!=="ADMIN") throw new BookingServiceError("Only photographer/admin can complete a booking.","FORBIDDEN");
 return BookingRepo.updateBooking(b.id,{status:i.status});
}
export async function sendBookingMessage(i:{bookingId:string; authenticatedUserId:string; message:string}) { const b=await BookingRepo.getBookingById(i.bookingId); if(!b) throw new BookingServiceError("Booking not found.","NOT_FOUND"); if(![b.client_id,b.photographer_id].includes(i.authenticatedUserId)) throw new BookingServiceError("Forbidden.","FORBIDDEN"); if(!i.message.trim()) throw new BookingServiceError("Message cannot be empty.","EMPTY_MESSAGE"); return MessageRepo.createBookingMessage({booking_id:b.id,sender_user_id:i.authenticatedUserId,message:i.message.trim()}); }
export const listMessages=(bookingId:string)=>MessageRepo.listMessagesForBooking(bookingId);
export const listPayments=(bookingId:string)=>PaymentRepo.listPaymentsForBooking(bookingId);

export async function listMyBookings(clientId: string, limit = 50, offset = 0) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
    throw new Error("Invalid pagination.");
  }
  return BookingRepo.listBookingsForClient(clientId, limit, offset);
}

export async function listPhotographerBookings(photographerId: string, limit = 50, offset = 0) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
    throw new Error("Invalid pagination.");
  }
  return BookingRepo.listBookingsForPhotographer(photographerId, limit, offset);
}

export async function getMyBooking(bookingId: string, clientId: string) {
  const b = await BookingRepo.getBookingById(bookingId);
  if (!b) return null;
  if (b.client_id !== clientId) return null;
  return b;
}
