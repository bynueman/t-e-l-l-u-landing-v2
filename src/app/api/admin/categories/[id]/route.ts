import { getDb } from "@/lib/cms/db";
import { adminJson, mapServiceError, requireAdminApi } from "@/lib/cms/http";
import { deleteCategory, updateCategory } from "@/lib/cms/categories";
import { revalidateBlogPaths } from "@/lib/cms/next-server";

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
    const category = updateCategory(db, auth.user, id, {
      name: String(body.name ?? ""),
      slug: typeof body.slug === "string" ? body.slug : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      ecosystem:
        body.ecosystem === "technology" || body.ecosystem === "creative" || body.ecosystem === "business"
          ? body.ecosystem
          : null,
    });
    revalidateBlogPaths();
    return adminJson({ category });
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
    const { searchParams } = new URL(request.url);
    const reassignTo = searchParams.get("reassignTo") ?? undefined;
    const db = getDb();
    deleteCategory(db, auth.user, id, reassignTo);
    revalidateBlogPaths();
    return adminJson({ ok: true });
  } catch (error) {
    return mapServiceError(error);
  }
}
