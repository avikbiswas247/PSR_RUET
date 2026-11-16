import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/admin-session";
import AdminMediaPage from "./page.client";

export default async function Page() {
  const admin = await requireAdminUser();
  if (!admin) {
    redirect("/admin/login");
  }
  return <AdminMediaPage />;
}
