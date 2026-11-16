import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/admin-session";
import AdminPhotographersPage from "./page.client";

export default async function Page() {
  const admin = await requireAdminUser();
  if (!admin) {
    redirect("/admin/login");
  }
  return <AdminPhotographersPage />;
}
