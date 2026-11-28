import * as ClientProfileRepo from "@/lib/repositories/client-profile.repository";
import { PHOTOGRAPHY_SERVICES } from "@/lib/constants/booking";

const CONTACT_METHODS = new Set(["email", "phone", "either"]);

export function getClientProfile(userId: string) {
  return ClientProfileRepo.getClientProfileByUserId(userId);
}

export async function updateClientProfile(userId: string, patch: {
  organizationName?: string | null;
  billingAddress?: string | null;
  preferredServices?: string[];
  preferredContactMethod?: string | null;
  bookingNotes?: string | null;
}) {
  const current = await ClientProfileRepo.getClientProfileByUserId(userId);
  const textField = (value: string | null | undefined, currentValue: string | null, label: string, max: number) => {
    if (value === undefined) return currentValue;
    if (value === null) return null;
    if (typeof value !== "string") throw new Error(`${label} must be text.`);
    const normalized = value.trim();
    if (normalized.length > max) throw new Error(`${label} must be ${max} characters or fewer.`);
    return normalized || null;
  };

  const organizationName = textField(patch.organizationName, current?.organization_name ?? null, "Organization name", 160);
  const billingAddress = textField(patch.billingAddress, current?.billing_address ?? null, "Billing address", 500);
  const bookingNotes = textField(patch.bookingNotes, current?.booking_notes ?? null, "Booking notes", 2000);

  let preferredServices = current?.preferred_services ?? [];
  if (patch.preferredServices !== undefined) {
    if (!Array.isArray(patch.preferredServices) || patch.preferredServices.length > PHOTOGRAPHY_SERVICES.length) {
      throw new Error("Choose valid preferred photography services.");
    }
    const requested = [...new Set(patch.preferredServices)];
    if (requested.some((service) => !PHOTOGRAPHY_SERVICES.includes(service as (typeof PHOTOGRAPHY_SERVICES)[number]))) {
      throw new Error("Choose valid preferred photography services.");
    }
    preferredServices = requested;
  }

  let preferredContactMethod = current?.preferred_contact_method ?? null;
  if (patch.preferredContactMethod !== undefined) {
    const method = patch.preferredContactMethod?.trim().toLowerCase() || null;
    if (method !== null && !CONTACT_METHODS.has(method)) throw new Error("Choose email, phone, or either as your preferred contact method.");
    preferredContactMethod = method;
  }

  const saved = await ClientProfileRepo.saveClientProfileForUser(userId, {
    organization_name: organizationName,
    billing_address: billingAddress,
    preferred_services: preferredServices,
    preferred_contact_method: preferredContactMethod,
    booking_notes: bookingNotes,
  });
  if (!saved) throw new Error("Your client profile could not be saved. Please try again.");
  return saved;
}
