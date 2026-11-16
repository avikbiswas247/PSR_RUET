import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getRoleHomePath } from "@/lib/auth/role-home";
import PhotographerLayoutClient from "./layout.client";

export default async function PhotographerLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (user) {
    const home = getRoleHomePath(user.roles);
    if (home !== "/photographer") redirect(home);
  }
  return <PhotographerLayoutClient>{children}</PhotographerLayoutClient>;
}
