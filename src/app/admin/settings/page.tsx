import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { SettingsManager } from "@/components/admin/settings-manager";
import { requireAdminPageSession } from "@/lib/cms/admin-page-guard";
import { getDb } from "@/lib/cms/db";
import { canManageSettings } from "@/lib/cms/rbac";
import { getCmsSettings } from "@/lib/cms/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pengaturan CMS — TELLU Admin",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  const user = await requireAdminPageSession();
  const allowed = canManageSettings(user.role);
  const settings = allowed ? getCmsSettings(getDb()) : null;

  return (
    <AdminShell
      user={user}
      title="Pengaturan CMS"
      breadcrumb={[
        { label: "Dashboard", href: "/admin" },
        { label: "Pengaturan" },
      ]}
    >
      {allowed && settings ? (
        <SettingsManager initialSettings={settings} />
      ) : (
        <div className="rounded-2xl border border-line bg-white p-8 text-center space-y-3">
          <h2 className="text-lg font-bold text-foreground">Akses Terbatas</h2>
          <p className="text-sm text-muted">Pengaturan CMS hanya dapat diakses oleh Owner.</p>
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
