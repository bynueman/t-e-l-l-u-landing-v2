import { getDb } from "@/lib/cms/db";
import { adminJson, mapServiceError, requireAdminApi } from "@/lib/cms/http";
import { createCategory, listCategories } from "@/lib/cms/categories";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) return auth.response;

  const db = getDb();
  return adminJson({ items: listCategories(db) });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi(request, { requireMutationOrigin: true });
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const db = getDb();
    const category = createCategory(db, auth.user, {
      name: String(body.name ?? ""),
      slug: typeof body.slug === "string" ? body.slug : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      ecosystem:
        body.ecosystem === "technology" || body.ecosystem === "creative" || body.ecosystem === "business"
          ? body.ecosystem
          : null,
    });
    return adminJson({ category }, 201);
  } catch (error) {
    return mapServiceError(error);
  }
}
