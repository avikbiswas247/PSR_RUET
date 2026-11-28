import * as AvailabilityRepo from "@/lib/repositories/photographer-availability.repository";
export async function addAvailability(i:{authenticatedPhotographerId:string;date:string;startTime:string;endTime:string}) { if(i.endTime<=i.startTime) throw new Error("End time must be after start time."); return AvailabilityRepo.createAvailability({photographer_id:i.authenticatedPhotographerId,available_date:i.date,start_time:i.startTime,end_time:i.endTime,is_available:true}); }
export const listAvailability=(photographerId:string,from:string,to:string)=>{if(to<from) throw new Error("Invalid date range."); return AvailabilityRepo.listPhotographerAvailability(photographerId,from,to);};
export async function setSlotAvailability(id: string, photographerId: string, available: boolean) {
  const slot = await AvailabilityRepo.setAvailability(id, photographerId, available);
  if (!slot) throw new Error("Availability slot not found.");
  return slot;
}
