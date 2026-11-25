import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { UsersManager } from "@/components/admin/users-manager";
import { requireAdminPageSession } from "@/lib/cms/admin-page-guard";
import { getDb } from "@/lib/cms/db";
import { canManageUsers } from "@/lib/cms/rbac";
import { listAdminUsers } from "@/lib/cms/users";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pengguna — TELLU Admin",
  robots: { index: false, follow: false },
};

export default async function AdminUsersPage() {
  const user = await requireAdminPageSession();
  const allowed = canManageUsers(user.role);
  const users = allowed ? listAdminUsers(getDb()) : [];

  return (
    <AdminShell
      user={user}
      title="Manajemen Pengguna"
      breadcrumb={[
        { label: "Dashboard", href: "/admin" },
        { label: "Pengguna" },
      ]}
    >
      {allowed ? (
        <UsersManager currentUserId={user.id} initialUsers={users} />
      ) : (
        <div className="rounded-2xl border border-line bg-white p-8 text-center space-y-3">
          <h2 className="text-lg font-bold text-foreground">Akses Terbatas</h2>
          <p className="text-sm text-muted">
            Manajemen pengguna internal hanya dapat diakses oleh Owner.
          </p>
          <Link
            href="/admin"
            className="inline-flex rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-white"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      )}
    </AdminShell>
  );
}
