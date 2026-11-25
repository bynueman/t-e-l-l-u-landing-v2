import fs from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { listCategories } from "./categories.ts";
import {
  isSafeHttpOrRelativeUrl,
  validateAndSanitizeDocument,
  type StructuredDocument,
} from "./content.ts";
import { detectImageSignature, listMedia, processAndSaveMedia } from "./media.ts";
import {
  createPost,
  getAdminPostById,
  slugifyPost,
  updatePost,
  type PostRecord,
  type PostStatus,
} from "./posts.ts";
import { canPublishPost, type AdminUser } from "./rbac.ts";

export interface EditorialCoverSpec {
  filename: string;
  altText: string;
}

export interface EditorialArticlePackageItem {
  order: number;
  title: string;
  slug: string;
  excerpt: string;
  categorySlug: "technology" | "creative" | "business";
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  canonicalUrl?: string;
  featured?: boolean;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  searchIntent?: string;
  cover: EditorialCoverSpec;
  structuredContent: StructuredDocument;
}

export interface EditorialPackageManifest {
  packageId: string;
  version: string;
  articles: {
    order: number;
    slug: string;
    file: string;
  }[];
}

export interface ValidatedPackageArticle {
  article: EditorialArticlePackageItem;
  coverPath: string;
  coverBuffer: Buffer;
}

export interface ImportOptions {
  packageDir: string;
  actor: AdminUser;
  targetStatus?: PostStatus;
  dryRun?: boolean;
  replaceExisting?: boolean;
  confirmReplace?: boolean;
  publishExistingDrafts?: boolean;
  onlySlugs?: string[];
}

export interface ImportItemResult {
  slug: string;
  title: string;
  action: "created" | "updated" | "skipped" | "failed" | "would_create" | "would_update" | "would_skip";
  postId?: string;
  mediaId?: string;
  reason?: string;
}

export interface ImportReport {
  packageId: string;
  version: string;
  dryRun: boolean;
  targetStatus: PostStatus;
  actorEmail: string;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  items: ImportItemResult[];
}

/**
 * Resolves an eligible active Owner or Editor user from the database.
 */
export function resolveImportActor(db: DatabaseSync, actorEmail?: string): AdminUser {
  const rows = db
    .prepare(
      `SELECT id, name, email, role, status
       FROM users
       WHERE status = 'active' AND role IN ('owner', 'editor')
       ORDER BY CASE role WHEN 'owner' THEN 0 ELSE 1 END, created_at ASC`
    )
    .all() as unknown as AdminUser[];

  if (rows.length === 0) {
    throw new Error("Tidak ada akun Owner atau Editor aktif di database CMS. Jalankan npm run cms:init-owner terlebih dahulu.");
  }

  if (actorEmail) {
    const normalized = actorEmail.trim().toLowerCase();
    const matched = rows.find((u) => u.email.toLowerCase() === normalized);
    if (!matched) {
      throw new Error(`Akun aktif dengan role owner/editor tidak ditemukan untuk email: ${actorEmail}`);
    }
    return matched;
  }

  const owners = rows.filter((u) => u.role === "owner");
  if (owners.length === 1) {
    return owners[0];
  }

  if (rows.length === 1) {
    return rows[0];
  }

  throw new Error("Terdapat lebih dari satu akun pengelola. Sertakan --author-email=<email> secara eksplisit.");
}

function assertSafePackageSubpath(baseDir: string, relativePath: string): string {
  if (!relativePath || path.isAbsolute(relativePath) || relativePath.includes("..")) {
    throw new Error(`Path paket tidak valid: ${relativePath}`);
  }
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, relativePath);
  if (!resolvedTarget.startsWith(resolvedBase + path.sep)) {
    throw new Error(`Path di luar direktori paket ditolak: ${relativePath}`);
  }
  return resolvedTarget;
}

/**
 * Loads and validates all manifest entries, article documents, and cover images before any DB writes.
 */
