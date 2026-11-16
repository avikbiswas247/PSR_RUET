export type AccountRole = "ADMIN" | "PHOTOGRAPHER" | "MEMBER" | "CLIENT" | string;

export function getRoleHomePath(roles?: readonly AccountRole[] | null): string {
  if (roles?.includes("ADMIN")) return "/admin/dashboard";
  if (roles?.includes("PHOTOGRAPHER")) return "/photographer";
  return "/account";
}

export function getRoleHomeLabel(roles?: readonly AccountRole[] | null): string {
  if (roles?.includes("ADMIN")) return "Admin dashboard";
  if (roles?.includes("PHOTOGRAPHER")) return "Photographer workspace";
  return "My account";
}
