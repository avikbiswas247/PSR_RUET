import { byId, deleteById, insertRow, many, updateRow } from "./_shared";

export interface EventDesign {
  id: string;
  event_id: string;
  font_family: string | null;
  custom_font_url: string | null;
  background_color: string | null;
  accent_color: string | null;
  text_color: string | null;
  layout_template: string | null;
  custom_css: string | null;
  updated_at: string | Date;
}

const TABLE = "event_designs";
const CREATE_COLUMNS = ["event_id", "font_family", "custom_font_url", "background_color", "accent_color", "text_color", "layout_template", "custom_css"] as const;
const UPDATE_COLUMNS = ["font_family", "custom_font_url", "background_color", "accent_color", "text_color", "layout_template", "custom_css"] as const;

export function getEventDesignById(id: string) {
  return byId<EventDesign>(TABLE, id);
}

export function listEventDesigns(limit = 50, offset = 0) {
  return many<EventDesign>(`SELECT * FROM ${TABLE} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
}

export function createEventDesign(input: Pick<EventDesign, "event_id" | "font_family" | "custom_font_url" | "background_color" | "accent_color" | "text_color" | "layout_template" | "custom_css">) {
  return insertRow<EventDesign>(TABLE, input as Record<string, unknown>, CREATE_COLUMNS);
}

export function updateEventDesign(id: string, patch: Partial<Pick<EventDesign, "font_family" | "custom_font_url" | "background_color" | "accent_color" | "text_color" | "layout_template" | "custom_css">>) {
  return updateRow<EventDesign>(TABLE, id, patch as Record<string, unknown>, UPDATE_COLUMNS);
}

export function deleteEventDesign(id: string) {
  return deleteById(TABLE, id);
}
