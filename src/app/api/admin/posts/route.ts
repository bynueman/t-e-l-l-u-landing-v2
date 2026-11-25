import { getDb } from "@/lib/cms/db";
import { adminJson, mapServiceError, requireAdminApi } from "@/lib/cms/http";
import { createPost, listAdminPosts, type PostStatus } from "@/lib/cms/posts";
import { revalidateBlogPaths } from "@/lib/cms/next-server";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const db = getDb();
  const result = listAdminPosts(db, auth.user, {
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    categoryId: searchParams.get("categoryId") ?? undefined,
    includeDeleted: searchParams.get("deleted") === "true",
    sort: (searchParams.get("sort") as "updated_desc" | "updated_asc" | "title_asc" | "published_desc" | null) ?? "updated_desc",
    page: Number(searchParams.get("page") ?? 1),
    pageSize: Number(searchParams.get("pageSize") ?? 20),
  });

  return adminJson(result);
}

export async function POST(request: Request) {
  const auth = await requireAdminApi(request, { requireMutationOrigin: true });
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const db = getDb();
    const post = createPost(db, auth.user, {
      title: String(body.title ?? ""),
      slug: typeof body.slug === "string" ? body.slug : undefined,
      excerpt: typeof body.excerpt === "string" ? body.excerpt : undefined,
      structuredContent: body.structuredContent,
      coverMediaId: typeof body.coverMediaId === "string" || body.coverMediaId === null ? body.coverMediaId : undefined,
      authorId: typeof body.authorId === "string" ? body.authorId : undefined,
      status: typeof body.status === "string" ? (body.status as PostStatus) : undefined,
      featured: typeof body.featured === "boolean" ? body.featured : undefined,
      seoTitle: typeof body.seoTitle === "string" ? body.seoTitle : undefined,
      seoDescription: typeof body.seoDescription === "string" ? body.seoDescription : undefined,
      canonicalUrl: typeof body.canonicalUrl === "string" ? body.canonicalUrl : undefined,
      scheduledAt: typeof body.scheduledAt === "string" || body.scheduledAt === null ? body.scheduledAt : undefined,
      categoryIds: Array.isArray(body.categoryIds) ? body.categoryIds.map(String) : undefined,
      tags: Array.isArray(body.tags) ? body.tags.map(String) : undefined,
    });
    if (post.status === "published" || post.status === "scheduled") {
      revalidateBlogPaths(post.slug);
    }
    return adminJson({ post }, 201);
  } catch (error) {
    return mapServiceError(error);
  }
}
