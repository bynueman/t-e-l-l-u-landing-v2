import { cookies } from "next/headers";
import { getDb } from "@/lib/cms/db";
import { revokeSessionByRawToken, SESSION_COOKIE_NAME } from "@/lib/cms/auth";
import { logActivity } from "@/lib/cms/activity";
import { adminJson, requireAdminApi } from "@/lib/cms/http";
import { verifyMutationOrigin } from "@/lib/cms/network-safety";

export async function POST(request: Request) {
  if (!verifyMutationOrigin(request)) {
    return adminJson({ error: "Origin permintaan tidak tepercaya." }, 403);
  }

  const auth = await requireAdminApi(request, { requireMutationOrigin: true });
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (rawToken) {
    const db = getDb();
    revokeSessionByRawToken(db, rawToken);
    if (auth.ok) {
      logActivity(db, {
        actorId: auth.user.id,
        action: "auth.logout",
        entityType: "session",
        entityId: auth.user.id,
      });
    }
  }

  const res = adminJson({ ok: true }, 200);
  res.cookies.delete(SESSION_COOKIE_NAME);
  return res;
}
