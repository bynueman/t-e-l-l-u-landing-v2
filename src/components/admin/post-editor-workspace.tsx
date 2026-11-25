"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { MediaPickerModal } from "@/components/admin/media-picker-modal";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
import { StructuredArticleRenderer } from "@/components/blog/structured-article-renderer";
import {
  calculateReadingTimeMinutes,
  createEmptyDocument,
  type StructuredDocument,
} from "@/lib/cms/content";
import type { CategoryRecord } from "@/lib/cms/categories";
import type { MediaRecord } from "@/lib/cms/media";
import type { PostRecord, PostStatus } from "@/lib/cms/posts";
import { canAssignAuthor, canPublishPost, type AdminUser } from "@/lib/cms/rbac";
import {
  formatJakartaDateTime,
  jakartaInputValueToUtcIso,
  utcIsoToJakartaInputValue,
} from "@/lib/cms/time";

function slugifyClient(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

const STATUS_BADGE: Record<PostStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-[#f4f2eb] text-[#5c5f58] border-line" },
  in_review: { label: "Siap Ditinjau", className: "bg-amber-50 text-amber-800 border-amber-200" },
  published: { label: "Terbit", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  scheduled: { label: "Terjadwal", className: "bg-sky-50 text-sky-800 border-sky-200" },
  archived: { label: "Diarsipkan", className: "bg-stone-100 text-stone-700 border-stone-200" },
};

export interface AuthorOption {
  id: string;
  name: string;
  role: string;
}

export function PostEditorWorkspace({
  user,
  initialPost,
  categories,
  authors,
}: {
  user: AdminUser;
  initialPost?: PostRecord;
  categories: CategoryRecord[];
  authors: AuthorOption[];
}) {
  const canPublish = canPublishPost(user.role);
  const canSelectAuthor = canAssignAuthor(user.role);

  const [postId, setPostId] = useState<string | null>(initialPost?.id ?? null);
  const [revision, setRevision] = useState<number>(initialPost?.revision ?? 1);
  const [status, setStatus] = useState<PostStatus>(initialPost?.status ?? "draft");
  const [title, setTitle] = useState<string>(initialPost?.title ?? "");
  const [slug, setSlug] = useState<string>(initialPost?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState<boolean>(Boolean(initialPost?.slug));
  const [excerpt, setExcerpt] = useState<string>(initialPost?.excerpt ?? "");
  const [structuredContent, setStructuredContent] = useState<StructuredDocument>(
    initialPost?.structuredContent ?? createEmptyDocument()
  );
  const [coverMediaId, setCoverMediaId] = useState<string | null>(
    initialPost?.coverMediaId ?? null
  );
  const [coverAlt, setCoverAlt] = useState<string>(initialPost?.coverAlt ?? "");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    initialPost?.categories.map((c) => c.id) ?? []
  );
  const [tagsText, setTagsText] = useState<string>(
    initialPost?.tags.map((t) => t.name).join(", ") ?? ""
  );
  const [authorId, setAuthorId] = useState<string>(initialPost?.authorId ?? user.id);
  const [featured, setFeatured] = useState<boolean>(initialPost?.featured ?? false);
  const [scheduledWib, setScheduledWib] = useState<string>(
    utcIsoToJakartaInputValue(initialPost?.scheduledAt ?? null)
  );
  const [seoTitle, setSeoTitle] = useState<string>(initialPost?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState<string>(initialPost?.seoDescription ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState<string>(initialPost?.canonicalUrl ?? "");

  const [editorTab, setEditorTab] = useState<"write" | "preview">("write");
  const [coverModalOpen, setCoverModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<string>(
    initialPost ? `Terakhir disimpan ${formatJakartaDateTime(initialPost.updatedAt)}` : "Belum disimpan"
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const hydratedRef = useRef(false);
  const savingLockRef = useRef(false);

  useEffect(() => {
    hydratedRef.current = true;
  }, []);

  const readingMinutes = useMemo(
    () => calculateReadingTimeMinutes(structuredContent),
    [structuredContent]
  );

  const parsedTags = useMemo(
    () =>
      tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 12),
    [tagsText]
  );

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setIsDirty(true);
    if (!slugTouched && !postId) {
      setSlug(slugifyClient(val));
    }
  };

  const persistPost = useCallback(
    async (
      targetStatus?: PostStatus,
      options?: { silent?: boolean; explicitScheduleIso?: string | null }
    ) => {
      const effectiveTitle = title.trim();
      if (!effectiveTitle) {
        if (!options?.silent) {
          setError("Judul artikel wajib diisi sebelum menyimpan.");
        }
        return null;
      }

      if (savingLockRef.current) return null;
      savingLockRef.current = true;
      setSaving(true);
      if (!options?.silent) {
        setError(null);
        setNotice(null);
      }

      try {
        const nextStatus = targetStatus ?? status;
        let scheduledAtUtc: string | null = null;
        if (options?.explicitScheduleIso !== undefined) {
          scheduledAtUtc = options.explicitScheduleIso;
        } else if (nextStatus === "scheduled") {
          scheduledAtUtc = jakartaInputValueToUtcIso(scheduledWib);
          if (!scheduledAtUtc) {
            throw new Error("Tentukan tanggal & waktu publikasi (WIB) untuk artikel terjadwal.");
          }
        }

        const payload = {
          title: effectiveTitle,
          slug: slug.trim() || undefined,
          excerpt: excerpt.trim(),
          structuredContent,
          coverMediaId,
          authorId: canSelectAuthor ? authorId : undefined,
          status: nextStatus,
          featured: canPublish ? featured : undefined,
          seoTitle: seoTitle.trim(),
          seoDescription: seoDescription.trim(),
          canonicalUrl: canonicalUrl.trim(),
          scheduledAt: scheduledAtUtc,
          categoryIds: selectedCategoryIds,
          tags: parsedTags,
          expectedRevision: postId ? revision : undefined,
        };

        const res = await fetch(postId ? `/api/admin/posts/${postId}` : "/api/admin/posts", {
          method: postId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Gagal menyimpan artikel.");
        }

        const saved = data.post as PostRecord;
        setPostId(saved.id);
        setRevision(saved.revision);
        setStatus(saved.status);
        setSlug(saved.slug);
        setSlugTouched(true);
        setScheduledWib(utcIsoToJakartaInputValue(saved.scheduledAt));
        setIsDirty(false);
        setSaveState(
          options?.silent
            ? `Autosave ${formatJakartaDateTime(saved.updatedAt)}`
            : `Tersimpan ${formatJakartaDateTime(saved.updatedAt)}`
        );

        if (!postId && typeof window !== "undefined") {
          window.history.replaceState(null, "", `/admin/posts/${saved.id}/edit`);
        }

        if (!options?.silent) {
          const statusLabel = STATUS_BADGE[saved.status]?.label ?? saved.status;
          setNotice(`Artikel berhasil disimpan (${statusLabel}).`);
        }
        return saved;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan.";
        setError(msg);
        setSaveState("Gagal menyimpan");
        return null;
      } finally {
        savingLockRef.current = false;
        setSaving(false);
      }
    },
    [
      authorId,
      canPublish,
      canSelectAuthor,
      canonicalUrl,
      coverMediaId,
      excerpt,
      featured,
      parsedTags,
      postId,
      revision,
      scheduledWib,
      selectedCategoryIds,
      seoDescription,
      seoTitle,
      slug,
      status,
      structuredContent,
      title,
    ]
  );

  // Debounced autosave for drafts/in_review when dirty and title is present
  useEffect(() => {
    if (!hydratedRef.current || !isDirty || !title.trim()) return;
    if (status === "published" || status === "scheduled") {
      // Do not silently auto-mutate live published posts without explicit action; only draft/in_review
      return;
    }

    const timer = window.setTimeout(() => {
      void persistPost(undefined, { silent: true });
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [isDirty, persistPost, status, title]);

  const toggleCategory = (catId: string) => {
    setIsDirty(true);
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleCoverSelect = (media: MediaRecord) => {
    setCoverMediaId(media.id);
    setCoverAlt(media.altText || title);
    setCoverModalOpen(false);
    setIsDirty(true);
  };

  const badge = STATUS_BADGE[status];

  return (
    <div className="space-y-4">
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-center justify-between gap-3"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs font-semibold underline shrink-0"
          >
            Tutup
          </button>
        </div>
      )}

      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center justify-between gap-3">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-xs font-semibold underline shrink-0"
          >
            Tutup
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Main Editorial Column */}
        <div className="flex-1 min-w-0 w-full space-y-5">
          <div className="rounded-2xl border border-line bg-white p-5 sm:p-7 space-y-5 shadow-[0_12px_32px_-28px_rgba(32,33,31,0.18)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.className}`}
                >
                  {badge.label}
                </span>
                <span className="text-xs text-muted">
                  Revisi #{revision} • ±{readingMinutes} menit baca
                </span>
              </div>

              <span className="text-xs text-muted">
                {saving ? "Menyimpan..." : isDirty ? "Ada perubahan belum disimpan" : saveState}
              </span>
            </div>

            <div>
              <label htmlFor="post-title" className="sr-only">
                Judul Artikel
              </label>
              <input
                id="post-title"
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Judul artikel yang jelas dan informatif..."
                className="w-full bg-transparent text-2xl sm:text-3xl font-bold tracking-tight text-foreground placeholder:text-muted/50 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="post-excerpt"
                className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted mb-1.5"
              >
                Ringkasan / Excerpt
              </label>
              <textarea
                id="post-excerpt"
                rows={2}
                value={excerpt}
                onChange={(e) => {
                  setExcerpt(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Ringkasan singkat artikel untuk daftar blog dan meta deskripsi..."
                className="w-full rounded-xl border border-line bg-[#fcfbf8] px-3.5 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted/60 focus:border-foreground focus:outline-none"
              />
            </div>

            {/* Editor vs Preview switcher */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex rounded-full border border-line bg-[#f9f7f3] p-1">
                  <button
                    type="button"
                    onClick={() => setEditorTab("write")}
                    className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                      editorTab === "write"
                        ? "bg-white text-foreground shadow-xs"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    Tulis Artikel
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab("preview")}
                    className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                      editorTab === "preview"
                        ? "bg-white text-foreground shadow-xs"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    Pratinjau Konten
                  </button>
                </div>

                {postId && (
                  <Link
                    href={`/admin/posts/${postId}/preview`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#a44a00] hover:underline"
                  >
                    <Icon name="eye" className="w-3.5 h-3.5" />
                    Pratinjau Penuh
                  </Link>
                )}
              </div>

              {editorTab === "write" ? (
                <TiptapEditor
                  initialContent={structuredContent}
                  userRole={user.role}
                  onChange={(doc) => {
                    setStructuredContent(doc);
                    setIsDirty(true);
                  }}
                />
              ) : (
                <div className="rounded-xl border border-line bg-[#fcfbf8] p-5 sm:p-7 min-h-[340px]">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground mb-3">
                    {title || "Judul Artikel"}
                  </h2>
                  {excerpt && <p className="text-sm text-muted mb-6 leading-relaxed">{excerpt}</p>}
                  <StructuredArticleRenderer document={structuredContent} />
                </div>
              )}
            </div>
          </div>

          {/* SEO Card */}
          <section className="rounded-2xl border border-line bg-white p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-foreground">Pengaturan SEO & SERP Preview</h2>
              <span className="text-[11px] text-muted">Opsional</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Panduan editorial: jawab pertanyaan nyata pembaca dengan struktur heading yang jelas, cantumkan sumber rujukan untuk klaim eksternal, dan hindari pengulangan kata kunci maupun janji hasil yang belum terverifikasi.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">SEO Title</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => {
                    setSeoTitle(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder={title || "Judul di hasil pencarian..."}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-foreground focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Canonical URL
                </label>
                <input
                  type="text"
                  value={canonicalUrl}
                  onChange={(e) => {
                    setCanonicalUrl(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="https://domain-resmi/blog/..."
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-foreground focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                SEO Description
              </label>
              <textarea
                rows={2}
                value={seoDescription}
                onChange={(e) => {
                  setSeoDescription(e.target.value);
                  setIsDirty(true);
                }}
                placeholder={excerpt || "Ringkasan akurat isi artikel untuk mesin pencari..."}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-foreground focus:outline-none"
              />
            </div>

            <div className="rounded-xl border border-line bg-[#fcfbf8] p-4 space-y-1">
              <p className="text-[11px] text-muted truncate">
                /blog/{slug || "slug-artikel"}
              </p>
              <p className="text-base font-semibold text-[#1a0dab] truncate">
                {seoTitle || title || "Judul Artikel — TELLU"}
              </p>
              <p className="text-xs text-muted line-clamp-2">
                {seoDescription ||
                  excerpt ||
                  "Ringkasan artikel akan tampil di sini sebagai cuplikan hasil pencarian."}
              </p>
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <aside className="w-full lg:w-[330px] shrink-0 space-y-5">
          {/* Publishing Actions */}
          <div className="rounded-2xl border border-line bg-white p-5 space-y-4">
            <h2 className="text-sm font-bold text-foreground">Publikasi</h2>

            <div className="space-y-2.5">
              <button
                type="button"
                disabled={saving}
                onClick={() => void persistPost(status)}
                className="w-full rounded-full border border-line bg-white px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-[#f9f7f3] disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : postId ? "Simpan Perubahan" : "Simpan sebagai Draft"}
              </button>

              {status !== "in_review" && status !== "published" && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void persistPost("in_review")}
                  className="w-full rounded-full border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                >
                  Kirim untuk Ditinjau (In Review)
                </button>
              )}

              {canPublish && status !== "published" && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void persistPost("published", { explicitScheduleIso: null })}
                  className="w-full rounded-full bg-foreground px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#343632] disabled:opacity-50"
                >
                  Terbitkan Sekarang
                </button>
              )}

              {canPublish && status === "published" && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void persistPost("draft")}
                    className="rounded-full border border-line px-3 py-2 text-xs font-semibold text-foreground hover:bg-[#f9f7f3] disabled:opacity-50"
                  >
                    Tarik ke Draft
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void persistPost("archived")}
                    className="rounded-full border border-line px-3 py-2 text-xs font-semibold text-muted hover:text-foreground hover:bg-[#f9f7f3] disabled:opacity-50"
                  >
                    Arsipkan
                  </button>
                </div>
              )}

              {postId && status === "published" && (
                <Link
                  href={`/blog/${slug}`}
                  target="_blank"
                  className="flex items-center justify-center gap-1.5 w-full rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  <Icon name="arrow-right" className="w-3.5 h-3.5" />
                  Buka Artikel Publik
                </Link>
              )}
            </div>

            {canPublish && (
              <div className="border-t border-line pt-4 space-y-2">
                <label className="block text-xs font-semibold text-foreground">
                  Jadwalkan Publikasi (WIB)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledWib}
                  onChange={(e) => {
                    setScheduledWib(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full rounded-lg border border-line px-3 py-2 text-xs focus:border-foreground focus:outline-none"
                />
                <button
                  type="button"
                  disabled={saving || !scheduledWib}
                  onClick={() => void persistPost("scheduled")}
                  className="w-full rounded-full border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-900 hover:bg-sky-100 disabled:opacity-40"
                >
                  Jadwalkan Artikel
                </button>
              </div>
            )}

            {!canPublish && (
              <p className="text-[11px] leading-relaxed text-muted border-t border-line pt-3">
                Sebagai Author, Anda dapat menyimpan Draft atau mengirim artikel ke antrean{" "}
                <strong>Siap Ditinjau</strong> untuk diterbitkan oleh Editor atau Owner.
              </p>
            )}
          </div>

          {/* Cover Image */}
          <div className="rounded-2xl border border-line bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">Gambar Sampul</h2>
              {coverMediaId && (
                <button
                  type="button"
                  onClick={() => {
                    setCoverMediaId(null);
                    setCoverAlt("");
                    setIsDirty(true);
                  }}
                  className="text-xs text-red-700 hover:underline"
                >
                  Hapus
                </button>
              )}
            </div>

            {coverMediaId ? (
              <div className="space-y-2">
                <div className="overflow-hidden rounded-xl border border-line bg-[#f9f7f3] aspect-16/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/media/${coverMediaId}`}
                    alt={coverAlt || title || "Cover artikel"}
                    className="w-full h-full object-cover"
                  />
                </div>
                {coverAlt && <p className="text-[11px] text-muted truncate">Alt: {coverAlt}</p>}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-line bg-[#fcfbf8] p-5 text-center text-xs text-muted">
                Belum ada gambar sampul
              </div>
            )}

            <button
              type="button"
              onClick={() => setCoverModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-line px-3.5 py-2 text-xs font-semibold hover:bg-[#f9f7f3]"
            >
              <Icon name="image" className="w-3.5 h-3.5" />
              {coverMediaId ? "Ganti Gambar Sampul" : "Pilih / Unggah Sampul"}
            </button>
          </div>

          {/* Slug, Categories, Tags, Author, Featured */}
          <div className="rounded-2xl border border-line bg-white p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="post-slug" className="text-xs font-semibold text-foreground">
                  Slug URL
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setSlug(slugifyClient(title));
                    setSlugTouched(true);
                    setIsDirty(true);
                  }}
                  className="text-[11px] font-medium text-[#a44a00] hover:underline"
                >
                  Dari judul
                </button>
              </div>
              <input
                id="post-slug"
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value.toLowerCase());
                  setSlugTouched(true);
                  setIsDirty(true);
                }}
                placeholder="judul-artikel-anda"
                className="w-full rounded-lg border border-line px-3 py-2 text-xs font-mono focus:border-foreground focus:outline-none"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Kategori</p>
              <div className="space-y-1.5">
                {categories.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="rounded border-line accent-foreground"
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="post-tags" className="block text-xs font-semibold text-foreground mb-1">
                Tag (pisahkan koma)
              </label>
              <input
                id="post-tags"
                type="text"
                value={tagsText}
                onChange={(e) => {
                  setTagsText(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="nextjs, strategi, branding"
                className="w-full rounded-lg border border-line px-3 py-2 text-xs focus:border-foreground focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="post-author" className="block text-xs font-semibold text-foreground mb-1">
                Penulis
              </label>
              {canSelectAuthor ? (
                <select
                  id="post-author"
                  value={authorId}
                  onChange={(e) => {
                    setAuthorId(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs focus:border-foreground focus:outline-none"
                >
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.role})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-muted">{user.name}</p>
              )}
            </div>

            {canPublish && (
              <label className="flex items-center gap-2.5 pt-1 text-xs font-medium text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => {
                    setFeatured(e.target.checked);
                    setIsDirty(true);
                  }}
                  className="rounded border-line accent-foreground"
                />
                Tandai sebagai Artikel Unggulan
              </label>
            )}
          </div>
        </aside>
      </div>

      <MediaPickerModal
        open={coverModalOpen}
        userRole={user.role}
        title="Pilih Gambar Sampul Artikel"
        selectLabel="Gunakan sebagai Sampul"
        onClose={() => setCoverModalOpen(false)}
        onSelect={handleCoverSelect}
      />
    </div>
  );
}
