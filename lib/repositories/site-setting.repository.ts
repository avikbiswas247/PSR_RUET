import { byId, deleteById, insertRow, many, one, updateRow } from "./_shared";

export interface SiteSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  updated_at: string | Date;
}

const TABLE = "site_settings";
const CREATE_COLUMNS = ["key", "value", "description"] as const;
const UPDATE_COLUMNS = ["value", "description"] as const;

export function getSiteSettingById(id: string) {
  return byId<SiteSetting>(TABLE, id);
}

export function getSiteSettingByKey(key: string) {
  return one<SiteSetting>(`SELECT * FROM ${TABLE} WHERE "key" = $1 ORDER BY created_at ASC LIMIT 1`, [key]);
}

export function listSiteSettings(limit = 50, offset = 0) {
  return many<SiteSetting>(`SELECT * FROM ${TABLE} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
}

export function createSiteSetting(input: Pick<SiteSetting, "key" | "value" | "description">) {
  return insertRow<SiteSetting>(TABLE, input as Record<string, unknown>, CREATE_COLUMNS);
}

export function updateSiteSetting(id: string, patch: Partial<Pick<SiteSetting, "value" | "description">>) {
  return updateRow<SiteSetting>(TABLE, id, patch as Record<string, unknown>, UPDATE_COLUMNS);
}

export function deleteSiteSetting(id: string) {
  return deleteById(TABLE, id);
}