export function loadAndValidatePackage(
  db: DatabaseSync,
  packageDir: string,
  onlySlugs?: string[]
): { manifest: EditorialPackageManifest; entries: ValidatedPackageArticle[]; categoryIdBySlug: Map<string, string> } {
  const resolvedDir = path.resolve(packageDir);
  const manifestPath = path.join(resolvedDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest paket tidak ditemukan di: ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as EditorialPackageManifest;
  if (!manifest.packageId || !manifest.version || !Array.isArray(manifest.articles) || manifest.articles.length === 0) {
    throw new Error("Struktur manifest.json paket editorial tidak valid.");
  }

  const categories = listCategories(db);
  const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));
  const slugFilter = onlySlugs && onlySlugs.length > 0 ? new Set(onlySlugs) : null;
  const seenSlugs = new Set<string>();
  const entries: ValidatedPackageArticle[] = [];

  for (const ref of manifest.articles) {
    if (slugFilter && !slugFilter.has(ref.slug)) continue;

    const articlePath = assertSafePackageSubpath(resolvedDir, ref.file);
    if (!fs.existsSync(articlePath)) {
      throw new Error(`File artikel tidak ditemukan: ${ref.file}`);
    }

    const raw = JSON.parse(fs.readFileSync(articlePath, "utf8")) as EditorialArticlePackageItem;
    const normalizedSlug = slugifyPost(raw.slug || "");
    if (!raw.title?.trim() || !normalizedSlug || normalizedSlug !== raw.slug) {
      throw new Error(`Judul atau slug artikel tidak valid pada ${ref.file}`);
    }
    if (seenSlugs.has(normalizedSlug)) {
      throw new Error(`Duplikasi slug dalam paket: ${normalizedSlug}`);
    }
    seenSlugs.add(normalizedSlug);

    if (!raw.excerpt?.trim() || !raw.seoTitle?.trim() || !raw.seoDescription?.trim()) {
      throw new Error(`Metadata SEO/excerpt wajib lengkap pada ${ref.file}`);
    }
    if (!categoryIdBySlug.has(raw.categorySlug)) {
      throw new Error(`Kategori '${raw.categorySlug}' belum tersedia di CMS.`);
    }
    if (raw.canonicalUrl && !isSafeHttpOrRelativeUrl(raw.canonicalUrl)) {
      throw new Error(`Canonical URL tidak valid pada ${ref.file}`);
    }

    const sanitizedDoc = validateAndSanitizeDocument(raw.structuredContent);
    if (!raw.cover?.filename || !raw.cover?.altText?.trim()) {
      throw new Error(`Data cover dan altText wajib diisi pada ${ref.file}`);
    }

    const coverPath = assertSafePackageSubpath(resolvedDir, path.join("covers", raw.cover.filename));
    if (!fs.existsSync(coverPath)) {
      throw new Error(`File gambar sampul tidak ditemukan: covers/${raw.cover.filename}`);
    }

    const coverBuffer = fs.readFileSync(coverPath);
    if (!detectImageSignature(coverBuffer)) {
      throw new Error(`Format gambar sampul tidak valid: covers/${raw.cover.filename}`);
    }

    entries.push({
      article: { ...raw, structuredContent: sanitizedDoc },
      coverPath,
      coverBuffer,
    });
  }

  if (entries.length === 0) {
    throw new Error("Tidak ada artikel yang cocok untuk diimpor dari paket.");
  }

  return { manifest, entries, categoryIdBySlug };
}

function findReusableMediaId(
  db: DatabaseSync,
  filename: string,
  altText: string
): string | null {
  const existing = listMedia(db, filename).find(
    (m) => m.originalFilename === filename && (!altText || m.altText === altText)
  );
  return existing?.id ?? null;
}

/**
 * Imports a validated editorial package into the TELLU CMS using the existing service layer.
 */
