import { getDb } from "@/lib/cms/db";
import { adminJson, mapServiceError, requireAdminApi } from "@/lib/cms/http";
import { deleteMedia, updateMediaAltText } from "@/lib/cms/media";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi(request, { requireMutationOrigin: true });
  if (!auth.ok) return auth.response;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const altText = typeof body.altText === "string" ? body.altText : "";
    const db = getDb();
    const media = updateMediaAltText(db, auth.user, id, altText);
    return adminJson({ media });
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
    deleteMedia(db, auth.user, id);
    return adminJson({ ok: true });
  } catch (error) {
    return mapServiceError(error);
  }
}
