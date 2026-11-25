import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { DatabaseSync } from "node:sqlite";
import { getCmsPaths } from "./paths.ts";
import { logActivity } from "./activity.ts";
import { extractReferencedMediaIds, validateAndSanitizeDocument } from "./content.ts";
import { canDeleteMedia, canUploadMedia, type AdminUser } from "./rbac.ts";

export const MAX_MEDIA_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export type AllowedImageFormat = "jpeg" | "png" | "webp";

export interface MediaRecord {
  id: string;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
  altText: string;
  uploadedBy: string | null;
  uploadedByName?: string | null;
  createdAt: string;
  usageCount?: number;
}

export function detectImageSignature(buffer: Buffer): AllowedImageFormat | null {
  if (buffer.length < 12) return null;

  // Reject obvious text/SVG/XML payloads immediately
  const headText = buffer.subarray(0, Math.min(256, buffer.length)).toString("utf8").trimStart().toLowerCase();
  if (headText.startsWith("<svg") || headText.startsWith("<?xml") || headText.startsWith("<!doctype")) {
    return null;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  // WebP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }

  return null;
}

export function sanitizeOriginalFilename(filename: string): string {
  const base = path.basename(filename || "image").replace(/[^a-zA-Z0-9._-]/g, "-");
  return base.slice(0, 120) || "image";
}

export function resolveSafeMediaPath(storageKey: string): string {
  if (!storageKey || storageKey.includes("..") || path.isAbsolute(storageKey)) {
    throw new Error("Invalid media storage key");
  }
  const { mediaDir } = getCmsPaths();
  const resolvedRoot = path.resolve(mediaDir);
  const resolvedTarget = path.resolve(resolvedRoot, storageKey);
  if (!resolvedTarget.startsWith(resolvedRoot + path.sep)) {
    throw new Error("Path traversal attempt rejected");
  }
  return resolvedTarget;
}

export async function processAndSaveMedia(
  db: DatabaseSync,
  actor: AdminUser,
  params: {
    buffer: Buffer;
    originalFilename: string;
    altText?: string;
  }
): Promise<MediaRecord> {
  if (!canUploadMedia(actor.role)) {
    throw new Error("Anda tidak memiliki izin mengunggah media.");
  }

  if (params.buffer.length === 0) {
    throw new Error("File gambar kosong.");
  }
  if (params.buffer.length > MAX_MEDIA_UPLOAD_BYTES) {
    throw new Error("Ukuran file melebihi batas maksimal 5 MB.");
  }

  const detected = detectImageSignature(params.buffer);
  if (!detected) {
    throw new Error("Format file tidak didukung. Hanya JPEG, PNG, dan WebP yang valid yang diizinkan.");
  }

  let metadata: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    metadata = await sharp(params.buffer, { failOn: "error" }).metadata();
  } catch {
    throw new Error("File gambar rusak atau tidak valid.");
  }

  if (!metadata.width || !metadata.height || metadata.width > 8000 || metadata.height > 8000) {
    throw new Error("Dimensi gambar tidak valid (maksimal 8000×8000 px).");
  }

  let pipeline = sharp(params.buffer).rotate().resize({
    width: 1920,
    height: 1920,
    fit: "inside",
    withoutEnlargement: true,
  });

  let outExt: string;
  let outMime: string;
  if (detected === "png") {
    pipeline = pipeline.png({ compressionLevel: 9 });
    outExt = "png";
    outMime = "image/png";
  } else if (detected === "webp") {
    pipeline = pipeline.webp({ quality: 84 });
    outExt = "webp";
    outMime = "image/webp";
  } else {
    pipeline = pipeline.jpeg({ quality: 84, mozjpeg: true });
    outExt = "jpg";
    outMime = "image/jpeg";
  }

  const { data: optimizedBuffer, info } = await pipeline.toBuffer({ resolveWithObject: true });

  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const id = `med_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const storageKey = `${year}/${month}/${id}.${outExt}`;
  const fullPath = resolveSafeMediaPath(storageKey);

  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, optimizedBuffer);

  const safeOriginal = sanitizeOriginalFilename(params.originalFilename);
  const altText = (params.altText ?? "").trim().slice(0, 300);
  const createdAt = now.toISOString();

  db.prepare(
    `INSERT INTO media (id, storage_key, original_filename, mime_type, file_size, width, height, alt_text, uploaded_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    storageKey,
    safeOriginal,
    outMime,
    optimizedBuffer.length,
    info.width,
    info.height,
    altText,
    actor.id,
    createdAt
  );

  logActivity(db, {
    actorId: actor.id,
    action: "media.upload",
    entityType: "media",
    entityId: id,
    metadata: { originalFilename: safeOriginal, mimeType: outMime, fileSize: optimizedBuffer.length },
  });

  return {
    id,
    storageKey,
    originalFilename: safeOriginal,
    mimeType: outMime,
    fileSize: optimizedBuffer.length,
    width: info.width,
    height: info.height,
    altText,
    uploadedBy: actor.id,
    uploadedByName: actor.name,
    createdAt,
    usageCount: 0,
  };
}

export function getMediaUsageCount(db: DatabaseSync, mediaId: string): number {
  const coverCountRow = db
    .prepare("SELECT COUNT(*) as cnt FROM posts WHERE cover_media_id = ? AND deleted_at IS NULL")
    .get(mediaId) as { cnt: number };
  let total = Number(coverCountRow.cnt);

  const postsWithContent = db
    .prepare("SELECT id, structured_content FROM posts WHERE deleted_at IS NULL AND structured_content LIKE ?")
    .all(`%${mediaId}%`) as { id: string; structured_content: string }[];

  for (const row of postsWithContent) {
    try {
      const doc = validateAndSanitizeDocument(row.structured_content);
      if (extractReferencedMediaIds(doc).includes(mediaId)) {
        total += 1;
      }
    } catch {
      // ignore invalid legacy JSON
    }
  }

  return total;
}

