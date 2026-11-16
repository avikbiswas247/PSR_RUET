import * as EventRepo from "@/lib/repositories/event.repository";
import * as DesignRepo from "@/lib/repositories/event-design.repository";
import * as LinkRepo from "@/lib/repositories/event-link.repository";
import * as RegistrationRepo from "@/lib/repositories/event-registration.repository";
import { isCloudinaryImageUrl } from "@/lib/services/media.service";
export async function createEvent(i:{authenticatedCreatorId:string;title:string;slug:string;description?:string|null;coverImageUrl?:string|null;location?:string|null;startAt?:string|null;endAt?:string|null;registrationEnabled?:boolean}) { if(!i.title.trim()||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(i.slug)) throw new Error("A title and URL-safe slug are required."); if(i.startAt&&i.endAt&&new Date(i.endAt)<=new Date(i.startAt)) throw new Error("Event end must be after start."); if(i.coverImageUrl && !isCloudinaryImageUrl(i.coverImageUrl)) throw new Error("Event cover must be uploaded as an image."); return EventRepo.createEvent({created_by:i.authenticatedCreatorId,title:i.title.trim(),slug:i.slug,description:i.description??null,cover_image_url:i.coverImageUrl??null,location:i.location??null,start_at:i.startAt??null,end_at:i.endAt??null,status:"DRAFT",registration_enabled:i.registrationEnabled??false,published_at:null as unknown as string}); }
export async function listPublicEvents(limit = 50, offset = 0) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
    throw new Error("Invalid pagination.");
  }
  const events = await EventRepo.listEvents(limit, offset);
  return events.filter((e) => e.status === "PUBLISHED");
}
export async function getPublicEvent(eventId: string) {
  const e = await EventRepo.getEventById(eventId);
  if (!e || e.status !== "PUBLISHED") return null;
  return e;
}
export async function publishEvent(eventId:string) { const e=await EventRepo.getEventById(eventId); if(!e) throw new Error("Event not found."); return EventRepo.updateEvent(eventId,{status:"PUBLISHED",published_at:new Date()}); }
export async function registerForEvent(eventId:string,authenticatedUserId:string) { const e=await EventRepo.getEventById(eventId); if(!e||e.status!=="PUBLISHED") throw new Error("Event is not available."); if(!e.registration_enabled) throw new Error("Registration is disabled."); return RegistrationRepo.registerUserForEvent(eventId,authenticatedUserId); }
export const cancelRegistration=(eventId:string,userId:string)=>RegistrationRepo.cancelEventRegistration(eventId,userId);
export const addEventLink=(i:{eventId:string;type:string;url:string;label?:string|null})=>{if(!/^https:\/\//i.test(i.url)) throw new Error("Event link must use HTTPS."); return LinkRepo.createEventLink({event_id:i.eventId,link_type:i.type,url:i.url,label:i.label??null});};
export const saveEventDesign=(i:{eventId:string;fontFamily?:string|null;customFontUrl?:string|null;backgroundColor?:string|null;accentColor?:string|null;textColor?:string|null;layoutTemplate?:string|null;customCss?:string|null})=>DesignRepo.createEventDesign({event_id:i.eventId,font_family:i.fontFamily??null,custom_font_url:i.customFontUrl??null,background_color:i.backgroundColor??null,accent_color:i.accentColor??null,text_color:i.textColor??null,layout_template:i.layoutTemplate??null,custom_css:i.customCss??null});
