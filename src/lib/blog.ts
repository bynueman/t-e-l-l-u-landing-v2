import { getDb } from "./cms/db.ts";
import { listCategories, type CategoryRecord } from "./cms/categories.ts";
import { getCmsSettings, type CmsSettings } from "./cms/settings.ts";
import {
  getEffectivePublicDateIso,
  getPublicPostBySlug,
  getRelatedPublicPosts,
  listPublicPosts,
  type PostRecord,
} from "./cms/posts.ts";
import { formatJakartaDate } from "./cms/time.ts";
import type { StructuredDocument } from "./cms/content.ts";

export interface PublicBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categoryLabel: string;
  ecosystem: "technology" | "creative" | "business" | null;
  coverImage: string | null;
  coverAlt: string;
  tags: string[];
  featured: boolean;
  publishedAt: string;
  publishedAtIso: string;
  updatedAtIso: string;
  readingTimeMinutes: number;
  authorName: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  structuredContent: StructuredDocument;
}

function toPublicPost(post: PostRecord, defaultAuthorDisplay: string): PublicBlogPost {
  const primaryCat = post.categories[0];
  const effectiveIso = getEffectivePublicDateIso(post) ?? post.createdAt;

  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: primaryCat?.slug ?? "technology",
    categoryLabel: primaryCat?.name ?? "Technology",
    ecosystem: primaryCat?.ecosystem ?? "technology",
    coverImage: post.coverUrl,
    coverAlt: post.coverAlt || post.title,
    tags: post.tags.map((t) => t.name),
    featured: post.featured,
    publishedAt: formatJakartaDate(effectiveIso),
    publishedAtIso: effectiveIso,
    updatedAtIso: post.updatedAt,
    readingTimeMinutes: post.readingTimeMinutes,
    authorName: post.authorName || defaultAuthorDisplay,
    seoTitle: post.seoTitle || post.title,
    seoDescription: post.seoDescription || post.excerpt,
    canonicalUrl: post.canonicalUrl,
    structuredContent: post.structuredContent,
  };
}

export function getPublicBlogSettings(): CmsSettings {
  const db = getDb();
  return getCmsSettings(db);
}

export function getPublicBlogCategories(): CategoryRecord[] {
  const db = getDb();
  return listCategories(db);
}

export function getAllPublicBlogPosts(): PublicBlogPost[] {
  const db = getDb();
  const settings = getCmsSettings(db);
  return listPublicPosts(db).map((p) => toPublicPost(p, settings.defaultAuthorDisplay));
}

export function getPublicBlogPost(slug: string): PublicBlogPost | null {
  const db = getDb();
  const settings = getCmsSettings(db);
  const post = getPublicPostBySlug(db, slug);
  if (!post) return null;
  return toPublicPost(post, settings.defaultAuthorDisplay);
}

export function getRelatedPublicBlogPosts(slug: string, limit = 2): PublicBlogPost[] {
  const db = getDb();
  const settings = getCmsSettings(db);
  const current = getPublicPostBySlug(db, slug);
  if (!current) return [];
  const related = getRelatedPublicPosts(
    db,
    current.id,
    current.categories.map((c) => c.id),
    limit
  );
  return related.map((p) => toPublicPost(p, settings.defaultAuthorDisplay));
}

export interface BlogHighlightSelection {
  primary: PublicBlogPost;
  supporting: PublicBlogPost[];
}

/**
 * Selects up to 3 eligible published posts for the homepage highlight:
 * 1 featured post (or latest published post if none is featured) as primary,
 * plus up to 2 latest distinct published posts as supporting items.
 */
export function selectBlogHighlightPosts(posts: PublicBlogPost[]): BlogHighlightSelection | null {
  if (posts.length === 0) return null;

  const byNewest = [...posts].sort((a, b) => b.publishedAtIso.localeCompare(a.publishedAtIso));
  const primary = byNewest.find((p) => p.featured) ?? byNewest[0];
  const supporting = byNewest.filter((p) => p.id !== primary.id && p.slug !== primary.slug).slice(0, 2);

  return { primary, supporting };
}

export function getHomepageBlogHighlight(nowIso = new Date().toISOString()): BlogHighlightSelection | null {
  const db = getDb();
  const settings = getCmsSettings(db);
  const publicPosts = listPublicPosts(db, nowIso).map((p) =>
    toPublicPost(p, settings.defaultAuthorDisplay)
  );
  return selectBlogHighlightPosts(publicPosts);
}
