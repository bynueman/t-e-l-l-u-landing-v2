import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { withTransaction } from "./db.ts";
import { logActivity } from "./activity.ts";
import {
  calculateReadingTimeMinutes,
  createEmptyDocument,
  extractPlainText,
  isSafeHttpOrRelativeUrl,
  validateAndSanitizeDocument,
  type StructuredDocument,
} from "./content.ts";
import {
  canAssignAuthor,
  canChangePostStatus,
  canDeletePost,
  canEditPost,
  canPublishPost,
  type AdminUser,
} from "./rbac.ts";

export type PostStatus = "draft" | "in_review" | "published" | "scheduled" | "archived";

export interface PostCategorySummary {
  id: string;
  name: string;
  slug: string;
  ecosystem: "technology" | "creative" | "business" | null;
}

export interface PostTagSummary {
  id: string;
  name: string;
  slug: string;
}

export interface PostRecord {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  structuredContent: StructuredDocument;
  coverMediaId: string | null;
  coverUrl: string | null;
  coverAlt: string;
  authorId: string;
  authorName: string;
  status: PostStatus;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  publishedAt: string | null;
  scheduledAt: string | null;
  readingTimeMinutes: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  categories: PostCategorySummary[];
  tags: PostTagSummary[];
}

export interface DashboardStats {
  totalArticles: number;
  draftArticles: number;
  inReviewArticles: number;
  publishedArticles: number;
  scheduledArticles: number;
  archivedArticles: number;
}

