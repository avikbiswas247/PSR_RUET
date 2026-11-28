import { ProfileService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonError, jsonOk, readJson } from "@/lib/api/http";

type Body = {
  title?: string | null;
  bio?: string | null;
  location?: string | null;
  instagramUrl?: string | null;
  websiteUrl?: string | null;
  device?: string | null;
  photographyGenre?: string | null;
  avatarUrl?: string | null;
  isAvailable?: boolean;
};

const URL_FIELD_NAMES = ["instagramUrl", "websiteUrl"] as const;

function validateBody(body: Body): Record<string, string> | null {
  const errors: Record<string, string> = {};
  for (const field of URL_FIELD_NAMES) {
    const value = body[field];
    if (value !== undefined && value !== null && value !== "") {
      try {
        new URL(value);
      } catch {
        errors[field] = `Invalid URL for ${field}.`;
      }
    }
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "PHOTOGRAPHER"); if (denied) return denied;
    const body = await readJson<Body>(request);
    // avatar_url is stored on the users table via /api/users/me, not on
    // photographer_profiles (no such DB column). Strip it here.
    const { avatarUrl: _unusedAvatarUrl, ...profileBody } = body;
    void _unusedAvatarUrl;
    const validationErrors = validateBody(profileBody as Body);
    if (validationErrors) {
      return jsonError("Validation failed.", 400, "VALIDATION_ERROR", validationErrors);
    }
    const existing = await ProfileService.findPhotographerProfileByUserId(auth.id);
    if (existing) {
      const updated = await ProfileService.updatePhotographerProfile({
        profileId: existing.id,
        patch: profileBody as {
          title?: string | null;
          bio?: string | null;
          location?: string | null;
          instagramUrl?: string | null;
          websiteUrl?: string | null;
          device?: string | null;
          photographyGenre?: string | null;
          isAvailable?: boolean;
        },
      });
      if (!updated) return jsonError("Photographer profile could not be updated.", 404, "PROFILE_NOT_FOUND");
      return jsonOk(updated);
    }
    return jsonOk(await ProfileService.createPhotographerProfile({
      userId: auth.id,
      ...(profileBody as {
        title?: string | null;
        bio?: string | null;
        location?: string | null;
        instagramUrl?: string | null;
        websiteUrl?: string | null;
        isAvailable?: boolean;
        device?: string | null;
        photographyGenre?: string | null;
      }),
    }), 201);
  } catch (error) { return handleApiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "PHOTOGRAPHER"); if (denied) return denied;
    const body = await readJson<Body>(request);
    const { avatarUrl: _unusedAvatarUrl, ...profileBody } = body;
    void _unusedAvatarUrl;
    const validationErrors = validateBody(profileBody as Body);
    if (validationErrors) {
      return jsonError("Validation failed.", 400, "VALIDATION_ERROR", validationErrors);
    }
    const existing = await ProfileService.findPhotographerProfileByUserId(auth.id);
    if (!existing) {
      return jsonError("Photographer profile not found. Create one first.", 404, "PROFILE_NOT_FOUND");
    }
    const updated = await ProfileService.updatePhotographerProfile({
      profileId: existing.id,
      patch: profileBody as {
        title?: string | null;
        bio?: string | null;
        location?: string | null;
        instagramUrl?: string | null;
        websiteUrl?: string | null;
        device?: string | null;
        photographyGenre?: string | null;
        isAvailable?: boolean;
      },
    });
    if (!updated) return jsonError("Photographer profile could not be updated.", 404, "PROFILE_NOT_FOUND");
    return jsonOk(updated);
  } catch (error) { return handleApiError(error); }
}
