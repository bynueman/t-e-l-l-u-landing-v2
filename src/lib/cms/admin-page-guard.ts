import { redirect } from "next/navigation";
import { checkServerAdminNetworkAccess, getCurrentAdminSession } from "./next-server";
import type { AdminUser } from "./rbac";

export async function requireAdminPageSession(): Promise<AdminUser> {
  const net = await checkServerAdminNetworkAccess();
  if (!net.allowed) {
    redirect("/admin/login");
  }

  const user = await getCurrentAdminSession();
  if (!user) {
    redirect("/admin/login");
  }

  return user;
}