export function slugifyPost(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function hydratePostRows(db: DatabaseSync, rows: Record<string, unknown>[]): PostRecord[] {
  if (rows.length === 0) return [];
  const postIds = rows.map((r) => String(r.id));
  const placeholders = postIds.map(() => "?").join(",");

  const catRows = db
    .prepare(
      `SELECT pc.post_id, c.id, c.name, c.slug, c.ecosystem
       FROM post_categories pc
       JOIN categories c ON c.id = pc.category_id
       WHERE pc.post_id IN (${placeholders})
       ORDER BY c.name ASC`
    )
    .all(...postIds) as Record<string, unknown>[];

  const tagRows = db
    .prepare(
      `SELECT pt.post_id, t.id, t.name, t.slug
       FROM post_tags pt
       JOIN tags t ON t.id = pt.tag_id
       WHERE pt.post_id IN (${placeholders})
       ORDER BY t.name ASC`
    )
    .all(...postIds) as Record<string, unknown>[];

  const catMap = new Map<string, PostCategorySummary[]>();
  for (const cr of catRows) {
    const pid = String(cr.post_id);
    const list = catMap.get(pid) ?? [];
    list.push({
      id: String(cr.id),
      name: String(cr.name),
      slug: String(cr.slug),
      ecosystem: (cr.ecosystem as PostCategorySummary["ecosystem"]) ?? null,
    });
    catMap.set(pid, list);
  }

  const tagMap = new Map<string, PostTagSummary[]>();
  for (const tr of tagRows) {
    const pid = String(tr.post_id);
    const list = tagMap.get(pid) ?? [];
    list.push({
      id: String(tr.id),
      name: String(tr.name),
      slug: String(tr.slug),
    });
    tagMap.set(pid, list);
  }

  return rows.map((r) => {
    let structuredContent: StructuredDocument;
    try {
      structuredContent = validateAndSanitizeDocument(String(r.structured_content));
    } catch {
      structuredContent = createEmptyDocument();
    }

    const coverMediaId = r.cover_media_id ? String(r.cover_media_id) : null;
    return {
      id: String(r.id),
      title: String(r.title),
      slug: String(r.slug),
      excerpt: String(r.excerpt ?? ""),
      structuredContent,
      coverMediaId,
      coverUrl: coverMediaId ? `/api/media/${coverMediaId}` : null,
      coverAlt: String(r.cover_alt ?? ""),
      authorId: String(r.author_id),
      authorName: String(r.author_name ?? "Tim TELLU"),
      status: r.status as PostStatus,
      featured: Number(r.featured) === 1,
      seoTitle: String(r.seo_title ?? ""),
      seoDescription: String(r.seo_description ?? ""),
      canonicalUrl: String(r.canonical_url ?? ""),
      publishedAt: r.published_at ? String(r.published_at) : null,
      scheduledAt: r.scheduled_at ? String(r.scheduled_at) : null,
      readingTimeMinutes: Number(r.reading_time_minutes ?? 1),
      revision: Number(r.revision ?? 1),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
      deletedAt: r.deleted_at ? String(r.deleted_at) : null,
      categories: catMap.get(String(r.id)) ?? [],
      tags: tagMap.get(String(r.id)) ?? [],
    };
  });
}

export function getEffectivePublicDateIso(post: Pick<PostRecord, "status" | "publishedAt" | "scheduledAt">): string | null {
  if (post.status === "scheduled") {
    return post.scheduledAt ?? post.publishedAt;
  }
  if (post.status === "published") {
    return post.publishedAt;
  }
  return null;
}

export function isPostPubliclyEligible(
  post: Pick<PostRecord, "status" | "scheduledAt" | "deletedAt">,
  nowIso = new Date().toISOString()
): boolean {
  if (post.deletedAt) return false;
  if (post.status === "published") return true;
  if (post.status === "scheduled" && post.scheduledAt) {
    return post.scheduledAt <= nowIso;
  }
  return false;
}

export function listPublicPosts(db: DatabaseSync, nowIso = new Date().toISOString()): PostRecord[] {
  const rows = db
    .prepare(
      `SELECT p.*, u.name as author_name, m.alt_text as cover_alt
       FROM posts p
       LEFT JOIN users u ON u.id = p.author_id
       LEFT JOIN media m ON m.id = p.cover_media_id
       WHERE p.deleted_at IS NULL
         AND (
           p.status = 'published'
           OR (p.status = 'scheduled' AND p.scheduled_at IS NOT NULL AND p.scheduled_at <= ?)
         )
       ORDER BY p.featured DESC, COALESCE(p.published_at, p.scheduled_at, p.created_at) DESC`
    )
    .all(nowIso) as Record<string, unknown>[];

  return hydratePostRows(db, rows);
}

export function getPublicPostBySlug(
  db: DatabaseSync,
  slug: string,
  nowIso = new Date().toISOString()
): PostRecord | null {
  const rows = db
    .prepare(
      `SELECT p.*, u.name as author_name, m.alt_text as cover_alt
       FROM posts p
       LEFT JOIN users u ON u.id = p.author_id
       LEFT JOIN media m ON m.id = p.cover_media_id
       WHERE p.slug = ?
         AND p.deleted_at IS NULL
         AND (
           p.status = 'published'
           OR (p.status = 'scheduled' AND p.scheduled_at IS NOT NULL AND p.scheduled_at <= ?)
         )
       LIMIT 1`
    )
    .all(slug, nowIso) as Record<string, unknown>[];

  return hydratePostRows(db, rows)[0] ?? null;
}

export function getRelatedPublicPosts(
  db: DatabaseSync,
  currentPostId: string,
  categoryIds: string[],
  limit = 2,
  nowIso = new Date().toISOString()
): PostRecord[] {
  if (categoryIds.length === 0) return [];
  const placeholders = categoryIds.map(() => "?").join(",");

  const rows = db
    .prepare(
      `SELECT DISTINCT p.*, u.name as author_name, m.alt_text as cover_alt
       FROM posts p
       JOIN post_categories pc ON pc.post_id = p.id
       LEFT JOIN users u ON u.id = p.author_id
       LEFT JOIN media m ON m.id = p.cover_media_id
       WHERE p.id != ?
         AND pc.category_id IN (${placeholders})
         AND p.deleted_at IS NULL
         AND (
           p.status = 'published'
           OR (p.status = 'scheduled' AND p.scheduled_at IS NOT NULL AND p.scheduled_at <= ?)
         )
       ORDER BY COALESCE(p.published_at, p.scheduled_at, p.created_at) DESC
       LIMIT ?`
    )
    .all(currentPostId, ...categoryIds, nowIso, limit) as Record<string, unknown>[];

  return hydratePostRows(db, rows);
}

export function getAdminDashboardStats(db: DatabaseSync, actor: AdminUser): DashboardStats {
  const authorFilter = actor.role === "author" ? "AND author_id = ?" : "";
  const args = actor.role === "author" ? [actor.id] : [];

  const rows = db
    .prepare(
      `SELECT status, COUNT(*) as cnt
       FROM posts
       WHERE deleted_at IS NULL ${authorFilter}
       GROUP BY status`
    )
    .all(...args) as { status: PostStatus; cnt: number }[];

  const counts = new Map(rows.map((r) => [r.status, Number(r.cnt)]));
  const draftArticles = counts.get("draft") ?? 0;
  const inReviewArticles = counts.get("in_review") ?? 0;
  const publishedArticles = counts.get("published") ?? 0;
  const scheduledArticles = counts.get("scheduled") ?? 0;
  const archivedArticles = counts.get("archived") ?? 0;

  return {
    totalArticles: draftArticles + inReviewArticles + publishedArticles + scheduledArticles + archivedArticles,
    draftArticles,
    inReviewArticles,
    publishedArticles,
    scheduledArticles,
    archivedArticles,
  };
}

export interface AdminPostListFilters {
  search?: string;
  status?: string;
  categoryId?: string;
  includeDeleted?: boolean;
  sort?: "updated_desc" | "updated_asc" | "title_asc" | "published_desc";
  page?: number;
  pageSize?: number;
}

export function listAdminPosts(
  db: DatabaseSync,
  actor: AdminUser,
  filters: AdminPostListFilters = {}
): { items: PostRecord[]; total: number; page: number; pageSize: number } {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  const where: string[] = [];
  const params: (string | number)[] = [];

  if (actor.role === "author") {
    where.push("p.author_id = ?");
    params.push(actor.id);
  }

  if (filters.includeDeleted) {
    where.push("p.deleted_at IS NOT NULL");
  } else {
    where.push("p.deleted_at IS NULL");
  }

  if (filters.status && filters.status !== "all") {
    where.push("p.status = ?");
    params.push(filters.status);
  }

  if (filters.search?.trim()) {
    where.push("(LOWER(p.title) LIKE ? OR LOWER(p.slug) LIKE ?)");
    const q = `%${filters.search.trim().toLowerCase()}%`;
    params.push(q, q);
  }

  if (filters.categoryId && filters.categoryId !== "all") {
    where.push("EXISTS (SELECT 1 FROM post_categories pc WHERE pc.post_id = p.id AND pc.category_id = ?)");
    params.push(filters.categoryId);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const orderSql =
    filters.sort === "updated_asc"
      ? "ORDER BY p.updated_at ASC"
      : filters.sort === "title_asc"
      ? "ORDER BY p.title COLLATE NOCASE ASC"
      : filters.sort === "published_desc"
      ? "ORDER BY COALESCE(p.published_at, p.scheduled_at, p.updated_at) DESC"
      : "ORDER BY p.updated_at DESC";

  const countRow = db
    .prepare(`SELECT COUNT(*) as cnt FROM posts p ${whereSql}`)
    .get(...params) as { cnt: number };

  const rows = db
    .prepare(
      `SELECT p.*, u.name as author_name, m.alt_text as cover_alt
       FROM posts p
       LEFT JOIN users u ON u.id = p.author_id
       LEFT JOIN media m ON m.id = p.cover_media_id
       ${whereSql}
       ${orderSql}
       LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, offset) as Record<string, unknown>[];

  return {
    items: hydratePostRows(db, rows),
    total: Number(countRow.cnt),
    page,
    pageSize,
  };
}

export function getAdminPostById(db: DatabaseSync, actor: AdminUser, postId: string): PostRecord | null {
  const rows = db
    .prepare(
      `SELECT p.*, u.name as author_name, m.alt_text as cover_alt
       FROM posts p
       LEFT JOIN users u ON u.id = p.author_id
       LEFT JOIN media m ON m.id = p.cover_media_id
       WHERE p.id = ?
       LIMIT 1`
    )
    .all(postId) as Record<string, unknown>[];

  const post = hydratePostRows(db, rows)[0] ?? null;
  if (!post) return null;
  if (!canEditPost(actor, post.authorId)) {
    throw new Error("FORBIDDEN: Anda tidak memiliki akses ke artikel ini.");
  }
  return post;
}

export interface UpsertPostInput {
  title: string;
  slug?: string;
  excerpt?: string;
  structuredContent?: unknown;
  coverMediaId?: string | null;
  authorId?: string;
  status?: PostStatus;
  featured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  scheduledAt?: string | null;
  categoryIds?: string[];
  tags?: string[];
  expectedRevision?: number;
}

function syncPostRelations(
  db: DatabaseSync,
  postId: string,
  categoryIds: string[],
  tagNames: string[]
): void {
  db.prepare("DELETE FROM post_categories WHERE post_id = ?").run(postId);
  const insertCat = db.prepare("INSERT OR IGNORE INTO post_categories (post_id, category_id) VALUES (?, ?)");
  for (const cid of categoryIds) {
    const exists = db.prepare("SELECT id FROM categories WHERE id = ?").get(cid);
    if (!exists) throw new Error(`Kategori tidak valid: ${cid}`);
    insertCat.run(postId, cid);
  }

  db.prepare("DELETE FROM post_tags WHERE post_id = ?").run(postId);
  const findTag = db.prepare("SELECT id FROM tags WHERE slug = ?");
  const createTag = db.prepare("INSERT INTO tags (id, name, slug) VALUES (?, ?, ?)");
  const attachTag = db.prepare("INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)");

  const seenSlugs = new Set<string>();
  for (const rawName of tagNames) {
    const name = rawName.trim().slice(0, 48);
    if (!name) continue;
    const slug = slugifyPost(name);
    if (!slug || seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);

    const existing = findTag.get(slug) as { id: string } | undefined;
    const tagId = existing?.id ?? `tag_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
    if (!existing) {
      createTag.run(tagId, name, slug);
    }
    attachTag.run(postId, tagId);
  }
}

export function createPost(db: DatabaseSync, actor: AdminUser, input: UpsertPostInput): PostRecord {
  const title = input.title.trim();
  if (!title) throw new Error("Judul artikel wajib diisi.");

  const slug = slugifyPost(input.slug?.trim() || title);
  if (!slug) throw new Error("Slug artikel tidak valid.");

  const dup = db.prepare("SELECT id FROM posts WHERE slug = ?").get(slug);
  if (dup) throw new Error(`Slug '${slug}' sudah digunakan artikel lain.`);

  const sanitizedDoc =
    input.structuredContent === undefined
      ? createEmptyDocument()
      : validateAndSanitizeDocument(input.structuredContent);
  const status: PostStatus = input.status ?? "draft";
  if (!["draft", "in_review", "published", "scheduled", "archived"].includes(status)) {
    throw new Error("Status publikasi tidak valid.");
  }

  const authorId =
    input.authorId && canAssignAuthor(actor.role) ? input.authorId : actor.id;

  if (!canChangePostStatus(actor, authorId, status)) {
    throw new Error("FORBIDDEN: Role Anda tidak diizinkan menetapkan status publikasi tersebut.");
  }

  if (input.canonicalUrl?.trim() && !isSafeHttpOrRelativeUrl(input.canonicalUrl.trim())) {
    throw new Error("URL kanonikal tidak valid atau menggunakan skema yang tidak aman.");
  }

  if (input.coverMediaId) {
    const mediaExists = db.prepare("SELECT id FROM media WHERE id = ?").get(input.coverMediaId);
    if (!mediaExists) throw new Error("Cover media tidak ditemukan.");
  }

  const now = new Date().toISOString();
  let publishedAt: string | null = null;
  let scheduledAt: string | null = null;

  if (status === "published") {
    publishedAt = now;
  } else if (status === "scheduled") {
    if (!input.scheduledAt || Number.isNaN(Date.parse(input.scheduledAt))) {
      throw new Error("Waktu jadwal publikasi wajib diisi untuk status Terjadwal.");
    }
    scheduledAt = new Date(input.scheduledAt).toISOString();
  }

  const plain = extractPlainText(sanitizedDoc);
  const excerpt = (input.excerpt ?? "").trim() || plain.slice(0, 220);
  const readingTime = calculateReadingTimeMinutes(sanitizedDoc);
  const featured = canPublishPost(actor.role) && input.featured ? 1 : 0;
  const id = `pst_${randomUUID().replace(/-/g, "").slice(0, 14)}`;

  withTransaction(db, () => {
    db.prepare(
      `INSERT INTO posts (
        id, title, slug, excerpt, structured_content, cover_media_id, author_id,
        status, featured, seo_title, seo_description, canonical_url,
        published_at, scheduled_at, reading_time_minutes, revision, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`
    ).run(
      id,
      title,
      slug,
      excerpt,
      JSON.stringify(sanitizedDoc),
      input.coverMediaId || null,
      authorId,
      status,
      featured,
      (input.seoTitle ?? "").trim().slice(0, 160),
      (input.seoDescription ?? "").trim().slice(0, 320),
      (input.canonicalUrl ?? "").trim().slice(0, 500),
      publishedAt,
      scheduledAt,
      readingTime,
      now,
      now
    );

    syncPostRelations(db, id, input.categoryIds ?? [], input.tags ?? []);

    logActivity(db, {
      actorId: actor.id,
      action: status === "published" ? "post.publish" : "post.create",
      entityType: "post",
      entityId: id,
      metadata: { title, slug, status },
    });
  });

  return getAdminPostById(db, actor, id)!;
}

export function updatePost(
  db: DatabaseSync,
  actor: AdminUser,
  postId: string,
  input: UpsertPostInput
): PostRecord {
  const existing = getAdminPostById(db, actor, postId);
  if (!existing) throw new Error("Artikel tidak ditemukan.");

  if (
    input.expectedRevision !== undefined &&
    input.expectedRevision !== existing.revision
  ) {
    throw new Error("CONFLICT: Artikel telah diubah oleh sesi lain. Muat ulang sebelum menyimpan.");
  }

  const title = input.title.trim();
  if (!title) throw new Error("Judul artikel wajib diisi.");

  const slug = slugifyPost(input.slug?.trim() || existing.slug || title);
  if (!slug) throw new Error("Slug artikel tidak valid.");

  const dup = db.prepare("SELECT id FROM posts WHERE slug = ? AND id != ?").get(slug, postId);
  if (dup) throw new Error(`Slug '${slug}' sudah digunakan artikel lain.`);

  const sanitizedDoc =
    input.structuredContent === undefined
      ? existing.structuredContent
      : validateAndSanitizeDocument(input.structuredContent);
  const nextStatus: PostStatus = input.status ?? existing.status;

  if (!["draft", "in_review", "published", "scheduled", "archived"].includes(nextStatus)) {
    throw new Error("Status publikasi tidak valid.");
  }

  if (!canChangePostStatus(actor, existing.authorId, nextStatus)) {
    throw new Error("FORBIDDEN: Role Anda tidak diizinkan mengubah artikel ke status tersebut.");
  }

  const nextAuthorId =
    input.authorId && canAssignAuthor(actor.role) ? input.authorId : existing.authorId;

  if (input.canonicalUrl?.trim() && !isSafeHttpOrRelativeUrl(input.canonicalUrl.trim())) {
    throw new Error("URL kanonikal tidak valid atau menggunakan skema yang tidak aman.");
  }

  if (input.coverMediaId) {
    const mediaExists = db.prepare("SELECT id FROM media WHERE id = ?").get(input.coverMediaId);
    if (!mediaExists) throw new Error("Cover media tidak ditemukan.");
  }

  const now = new Date().toISOString();
  let publishedAt = existing.publishedAt;
  let scheduledAt = existing.scheduledAt;

  if (nextStatus === "published") {
    publishedAt = existing.publishedAt ?? now;
    scheduledAt = null;
  } else if (nextStatus === "scheduled") {
    if (!input.scheduledAt || Number.isNaN(Date.parse(input.scheduledAt))) {
      throw new Error("Waktu jadwal publikasi wajib diisi untuk status Terjadwal.");
    }
    scheduledAt = new Date(input.scheduledAt).toISOString();
  } else if (nextStatus === "draft" || nextStatus === "in_review" || nextStatus === "archived") {
    scheduledAt = null;
  }

  const plain = extractPlainText(sanitizedDoc);
  const excerpt =
    (input.excerpt !== undefined ? input.excerpt : existing.excerpt).trim() || plain.slice(0, 220);
  const readingTime = calculateReadingTimeMinutes(sanitizedDoc);
  const featured =
    canPublishPost(actor.role) && input.featured !== undefined
      ? input.featured
        ? 1
        : 0
      : existing.featured
      ? 1
      : 0;

  withTransaction(db, () => {
    db.prepare(
      `UPDATE posts SET
        title = ?, slug = ?, excerpt = ?, structured_content = ?, cover_media_id = ?,
        author_id = ?, status = ?, featured = ?, seo_title = ?, seo_description = ?,
        canonical_url = ?, published_at = ?, scheduled_at = ?, reading_time_minutes = ?,
        revision = revision + 1, updated_at = ?
       WHERE id = ?`
    ).run(
      title,
      slug,
      excerpt,
      JSON.stringify(sanitizedDoc),
      input.coverMediaId === undefined ? existing.coverMediaId : input.coverMediaId,
      nextAuthorId,
      nextStatus,
      featured,
      (input.seoTitle ?? existing.seoTitle).trim().slice(0, 160),
      (input.seoDescription ?? existing.seoDescription).trim().slice(0, 320),
      (input.canonicalUrl ?? existing.canonicalUrl).trim().slice(0, 500),
      publishedAt,
      scheduledAt,
      readingTime,
      now,
      postId
    );

    if (input.categoryIds !== undefined || input.tags !== undefined) {
      syncPostRelations(
        db,
        postId,
        input.categoryIds ?? existing.categories.map((c) => c.id),
        input.tags ?? existing.tags.map((t) => t.name)
      );
    }

    const actionName =
      existing.status !== nextStatus
        ? nextStatus === "published"
          ? "post.publish"
          : nextStatus === "archived"
          ? "post.archive"
          : nextStatus === "draft" && existing.status === "published"
          ? "post.unpublish"
          : nextStatus === "scheduled"
          ? "post.schedule"
          : "post.update"
        : "post.update";

    logActivity(db, {
      actorId: actor.id,
      action: actionName,
      entityType: "post",
      entityId: postId,
      metadata: { title, slug, status: nextStatus, previousStatus: existing.status },
    });
  });

  return getAdminPostById(db, actor, postId)!;
}

export function softDeletePost(db: DatabaseSync, actor: AdminUser, postId: string): void {
  const existing = getAdminPostById(db, actor, postId);
  if (!existing) throw new Error("Artikel tidak ditemukan.");

  if (!canDeletePost(actor, existing.authorId, existing.status)) {
    throw new Error("FORBIDDEN: Anda tidak memiliki izin menghapus artikel ini.");
  }

  const now = new Date().toISOString();
  db.prepare("UPDATE posts SET deleted_at = ?, updated_at = ? WHERE id = ?").run(now, now, postId);

  logActivity(db, {
    actorId: actor.id,
    action: "post.delete",
    entityType: "post",
    entityId: postId,
    metadata: { title: existing.title, slug: existing.slug },
  });
}

export function restorePost(db: DatabaseSync, actor: AdminUser, postId: string): PostRecord {
  const existing = getAdminPostById(db, actor, postId);
  if (!existing) throw new Error("Artikel tidak ditemukan.");

  if (!canPublishPost(actor.role) && existing.authorId !== actor.id) {
    throw new Error("FORBIDDEN: Anda tidak memiliki izin memulihkan artikel ini.");
  }

  const now = new Date().toISOString();
  db.prepare("UPDATE posts SET deleted_at = NULL, updated_at = ? WHERE id = ?").run(now, postId);

  logActivity(db, {
    actorId: actor.id,
    action: "post.restore",
    entityType: "post",
    entityId: postId,
    metadata: { title: existing.title, slug: existing.slug },
  });

  return getAdminPostById(db, actor, postId)!;
}
