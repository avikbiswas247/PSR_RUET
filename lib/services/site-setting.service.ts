import * as SettingRepo from "@/lib/repositories/site-setting.repository";
export const getSettings=()=>SettingRepo.listSiteSettings(100,0);
export async function createSetting(i:{key:string;value:Record<string,unknown>;description?:string|null}) { if(!/^[a-z][a-z0-9_.-]{1,149}$/.test(i.key)) throw new Error("Invalid setting key."); return SettingRepo.createSiteSetting({key:i.key,value:i.value,description:i.description??null}); }
export async function updateSetting(i:{id:string;value:Record<string,unknown>;description?:string|null}) { const row=await SettingRepo.updateSiteSetting(i.id,{value:i.value,description:i.description}); if(!row) throw new Error("Setting not found."); return row; }
export const getSettingByKey = (key: string) => SettingRepo.getSiteSettingByKey(key);
export async function saveSettingByKey(i:{key:string;value:Record<string,unknown>;description?:string|null}) {
  if(!/^[a-z][a-z0-9_.-]{1,149}$/.test(i.key)) throw new Error("Invalid setting key.");
  const existing = await SettingRepo.getSiteSettingByKey(i.key);
  if (existing) {
    const updated = await SettingRepo.updateSiteSetting(existing.id, { value: i.value, description: i.description });
    if (!updated) throw new Error("Setting not found.");
    return updated;
  }
  return SettingRepo.createSiteSetting({ key: i.key, value: i.value, description: i.description ?? null });
}
