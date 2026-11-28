import { UserService } from "@/lib/services";
import { ClientProfileService } from "@/lib/services";
import { requireUser, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonError, jsonOk, readJson } from "@/lib/api/http";


type PatchBody = {
  fullName?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  organizationName?: string | null;
  billingAddress?: string | null;
  preferredServices?: string[];
  preferredContactMethod?: string | null;
  bookingNotes?: string | null;
};

const CLIENT_PROFILE_FIELDS = ["organizationName", "billingAddress", "preferredServices", "preferredContactMethod", "bookingNotes"] as const;

export async function GET() {
  try {
    const auth = await requireUser();
    if (isResponse(auth)) return auth;
    const user = await UserService.getPublicUser(auth.id);
    if (!user) return jsonOk({ message: "User not found." }, 404);
    const clientProfile = auth.roles.includes("CLIENT") ? await ClientProfileService.getClientProfile(auth.id) : null;
    return jsonOk({ ...user, client_profile: clientProfile });
  } catch (error) { return handleApiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireUser();
    if (isResponse(auth)) return auth;
    const body = await readJson<PatchBody>(request);
    const hasClientProfileFields = CLIENT_PROFILE_FIELDS.some((field) => body[field] !== undefined);
    if (hasClientProfileFields && !auth.roles.includes("CLIENT")) {
      return jsonError("Only client accounts can update client booking preferences.", 403, "FORBIDDEN");
    }
    const userPatch = {
      ...(body.fullName !== undefined ? { fullName: body.fullName } : {}),
      ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
    };
    const user = Object.keys(userPatch).length > 0
      ? await UserService.updateOwnProfile(auth.id, userPatch)
      : await UserService.getPublicUser(auth.id);
    const client_profile = hasClientProfileFields
      ? await ClientProfileService.updateClientProfile(auth.id, body)
      : null;
    return jsonOk({ ...user, ...(hasClientProfileFields ? { client_profile } : {}) });
  } catch (error) { return handleApiError(error); }
}
