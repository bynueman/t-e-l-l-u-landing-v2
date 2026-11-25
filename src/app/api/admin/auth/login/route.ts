import { cookies } from "next/headers";
import { getDb } from "@/lib/cms/db";
import {
  authenticateCredentials,
  buildSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/cms/auth";
import { verifyMutationOrigin } from "@/lib/cms/network-safety";
import { checkServerAdminNetworkAccess, getClientIpAddress } from "@/lib/cms/next-server";
import { adminJson } from "@/lib/cms/http";

export async function POST(request: Request) {
  const net = await checkServerAdminNetworkAccess(request);
  if (!net.allowed) {
    return adminJson({ error: net.reason ?? "Login admin dinonaktifkan." }, 403);
  }

  if (!verifyMutationOrigin(request)) {
    return adminJson({ error: "Origin permintaan tidak tepercaya." }, 403);
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return adminJson({ error: "Format permintaan tidak valid." }, 400);
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email.trim() || !password) {
    return adminJson({ error: "Email dan kata sandi wajib diisi." }, 400);
  }

  const cookieStore = await cookies();
  const priorToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const ip = await getClientIpAddress(request);
  const db = getDb();

  const authResult = authenticateCredentials(db, {
    email,
    password,
    ip,
    priorToken,
  });

  if (!authResult.ok) {
    return adminJson({ error: authResult.error }, authResult.status);
  }

  const response = adminJson({ user: authResult.user }, 200);
  response.cookies.set(
    SESSION_COOKIE_NAME,
    authResult.rawToken,
    buildSessionCookieOptions(authResult.expiresAt, net.isHttps)
  );
  return response;
}
