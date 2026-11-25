import { getDb } from "@/lib/cms/db";
import { adminJson, mapServiceError, requireAdminApi } from "@/lib/cms/http";
import { revalidateBlogPaths } from "@/lib/cms/next-server";
import {
  getAdminPostById,
  restorePost,
  softDeletePost,
  updatePost,
  type PostStatus,
} from "@/lib/cms/posts";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await context.params;
    const db = getDb();
    const post = getAdminPostById(db, auth.user, id);
    if (!post) return adminJson({ error: "Artikel tidak ditemukan." }, 404);
    return adminJson({ post });
  } catch (error) {
    return mapServiceError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi(request, { requireMutationOrigin: true });
  if (!auth.ok) return auth.response;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const db = getDb();

    if (body.action === "restore") {
      const restored = restorePost(db, auth.user, id);
      revalidateBlogPaths(restored.slug);
      return adminJson({ post: restored });
    }

    const previousSlug = getAdminPostById(db, auth.user, id)?.slug;
    const post = updatePost(db, auth.user, id, {
      title: String(body.title ?? ""),
      slug: typeof body.slug === "string" ? body.slug : undefined,
      excerpt: typeof body.excerpt === "string" ? body.excerpt : undefined,
      structuredContent: body.structuredContent,
      coverMediaId: body.coverMediaId === undefined ? undefined : body.coverMediaId,
      authorId: typeof body.authorId === "string" ? body.authorId : undefined,
      status: typeof body.status === "string" ? (body.status as PostStatus) : undefined,
      featured: typeof body.featured === "boolean" ? body.featured : undefined,
      seoTitle: typeof body.seoTitle === "string" ? body.seoTitle : undefined,
      seoDescription: typeof body.seoDescription === "string" ? body.seoDescription : undefined,
      canonicalUrl: typeof body.canonicalUrl === "string" ? body.canonicalUrl : undefined,
      scheduledAt: body.scheduledAt === undefined ? undefined : body.scheduledAt,
      categoryIds: Array.isArray(body.categoryIds) ? body.categoryIds.map(String) : undefined,
      tags: Array.isArray(body.tags) ? body.tags.map(String) : undefined,
      expectedRevision: typeof body.expectedRevision === "number" ? body.expectedRevision : undefined,
    });
    if (previousSlug) revalidateBlogPaths(previousSlug);
    revalidateBlogPaths(post.slug);
    return adminJson({ post });
  } catch (error) {
    return mapServiceError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi(request, { requireMutationOrigin: true });
  if (!auth.ok) return auth.response;

  try {
    const { id } = await context.params;
    const db = getDb();
    const deletedSlug = getAdminPostById(db, auth.user, id)?.slug;
    softDeletePost(db, auth.user, id);
    revalidateBlogPaths(deletedSlug);
    return adminJson({ ok: true });
  } catch (error) {
    return mapServiceError(error);
  }
}
