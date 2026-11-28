import { randomBytes } from "node:crypto";
import { transaction } from "@/lib/db";
import * as BookingRepo from "@/lib/repositories/booking.repository";
import * as MessageRepo from "@/lib/repositories/booking-message.repository";
import * as PaymentRepo from "@/lib/repositories/booking-payment.repository";
import * as NotificationRepo from "@/lib/repositories/notification.repository";
import * as UserRepo from "@/lib/repositories/user.repository";
import * as ClientProfileRepo from "@/lib/repositories/client-profile.repository";
import * as PhotographerProfileRepo from "@/lib/repositories/photographer-profile.repository";
import { sendBookingRequestEmail } from "@/lib/email/send-booking-request";

export class BookingServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "BookingServiceError";
  }
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["ACCEPTED", "REJECTED", "CANCELLED"],
  ACCEPTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
};

function dhakaDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function timeValue(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(value);
  if (!match) return null;
  return (Number(match[1]) * 60 + Number(match[2])) * 60 + Number(match[3] ?? 0);
}

function createBookingNumber() {
  return `PSR-${Date.now().toString(36).toUpperCase()}-${randomBytes(6).toString("hex").toUpperCase()}`;
}

export async function requestBooking(input: {
  authenticatedClientId: string;
  photographerId: string;
  title: string;
  description?: string | null;
  photographyType?: string | null;
  location?: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  budget?: number | null;
}) {
  const title = input.title.trim();
  const description = input.description?.trim() ?? "";
  const photographyType = input.photographyType?.trim() ?? "";
  const location = input.location?.trim() ?? "";
  if (!title || title.length > 120) throw new BookingServiceError("Enter a session title up to 120 characters.", "INVALID_TITLE");
  if (!description || description.length > 2000) throw new BookingServiceError("A booking message is required and must be 2,000 characters or less.", "INVALID_MESSAGE");
  if (photographyType.length > 80) throw new BookingServiceError("Choose a valid photography service.", "INVALID_SERVICE");
  if (location.length > 240) throw new BookingServiceError("Location must be 240 characters or less.", "INVALID_LOCATION");
  if (!isValidIsoDate(input.bookingDate)) throw new BookingServiceError("Choose a valid session date.", "INVALID_DATE");
  const firstBookableDate = dhakaDate();
  if (input.bookingDate < firstBookableDate) throw new BookingServiceError("The session date cannot be in the past.", "PAST_DATE");
  const startValue = timeValue(input.startTime);
  const endValue = timeValue(input.endTime);
  if (startValue === null || endValue === null || endValue <= startValue) {
    throw new BookingServiceError("Choose a valid time range. The end time must be later than the start time.", "INVALID_TIME");
  }
  if (input.budget != null && (!Number.isFinite(input.budget) || input.budget < 0 || input.budget > 1_000_000_000)) {
    throw new BookingServiceError("Enter a valid non-negative budget in BDT.", "INVALID_BUDGET");
  }

  const booking = await transaction(async (client) => {
    if (!await BookingRepo.hasActiveClientRole(client, input.authenticatedClientId)) {
      throw new BookingServiceError("A client account is required to request a booking.", "FORBIDDEN");
    }
    const photographerUserId = await BookingRepo.resolveActivePhotographer(client, input.photographerId);
    if (!photographerUserId) throw new BookingServiceError("This photographer is unavailable for booking.", "PHOTOGRAPHER_UNAVAILABLE");

    // The advisory lock serializes requests for this photographer/date. The row
    // lock protects the selected availability record while validation and insert run.
    await BookingRepo.lockPhotographerDate(client, photographerUserId, input.bookingDate);
    const slot = await BookingRepo.lockAvailableSlot(client, {
      photographerId: photographerUserId,
      date: input.bookingDate,
      startTime: input.startTime,
      endTime: input.endTime,
    });
    if (!slot) throw new BookingServiceError("That time is no longer available. Choose another slot.", "SLOT_UNAVAILABLE");

    const hasConflict = await BookingRepo.hasOverlappingActiveBooking(client, {
      photographerId: photographerUserId,
      date: input.bookingDate,
      startTime: input.startTime,
      endTime: input.endTime,
    });
    if (hasConflict) throw new BookingServiceError("That time was just booked. Choose another available slot.", "SLOT_CONFLICT");

    return BookingRepo.createBookingInTransaction(client, {
      booking_number: createBookingNumber(),
      client_id: input.authenticatedClientId,
      photographer_id: photographerUserId,
      title,
      description,
      photography_type: photographyType || null,
      location: location || null,
      booking_date: input.bookingDate,
      start_time: input.startTime,
      end_time: input.endTime,
      budget: input.budget ?? null,
      status: "PENDING",
    });
  });

  const clientUser = await UserRepo.getUserById(input.authenticatedClientId).catch(() => null);
  await notifyBookingParticipant(booking.photographer_id, {
    title: "New Booking Request",
    message: `${clientUser?.full_name ?? "A client"} requested ${title} for ${input.bookingDate}. Booking ${booking.booking_number}.`,
    type: "booking_request",
    linkUrl: `/photographer/bookings/${booking.id}`,
  }, booking.id);

  const [photographerUser, photographerProfile] = await Promise.all([
    UserRepo.getUserById(booking.photographer_id).catch(() => null),
    PhotographerProfileRepo.getPhotographerProfileByUserId(booking.photographer_id).catch(() => null),
  ]);
  if (photographerUser?.email) {
    try {
      await sendBookingRequestEmail({
        to: photographerUser.email,
        photographerName: photographerUser.full_name || "Photographer",
        clientName: clientUser?.full_name || "A client",
        clientEmail: clientUser?.email || null,
        bookingId: booking.id,
        bookingNumber: booking.booking_number,
        title: booking.title || title,
        message: booking.description || description,
        photographyType: booking.photography_type || photographyType || null,
        location: booking.location || location || null,
        date: input.bookingDate,
        startTime: String(booking.start_time).slice(0, 5),
        endTime: String(booking.end_time).slice(0, 5),
        budget: booking.budget == null ? null : Number(booking.budget),
        photographerTitle: photographerProfile?.title || null,
      });
    } catch (error) {
      console.error("[Booking] Email could not be sent for booking", booking.id, error instanceof Error ? error.message : "Unknown error");
    }
  } else {
    console.error("[Booking] Photographer email is missing for booking", booking.id);
  }
  return booking;
}

