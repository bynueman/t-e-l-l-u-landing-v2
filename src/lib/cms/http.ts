import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "./db.ts";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "./auth.ts";
import { verifyMutationOrigin } from "./network-safety.ts";
import { checkServerAdminNetworkAccess } from "./next-server.ts";
import type { AdminUser } from "./rbac.ts";

export function adminJson(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, private",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export async function requireAdminApi(
  request: Request,
  options: { requireMutationOrigin?: boolean } = {}
): Promise<
  | { ok: true; user: AdminUser; rawToken: string; isHttps: boolean }
  | { ok: false; response: NextResponse }
> {
  const net = await checkServerAdminNetworkAccess(request);
  if (!net.allowed) {
    return {
      ok: false,
      response: adminJson({ error: net.reason ?? "Akses admin dinonaktifkan." }, 403),
    };
  }

  if (options.requireMutationOrigin && !verifyMutationOrigin(request)) {
    return {
      ok: false,
      response: adminJson({ error: "Origin permintaan tidak tepercaya." }, 403),
    };
  }

  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!rawToken) {
    return { ok: false, response: adminJson({ error: "Autentikasi diperlukan." }, 401) };
  }

  const db = getDb();
  const user = getUserBySessionToken(db, rawToken);
  if (!user) {
    return { ok: false, response: adminJson({ error: "Sesi tidak valid atau telah berakhir." }, 401) };
  }

  return { ok: true, user, rawToken, isHttps: net.isHttps };
}

export function mapServiceError(error: unknown) {
  const message = error instanceof Error ? error.message : "Terjadi kesalahan pada server.";
  if (message.startsWith("FORBIDDEN:")) {
    return adminJson({ error: message.replace("FORBIDDEN:", "").trim() }, 403);
  }
  if (message.startsWith("CONFLICT:")) {
    return adminJson({ error: message.replace("CONFLICT:", "").trim() }, 409);
  }
  if (message.includes("tidak ditemukan")) {
    return adminJson({ error: message }, 404);
  }
  return adminJson({ error: message }, 400);
}
