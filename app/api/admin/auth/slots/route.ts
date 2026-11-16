import { AdminAuthService } from "@/lib/services";
import { handleApiError, jsonOk } from "@/lib/api/http";

export async function GET() {
  try {
    const result = await AdminAuthService.getAdminSlots();
    return jsonOk(result, 200);
  } catch (error) { return handleApiError(error); }
}
