import * as CommunityProfileRepo from "@/lib/repositories/community-profile.repository";
import type { CommunityProfileDetail } from "@/lib/types/public";

function validatePage(limit: number, offset: number) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("Limit must be an integer between 1 and 100.");
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw new Error("Offset must be a non-negative integer.");
  }
}

export async function listCommunityProfiles(limit = 50, offset = 0) {
  validatePage(limit, offset);
  return CommunityProfileRepo.listCommunityProfiles(limit, offset);
}

export async function getCommunityProfile(userId: string): Promise<CommunityProfileDetail | null> {
  if (!userId) throw new Error("Profile ID is required.");
  const profile = await CommunityProfileRepo.getCommunityProfileById(userId);
  if (!profile) return null;

  const photos = await CommunityProfileRepo.listCommunityProfilePhotos(userId, 100);
  return { ...profile, photos };
}