async function notifyBookingParticipant(userId: string, notification: { title: string; message: string; type?: string; linkUrl?: string }, bookingId: string) {
  try {
    await NotificationRepo.createNotification({
      user_id: userId,
      title: notification.title,
      message: notification.message.slice(0, 500),
      notification_type: notification.type ?? "booking_status",
      is_read: false,
      read_at: null,
      link_url: notification.linkUrl ?? null,
    });
  } catch (error) {
    console.error("[Booking] Notification could not be created for booking", bookingId, error instanceof Error ? error.message : "Unknown error");
  }
}

export async function setBookingStatus(input: {
  bookingId: string;
  actorUserId: string;
  actorRoles: readonly string[];
  status: "ACCEPTED" | "CONFIRMED" | "REJECTED" | "CANCELLED" | "COMPLETED";
}) {
  const result = await transaction(async (client) => {
    const booking = await BookingRepo.getBookingForUpdate(client, input.bookingId);
    if (!booking) throw new BookingServiceError("Booking not found.", "NOT_FOUND");

    const isAdmin = input.actorRoles.includes("ADMIN");
    const isClient = booking.client_id === input.actorUserId && input.actorRoles.includes("CLIENT");
    const isPhotographer = booking.photographer_id === input.actorUserId && input.actorRoles.includes("PHOTOGRAPHER");
    if (!isAdmin && !isClient && !isPhotographer) throw new BookingServiceError("You are not allowed to update this booking.", "FORBIDDEN");
    if (!VALID_TRANSITIONS[booking.status]?.includes(input.status)) {
      throw new BookingServiceError("This booking status cannot be changed to that value.", "INVALID_TRANSITION");
    }
    if (["ACCEPTED", "REJECTED"].includes(input.status) && !isAdmin && !isPhotographer) {
      throw new BookingServiceError("Only the photographer can accept or reject a request.", "FORBIDDEN");
    }
    if (input.status === "COMPLETED" && !isAdmin && !isPhotographer) {
      throw new BookingServiceError("Only the photographer can complete a booking.", "FORBIDDEN");
    }
    const updated = await BookingRepo.updateBookingStatusInTransaction(client, booking.id, input.status);
    if (!updated) throw new BookingServiceError("Booking could not be updated.", "UPDATE_FAILED");
    const recipientIds = input.status === "CANCELLED" || input.status === "CONFIRMED"
      ? isAdmin
        ? [booking.client_id, booking.photographer_id]
        : [booking.client_id === input.actorUserId ? booking.photographer_id : booking.client_id]
      : [booking.client_id];
    return { booking: updated, recipientIds };
  });

  const titleByStatus: Record<string, string> = {
    ACCEPTED: "Booking request accepted",
    REJECTED: "Booking request declined",
    CONFIRMED: "Booking confirmed",
    CANCELLED: "Booking cancelled",
    COMPLETED: "Session marked complete",
  };
  await Promise.all(result.recipientIds.map((recipientId) => notifyBookingParticipant(recipientId, {
    title: titleByStatus[input.status],
    message: `Booking ${result.booking.booking_number} for ${result.booking.title ?? "your session"} is now ${input.status.toLowerCase()}.`,
    linkUrl: `${recipientId === result.booking.photographer_id ? "/photographer" : "/account"}/bookings/${result.booking.id}`,
  }, result.booking.id)));
  return result.booking;
}

