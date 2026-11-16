import { byId, deleteById, insertRow, many, updateRow } from "./_shared";

export interface Event {
  id: string;
  created_by: string;
  title: string | null;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  location: string | null;
  start_at: string | Date | null;
  end_at: string | Date | null;
  status: string;
  registration_enabled: boolean;
  published_at: string | Date;
  created_at: string | Date;
  updated_at: string | Date;
}

const TABLE = "events";
const CREATE_COLUMNS = ["created_by", "title", "slug", "description", "cover_image_url", "location", "start_at", "end_at", "status", "registration_enabled", "published_at"] as const;
const UPDATE_COLUMNS = ["title", "slug", "description", "cover_image_url", "location", "start_at", "end_at", "status", "registration_enabled", "published_at"] as const;

export function getEventById(id: string) {
  return byId<Event>(TABLE, id);
}

export function listEvents(limit = 50, offset = 0) {
  return many<Event>(`SELECT * FROM ${TABLE} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
}

export function createEvent(input: Pick<Event, "created_by" | "title" | "slug" | "description" | "cover_image_url" | "location" | "start_at" | "end_at" | "status" | "registration_enabled" | "published_at">) {
  return insertRow<Event>(TABLE, input as Record<string, unknown>, CREATE_COLUMNS);
}

export function updateEvent(id: string, patch: Partial<Pick<Event, "title" | "slug" | "description" | "cover_image_url" | "location" | "start_at" | "end_at" | "status" | "registration_enabled" | "published_at">>) {
  return updateRow<Event>(TABLE, id, patch as Record<string, unknown>, UPDATE_COLUMNS);
}

export function deleteEvent(id: string) {
  return deleteById(TABLE, id);
}
