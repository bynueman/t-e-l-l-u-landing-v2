import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import sharp from "sharp";

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "tellu-importer-test-"));
const dbPath = path.join(tempRoot, "cms", "tellu.sqlite");
const mediaDir = path.join(tempRoot, "media");
const backupDir = path.join(tempRoot, "backups");
const pkgDir = path.join(tempRoot, "pkg");

process.env.TELLU_CMS_DB_PATH = dbPath;
process.env.TELLU_CMS_MEDIA_DIR = mediaDir;
process.env.TELLU_CMS_BACKUP_DIR = backupDir;

const dbMod = await import("./db.ts");
const usersMod = await import("./users.ts");
const postsMod = await import("./posts.ts");
const mediaMod = await import("./media.ts");
const importerMod = await import("./editorial-importer.ts");

async function buildSamplePackage() {
  fs.mkdirSync(path.join(pkgDir, "articles"), { recursive: true });
  fs.mkdirSync(path.join(pkgDir, "covers"), { recursive: true });

  const webpBuf = await sharp({
    create: { width: 800, height: 450, channels: 3, background: { r: 245, g: 243, b: 237 } },
  })
    .webp()
    .toBuffer();

  fs.writeFileSync(path.join(pkgDir, "covers", "sample-cover.webp"), webpBuf);

  const article = {
    order: 1,
    title: "Panduan Uji Impor Artikel TELLU",
    slug: "panduan-uji-impor-artikel",
    excerpt: "Ringkasan uji impor paket editorial TELLU.",
    categorySlug: "technology",
    tags: ["Panduan", "Uji"],
    seoTitle: "Panduan Uji Impor Artikel TELLU",
    seoDescription: "Deskripsi SEO uji impor paket editorial.",
    canonicalUrl: "",
    featured: true,
    cover: {
      filename: "sample-cover.webp",
      altText: "Ilustrasi uji sampul paket editorial",
    },
    structuredContent: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Pendahuluan" }] },
        { type: "paragraph", content: [{ type: "text", text: "Paragraf uji yang tervalidasi." }] },
      ],
    },
  };

  fs.writeFileSync(path.join(pkgDir, "articles", "01-sample.json"), JSON.stringify(article, null, 2));
  fs.writeFileSync(
    path.join(pkgDir, "manifest.json"),
    JSON.stringify(
      {
        packageId: "tellu-test-pkg",
        version: "1.0.0",
        articles: [{ order: 1, slug: "panduan-uji-impor-artikel", file: "articles/01-sample.json" }],
      },
      null,
      2
    )
  );
}

describe("TELLU Editorial Package Importer", () => {
  let db;
  let owner;
  let author;

  before(async () => {
    db = dbMod.getDb();
    owner = usersMod.createInternalUser(db, null, {
      name: "Owner Test",
      email: "owner@tellu.local",
      password: "OwnerPassword!2026",
      role: "owner",
    });
    author = usersMod.createInternalUser(db, owner, {
      name: "Author Test",
      email: "author@tellu.local",
      password: "AuthorPassword!2026",
      role: "author",
    });
    await buildSamplePackage();
  });

  after(() => {
    dbMod.closeDb();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("validates dry-run without writing posts or media", async () => {
    const report = await importerMod.importEditorialPackage(db, {
      packageDir: pkgDir,
      actor: owner,
      targetStatus: "draft",
      dryRun: true,
    });

    assert.equal(report.created, 1);
    assert.equal(report.items[0].action, "would_create");
    assert.equal(db.prepare("SELECT COUNT(*) as c FROM posts").get().c, 0);
    assert.equal(db.prepare("SELECT COUNT(*) as c FROM media").get().c, 0);
  });

  it("imports as draft, skips duplicate slugs on rerun, and avoids duplicate media on authorized replace", async () => {
    const first = await importerMod.importEditorialPackage(db, {
      packageDir: pkgDir,
      actor: owner,
      targetStatus: "draft",
    });
    assert.equal(first.created, 1);
    assert.equal(first.failed, 0);

    const mediaCountAfterFirst = mediaMod.listMedia(db).length;
    assert.equal(mediaCountAfterFirst, 1);

    // Owner edits the post title locally
    const createdPost = postsMod.getAdminPostById(db, owner, first.items[0].postId);
    postsMod.updatePost(db, owner, createdPost.id, {
      title: "Judul Diedit Owner",
      expectedRevision: createdPost.revision,
    });

    // Rerun without --replace skips and preserves owner edit
    const rerunSkip = await importerMod.importEditorialPackage(db, {
      packageDir: pkgDir,
      actor: owner,
      targetStatus: "published",
    });
    assert.equal(rerunSkip.skipped, 1);
    assert.equal(rerunSkip.created, 0);
    assert.equal(postsMod.getAdminPostById(db, owner, createdPost.id).title, "Judul Diedit Owner");

    // Attempting replace without confirmReplace throws
    await assert.rejects(
      () =>
        importerMod.importEditorialPackage(db, {
          packageDir: pkgDir,
          actor: owner,
          targetStatus: "published",
          replaceExisting: true,
          confirmReplace: false,
        }),
      /konfirmasi eksplisit/
    );

    // Non-publisher author cannot import with status published
    await assert.rejects(
      () =>
        importerMod.importEditorialPackage(db, {
          packageDir: pkgDir,
          actor: author,
          targetStatus: "published",
        }),
      /FORBIDDEN/
    );

    // Publish existing draft WITHOUT replace mode, preserving Owner's edited title
    const publishedFromDraft = await importerMod.importEditorialPackage(db, {
      packageDir: pkgDir,
      actor: owner,
      publishExistingDrafts: true,
    });
    assert.equal(publishedFromDraft.updated, 1);
    assert.equal(mediaMod.listMedia(db).length, 1);
    const pubPreserved = postsMod.getPublicPostBySlug(db, "panduan-uji-impor-artikel");
    assert.ok(pubPreserved);
    assert.equal(pubPreserved.title, "Judul Diedit Owner");

    // Authorized replace publishes without duplicating media
    const replaced = await importerMod.importEditorialPackage(db, {
      packageDir: pkgDir,
      actor: owner,
      targetStatus: "published",
      replaceExisting: true,
      confirmReplace: true,
    });
    assert.equal(replaced.updated, 1);
    assert.equal(mediaMod.listMedia(db).length, 1);
    const pub = postsMod.getPublicPostBySlug(db, "panduan-uji-impor-artikel");
    assert.ok(pub);
    assert.equal(pub.featured, true);
  });
});
