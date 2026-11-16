import * as ApplicationRepo from "@/lib/repositories/membership-application.repository";
import * as MembershipRepo from "@/lib/repositories/membership.repository";
import { transaction } from "@/lib/db";
export class MembershipServiceError extends Error { constructor(message: string, public code: string) { super(message); this.name = "MembershipServiceError"; } }
export async function submitMembershipApplication(input: { authenticatedUserId?: string | null; fullName: string; email: string; phone?: string | null; department?: string | null; academicYear?: string | null; motivation?: string | null }) {
  const fullName = input.fullName.trim(), email = input.email.trim().toLowerCase();
  if (fullName.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) throw new MembershipServiceError("Valid name and email are required.", "INVALID_APPLICATION");
  return ApplicationRepo.createMembershipApplication({ user_id: input.authenticatedUserId ?? null, full_name: fullName, email, phone: input.phone ?? null, department: input.department ?? null, academic_year: input.academicYear ?? null, motivation: input.motivation ?? null, status: "PENDING" });
}
/** Route must verify ADMIN role and pass the authenticated admin ID. */
export async function approveApplication(input: { applicationId: string; authenticatedAdminId: string; memberCode: string }) {
  if (!input.memberCode.trim()) throw new MembershipServiceError("Member code is required.", "INVALID_MEMBER_CODE");
  return transaction(async (client) => {
    const appResult = await client.query("SELECT * FROM membership_applications WHERE id = $1 FOR UPDATE", [input.applicationId]);
    const app = appResult.rows[0];
    if (!app) throw new MembershipServiceError("Application not found.", "NOT_FOUND");
    if (app.status !== "PENDING") throw new MembershipServiceError("Only pending applications can be approved.", "INVALID_STATUS");
    const userResult = app.user_id
      ? await client.query("SELECT id, is_active FROM users WHERE id = $1", [app.user_id])
      : await client.query("SELECT id, is_active FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1", [app.email]);
    const applicant = userResult.rows[0];
    if (!applicant) throw new MembershipServiceError("No account matches this applicant. Ask them to create an account with this email, then review the application again.", "USER_NOT_LINKED");
    if (!applicant.is_active) throw new MembershipServiceError("The applicant account is inactive. Reactivate it before approving membership.", "USER_INACTIVE");
    const roleResult = await client.query("SELECT id FROM roles WHERE name = 'MEMBER' LIMIT 1");
    const memberRole = roleResult.rows[0];
    if (!memberRole) throw new MembershipServiceError("The MEMBER role is not configured.", "ROLE_NOT_CONFIGURED");
    const membershipResult = await client.query(
      `INSERT INTO memberships (user_id, member_code, department, academic_year, status, joined_at)
       VALUES ($1, $2, $3, $4, 'ACTIVE', CURRENT_DATE) RETURNING *`,
      [applicant.id, input.memberCode.trim(), app.department, app.academic_year],
    );
    await client.query("INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT (user_id, role_id) DO NOTHING", [applicant.id, memberRole.id]);
    await client.query("UPDATE membership_applications SET user_id = $2, status = 'APPROVED', reviewed_by = $3, reviewed_at = NOW() WHERE id = $1", [app.id, applicant.id, input.authenticatedAdminId]);
    return membershipResult.rows[0];
  });
}
export async function rejectApplication(input: { applicationId: string; authenticatedAdminId: string }) {
  const app = await ApplicationRepo.getMembershipApplicationById(input.applicationId); if (!app) throw new MembershipServiceError("Application not found.", "NOT_FOUND");
  if (app.status !== "PENDING") throw new MembershipServiceError("Only pending applications can be rejected.", "INVALID_STATUS");
  return ApplicationRepo.reviewMembershipApplication(app.id, input.authenticatedAdminId, "REJECTED");
}
export const getMembership = (id: string) => MembershipRepo.getMembershipById(id);
