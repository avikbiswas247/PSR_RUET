import * as ExhibitionRepo from "@/lib/repositories/exhibition.repository";
import * as ItemRepo from "@/lib/repositories/exhibition-item.repository";
import { isCloudinaryImageUrl } from "@/lib/services/media.service";
export async function createExhibition(i:{authenticatedCreatorId:string;title:string;slug:string;description?:string|null;coverImageUrl?:string|null;venue?:string|null;startDate?:string|null;endDate?:string|null}) { if(!i.title.trim()||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(i.slug)) throw new Error("A title and URL-safe slug are required."); if(i.startDate&&i.endDate&&i.endDate<i.startDate) throw new Error("End date cannot be before start date."); if(i.coverImageUrl && !isCloudinaryImageUrl(i.coverImageUrl)) throw new Error("Exhibition cover must be uploaded as an image."); return ExhibitionRepo.createExhibition({created_by:i.authenticatedCreatorId,title:i.title.trim(),slug:i.slug,description:i.description??null,cover_image_url:i.coverImageUrl??null,venue:i.venue??null,start_date:i.startDate??null,end_date:i.endDate??null,status:"DRAFT"}); }
export async function listPublicExhibitions(limit = 50, offset = 0) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
    throw new Error("Invalid pagination.");
  }
  const exhibitions = await ExhibitionRepo.listExhibitions(limit, offset);
  return exhibitions.filter((e) => e.status === "PUBLISHED");
}
export async function getPublicExhibition(id: string) {
  const e = await ExhibitionRepo.getExhibitionById(id);
  if (!e || e.status !== "PUBLISHED") return null;
  return e;
}
export async function addExhibitionPhoto(i:{exhibitionId:string;photoId:string;displayOrder?:number;curatorNote?:string|null}) { const e=await ExhibitionRepo.getExhibitionById(i.exhibitionId); if(!e) throw new Error("Exhibition not found."); return ItemRepo.addExhibitionItem({exhibition_id:i.exhibitionId,photo_id:i.photoId,display_order:i.displayOrder??0,curator_note:i.curatorNote??null}); }
export const listExhibitionPhotos=(id:string)=>ItemRepo.listExhibitionItems(id);
export const removeExhibitionPhoto=(exhibitionId:string,photoId:string)=>ItemRepo.removeExhibitionItem(exhibitionId,photoId);
