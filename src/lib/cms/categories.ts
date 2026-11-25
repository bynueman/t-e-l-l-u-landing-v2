import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { withTransaction } from "./db.ts";
import { logActivity } from "./activity.ts";
import { canManageCategories, type AdminUser } from "./rbac.ts";

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  ecosystem: "technology" | "creative" | "business" | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export function slugifyCategory(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function listCategories(db: DatabaseSync): CategoryRecord[] {
  const rows = db
    .prepare(
      `SELECT c.*,
              (SELECT COUNT(*) FROM post_categories pc
               JOIN posts p ON p.id = pc.post_id
               WHERE pc.category_id = c.id AND p.deleted_at IS NULL) as usage_count
       FROM categories c
       ORDER BY c.name ASC`
    )
    .all() as Record<string, unknown>[];

  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    slug: String(r.slug),
    description: String(r.description ?? ""),
    ecosystem: (r.ecosystem as CategoryRecord["ecosystem"]) ?? null,
    usageCount: Number(r.usage_count ?? 0),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  }));
}

export function createCategory(
  db: DatabaseSync,
  actor: AdminUser,
  input: {
    name: string;
    slug?: string;
    description?: string;
    ecosystem?: "technology" | "creative" | "business" | null;
  }
): CategoryRecord {
  if (!canManageCategories(actor.role)) {
    throw new Error("Anda tidak memiliki izin mengelola kategori.");
  }

  const name = input.name.trim();
  if (!name) throw new Error("Nama kategori wajib diisi.");
  const slug = slugifyCategory(input.slug?.trim() || name);
  if (!slug) throw new Error("Slug kategori tidak valid.");

  const dup = db.prepare("SELECT id FROM categories WHERE slug = ?").get(slug);
  if (dup) throw new Error(`Slug kategori '${slug}' sudah digunakan.`);

  const id = `cat_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const now = new Date().toISOString();
  const description = (input.description ?? "").trim();
  const ecosystem = input.ecosystem ?? null;

  db.prepare(
    `INSERT INTO categories (id, name, slug, description, ecosystem, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, name, slug, description, ecosystem, now, now);

  logActivity(db, {
    actorId: actor.id,
    action: "category.create",
    entityType: "category",
    entityId: id,
    metadata: { name, slug },
  });

  return { id, name, slug, description, ecosystem, usageCount: 0, createdAt: now, updatedAt: now };
}

export function updateCategory(
  db: DatabaseSync,
  actor: AdminUser,
  categoryId: string,
  input: {
    name: string;
    slug?: string;
    description?: string;
    ecosystem?: "technology" | "creative" | "business" | null;
  }
): CategoryRecord {
  if (!canManageCategories(actor.role)) {
    throw new Error("Anda tidak memiliki izin mengelola kategori.");
  }

  const existing = db.prepare("SELECT * FROM categories WHERE id = ?").get(categoryId) as Record<string, unknown> | undefined;
  if (!existing) throw new Error("Kategori tidak ditemukan.");

  const name = input.name.trim();
  if (!name) throw new Error("Nama kategori wajib diisi.");
  const slug = slugifyCategory(input.slug?.trim() || name);
  if (!slug) throw new Error("Slug kategori tidak valid.");

  const dup = db.prepare("SELECT id FROM categories WHERE slug = ? AND id != ?").get(slug, categoryId);
  if (dup) throw new Error(`Slug kategori '${slug}' sudah digunakan.`);

  const now = new Date().toISOString();
  const description = (input.description ?? "").trim();
  const ecosystem = input.ecosystem ?? null;

  db.prepare(
    `UPDATE categories SET name = ?, slug = ?, description = ?, ecosystem = ?, updated_at = ? WHERE id = ?`
  ).run(name, slug, description, ecosystem, now, categoryId);

  logActivity(db, {
    actorId: actor.id,
    action: "category.update",
    entityType: "category",
    entityId: categoryId,
    metadata: { name, slug },
  });

  const usageRow = db
    .prepare(
      `SELECT COUNT(*) as cnt FROM post_categories pc JOIN posts p ON p.id = pc.post_id WHERE pc.category_id = ? AND p.deleted_at IS NULL`
    )
    .get(categoryId) as { cnt: number };

  return {
    id: categoryId,
    name,
    slug,
    description,
    ecosystem,
    usageCount: Number(usageRow.cnt),
    createdAt: String(existing.created_at),
    updatedAt: now,
  };
}

export function deleteCategory(
  db: DatabaseSync,
  actor: AdminUser,
  categoryId: string,
  reassignToCategoryId?: string
): void {
  if (!canManageCategories(actor.role)) {
    throw new Error("Anda tidak memiliki izin menghapus kategori.");
  }

  const existing = db.prepare("SELECT id, name FROM categories WHERE id = ?").get(categoryId) as
    | { id: string; name: string }
    | undefined;
  if (!existing) throw new Error("Kategori tidak ditemukan.");

  const usageRow = db
    .prepare("SELECT COUNT(*) as cnt FROM post_categories WHERE category_id = ?")
    .get(categoryId) as { cnt: number };
  const usage = Number(usageRow.cnt);

  if (usage > 0) {
    if (!reassignToCategoryId || reassignToCategoryId === categoryId) {
      throw new Error(
        "Kategori masih digunakan oleh artikel. Pilih kategori tujuan untuk memindahkan artikel terlebih dahulu."
      );
    }
    const target = db.prepare("SELECT id FROM categories WHERE id = ?").get(reassignToCategoryId);
    if (!target) {
      throw new Error("Kategori tujuan pemindahan tidak ditemukan.");
    }

    withTransaction(db, () => {
      db.prepare(
        `INSERT OR IGNORE INTO post_categories (post_id, category_id)
         SELECT post_id, ? FROM post_categories WHERE category_id = ?`
      ).run(reassignToCategoryId, categoryId);
      db.prepare("DELETE FROM post_categories WHERE category_id = ?").run(categoryId);
      db.prepare("DELETE FROM categories WHERE id = ?").run(categoryId);
    });
  } else {
    db.prepare("DELETE FROM categories WHERE id = ?").run(categoryId);
  }

  logActivity(db, {
    actorId: actor.id,
    action: "category.delete",
    entityType: "category",
    entityId: categoryId,
    metadata: { name: existing.name, reassignedTo: reassignToCategoryId ?? null },
  });
}
