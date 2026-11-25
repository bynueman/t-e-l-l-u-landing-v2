import fs from "node:fs";
import { cookies } from "next/headers";
import { getDb } from "@/lib/cms/db";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "@/lib/cms/auth";
import {
  getMediaById,
  isMediaPubliclyAccessible,
  resolveSafeMediaPath,
} from "@/lib/cms/media";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const db = getDb();
  const media = getMediaById(db, id);
  if (!media) {
    return new Response("Not Found", { status: 404 });
  }

  const isPublic = isMediaPubliclyAccessible(db, id);
  if (!isPublic) {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const adminUser = getUserBySessionToken(db, rawToken);
    if (!adminUser) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  let filePath: string;
  try {
    filePath = resolveSafeMediaPath(media.storageKey);
  } catch {
    return new Response("Not Found", { status: 404 });
  }

  if (!fs.existsSync(filePath)) {
    return new Response("Not Found", { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  return new Response(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": media.mimeType,
      "Content-Length": String(fileBuffer.length),
      "Content-Disposition": `inline; filename="${media.originalFilename}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": isPublic
        ? "public, max-age=3600, stale-while-revalidate=86400"
        : "private, no-store",
    },
  });
}
