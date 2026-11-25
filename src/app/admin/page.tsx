import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Icon } from "@/components/ui/icon";
import { getDb } from "@/lib/cms/db";
import { requireAdminPageSession } from "@/lib/cms/admin-page-guard";
import { getAdminDashboardStats, listAdminPosts } from "@/lib/cms/posts";
import { canViewActivity } from "@/lib/cms/rbac";
import { formatJakartaDateTime } from "@/lib/cms/time";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-[#f4f3ee] text-[#55584f] border-[#e6e4dc]" },
  in_review: { label: "Siap Ditinjau", cls: "bg-amber-50 text-amber-900 border-amber-200" },
  published: { label: "Terbit", cls: "bg-emerald-50 text-emerald-900 border-emerald-200" },
  scheduled: { label: "Terjadwal", cls: "bg-sky-50 text-sky-900 border-sky-200" },
  archived: { label: "Arsip", cls: "bg-zinc-100 text-zinc-700 border-zinc-200" },
};

export default async function AdminDashboardPage() {
  const user = await requireAdminPageSession();
  const db = getDb();
  const stats = getAdminDashboardStats(db, user);
  const recentPosts = listAdminPosts(db, user, { page: 1, pageSize: 5 }).items;

  const recentActivity = canViewActivity(user.role)
    ? (db
        .prepare(
          `SELECT a.id, a.action, a.entity_type, a.created_at, u.name as actor_name
           FROM activity_logs a
           LEFT JOIN users u ON u.id = a.actor_id
           ORDER BY a.created_at DESC
           LIMIT 6`
        )
        .all() as {
        id: string;
        action: string;
        entity_type: string;
        created_at: string;
        actor_name: string | null;
      }[])
    : [];

  return (
    <AdminShell
      user={user}
      title="Dashboard"
      actions={
        <Link
          href="/admin/posts/new"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#20211f] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#353733]"
        >
          <Icon name="plus" size={14} />
          <span>Buat Artikel Baru</span>
        </Link>
      }
    >
      {/* Real SQLite Statistics */}
      <section aria-label="Ringkasan Artikel" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-[#e6e4dc] bg-white p-5">
          <span className="text-xs font-medium text-[#666961]">Total Artikel</span>
          <p className="mt-2 text-3xl font-bold tabular-nums text-[#20211f]">{stats.totalArticles}</p>
        </div>
        <div className="rounded-xl border border-[#e6e4dc] bg-white p-5">
          <span className="text-xs font-medium text-[#666961]">Draft</span>
          <p className="mt-2 text-3xl font-bold tabular-nums text-[#20211f]">{stats.draftArticles}</p>
        </div>
        <div className="rounded-xl border border-[#e6e4dc] bg-white p-5">
          <span className="text-xs font-medium text-[#666961]">Terbit</span>
          <p className="mt-2 text-3xl font-bold tabular-nums text-[#b84300]">{stats.publishedArticles}</p>
        </div>
        <div className="rounded-xl border border-[#e6e4dc] bg-white p-5">
          <span className="text-xs font-medium text-[#666961]">Terjadwal</span>
          <p className="mt-2 text-3xl font-bold tabular-nums text-[#20211f]">{stats.scheduledArticles}</p>
        </div>
      </section>

      <div className={`grid gap-6 ${canViewActivity(user.role) ? "lg:grid-cols-12" : ""}`}>
        {/* Recent Articles */}
        <section
          aria-labelledby="recent-posts-heading"
          className={`${canViewActivity(user.role) ? "lg:col-span-7" : ""} rounded-xl border border-[#e6e4dc] bg-white`}
        >
          <div className="flex items-center justify-between border-b border-[#e6e4dc] px-5 py-4">
            <h2 id="recent-posts-heading" className="text-sm font-bold text-[#20211f]">
              Artikel Terbaru
            </h2>
            <Link href="/admin/posts" className="text-xs font-semibold text-[#b84300] hover:underline">
              Kelola Semua
            </Link>
          </div>

          {recentPosts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-[#20211f]">Belum ada artikel.</p>
              <p className="mt-1 text-xs text-[#666961]">
                Gunakan tombol Buat Artikel Baru untuk mulai menulis.
              </p>
              <Link
                href="/admin/posts/new"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#e6e4dc] bg-[#f9f7f3] px-3.5 py-2 text-xs font-semibold text-[#20211f] hover:bg-[#efede4]"
              >
                <Icon name="plus" size={14} />
                <span>Tulis Artikel</span>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[#e6e4dc]">
              {recentPosts.map((post) => {
                const badge = STATUS_BADGE[post.status] ?? STATUS_BADGE.draft;
                return (
                  <li key={post.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="block truncate text-sm font-semibold text-[#20211f] hover:text-[#b84300]"
                      >
                        {post.title}
                      </Link>
                      <span className="block text-xs text-[#666961] mt-0.5">
                        {post.categories.map((c) => c.name).join(", ") || "Tanpa kategori"} · Diperbarui{" "}
                        {formatJakartaDateTime(post.updatedAt)}
                      </span>
                    </div>
                    <span className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Recent Activity */}
        {canViewActivity(user.role) && (
          <section
            aria-labelledby="recent-activity-heading"
            className="lg:col-span-5 rounded-xl border border-[#e6e4dc] bg-white"
          >
            <div className="flex items-center justify-between border-b border-[#e6e4dc] px-5 py-4">
              <h2 id="recent-activity-heading" className="text-sm font-bold text-[#20211f]">
                Aktivitas Terbaru
              </h2>
              <Link href="/admin/activity" className="text-xs font-semibold text-[#b84300] hover:underline">
                Lihat Semua
              </Link>
            </div>

            {recentActivity.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#666961]">
                Belum ada catatan aktivitas administratif.
              </div>
            ) : (
              <ul className="divide-y divide-[#e6e4dc]">
                {recentActivity.map((act) => (
                  <li key={act.id} className="px-5 py-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#20211f]">{act.action}</span>
                      <span className="text-[#666961]">{formatJakartaDateTime(act.created_at)}</span>
                    </div>
                    <span className="text-[#666961] block mt-0.5">
                      Oleh {act.actor_name ?? "Sistem"} · {act.entity_type}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </AdminShell>
  );
}
