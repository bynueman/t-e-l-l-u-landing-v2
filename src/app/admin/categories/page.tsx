import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { requireAdminPageSession } from "@/lib/cms/admin-page-guard";
import { listCategories } from "@/lib/cms/categories";
import { getDb } from "@/lib/cms/db";
import { canManageCategories } from "@/lib/cms/rbac";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kategori — TELLU Admin",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  const user = await requireAdminPageSession();
  const allowed = canManageCategories(user.role);
  const categories = allowed ? listCategories(getDb()) : [];

  return (
    <AdminShell
      user={user}
      title="Kategori Artikel"
      breadcrumb={[
        { label: "Dashboard", href: "/admin" },
        { label: "Kategori" },
      ]}
    >
      {allowed ? (
        <CategoriesManager initialCategories={categories} />
      ) : (
        <div className="rounded-2xl border border-line bg-white p-8 text-center space-y-3">
          <h2 className="text-lg font-bold text-foreground">Akses Terbatas</h2>
          <p className="text-sm text-muted">
            Pengelolaan kategori hanya tersedia untuk peran Owner dan Editor.
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
