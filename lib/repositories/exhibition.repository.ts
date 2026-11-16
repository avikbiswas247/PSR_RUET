import { byId, deleteById, insertRow, many, updateRow } from "./_shared";

export interface Exhibition {
  id: string;
  created_by: string;
  title: string | null;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  venue: string | null;
  start_date: string | Date | null;
  end_date: string | Date | null;
  status: string;
  created_at: string | Date;
}

const TABLE = "exhibitions";
const CREATE_COLUMNS = ["created_by", "title", "slug", "description", "cover_image_url", "venue", "start_date", "end_date", "status"] as const;
const UPDATE_COLUMNS = ["title", "slug", "description", "cover_image_url", "venue", "start_date", "end_date", "status"] as const;

export function getExhibitionById(id: string) {
  return byId<Exhibition>(TABLE, id);
}

export function listExhibitions(limit = 50, offset = 0) {
  return many<Exhibition>(`SELECT * FROM ${TABLE} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
}

export function createExhibition(input: Pick<Exhibition, "created_by" | "title" | "slug" | "description" | "cover_image_url" | "venue" | "start_date" | "end_date" | "status">) {
  return insertRow<Exhibition>(TABLE, input as Record<string, unknown>, CREATE_COLUMNS);
}

export function updateExhibition(id: string, patch: Partial<Pick<Exhibition, "title" | "slug" | "description" | "cover_image_url" | "venue" | "start_date" | "end_date" | "status">>) {
  return updateRow<Exhibition>(TABLE, id, patch as Record<string, unknown>, UPDATE_COLUMNS);
}

export function deleteExhibition(id: string) {
  return deleteById(TABLE, id);
}
