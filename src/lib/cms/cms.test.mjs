import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import sharp from "sharp";

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "tellu-cms-accept-"));
const dbPath = path.join(tempRoot, "cms", "tellu.sqlite");
const mediaDir = path.join(tempRoot, "media");
const backupDir = path.join(tempRoot, "backups");

process.env.TELLU_CMS_DB_PATH = dbPath;
process.env.TELLU_CMS_MEDIA_DIR = mediaDir;
process.env.TELLU_CMS_BACKUP_DIR = backupDir;

const dbMod = await import("./db.ts");
const usersMod = await import("./users.ts");
const authMod = await import("./auth.ts");
const postsMod = await import("./posts.ts");
const categoriesMod = await import("./categories.ts");
const mediaMod = await import("./media.ts");
const contentMod = await import("./content.ts");
const netMod = await import("./network-safety.ts");
const settingsMod = await import("./settings.ts");
const backupMod = await import("./backup.ts");
const timeMod = await import("./time.ts");

describe("TELLU CMS Phase 1 Acceptance & Security Suite", () => {
  let db;
  let owner;
  let editor;
  let author;

  before(() => {
    db = dbMod.getDb();
    // Run migrations a second time to verify idempotency
    dbMod.runMigrations(db);
  });

  after(() => {
    dbMod.closeDb();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("starts with zero posts, zero users, and default categories outside public/ and .next/", () => {
    assert.equal(db.prepare("SELECT COUNT(*) as c FROM posts").get().c, 0);
    assert.equal(db.prepare("SELECT COUNT(*) as c FROM users").get().c, 0);
    assert.equal(categoriesMod.listCategories(db).length, 3);
    assert.ok(!dbPath.includes(`${path.sep}public${path.sep}`));
    assert.ok(!mediaDir.includes(`${path.sep}public${path.sep}`));
  });

  it("creates Owner, Editor, and Author accounts without storing plaintext passwords", () => {
    owner = usersMod.createInternalUser(db, null, {
      name: "Owner TELLU",
      email: "owner@tellu.local",
      password: "OwnerStrongPassword!2026",
      role: "owner",
    });
    editor = usersMod.createInternalUser(db, owner, {
      name: "Editor TELLU",
      email: "editor@tellu.local",
      password: "EditorStrongPassword!2026",
      role: "editor",
    });
    author = usersMod.createInternalUser(db, owner, {
      name: "Author TELLU",
      email: "author@tellu.local",
      password: "AuthorStrongPassword!2026",
      role: "author",
    });

    const row = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(owner.id);
    assert.ok(String(row.password_hash).startsWith("scrypt$"));
    assert.ok(!String(row.password_hash).includes("OwnerStrongPassword!2026"));

    // Non-owner cannot create internal users
    assert.throws(
      () =>
        usersMod.createInternalUser(db, editor, {
          name: "Unauthorized",
          email: "unauth@tellu.local",
          password: "StrongPassword123!",
          role: "author",
        }),
      /Hanya Owner/
    );
  });

  it("enforces login rate limiting, hashed sessions, rotation, and logout revocation", () => {
    for (let i = 0; i < 5; i += 1) {
      const fail = authMod.authenticateCredentials(db, {
        email: "owner@tellu.local",
        password: "wrong-password-123",
        ip: "127.0.0.99",
      });
      assert.equal(fail.ok, false);
      assert.equal(fail.status, 401);
    }

    // 6th attempt from same IP+email triggers rate lock
    const locked = authMod.authenticateCredentials(db, {
      email: "owner@tellu.local",
      password: "OwnerStrongPassword!2026",
      ip: "127.0.0.99",
    });
    assert.equal(locked.ok, false);
    assert.equal(locked.status, 429);

    // Valid login from clean IP succeeds and stores only SHA-256 hash in DB
    const login1 = authMod.authenticateCredentials(db, {
      email: "owner@tellu.local",
      password: "OwnerStrongPassword!2026",
      ip: "127.0.0.1",
    });
    assert.equal(login1.ok, true);
    const dbSession = db
      .prepare("SELECT token_hash FROM sessions WHERE user_id = ? AND revoked_at IS NULL")
      .get(owner.id);
    assert.notEqual(dbSession.token_hash, login1.rawToken);
    assert.equal(authMod.getUserBySessionToken(db, login1.rawToken)?.id, owner.id);

    // Rotation revokes previous token
    const login2 = authMod.authenticateCredentials(db, {
      email: "owner@tellu.local",
      password: "OwnerStrongPassword!2026",
      ip: "127.0.0.1",
      priorToken: login1.rawToken,
    });
    assert.equal(login2.ok, true);
    assert.equal(authMod.getUserBySessionToken(db, login1.rawToken), null);
    assert.equal(authMod.getUserBySessionToken(db, login2.rawToken)?.id, owner.id);

    // Logout revokes active token
    authMod.revokeSessionByRawToken(db, login2.rawToken);
    assert.equal(authMod.getUserBySessionToken(db, login2.rawToken), null);
  });

  it("enforces fail-closed production HTTPS admin network policy and origin checks", () => {
    // Default production without flags -> blocked
    const prodDefault = netMod.evaluateAdminNetworkPolicy({ nodeEnv: "production" });
    assert.equal(prodDefault.allowed, false);

    // HTTP origin in production -> blocked
    const prodHttpOrigin = netMod.evaluateAdminNetworkPolicy({
      nodeEnv: "production",
      adminEnabled: "true",
      adminOrigin: "http://cms.tellu.web.id",
      trustProxy: "true",
      forwardedProto: "https",
      hostHeader: "cms.tellu.web.id",
    });
    assert.equal(prodHttpOrigin.allowed, false);

    // Valid HTTPS origin + forwarded https + matching host -> allowed
    const prodValid = netMod.evaluateAdminNetworkPolicy({
      nodeEnv: "production",
      adminEnabled: "true",
      adminOrigin: "https://cms.tellu.web.id",
      trustProxy: "true",
      forwardedProto: "https",
      hostHeader: "cms.tellu.web.id",
    });
    assert.equal(prodValid.allowed, true);
    assert.equal(prodValid.isHttps, true);

    // Origin CSRF check
    const badReq = new Request("http://localhost:3000/api/admin/posts", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "https://evil.example",
      },
    });
    assert.equal(netMod.verifyMutationOrigin(badReq), false);

    const goodReq = new Request("http://localhost:3000/api/admin/posts", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
    });
    assert.equal(netMod.verifyMutationOrigin(goodReq), true);
  });

  it("rejects XSS payloads, unsafe links, SVG/executable uploads, and traversal paths", async () => {
    // XSS & unsafe links rejected
    assert.throws(() => {
      contentMod.validateAndSanitizeDocument({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Click",
                marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
              },
            ],
          },
        ],
      });
    }, /Unsafe link href rejected/);

    assert.throws(() => {
      contentMod.validateAndSanitizeDocument({
        type: "doc",
        content: [{ type: "script", content: [] }],
      });
    }, /Unsupported content node type/);

    assert.throws(() => {
      contentMod.validateAndSanitizeDocument({
        type: "doc",
        content: [{ type: "image", attrs: { src: "https://evil.test/tracker.png" } }],
      });
    }, /Unsafe or unsupported image source rejected/);

    // SVG / fake image signature rejected
    const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    assert.equal(mediaMod.detectImageSignature(svgBuffer), null);
    await assert.rejects(
      () =>
        mediaMod.processAndSaveMedia(db, owner, {
          buffer: svgBuffer,
          originalFilename: "fake.jpg",
        }),
      /Format file tidak didukung/
    );

    // Path traversal rejected
    assert.throws(() => mediaMod.resolveSafeMediaPath("../../etc/passwd"), /Invalid|traversal/);

    // Real PNG via sharp succeeds
    const validPng = await sharp({
      create: { width: 120, height: 80, channels: 3, background: { r: 32, g: 33, b: 31 } },
    })
      .png()
      .toBuffer();

    const savedMedia = await mediaMod.processAndSaveMedia(db, author, {
      buffer: validPng,
      originalFilename: "cover-test.png",
      altText: "Ilustrasi Sistem Digital TELLU",
    });

    assert.ok(savedMedia.id.startsWith("med_"));
    assert.equal(savedMedia.mimeType, "image/png");
    assert.equal(mediaMod.isMediaPubliclyAccessible(db, savedMedia.id), false);
    assert.ok(fs.existsSync(mediaMod.resolveSafeMediaPath(savedMedia.storageKey)));
  });

  it("handles Draft -> In Review -> Publish -> Edit -> Unpublish -> Schedule -> Soft Delete -> Restore & RBAC", () => {
    const categories = categoriesMod.listCategories(db);
    const techCat = categories.find((c) => c.slug === "technology");
    const mediaRow = db.prepare("SELECT id FROM media LIMIT 1").get();
    const mediaId = String(mediaRow.id);

    // Author creates draft
    const draft = postsMod.createPost(db, author, {
      title: "Arsitektur Sistem Digital Skala Bisnis",
      excerpt: "Ringkasan arsitektur modern untuk operasional bisnis.",
      structuredContent: {
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Pendahuluan" }] },
          {
            type: "paragraph",
            content: [{ type: "text", text: "Konten terstruktur aman dan mudah dirawat." }],
          },
          { type: "image", attrs: { src: `/api/media/${mediaId}`, alt: "Diagram" } },
        ],
      },
      coverMediaId: mediaId,
      categoryIds: [techCat.id],
      tags: ["Arsitektur", "NextJS"],
      status: "draft",
    });

    assert.equal(draft.status, "draft");
    assert.equal(postsMod.listPublicPosts(db).length, 0);
    assert.equal(postsMod.getPublicPostBySlug(db, draft.slug), null);
    assert.equal(postsMod.getAdminPostById(db, author, draft.id)?.id, draft.id);

    // Author CANNOT publish directly
    assert.throws(
      () =>
        postsMod.updatePost(db, author, draft.id, {
          title: draft.title,
          status: "published",
        }),
      /FORBIDDEN/
    );

    // Author moves to in_review
    const inReview = postsMod.updatePost(db, author, draft.id, {
      title: draft.title,
      status: "in_review",
      expectedRevision: draft.revision,
    });
    assert.equal(inReview.status, "in_review");
    assert.equal(postsMod.listPublicPosts(db).length, 0);

    // Editor publishes post
    const published = postsMod.updatePost(db, editor, draft.id, {
      title: draft.title,
      status: "published",
      expectedRevision: inReview.revision,
    });
    assert.equal(published.status, "published");
    assert.equal(postsMod.listPublicPosts(db).length, 1);
    assert.equal(postsMod.getPublicPostBySlug(db, published.slug)?.id, published.id);
    assert.equal(mediaMod.isMediaPubliclyAccessible(db, mediaId), true);

    // Media deletion protected while referenced by post
    assert.throws(() => mediaMod.deleteMedia(db, editor, mediaId), /masih digunakan/);

    // Stale optimistic revision fails
    assert.throws(
      () =>
        postsMod.updatePost(db, editor, draft.id, {
          title: "Judul Konflik",
          expectedRevision: inReview.revision,
        }),
      /CONFLICT/
    );

    // Unpublish removes from public immediately
    const unpublished = postsMod.updatePost(db, editor, draft.id, {
      title: draft.title,
      status: "draft",
      expectedRevision: published.revision,
    });
    assert.equal(postsMod.listPublicPosts(db).length, 0);
    assert.equal(mediaMod.isMediaPubliclyAccessible(db, mediaId), false);

    // Future schedule (UTC converted from WIB) stays hidden until timestamp passes
    const futureWibIso = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const wibInput = timeMod.utcIsoToJakartaInputValue(futureWibIso);
    const convertedBackUtc = timeMod.jakartaInputValueToUtcIso(wibInput);
    assert.ok(convertedBackUtc && new Date(convertedBackUtc).getTime() > Date.now());

    const scheduledFuture = postsMod.updatePost(db, editor, draft.id, {
      title: draft.title,
      status: "scheduled",
      scheduledAt: futureWibIso,
      expectedRevision: unpublished.revision,
    });
    assert.equal(postsMod.listPublicPosts(db).length, 0);

    // Past schedule becomes publicly visible automatically
    const pastIso = new Date(Date.now() - 60 * 1000).toISOString();
    const scheduledPast = postsMod.updatePost(db, editor, draft.id, {
      title: draft.title,
      status: "scheduled",
      scheduledAt: pastIso,
      expectedRevision: scheduledFuture.revision,
    });
    assert.equal(postsMod.listPublicPosts(db).length, 1);

    // Soft delete & restore
    postsMod.softDeletePost(db, editor, scheduledPast.id);
    assert.equal(postsMod.listPublicPosts(db).length, 0);
    assert.equal(postsMod.listAdminPosts(db, editor, { includeDeleted: true }).total, 1);

    const restored = postsMod.restorePost(db, editor, scheduledPast.id);
    assert.equal(restored.deletedAt, null);
    assert.equal(restored.status, "scheduled");
    assert.equal(postsMod.listPublicPosts(db).length, 1);

    // Author cannot edit another author's or editor-owned post
    const editorOwned = postsMod.createPost(db, editor, {
      title: "Artikel Milik Editor",
      structuredContent: contentMod.createEmptyDocument(),
      status: "draft",
    });
    assert.throws(() => postsMod.getAdminPostById(db, author, editorOwned.id), /FORBIDDEN/);
    assert.throws(
      () =>
        postsMod.updatePost(db, author, editorOwned.id, {
          title: "Hack",
          structuredContent: contentMod.createEmptyDocument(),
        }),
      /FORBIDDEN/
    );
  });

  it("protects the last active Owner and handles safe category reassignment", () => {
    // Cannot demote or deactivate the sole active owner
    assert.throws(
      () => usersMod.updateAdminUser(db, owner, owner.id, { role: "editor" }),
      /Owner aktif terakhir/
    );
    assert.throws(
      () => usersMod.updateAdminUser(db, owner, owner.id, { status: "inactive" }),
      /Owner aktif terakhir/
    );

    // Settings restricted to Owner
    assert.throws(
      () => settingsMod.updateCmsSettings(db, editor, { blogTitle: "Denied" }),
      /Hanya Owner/
    );
    const updatedSettings = settingsMod.updateCmsSettings(db, owner, {
      defaultAuthorDisplay: "TELLU Studio",
    });
    assert.equal(updatedSettings.defaultAuthorDisplay, "TELLU Studio");

    // Category deletion protection + safe reassignment
    const categories = categoriesMod.listCategories(db);
    const tech = categories.find((c) => c.slug === "technology");
    const customCat = categoriesMod.createCategory(db, editor, { name: "Engineering Notes" });

    const samplePost = postsMod.createPost(db, editor, {
      title: "Artikel Dengan Kategori Khusus",
      structuredContent: contentMod.createEmptyDocument(),
      categoryIds: [customCat.id],
      status: "draft",
    });

    assert.throws(() => categoriesMod.deleteCategory(db, editor, customCat.id), /digunakan oleh/);
    categoriesMod.deleteCategory(db, editor, customCat.id, tech.id);

    const reloaded = postsMod.getAdminPostById(db, editor, samplePost.id);
    assert.ok(reloaded.categories.some((c) => c.id === tech.id));
  });

  it("creates an online SQLite + media backup and restores safely", async () => {
    const beforeCount = db.prepare("SELECT COUNT(*) as c FROM posts").get().c;
    const { backupDir: snapDir, manifest } = await backupMod.createCmsBackup();

    assert.equal(manifest.dbFilename, "tellu.sqlite");
    assert.ok(manifest.mediaFileCount >= 1);

    // Mutate DB after backup
    postsMod.createPost(db, editor, {
      title: "Artikel Setelah Backup",
      structuredContent: contentMod.createEmptyDocument(),
      status: "draft",
    });
    const afterMutateCount = db.prepare("SELECT COUNT(*) as c FROM posts").get().c;
    assert.equal(afterMutateCount, beforeCount + 1);

    // Restore snapshot
    backupMod.restoreCmsBackup(snapDir);
    db = dbMod.getDb();
    const afterRestoreCount = db.prepare("SELECT COUNT(*) as c FROM posts").get().c;
    assert.equal(afterRestoreCount, beforeCount);
  });
});
