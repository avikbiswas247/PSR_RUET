import { AdminService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { getPagination, handleApiError, jsonOk, readJson } from "@/lib/api/http";

type Body = { userId?: string; roleName?: string; action?: "ASSIGN" | "REVOKE"; isActive?: boolean };

export async function GET(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "ADMIN"); if (denied) return denied;
    const { limit, offset } = getPagination(new URL(request.url));
    const users = await AdminService.listAdminUsers(limit, offset);
    return jsonOk(users);
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "ADMIN"); if (denied) return denied;
    const body = await readJson<Body>(request);
    if (!body.userId || !body.roleName || !body.action) {
      return jsonOk({ message: "userId, roleName and action are required." }, 422);
    }
    if (!["ASSIGN", "REVOKE"].includes(body.action)) {
      return jsonOk({ message: "action must be ASSIGN or REVOKE." }, 422);
    }
    return jsonOk(await AdminService.updateUserRole({
      authenticatedAdminId: auth.id, userId: body.userId, roleName: body.roleName, action: body.action,
    }));
  } catch (error) { return handleApiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "ADMIN"); if (denied) return denied;
    const body = await readJson<Body>(request);
    if (!body.userId || body.isActive === undefined) {
      return jsonOk({ message: "userId and isActive are required." }, 422);
    }
    return jsonOk(await AdminService.deactivateUser({
      authenticatedAdminId: auth.id, userId: body.userId, isActive: body.isActive,
    }));
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "ADMIN"); if (denied) return denied;
    const body = await readJson<Body>(request);
    if (!body.userId) return jsonOk({ message: "userId is required." }, 422);
    return jsonOk(await AdminService.deleteUserAccount({
      authenticatedAdminId: auth.id,
      userId: body.userId,
    }));
  } catch (error) { return handleApiError(error); }
}
