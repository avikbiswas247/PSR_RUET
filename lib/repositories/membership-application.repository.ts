import { byId, deleteById, insertRow, many, updateRow } from "./_shared";

export interface MembershipApplication {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  department: string | null;
  academic_year: string | null;
  motivation: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | Date | null;
  created_at: string | Date;
}

const TABLE = "membership_applications";
const CREATE_COLUMNS = ["user_id", "full_name", "email", "phone", "department", "academic_year", "motivation", "status"] as const;
const UPDATE_COLUMNS = ["user_id", "full_name", "email", "phone", "department", "academic_year", "motivation", "status", "reviewed_by", "reviewed_at"] as const;

export function getMembershipApplicationById(id: string) {
  return byId<MembershipApplication>(TABLE, id);
}

export function listMembershipApplications(limit = 50, offset = 0) {
  return many<MembershipApplication>(`SELECT * FROM ${TABLE} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
}

export function createMembershipApplication(input: Pick<MembershipApplication, "user_id" | "full_name" | "email" | "phone" | "department" | "academic_year" | "motivation" | "status">) {
  return insertRow<MembershipApplication>(TABLE, input as Record<string, unknown>, CREATE_COLUMNS);
}

export function updateMembershipApplication(id: string, patch: Partial<Pick<MembershipApplication, "user_id" | "full_name" | "email" | "phone" | "department" | "academic_year" | "motivation" | "status" | "reviewed_by" | "reviewed_at">>) {
  return updateRow<MembershipApplication>(TABLE, id, patch as Record<string, unknown>, UPDATE_COLUMNS);
}

export function deleteMembershipApplication(id: string) {
  return deleteById(TABLE, id);
}


/** Record an admin decision. Authorization must be checked by the service. */
export function reviewMembershipApplication(
  id: string,
  reviewedBy: string,
  status: "APPROVED" | "REJECTED",
) {
  return updateRow<MembershipApplication>(
    TABLE,
    id,
    { status, reviewed_by: reviewedBy, reviewed_at: new Date() },
    UPDATE_COLUMNS,
  );
}
