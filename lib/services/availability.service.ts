import * as AvailabilityRepo from "@/lib/repositories/photographer-availability.repository";

export class AvailabilityServiceError extends Error {
  constructor(message: string, public code: "INVALID_DATE" | "INVALID_TIME" | "INVALID_RANGE" | "NOT_FOUND" | "SAVE_FAILED") {
    super(message);
    this.name = "AvailabilityServiceError";
  }
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export async function addAvailability(i:{authenticatedPhotographerId:string;date:string;startTime:string;endTime:string}) {
  if (!isValidIsoDate(i.date)) {
    throw new AvailabilityServiceError("Choose a valid date for the availability slot.", "INVALID_DATE");
  }
  const validTime = (value: string) => {
    const match = /^(\d{2}):(\d{2})$/.exec(value);
    return !!match && Number(match[1]) < 24 && Number(match[2]) < 60;
  };
  if (!validTime(i.startTime) || !validTime(i.endTime) || i.endTime <= i.startTime) {
    throw new AvailabilityServiceError("Choose a valid start and end time. The end time must be later.", "INVALID_TIME");
  }
  const slot = await AvailabilityRepo.createAvailability({photographer_id:i.authenticatedPhotographerId,available_date:i.date,start_time:i.startTime,end_time:i.endTime,is_available:true});
  if (!slot) throw new AvailabilityServiceError("The availability slot could not be saved. Please try again.", "SAVE_FAILED");
  return slot;
}
export const listAvailability=(photographerId:string,from:string,to:string)=>{
  if (!isValidIsoDate(from) || !isValidIsoDate(to)) throw new AvailabilityServiceError("Choose a valid availability date range.", "INVALID_DATE");
  if(to<from) throw new AvailabilityServiceError("The end date must be on or after the start date.", "INVALID_RANGE");
  return AvailabilityRepo.listPhotographerAvailability(photographerId,from,to);
};
export async function setSlotAvailability(id: string, photographerId: string, available: boolean) {
  const slot = await AvailabilityRepo.setAvailability(id, photographerId, available);
  if (!slot) throw new AvailabilityServiceError("Availability slot not found.", "NOT_FOUND");
  return slot;
}
