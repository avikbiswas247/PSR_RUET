import * as AwardRepo from "@/lib/repositories/award.repository";
import * as CategoryRepo from "@/lib/repositories/photo-category.repository";
import * as ProfileRepo from "@/lib/repositories/photographer-profile.repository";
import * as ClientRepo from "@/lib/repositories/client-profile.repository";
import * as UserRepo from "@/lib/repositories/user.repository";
import * as RoleRepo from "@/lib/repositories/role.repository";
export const listAwards=(limit=50,offset=0)=>AwardRepo.listAwards(Math.min(Math.max(limit,1),100),Math.max(offset,0));
export function addAward(i:{photographerId:string;title:string;organization?:string|null;level?:string|null;awardedAt?:string|null;certificateUrl?:string|null;description?:string|null}) { if(!i.title.trim()) throw new Error("Award title is required."); if(i.certificateUrl&&!/^https:\/\//i.test(i.certificateUrl)) throw new Error("Certificate URL must use HTTPS."); return AwardRepo.createAward({photographer_id:i.photographerId,title:i.title.trim(),organization:i.organization??null,award_level:i.level??null,awarded_at:i.awardedAt??null,certificate_url:i.certificateUrl??null,description:i.description??null}); }
export function createPhotoCategory(i:{name:string;slug:string;description?:string|null}) { if(!i.name.trim()||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(i.slug)) throw new Error("Category name and valid slug are required."); return CategoryRepo.createPhotoCategory({name:i.name.trim(),slug:i.slug,description:i.description??null}); }
export async function createPhotographerProfile(i:{userId:string;title?:string|null;bio?:string|null;location?:string|null;instagramUrl?:string|null;websiteUrl?:string|null;device?:string|null;photographyGenre?:string|null;avatarUrl?:string|null}) { return ProfileRepo.createPhotographerProfile({user_id:i.userId,title:i.title??null,bio:i.bio??null,location:i.location??null,instagram_url:i.instagramUrl??null,website_url:i.websiteUrl??null,is_available:true,device:i.device??null,photography_genre:i.photographyGenre??null}); }
export async function updatePhotographerProfile(i:{profileId:string;patch:{title?:string|null;bio?:string|null;location?:string|null;instagramUrl?:string|null;websiteUrl?:string|null;isAvailable?:boolean;device?:string|null;photographyGenre?:string|null;avatarUrl?:string|null}}) { const p=i.patch; return ProfileRepo.updatePhotographerProfile(i.profileId,{title:p.title,bio:p.bio,location:p.location,instagram_url:p.instagramUrl,website_url:p.websiteUrl,is_available:p.isAvailable,device:p.device,photography_genre:p.photographyGenre}); }
export function createClientProfile(i:{userId:string;organizationName?:string|null;billingAddress?:string|null}) { return ClientRepo.createClientProfile({user_id:i.userId,organization_name:i.organizationName??null,billing_address:i.billingAddress??null}); }

export type PhotographerProfileMe = {
  id: string;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  title: string | null;
  bio: string | null;
  location: string | null;
  instagram_url: string | null;
  website_url: string | null;
  is_available: boolean;
  device: string | null;
  photography_genre: string | null;
  avatar_url: string | null;
  roles: string[];
  created_at: string | Date;
};

export async function getMyPhotographerProfile(userId: string): Promise<PhotographerProfileMe | null> {
  const profile = await ProfileRepo.getPhotographerProfileByUserId(userId);
  const u = await UserRepo.getUserById(userId);
  const user = u ? { full_name: u.full_name, email: u.email, avatar_url: u.avatar_url ?? null, created_at: u.created_at } : null;
  if (!profile && !user) return null;
  const roles = await RoleRepo.getUserRoles(userId);
  return {
    id: profile?.id ?? userId,
    user_id: profile?.user_id ?? userId,
    full_name: user?.full_name ?? null,
    email: null,
    title: profile?.title ?? null,
    bio: profile?.bio ?? null,
    location: profile?.location ?? null,
    instagram_url: profile?.instagram_url ?? null,
    website_url: profile?.website_url ?? null,
    is_available: profile?.is_available ?? false,
    device: profile?.device ?? null,
    photography_genre: profile?.photography_genre ?? null,
    avatar_url: user?.avatar_url ?? profile?.avatar_url ?? null,
    roles: roles.map((r) => r.name),
    created_at: profile?.created_at ?? user?.created_at ?? new Date().toISOString(),
  };
}
