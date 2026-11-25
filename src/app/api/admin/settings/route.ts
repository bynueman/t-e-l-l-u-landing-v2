import { getDb } from "@/lib/cms/db";
import { adminJson, mapServiceError, requireAdminApi } from "@/lib/cms/http";
import { canManageSettings } from "@/lib/cms/rbac";
import { getCmsSettings, updateCmsSettings } from "@/lib/cms/settings";
import { revalidateBlogPaths } from "@/lib/cms/next-server";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) return auth.response;

  if (!canManageSettings(auth.user.role)) {
    return adminJson({ error: "Hanya Owner yang dapat mengakses pengaturan CMS." }, 403);
  }

  const db = getDb();
  return adminJson({ settings: getCmsSettings(db) });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminApi(request, { requireMutationOrigin: true });
  if (!auth.ok) return auth.response;

  if (!canManageSettings(auth.user.role)) {
    return adminJson({ error: "Hanya Owner yang dapat mengubah pengaturan CMS." }, 403);
  }

  try {
    const body = await request.json();
    const db = getDb();
    const settings = updateCmsSettings(db, auth.user, {
      blogTitle: typeof body.blogTitle === "string" ? body.blogTitle : undefined,
      blogDescription: typeof body.blogDescription === "string" ? body.blogDescription : undefined,
      defaultAuthorDisplay: typeof body.defaultAuthorDisplay === "string" ? body.defaultAuthorDisplay : undefined,
      defaultSeoDescription: typeof body.defaultSeoDescription === "string" ? body.defaultSeoDescription : undefined,
    });
    revalidateBlogPaths();
    return adminJson({ settings });
  } catch (error) {
    return mapServiceError(error);
  }
}
