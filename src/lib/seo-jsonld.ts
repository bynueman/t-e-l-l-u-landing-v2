import type { PublicBlogPost } from "./blog.ts";

function isOrganizationAuthor(authorName: string): boolean {
  const lower = authorName.trim().toLowerCase();
  return lower.includes("tellu") || lower.includes("tim ") || lower.includes("admin");
}

/**
 * Safely serializes JSON-LD to prevent script-breakout payloads.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Builds Schema.org BlogPosting and BreadcrumbList JSON-LD only when a confirmed
 * HTTPS production origin (`siteUrl`) is configured. Never emits localhost or preview IPs.
 */
export function buildArticleJsonLd(
  post: PublicBlogPost,
  productionOrigin: URL | undefined
): Record<string, unknown>[] {
  if (!productionOrigin || productionOrigin.protocol !== "https:") {
    return [];
  }

  const origin = productionOrigin.toString().replace(/\/$/, "");
  const articleUrl = `${origin}/blog/${post.slug}`;
  const canonical =
    post.canonicalUrl && post.canonicalUrl.startsWith("https://")
      ? post.canonicalUrl
      : articleUrl;

  const imageUrl = post.coverImage
    ? post.coverImage.startsWith("https://")
      ? post.coverImage
      : `${origin}${post.coverImage.startsWith("/") ? "" : "/"}${post.coverImage}`
    : undefined;

  const blogPosting: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    ...(imageUrl ? { image: [imageUrl] } : {}),
    datePublished: post.publishedAtIso,
    dateModified: post.updatedAtIso || post.publishedAtIso,
    author: {
      "@type": isOrganizationAuthor(post.authorName) ? "Organization" : "Person",
      name: post.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "TELLU",
      url: origin,
      logo: {
        "@type": "ImageObject",
        url: `${origin}/brand/tellu-logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical,
    },
    articleSection: post.categoryLabel,
    inLanguage: "id-ID",
  };

  const breadcrumbList: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Beranda",
        item: `${origin}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${origin}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: articleUrl,
      },
    ],
  };

  return [blogPosting, breadcrumbList];
}
