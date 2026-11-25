import type { DatabaseSync } from "node:sqlite";
import { logActivity } from "./activity.ts";
import { canManageSettings, type AdminUser } from "./rbac.ts";

export interface CmsSettings {
  blogTitle: string;
  blogDescription: string;
  defaultAuthorDisplay: string;
  defaultSeoDescription: string;
}

const DEFAULTS: CmsSettings = {
  blogTitle: "Blog TELLU.",
  blogDescription:
    "Panduan praktis dan pembahasan seputar website, branding, dan sistem bisnis digital dari tim TELLU.",
  defaultAuthorDisplay: "Tim TELLU",
  defaultSeoDescription:
    "Panduan dan pembahasan seputar pembuatan website, branding, media sosial, dan software bisnis dari TELLU.",
};

export function getCmsSettings(db: DatabaseSync): CmsSettings {
  const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const map = new Map(rows.map((r) => [r.key, r.value]));

  return {
    blogTitle: map.get("blog_title") ?? DEFAULTS.blogTitle,
    blogDescription: map.get("blog_description") ?? DEFAULTS.blogDescription,
    defaultAuthorDisplay: map.get("default_author_display") ?? DEFAULTS.defaultAuthorDisplay,
    defaultSeoDescription: map.get("default_seo_description") ?? DEFAULTS.defaultSeoDescription,
  };
}

export function updateCmsSettings(
  db: DatabaseSync,
  actor: AdminUser,
  input: Partial<CmsSettings>
): CmsSettings {
  if (!canManageSettings(actor.role)) {
    throw new Error("Hanya Owner yang dapat mengubah pengaturan CMS.");
  }

  const current = getCmsSettings(db);
  const next: CmsSettings = {
    blogTitle: (input.blogTitle ?? current.blogTitle).trim() || DEFAULTS.blogTitle,
    blogDescription: (input.blogDescription ?? current.blogDescription).trim() || DEFAULTS.blogDescription,
    defaultAuthorDisplay:
      (input.defaultAuthorDisplay ?? current.defaultAuthorDisplay).trim() || DEFAULTS.defaultAuthorDisplay,
    defaultSeoDescription:
      (input.defaultSeoDescription ?? current.defaultSeoDescription).trim() || DEFAULTS.defaultSeoDescription,
  };

  const now = new Date().toISOString();
  const upsert = db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  );

  upsert.run("blog_title", next.blogTitle, now);
  upsert.run("blog_description", next.blogDescription, now);
  upsert.run("default_author_display", next.defaultAuthorDisplay, now);
  upsert.run("default_seo_description", next.defaultSeoDescription, now);

  logActivity(db, {
    actorId: actor.id,
    action: "settings.update",
    entityType: "settings",
    entityId: "cms",
    metadata: { keys: ["blog_title", "blog_description", "default_author_display", "default_seo_description"] },
  });

  return next;
}
