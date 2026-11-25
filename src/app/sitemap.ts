import type { MetadataRoute } from "next";
import { getAllPublicBlogPosts } from "@/lib/blog";
import { siteUrl } from "@/config/site";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl ? siteUrl.toString().replace(/\/$/, "") : "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/technology`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/creative`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/business`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/blog`, changeFrequency: "daily", priority: 0.8 },
  ];

  const publishedPosts = getAllPublicBlogPosts().map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAtIso),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...publishedPosts];
}
