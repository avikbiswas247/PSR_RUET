import * as AvailabilityRepo from "@/lib/repositories/photographer-availability.repository";
export async function addAvailability(i:{authenticatedPhotographerId:string;date:string;startTime:string;endTime:string}) {
  const parsedDate = new Date(`${i.date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(i.date) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== i.date) {
    throw new Error("Choose a valid date for the availability slot.");
  }
  const validTime = (value: string) => {
    const match = /^(\d{2}):(\d{2})$/.exec(value);
    return !!match && Number(match[1]) < 24 && Number(match[2]) < 60;
  };
  if (!validTime(i.startTime) || !validTime(i.endTime) || i.endTime <= i.startTime) {
    throw new Error("Choose a valid start and end time. The end time must be later.");
  }
  const slot = await AvailabilityRepo.createAvailability({photographer_id:i.authenticatedPhotographerId,available_date:i.date,start_time:i.startTime,end_time:i.endTime,is_available:true});
  if (!slot) throw new Error("The availability slot could not be saved. Please try again.");
  return slot;
}
export const listAvailability=(photographerId:string,from:string,to:string)=>{if(to<from) throw new Error("Invalid date range."); return AvailabilityRepo.listPhotographerAvailability(photographerId,from,to);};
export async function setSlotAvailability(id: string, photographerId: string, available: boolean) {
  const slot = await AvailabilityRepo.setAvailability(id, photographerId, available);
  if (!slot) throw new Error("Availability slot not found.");
  return slot;
}
