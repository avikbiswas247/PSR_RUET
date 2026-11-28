import { byId, deleteById, insertRow, many, one, updateRow } from "./_shared";

export interface ClientProfile {
  id: string;
  user_id: string | null;
  organization_name: string | null;
  billing_address: string | null;
  preferred_services: string[];
  preferred_contact_method: string | null;
  booking_notes: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

const TABLE = "client_profiles";
const CREATE_COLUMNS = ["user_id", "organization_name", "billing_address", "preferred_services", "preferred_contact_method", "booking_notes"] as const;
const UPDATE_COLUMNS = ["organization_name", "billing_address", "preferred_services", "preferred_contact_method", "booking_notes"] as const;

export function getClientProfileById(id: string) {
  return byId<ClientProfile>(TABLE, id);
}

export function getClientProfileByUserId(userId: string) {
  return one<ClientProfile>(`SELECT * FROM ${TABLE} WHERE user_id = $1 LIMIT 1`, [userId]);
}

export function listClientProfiles(limit = 50, offset = 0) {
  return many<ClientProfile>(`SELECT * FROM ${TABLE} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
}

export function createClientProfile(input: Pick<ClientProfile, "user_id" | "organization_name" | "billing_address">) {
  return insertRow<ClientProfile>(TABLE, input as Record<string, unknown>, CREATE_COLUMNS);
}

export function updateClientProfile(id: string, patch: Partial<Pick<ClientProfile, "organization_name" | "billing_address">>) {
  return updateRow<ClientProfile>(TABLE, id, patch as Record<string, unknown>, UPDATE_COLUMNS);
}

export function saveClientProfileForUser(userId: string, input: Pick<ClientProfile, "organization_name" | "billing_address" | "preferred_services" | "preferred_contact_method" | "booking_notes">) {
  return one<ClientProfile>(
    `INSERT INTO ${TABLE} (user_id, organization_name, billing_address, preferred_services, preferred_contact_method, booking_notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id) DO UPDATE SET
       organization_name = EXCLUDED.organization_name,
       billing_address = EXCLUDED.billing_address,
       preferred_services = EXCLUDED.preferred_services,
       preferred_contact_method = EXCLUDED.preferred_contact_method,
       booking_notes = EXCLUDED.booking_notes,
       updated_at = NOW()
     RETURNING *`,
    [userId, input.organization_name, input.billing_address, input.preferred_services, input.preferred_contact_method, input.booking_notes],
  );
}

export function deleteClientProfile(id: string) {
  return deleteById(TABLE, id);
}
