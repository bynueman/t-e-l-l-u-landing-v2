import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "tellu-blog-empty-"));
process.env.TELLU_CMS_DB_PATH = path.join(tempRoot, "cms", "tellu.sqlite");
process.env.TELLU_CMS_MEDIA_DIR = path.join(tempRoot, "media");
process.env.TELLU_CMS_BACKUP_DIR = path.join(tempRoot, "backups");

const dbMod = await import("./cms/db.ts");
const usersMod = await import("./cms/users.ts");
const postsMod = await import("./cms/posts.ts");
const categoriesMod = await import("./cms/categories.ts");
const blogMod = await import("./blog.ts");
const jsonLdMod = await import("./seo-jsonld.ts");

describe("TELLU Public Blog Registry (Database-Backed Empty Start)", () => {
  before(() => {
    dbMod.getDb();
  });

  after(() => {
    dbMod.closeDb();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("starts completely empty with zero published or demonstration articles", () => {
    const posts = blogMod.getAllPublicBlogPosts();
    assert.equal(posts.length, 0);
    assert.equal(blogMod.getPublicBlogPost("biaya-pembuatan-website-bisnis"), null);
    assert.equal(blogMod.getPublicBlogPost("website-baru-atau-revamp"), null);
  });

  it("initializes the three core TELLU blog categories cleanly", () => {
    const categories = blogMod.getPublicBlogCategories();
    const slugs = categories.map((c) => c.slug).sort();
    assert.deepEqual(slugs, ["business", "creative", "technology"]);
  });

  it("exposes default public blog settings", () => {
    const settings = blogMod.getPublicBlogSettings();
    assert.ok(settings.blogTitle.length > 0);
    assert.ok(settings.blogDescription.length > 0);
    assert.equal(settings.defaultAuthorDisplay, "Tim TELLU");
  });

  it("handles homepage Blog Highlight selection and publication lifecycle (0, 1, 2, 3+ posts, featured, scheduled)", () => {
    const db = dbMod.getDb();
    const owner = usersMod.createInternalUser(db, null, {
      name: "Owner Blog Test",
      email: "owner-blog@tellu.local",
      password: "StrongPassword!2026",
      role: "owner",
    });
    const cats = categoriesMod.listCategories(db);
    const techId = cats.find((c) => c.slug === "technology").id;
    const creativeId = cats.find((c) => c.slug === "creative").id;
    const doc = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Konten uji terstruktur." }] }],
    };

    // 0 eligible posts -> null
    assert.equal(blogMod.getHomepageBlogHighlight(), null);

    // Draft and archived posts never appear
    const draftPost = postsMod.createPost(db, owner, {
      title: "Draft Tersembunyi",
      structuredContent: doc,
      categoryIds: [techId],
      status: "draft",
    });
    assert.equal(blogMod.getHomepageBlogHighlight(), null);

    // 1 published post -> primary only
    const p1 = postsMod.createPost(db, owner, {
      title: "Artikel Pertama",
      structuredContent: doc,
      categoryIds: [techId],
      status: "published",
      featured: false,
    });
    let hl = blogMod.getHomepageBlogHighlight();
    assert.ok(hl);
    assert.equal(hl.primary.id, p1.id);
    assert.equal(hl.supporting.length, 0);

    // 2 published posts -> primary + 1 supporting
    const p2 = postsMod.createPost(db, owner, {
      title: "Artikel Kedua",
      structuredContent: doc,
      categoryIds: [creativeId],
      status: "published",
      featured: true,
    });
    hl = blogMod.getHomepageBlogHighlight();
    assert.equal(hl.primary.id, p2.id);
    assert.equal(hl.supporting.length, 1);
    assert.equal(hl.supporting[0].id, p1.id);

    // 3+ published posts -> 1 featured primary + 2 latest distinct supporting (excluding future scheduled)
    const p3 = postsMod.createPost(db, owner, {
      title: "Artikel Ketiga",
      structuredContent: doc,
      categoryIds: [techId],
      status: "published",
      featured: false,
    });
    const futureIso = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const pScheduled = postsMod.createPost(db, owner, {
      title: "Artikel Terjadwal",
      structuredContent: doc,
      categoryIds: [techId],
      status: "scheduled",
      scheduledAt: futureIso,
    });

    hl = blogMod.getHomepageBlogHighlight();
    assert.equal(hl.primary.id, p2.id);
    assert.equal(hl.supporting.length, 2);
    const ids = new Set([hl.primary.id, ...hl.supporting.map((s) => s.id)]);
    assert.equal(ids.size, 3);
    assert.ok(!ids.has(pScheduled.id));
    assert.ok(!ids.has(draftPost.id));

    // When future scheduled time passes, it becomes eligible
    const pastCheckIso = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const hlAfterSchedule = blogMod.getHomepageBlogHighlight(pastCheckIso);
    assert.equal(hlAfterSchedule.primary.id, p2.id);
    assert.equal(hlAfterSchedule.supporting.length, 2);
    assert.ok(hlAfterSchedule.supporting.some((s) => s.id === pScheduled.id));

    // Unpublishing featured post falls back to latest published post
    postsMod.updatePost(db, owner, p2.id, {
      title: p2.title,
      status: "draft",
      expectedRevision: p2.revision,
    });
    hl = blogMod.getHomepageBlogHighlight();
    assert.ok(hl);
    assert.notEqual(hl.primary.id, p2.id);
    assert.ok([p1.id, p3.id].includes(hl.primary.id));
  });

  it("builds BlogPosting & BreadcrumbList JSON-LD only for confirmed HTTPS origin and safely escapes script chars", () => {
    const samplePost = {
      id: "pst_1",
      slug: "contoh-artikel",
      title: "Contoh <Judul> Artikel",
      excerpt: "Ringkasan singkat.",
      category: "technology",
      categoryLabel: "Technology",
      ecosystem: "technology",
      coverImage: "/api/media/med_123",
      coverAlt: "Ilustrasi contoh",
      tags: ["SEO"],
      featured: true,
      publishedAt: "25 November 2026",
      publishedAtIso: "2026-11-25T10:00:00.000Z",
      updatedAtIso: "2026-11-25T10:30:00.000Z",
      readingTimeMinutes: 5,
      authorName: "Admin TELLU",
      seoTitle: "Contoh Judul",
      seoDescription: "Deskripsi SEO contoh.",
      canonicalUrl: "",
      structuredContent: { type: "doc", content: [{ type: "paragraph" }] },
    };

    assert.deepEqual(jsonLdMod.buildArticleJsonLd(samplePost, undefined), []);
    assert.deepEqual(jsonLdMod.buildArticleJsonLd(samplePost, new URL("http://localhost:3000")), []);

    const schemas = jsonLdMod.buildArticleJsonLd(samplePost, new URL("https://tellu.co"));
    assert.equal(schemas.length, 2);
    assert.equal(schemas[0]["@type"], "BlogPosting");
    assert.equal(schemas[0].headline, "Contoh <Judul> Artikel");
    assert.deepEqual(schemas[0].image, ["https://tellu.co/api/media/med_123"]);
    assert.equal(schemas[0].publisher.logo.url, "https://tellu.co/brand/tellu-logo.png");
    assert.equal(schemas[1]["@type"], "BreadcrumbList");
    assert.equal(schemas[1].itemListElement.length, 3);

    const serialized = jsonLdMod.serializeJsonLd(schemas[0]);
    assert.ok(!serialized.includes("<"));
    assert.ok(serialized.includes("\\u003cJudul>"));
  });
});
