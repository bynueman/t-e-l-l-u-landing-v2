import { getDb } from "@/lib/cms/db";
import { adminJson, mapServiceError, requireAdminApi } from "@/lib/cms/http";
import { listMedia, processAndSaveMedia } from "@/lib/cms/media";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const db = getDb();
  return adminJson({ items: listMedia(db, search) });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi(request, { requireMutationOrigin: true });
  if (!auth.ok) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const altText = typeof formData.get("altText") === "string" ? String(formData.get("altText")) : "";

    if (!(file instanceof File)) {
      return adminJson({ error: "File gambar wajib disertakan." }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const db = getDb();
    const media = await processAndSaveMedia(db, auth.user, {
      buffer,
      originalFilename: file.name,
      altText,
    });

    return adminJson({ media }, 201);
  } catch (error) {
    return mapServiceError(error);
  }
}
