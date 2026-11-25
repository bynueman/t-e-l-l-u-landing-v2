import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { getCmsPaths } from "./paths.ts";

interface Migration {
  version: number;
  name: string;
  up: (db: DatabaseSync) => void;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: "001_initial_cms_schema",
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE COLLATE NOCASE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'author')),
          status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL,
          revoked_at TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);

        CREATE TABLE IF NOT EXISTS media (
          id TEXT PRIMARY KEY,
          storage_key TEXT NOT NULL UNIQUE,
          original_filename TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          width INTEGER NOT NULL,
          height INTEGER NOT NULL,
          alt_text TEXT NOT NULL DEFAULT '',
          uploaded_by TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
        );
        CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);

        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          description TEXT NOT NULL DEFAULT '',
          ecosystem TEXT CHECK (ecosystem IN ('technology', 'creative', 'business') OR ecosystem IS NULL),
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS posts (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          excerpt TEXT NOT NULL DEFAULT '',
          structured_content TEXT NOT NULL,
          cover_media_id TEXT,
          author_id TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'published', 'scheduled', 'archived')),
          featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
          seo_title TEXT NOT NULL DEFAULT '',
          seo_description TEXT NOT NULL DEFAULT '',
          canonical_url TEXT NOT NULL DEFAULT '',
          published_at TEXT,
          scheduled_at TEXT,
          reading_time_minutes INTEGER NOT NULL DEFAULT 1,
          revision INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          FOREIGN KEY (cover_media_id) REFERENCES media(id) ON DELETE SET NULL,
          FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT
        );
        CREATE INDEX IF NOT EXISTS idx_posts_status_pub ON posts(status, published_at DESC);
        CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
        CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);

        CREATE TABLE IF NOT EXISTS post_categories (
          post_id TEXT NOT NULL,
          category_id TEXT NOT NULL,
          PRIMARY KEY (post_id, category_id),
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
        );
        CREATE INDEX IF NOT EXISTS idx_post_categories_cat ON post_categories(category_id);

        CREATE TABLE IF NOT EXISTS tags (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS post_tags (
          post_id TEXT NOT NULL,
          tag_id TEXT NOT NULL,
          PRIMARY KEY (post_id, tag_id),
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_post_tags_tag ON post_tags(tag_id);

        CREATE TABLE IF NOT EXISTS activity_logs (
          id TEXT PRIMARY KEY,
          actor_id TEXT,
          action TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id TEXT,
          safe_metadata TEXT NOT NULL DEFAULT '{}',
          created_at TEXT NOT NULL,
          FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
        );
        CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at DESC);

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS login_rate_limits (
          rate_key TEXT PRIMARY KEY,
          attempts INTEGER NOT NULL DEFAULT 0,
          window_start INTEGER NOT NULL,
          locked_until INTEGER
        );
      `);

      const now = new Date().toISOString();
      const insertCat = db.prepare(`
        INSERT OR IGNORE INTO categories (id, name, slug, description, ecosystem, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      insertCat.run(
        "cat_technology",
        "Technology",
        "technology",
        "Artikel seputar pembuatan website, revamp, infrastruktur web, dan rekayasa digital.",
        "technology",
        now,
        now
      );
      insertCat.run(
        "cat_creative",
        "Creative",
        "creative",
        "Wawasan tentang identitas visual, komunikasi brand, konten kreatif, dan media sosial.",
        "creative",
        now,
        now
      );
      insertCat.run(
        "cat_business",
        "Business",
        "business",
        "Pembahasan seputar perangkat lunak SaaS, alur kerja tim, dan digitalisasi operasional.",
        "business",
        now,
        now
      );

      const insertSetting = db.prepare(`
        INSERT OR IGNORE INTO settings (key, value, updated_at)
        VALUES (?, ?, ?)
      `);
      insertSetting.run("blog_title", "Blog TELLU.", now);
      insertSetting.run(
        "blog_description",
        "Panduan praktis dan pembahasan seputar website, branding, dan sistem bisnis digital dari tim TELLU.",
        now
      );
      insertSetting.run("default_author_display", "Tim TELLU", now);
      insertSetting.run(
        "default_seo_description",
        "Panduan dan pembahasan seputar pembuatan website, branding, media sosial, dan software bisnis dari TELLU.",
        now
      );
    },
  },
];

let cachedDb: DatabaseSync | null = null;
let cachedDbPath: string | null = null;

export function runMigrations(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedRows = db.prepare("SELECT version FROM _migrations").all();
  const applied = new Set(appliedRows.map((row) => Number(row.version)));

  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;
    db.exec("BEGIN IMMEDIATE");
    try {
      migration.up(db);
      db.prepare("INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)").run(
        migration.version,
        migration.name,
        new Date().toISOString()
      );
      db.exec("COMMIT");
    } catch (error) {
      try {
        db.exec("ROLLBACK");
      } catch {
        // ignore rollback error
      }
      throw error;
    }
  }
}

export function getDb(): DatabaseSync {
  const { dbPath, dbDir, mediaDir } = getCmsPaths();

  if (cachedDb && cachedDbPath === dbPath) {
    return cachedDb;
  }

  if (cachedDb) {
    try {
      cachedDb.close();
    } catch {
      // ignore close error
    }
    cachedDb = null;
  }

  fs.mkdirSync(dbDir, { recursive: true });
  fs.mkdirSync(mediaDir, { recursive: true });

  const db = new DatabaseSync(dbPath, { timeout: 5000 });
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");
  runMigrations(db);

  cachedDb = db;
  cachedDbPath = dbPath;
  return db;
}

export function closeDb(): void {
  if (cachedDb) {
    try {
      cachedDb.close();
    } catch {
      // ignore
    }
    cachedDb = null;
    cachedDbPath = null;
  }
}

export function withTransaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // ignore
    }
    throw error;
  }
}
