import { AdminAuthService } from "@/lib/services";
import { handleApiError, jsonOk } from "@/lib/api/http";

export async function POST() {
  try {
    await AdminAuthService.adminLogout();
    return jsonOk({ message: "Logged out successfully." }, 200);
  } catch (error) { return handleApiError(error); }
}
