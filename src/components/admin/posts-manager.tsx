"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { CategoryRecord } from "@/lib/cms/categories";
import type { PostRecord, PostStatus } from "@/lib/cms/posts";
import { canDeletePost, canPublishPost, type AdminUser } from "@/lib/cms/rbac";
import { formatJakartaDateTime } from "@/lib/cms/time";

const STATUS_BADGE: Record<PostStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-[#f4f2eb] text-[#5c5f58] border-line" },
  in_review: { label: "Siap Ditinjau", className: "bg-amber-50 text-amber-800 border-amber-200" },
  published: { label: "Terbit", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  scheduled: { label: "Terjadwal", className: "bg-sky-50 text-sky-800 border-sky-200" },
  archived: { label: "Diarsipkan", className: "bg-stone-100 text-stone-700 border-stone-200" },
};

export function PostsManager({
  user,
  initialItems,
  initialTotal,
  categories,
}: {
  user: AdminUser;
  initialItems: PostRecord[];
  initialTotal: number;
  categories: CategoryRecord[];
}) {
  const [items, setItems] = useState<PostRecord[]>(initialItems);
  const [total, setTotal] = useState<number>(initialTotal);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | PostStatus>("all");
  const [categoryId, setCategoryId] = useState("");
  const [deletedView, setDeletedView] = useState<"active" | "deleted">("active");
  const [sort, setSort] = useState<"updated_desc" | "published_desc" | "title_asc">("updated_desc");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPublish = canPublishPost(user.role);

  const fetchPosts = useCallback(
    async (overrides?: {
      search?: string;
      status?: "all" | PostStatus;
      categoryId?: string;
      deleted?: "active" | "deleted";
      sort?: "updated_desc" | "published_desc" | "title_asc";
    }) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        const s = overrides?.search ?? search;
        const st = overrides?.status ?? status;
        const cat = overrides?.categoryId ?? categoryId;
        const del = overrides?.deleted ?? deletedView;
        const sr = overrides?.sort ?? sort;

        if (s.trim()) params.set("search", s.trim());
        if (st !== "all") params.set("status", st);
        if (cat) params.set("categoryId", cat);
        if (del === "deleted") params.set("deleted", "true");
        params.set("sort", sr);

        const res = await fetch(`/api/admin/posts?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memuat daftar artikel.");
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat artikel.");
      } finally {
        setLoading(false);
      }
    },
    [categoryId, deletedView, search, sort, status]
  );

  const handleDelete = async (post: PostRecord) => {
    setError(null);
    const res = await fetch(`/api/admin/posts/${post.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Gagal memindahkan artikel ke Trash.");
      return;
    }
    await fetchPosts();
  };

  const handleRestore = async (post: PostRecord) => {
    setError(null);
    const res = await fetch(`/api/admin/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Gagal memulihkan artikel.");
      return;
    }
    await fetchPosts();
  };

  const handleQuickStatus = async (post: PostRecord, nextStatus: PostStatus) => {
    setError(null);
    const res = await fetch(`/api/admin/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: post.title,
        status: nextStatus,
        expectedRevision: post.revision,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Gagal mengubah status artikel.");
      return;
    }
    await fetchPosts();
  };

  return (
    <div className="space-y-5">
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-2xl border border-line bg-white p-4 space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void fetchPosts();
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
        >
          <div className="sm:col-span-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul atau slug artikel..."
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-foreground focus:outline-none"
            />
          </div>

          <select
            aria-label="Filter status"
            value={status}
            onChange={(e) => {
              const val = e.target.value as "all" | PostStatus;
              setStatus(val);
              void fetchPosts({ status: val });
            }}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-foreground focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="in_review">Siap Ditinjau</option>
            <option value="published">Terbit</option>
            <option value="scheduled">Terjadwal</option>
            <option value="archived">Diarsipkan</option>
          </select>

          <select
            aria-label="Filter kategori"
            value={categoryId}
            onChange={(e) => {
              const val = e.target.value;
              setCategoryId(val);
              void fetchPosts({ categoryId: val });
            }}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-foreground focus:outline-none"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <select
              aria-label="Urutan"
              value={sort}
              onChange={(e) => {
                const val = e.target.value as "updated_desc" | "published_desc" | "title_asc";
                setSort(val);
                void fetchPosts({ sort: val });
              }}
              className="flex-1 min-w-0 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-foreground focus:outline-none"
            >
              <option value="updated_desc">Terbaru diubah</option>
              <option value="published_desc">Terbaru terbit</option>
              <option value="title_asc">Judul A-Z</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-foreground px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#343632] shrink-0"
            >
              Cari
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted pt-1">
          <span>
            Menampilkan <strong className="text-foreground">{items.length}</strong> dari{" "}
            <strong className="text-foreground">{total}</strong> artikel
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDeletedView("active");
                void fetchPosts({ deleted: "active" });
              }}
              className={`rounded-full px-3 py-1 font-medium ${
                deletedView === "active"
                  ? "bg-foreground text-white"
                  : "border border-line hover:bg-[#f9f7f3]"
              }`}
            >
              Aktif
            </button>
            <button
              type="button"
              onClick={() => {
                setDeletedView("deleted");
                void fetchPosts({ deleted: "deleted" });
              }}
              className={`rounded-full px-3 py-1 font-medium ${
                deletedView === "deleted"
                  ? "bg-foreground text-white"
                  : "border border-line hover:bg-[#f9f7f3]"
              }`}
            >
              Trash
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white px-6 py-14 text-center space-y-3">
          <p className="text-base font-semibold text-foreground">
            {deletedView === "deleted"
              ? "Trash artikel masih kosong."
              : "Belum ada artikel yang cocok dengan filter ini."}
          </p>
          <p className="text-sm text-muted max-w-md mx-auto">
            {deletedView === "deleted"
              ? "Artikel yang dihapus sementara akan muncul di sini."
              : "Mulai buat artikel baru dari editor agar konten TELLU Blog siap dikelola."}
          </p>
          {deletedView === "active" && (
            <div className="pt-2">
              <Link
                href="/admin/posts/new"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#343632]"
              >
                <Icon name="plus" className="w-3.5 h-3.5" />
                Tulis Artikel Baru
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-2xl border border-line bg-white overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line bg-[#f9f7f3] text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                  <th className="py-3 px-4">Artikel</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Penulis</th>
                  <th className="py-3 px-4">Diubah (WIB)</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-sm">
                {items.map((post) => {
                  const badge = STATUS_BADGE[post.status];
                  const deletable = canDeletePost(user, post.authorId, post.status);
                  return (
                    <tr key={post.id} className={loading ? "opacity-60" : "hover:bg-[#fcfbf8]"}>
                      <td className="py-3.5 px-4 max-w-[320px]">
                        <Link
                          href={`/admin/posts/${post.id}/edit`}
                          className="font-semibold text-foreground hover:text-[#a44a00] line-clamp-1"
                        >
                          {post.title}
                        </Link>
                        <p className="text-xs text-muted font-mono truncate">/{post.slug}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted">
                        {post.categories.map((c) => c.name).join(", ") || "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted">{post.authorName}</td>
                      <td className="py-3.5 px-4 text-xs text-muted whitespace-nowrap">
                        {formatJakartaDateTime(post.updatedAt)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-2">
                          {deletedView === "deleted" ? (
                            <button
                              type="button"
                              onClick={() => void handleRestore(post)}
                              className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold hover:bg-[#f9f7f3]"
                            >
                              Pulihkan
                            </button>
                          ) : (
                            <>
                              <Link
                                href={`/admin/posts/${post.id}/edit`}
                                className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold hover:bg-[#f9f7f3]"
                              >
                                Edit
                              </Link>
                              <Link
                                href={`/admin/posts/${post.id}/preview`}
                                className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-muted hover:text-foreground hover:bg-[#f9f7f3]"
                              >
                                Pratinjau
                              </Link>
                              {canPublish && post.status !== "published" && (
                                <button
                                  type="button"
                                  onClick={() => void handleQuickStatus(post, "published")}
                                  className="rounded-lg bg-foreground px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#343632]"
                                >
                                  Terbitkan
                                </button>
                              )}
                              {canPublish && post.status === "published" && (
                                <button
                                  type="button"
                                  onClick={() => void handleQuickStatus(post, "draft")}
                                  className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-muted hover:text-foreground"
                                >
                                  Draft
                                </button>
                              )}
                              {deletable && (
                                <button
                                  type="button"
                                  aria-label={`Hapus ${post.title}`}
                                  onClick={() => void handleDelete(post)}
                                  className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                                >
                                  <Icon name="trash" className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {items.map((post) => {
              const badge = STATUS_BADGE[post.status];
              return (
                <article
                  key={post.id}
                  className="rounded-2xl border border-line bg-white p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="font-semibold text-foreground block line-clamp-2"
                      >
                        {post.title}
                      </Link>
                      <p className="text-xs text-muted font-mono truncate">/{post.slug}</p>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>{post.authorName}</span>
                    <span>{formatJakartaDateTime(post.updatedAt)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {deletedView === "deleted" ? (
                      <button
                        type="button"
                        onClick={() => void handleRestore(post)}
                        className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold"
                      >
                        Pulihkan
                      </button>
                    ) : (
                      <>
                        <Link
                          href={`/admin/posts/${post.id}/edit`}
                          className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/admin/posts/${post.id}/preview`}
                          className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted"
                        >
                          Pratinjau
                        </Link>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
