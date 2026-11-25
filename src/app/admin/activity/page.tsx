import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPageSession } from "@/lib/cms/admin-page-guard";
import { getDb } from "@/lib/cms/db";
import { canViewActivity } from "@/lib/cms/rbac";
import { formatJakartaDateTime } from "@/lib/cms/time";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Activity Log — TELLU Admin",
  robots: { index: false, follow: false },
};

export default async function AdminActivityPage() {
  const user = await requireAdminPageSession();
  const allowed = canViewActivity(user.role);

  const items = allowed
    ? (getDb()
        .prepare(
          `SELECT a.id, u.name as actor_name, u.role as actor_role,
                  a.action, a.entity_type, a.entity_id, a.safe_metadata, a.created_at
           FROM activity_logs a
           LEFT JOIN users u ON u.id = a.actor_id
           ORDER BY a.created_at DESC
           LIMIT 80`
        )
        .all() as Record<string, unknown>[])
    : [];

  return (
    <AdminShell
      user={user}
      title="Activity Log"
      breadcrumb={[
        { label: "Dashboard", href: "/admin" },
        { label: "Activity Log" },
      ]}
    >
      {!allowed ? (
        <div className="rounded-2xl border border-line bg-white p-8 text-center space-y-3">
          <h2 className="text-lg font-bold text-foreground">Akses Terbatas</h2>
          <p className="text-sm text-muted">
            Log aktivitas hanya tersedia untuk peran Owner dan Editor.
          </p>
          <Link
            href="/admin"
            className="inline-flex rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-white"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-muted">
          Belum ada aktivitas yang tercatat.
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-white overflow-hidden">
          <div className="divide-y divide-line">
            {items.map((row) => {
              const metaRaw = String(row.safe_metadata ?? "{}");
              return (
                <div
                  key={String(row.id)}
                  className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">
                        {row.actor_name ? String(row.actor_name) : "Sistem"}
                      </span>{" "}
                      <span className="text-muted">melakukan</span>{" "}
                      <code className="rounded bg-[#f4f2eb] px-1.5 py-0.5 text-xs">
                        {String(row.action)}
                      </code>{" "}
                      <span className="text-xs text-muted">
                        ({String(row.entity_type)}
                        {row.entity_id ? ` • ${String(row.entity_id)}` : ""})
                      </span>
                    </p>
                    {metaRaw !== "{}" && (
                      <p className="text-xs font-mono text-muted truncate">{metaRaw}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted shrink-0">
                    {formatJakartaDateTime(String(row.created_at))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
