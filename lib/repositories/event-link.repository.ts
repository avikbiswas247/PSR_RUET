import { byId, deleteById, insertRow, many, updateRow } from "./_shared";

export interface EventLink {
  id: string;
  event_id: string;
  link_type: string;
  url: string;
  label: string | null;
  created_at: string | Date;
}

const TABLE = "event_links";
const CREATE_COLUMNS = ["event_id", "link_type", "url", "label"] as const;
const UPDATE_COLUMNS = ["link_type", "url", "label"] as const;

export function getEventLinkById(id: string) {
  return byId<EventLink>(TABLE, id);
}

export function listEventLinks(limit = 50, offset = 0) {
  return many<EventLink>(`SELECT * FROM ${TABLE} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
}

export function createEventLink(input: Pick<EventLink, "event_id" | "link_type" | "url" | "label">) {
  return insertRow<EventLink>(TABLE, input as Record<string, unknown>, CREATE_COLUMNS);
}

export function updateEventLink(id: string, patch: Partial<Pick<EventLink, "link_type" | "url" | "label">>) {
  return updateRow<EventLink>(TABLE, id, patch as Record<string, unknown>, UPDATE_COLUMNS);
}

export function deleteEventLink(id: string) {
  return deleteById(TABLE, id);
}