export async function sendBookingMessage(input: { bookingId: string; authenticatedUserId: string; message: string }) {
  const booking = await BookingRepo.getBookingById(input.bookingId);
  if (!booking) throw new BookingServiceError("Booking not found.", "NOT_FOUND");
  if (booking.client_id !== input.authenticatedUserId && booking.photographer_id !== input.authenticatedUserId) {
    throw new BookingServiceError("You are not allowed to access this conversation.", "FORBIDDEN");
  }
  const message = input.message.trim();
  if (!message) throw new BookingServiceError("Message cannot be empty.", "INVALID_MESSAGE");
  if (message.length > 2000) throw new BookingServiceError("Messages must be 2,000 characters or less.", "INVALID_MESSAGE");
  const savedMessage = await MessageRepo.createBookingMessage({ booking_id: booking.id, sender_user_id: input.authenticatedUserId, message });
  const recipientId = booking.client_id === input.authenticatedUserId ? booking.photographer_id : booking.client_id;
  const sender = await UserRepo.getUserById(input.authenticatedUserId).catch(() => null);
  const recipientIsPhotographer = recipientId === booking.photographer_id;
  await notifyBookingParticipant(recipientId, {
    title: "New booking message",
    message: `${sender?.full_name ?? "A participant"} sent a message about booking ${booking.booking_number}.`,
    type: "booking_message",
    linkUrl: `${recipientIsPhotographer ? "/photographer" : "/account"}/bookings/${booking.id}/messages`,
  }, booking.id);
  return savedMessage;
}

export async function listMessagesForParticipant(bookingId: string, userId: string) {
  const booking = await BookingRepo.getBookingById(bookingId);
  if (!booking) throw new BookingServiceError("Booking not found.", "NOT_FOUND");
  if (booking.client_id !== userId && booking.photographer_id !== userId) {
    throw new BookingServiceError("You are not allowed to access this conversation.", "FORBIDDEN");
  }
  return MessageRepo.listMessagesForBooking(bookingId);
}

export const listPayments = (bookingId: string) => PaymentRepo.listPaymentsForBooking(bookingId);

export async function listMyBookings(clientId: string, limit = 50, offset = 0) {
  validatePagination(limit, offset);
  return BookingRepo.listBookingsForClientWithPhotographer(clientId, limit, offset);
}

export async function getClientDashboardData(clientId: string) {
  const [summary, upcoming, recent] = await Promise.all([
    BookingRepo.getClientDashboardSummary(clientId),
    BookingRepo.listUpcomingBookingsForClient(clientId, 5),
    BookingRepo.listBookingsForClientWithPhotographer(clientId, 5, 0),
  ]);
  return { summary, upcoming, recent };
}

export async function listPhotographerBookings(photographerId: string, limit = 50, offset = 0) {
  validatePagination(limit, offset);
  return BookingRepo.listBookingsForPhotographerWithClient(photographerId, limit, offset);
}

export async function listAdminBookings(limit = 50, offset = 0) {
  validatePagination(limit, offset);
  return BookingRepo.listBookings(limit, offset);
}

function validatePagination(limit: number, offset: number) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
    throw new Error("Invalid pagination.");
  }
}

async function getClientProfileSummary(clientId: string) {
  const [user, clientProfile] = await Promise.all([
    UserRepo.getUserById(clientId),
    ClientProfileRepo.getClientProfileByUserId(clientId),
  ]);
  if (!user || !user.is_active || user.deleted_at) return null;
  return {
    id: user.id,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    email: user.email,
    phone: user.phone,
    organization_name: clientProfile?.organization_name ?? null,
    created_at: user.created_at,
  };
}

export async function getBookingForParticipant(bookingId: string, userId: string, isAdmin = false) {
  const booking = await BookingRepo.getBookingById(bookingId);
  if (!booking || (!isAdmin && booking.client_id !== userId && booking.photographer_id !== userId)) return null;
  if (booking.photographer_id === userId) {
    return { ...booking, client_profile: await getClientProfileSummary(booking.client_id) };
  }
  if (booking.client_id === userId) {
    return { ...booking, photographer_profile: await getPhotographerProfileSummary(booking.photographer_id) };
  }
  if (isAdmin) {
    const [client_profile, photographer_profile] = await Promise.all([
      getClientProfileSummary(booking.client_id),
      getPhotographerProfileSummary(booking.photographer_id),
    ]);
    return { ...booking, client_profile, photographer_profile };
  }
  return booking;
}

async function getPhotographerProfileSummary(userId: string) {
  const [profile, user] = await Promise.all([
    PhotographerProfileRepo.getPhotographerProfileByUserId(userId),
    UserRepo.getUserById(userId),
  ]);
  if (!profile || !user || !user.is_active || user.deleted_at) return null;
  return {
    id: profile.id,
    user_id: profile.user_id,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    title: profile.title,
    location: profile.location,
    photography_genre: profile.photography_genre,
  };
}
