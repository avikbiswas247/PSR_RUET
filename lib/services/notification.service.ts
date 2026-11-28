import * as NotificationRepo from "@/lib/repositories/notification.repository";
export const getMyNotifications=(userId:string,limit=30,offset=0)=>{if(limit<1||limit>100||offset<0) throw new Error("Invalid pagination."); return NotificationRepo.listNotificationsForUser(userId,limit,offset);};
export const getMyUnreadNotifications=(userId:string,limit=30)=>NotificationRepo.listUnreadNotifications(userId,Math.min(Math.max(limit,1),100));
export const getMyUnreadCount=(userId:string)=>NotificationRepo.countUnreadNotifications(userId);
export async function markMyNotificationRead(id:string,authenticatedUserId:string) { const n=await NotificationRepo.getNotificationById(id); if(!n) throw new Error("Notification not found."); if(n.user_id!==authenticatedUserId) throw new Error("Forbidden."); return NotificationRepo.markNotificationRead(id); }
export const markAllMyNotificationsRead=(authenticatedUserId:string)=>NotificationRepo.markAllNotificationsRead(authenticatedUserId);
export function createNotification(i:{userId:string;title:string;message:string;type:string;linkUrl?:string|null}) { if(!i.title.trim()||!i.message.trim()) throw new Error("Title and message are required."); return NotificationRepo.createNotification({user_id:i.userId,title:i.title.trim(),message:i.message.trim(),notification_type:i.type,is_read:false,read_at:null,link_url: safeInternalLink(i.linkUrl)}); }

function safeInternalLink(value?: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
}
