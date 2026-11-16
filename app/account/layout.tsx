import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getRoleHomePath } from "@/lib/auth/role-home";
import AccountLayoutClient from "./layout.client";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (user) {
    const home = getRoleHomePath(user.roles);
    if (home !== "/account") redirect(home);
  }
  return <AccountLayoutClient>{children}</AccountLayoutClient>;
}