export function listMedia(db: DatabaseSync, search?: string): MediaRecord[] {
  const q = search?.trim().toLowerCase();
  const rows = (
    q
      ? db
          .prepare(
            `SELECT m.*, u.name as uploaded_by_name
             FROM media m
             LEFT JOIN users u ON u.id = m.uploaded_by
             WHERE LOWER(m.original_filename) LIKE ? OR LOWER(m.alt_text) LIKE ?
             ORDER BY m.created_at DESC`
          )
          .all(`%${q}%`, `%${q}%`)
      : db
          .prepare(
            `SELECT m.*, u.name as uploaded_by_name
             FROM media m
             LEFT JOIN users u ON u.id = m.uploaded_by
             ORDER BY m.created_at DESC`
          )
          .all()
  ) as Record<string, unknown>[];

  return rows.map((r) => ({
    id: String(r.id),
    storageKey: String(r.storage_key),
    originalFilename: String(r.original_filename),
    mimeType: String(r.mime_type),
    fileSize: Number(r.file_size),
    width: Number(r.width),
    height: Number(r.height),
    altText: String(r.alt_text ?? ""),
    uploadedBy: r.uploaded_by ? String(r.uploaded_by) : null,
    uploadedByName: r.uploaded_by_name ? String(r.uploaded_by_name) : null,
    createdAt: String(r.created_at),
    usageCount: getMediaUsageCount(db, String(r.id)),
  }));
}

export function getMediaById(db: DatabaseSync, id: string): MediaRecord | null {
  const r = db
    .prepare(
      `SELECT m.*, u.name as uploaded_by_name
       FROM media m
       LEFT JOIN users u ON u.id = m.uploaded_by
       WHERE m.id = ?
       LIMIT 1`
    )
    .get(id) as Record<string, unknown> | undefined;

  if (!r) return null;
  return {
    id: String(r.id),
    storageKey: String(r.storage_key),
    originalFilename: String(r.original_filename),
    mimeType: String(r.mime_type),
    fileSize: Number(r.file_size),
    width: Number(r.width),
    height: Number(r.height),
    altText: String(r.alt_text ?? ""),
    uploadedBy: r.uploaded_by ? String(r.uploaded_by) : null,
    uploadedByName: r.uploaded_by_name ? String(r.uploaded_by_name) : null,
    createdAt: String(r.created_at),
  };
}

export function updateMediaAltText(db: DatabaseSync, actor: AdminUser, mediaId: string, altText: string): MediaRecord {
  const existing = getMediaById(db, mediaId);
  if (!existing) throw new Error("Media tidak ditemukan.");

  if (actor.role === "author" && existing.uploadedBy !== actor.id) {
    throw new Error("Author hanya dapat memperbarui alt text media yang diunggah sendiri.");
  }

  const cleanAlt = altText.trim().slice(0, 300);
  db.prepare("UPDATE media SET alt_text = ? WHERE id = ?").run(cleanAlt, mediaId);

  logActivity(db, {
    actorId: actor.id,
    action: "media.update_alt",
    entityType: "media",
    entityId: mediaId,
    metadata: { altText: cleanAlt },
  });

  return { ...existing, altText: cleanAlt };
}

export function deleteMedia(db: DatabaseSync, actor: AdminUser, mediaId: string): void {
  if (!canDeleteMedia(actor.role)) {
    throw new Error("Anda tidak memiliki izin menghapus media.");
  }
  const existing = getMediaById(db, mediaId);
  if (!existing) {
    throw new Error("Media tidak ditemukan.");
  }

  const usage = getMediaUsageCount(db, mediaId);
  if (usage > 0) {
    throw new Error("Media tidak dapat dihapus karena masih digunakan oleh artikel.");
  }

  const fullPath = resolveSafeMediaPath(existing.storageKey);
  db.prepare("DELETE FROM media WHERE id = ?").run(mediaId);
  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch {
    // ignore file unlink failure after DB delete
  }

  logActivity(db, {
    actorId: actor.id,
    action: "media.delete",
    entityType: "media",
    entityId: mediaId,
    metadata: { originalFilename: existing.originalFilename },
  });
}

export function isMediaPubliclyAccessible(db: DatabaseSync, mediaId: string, nowIso = new Date().toISOString()): boolean {
  const coverMatch = db
    .prepare(
      `SELECT 1 FROM posts
       WHERE cover_media_id = ?
         AND deleted_at IS NULL
         AND (status = 'published' OR (status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= ?))
       LIMIT 1`
    )
    .get(mediaId, nowIso);
  if (coverMatch) return true;

  const bodyCandidates = db
    .prepare(
      `SELECT structured_content FROM posts
       WHERE deleted_at IS NULL
         AND (status = 'published' OR (status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= ?))
         AND structured_content LIKE ?`
    )
    .all(nowIso, `%${mediaId}%`) as { structured_content: string }[];

  for (const row of bodyCandidates) {
    try {
      const doc = validateAndSanitizeDocument(row.structured_content);
      if (extractReferencedMediaIds(doc).includes(mediaId)) {
        return true;
      }
    } catch {
      // ignore
    }
  }

  return false;
}
