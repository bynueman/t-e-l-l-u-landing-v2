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
const blogMod = await import("./blog.ts");

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
});
