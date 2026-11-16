import { MembershipService } from "@/lib/services";
import { requireUser, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";

type Body = { fullName?: string; email?: string; phone?: string | null; department?: string | null; academicYear?: string | null; motivation?: string | null };

export async function POST(request: Request) {
  try {
    // Applications may be public or authenticated; if a valid session exists,
    // link it. Never accept authenticatedUserId from the request body.
    const auth = await requireUser();
    const body = await readJson<Body>(request);
    if (!body.fullName || !body.email) return jsonOk({ message: "Full name and email are required." }, 422);
    const application = await MembershipService.submitMembershipApplication({
      authenticatedUserId: isResponse(auth) ? null : auth.id,
      fullName: body.fullName, email: body.email, phone: body.phone,
      department: body.department, academicYear: body.academicYear, motivation: body.motivation,
    });
    return jsonOk(application, 201);
  } catch (error) { return handleApiError(error); }
}