export async function importEditorialPackage(
  db: DatabaseSync,
  options: ImportOptions
): Promise<ImportReport> {
  const targetStatus: PostStatus = options.targetStatus ?? "draft";
  if (!["draft", "in_review", "published"].includes(targetStatus)) {
    throw new Error(`Status target tidak didukung oleh importer: ${targetStatus}`);
  }
  if ((targetStatus === "published" || options.publishExistingDrafts) && !canPublishPost(options.actor.role)) {
    throw new Error("FORBIDDEN: Akun pelaksana tidak memiliki izin menerbitkan artikel.");
  }
  if (options.replaceExisting && !options.confirmReplace) {
    throw new Error("Penggantian artikel yang sudah ada memerlukan konfirmasi eksplisit (--confirm-replace).");
  }
  if (options.publishExistingDrafts && options.replaceExisting) {
    throw new Error("Opsi --publish-drafts tidak dapat digabungkan dengan --replace.");
  }

  const { manifest, entries, categoryIdBySlug } = loadAndValidatePackage(
    db,
    options.packageDir,
    options.onlySlugs
  );

  const report: ImportReport = {
    packageId: manifest.packageId,
    version: manifest.version,
    dryRun: Boolean(options.dryRun),
    targetStatus,
    actorEmail: options.actor.email,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    items: [],
  };

  for (const entry of entries) {
    const { article, coverBuffer } = entry;
    const categoryId = categoryIdBySlug.get(article.categorySlug)!;
    const existingRow = db
      .prepare("SELECT id, status, deleted_at FROM posts WHERE slug = ? LIMIT 1")
      .get(article.slug) as { id: string; status: PostStatus; deleted_at: string | null } | undefined;

    if (existingRow?.deleted_at) {
      report.skipped += 1;
      report.items.push({
        slug: article.slug,
        title: article.title,
        action: options.dryRun ? "would_skip" : "skipped",
        postId: existingRow.id,
        reason: "Slug sudah ada di tempat sampah (soft-deleted); lewati agar aman.",
      });
      continue;
    }

    if (existingRow && options.publishExistingDrafts) {
      if (existingRow.status === "published") {
        report.skipped += 1;
        report.items.push({
          slug: article.slug,
          title: article.title,
          action: options.dryRun ? "would_skip" : "skipped",
          postId: existingRow.id,
          reason: "Artikel sudah berstatus published.",
        });
        continue;
      }
      if (existingRow.status !== "draft" && existingRow.status !== "in_review") {
        report.skipped += 1;
        report.items.push({
          slug: article.slug,
          title: article.title,
          action: options.dryRun ? "would_skip" : "skipped",
          postId: existingRow.id,
          reason: `Status saat ini '${existingRow.status}' tidak diubah oleh --publish-drafts.`,
        });
        continue;
      }
      if (options.dryRun) {
        report.updated += 1;
        report.items.push({
          slug: article.slug,
          title: article.title,
          action: "would_update",
          postId: existingRow.id,
          reason: `Akan menerbitkan ${existingRow.status} yang ada tanpa menimpa isi.`,
        });
        continue;
      }
      const current = getAdminPostById(db, options.actor, existingRow.id);
      if (!current) throw new Error("Artikel tidak dapat diakses.");
      const publishedPost = updatePost(db, options.actor, current.id, {
        title: current.title,
        status: "published",
        expectedRevision: current.revision,
      });
      report.updated += 1;
      report.items.push({
        slug: publishedPost.slug,
        title: publishedPost.title,
        action: "updated",
        postId: publishedPost.id,
        reason: "Diterbitkan dari draft tanpa menimpa suntingan Owner.",
      });
      continue;
    }

    if (existingRow && !options.replaceExisting) {
      report.skipped += 1;
      report.items.push({
        slug: article.slug,
        title: article.title,
        action: options.dryRun ? "would_skip" : "skipped",
        postId: existingRow.id,
        reason: "Artikel dengan slug ini sudah ada (gunakan --replace --confirm-replace untuk memperbarui).",
      });
      continue;
    }

    if (options.dryRun) {
      const action = existingRow ? "would_update" : "would_create";
      if (existingRow) report.updated += 1;
      else report.created += 1;
      report.items.push({
        slug: article.slug,
        title: article.title,
        action,
        postId: existingRow?.id,
      });
      continue;
    }

    try {
      let mediaId = findReusableMediaId(db, article.cover.filename, article.cover.altText);
      if (!mediaId) {
        const uploaded = await processAndSaveMedia(db, options.actor, {
          buffer: coverBuffer,
          originalFilename: article.cover.filename,
          altText: article.cover.altText,
        });
        mediaId = uploaded.id;
      }

      let savedPost: PostRecord;
      if (existingRow) {
        const current = getAdminPostById(db, options.actor, existingRow.id);
        if (!current) throw new Error("Artikel tidak dapat diakses.");
        savedPost = updatePost(db, options.actor, current.id, {
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          structuredContent: article.structuredContent,
          coverMediaId: mediaId,
          status: targetStatus,
          featured: Boolean(article.featured),
          seoTitle: article.seoTitle,
          seoDescription: article.seoDescription,
          canonicalUrl: article.canonicalUrl ?? "",
          categoryIds: [categoryId],
          tags: article.tags,
          expectedRevision: current.revision,
        });
        report.updated += 1;
        report.items.push({
          slug: savedPost.slug,
          title: savedPost.title,
          action: "updated",
          postId: savedPost.id,
          mediaId,
        });
      } else {
        savedPost = createPost(db, options.actor, {
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          structuredContent: article.structuredContent,
          coverMediaId: mediaId,
          status: targetStatus,
          featured: Boolean(article.featured),
          seoTitle: article.seoTitle,
          seoDescription: article.seoDescription,
          canonicalUrl: article.canonicalUrl ?? "",
          categoryIds: [categoryId],
          tags: article.tags,
        });
        report.created += 1;
        report.items.push({
          slug: savedPost.slug,
          title: savedPost.title,
          action: "created",
          postId: savedPost.id,
          mediaId,
        });
      }
    } catch (error) {
      report.failed += 1;
      report.items.push({
        slug: article.slug,
        title: article.title,
        action: "failed",
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return report;
}
