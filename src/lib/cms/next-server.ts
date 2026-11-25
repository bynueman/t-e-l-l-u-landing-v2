import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "./auth";
import { getDb } from "./db";
import { evaluateAdminNetworkPolicy, type AdminNetworkCheck } from "./network-safety";
import type { AdminUser } from "./rbac";

export async function getCurrentAdminSession(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!rawToken) return null;
  const db = getDb();
  return getUserBySessionToken(db, rawToken);
}

export async function getClientIpAddress(request?: Request): Promise<string> {
  const h = request ? request.headers : await headers();
  if (process.env.TELLU_TRUST_PROXY === "true") {
    const fwd = h.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0].trim();
  }
  return h.get("x-real-ip") ?? "local";
}

export async function checkServerAdminNetworkAccess(request?: Request): Promise<AdminNetworkCheck> {
  const headerList = request ? request.headers : await headers();
  return evaluateAdminNetworkPolicy({
    nodeEnv: process.env.NODE_ENV,
    forceProdCheck: process.env.TELLU_FORCE_PROD_NET_CHECK === "true",
    adminEnabled: process.env.TELLU_ADMIN_ENABLED,
    adminOrigin: process.env.TELLU_ADMIN_ORIGIN,
    trustProxy: process.env.TELLU_TRUST_PROXY,
    requestUrl: request?.url,
    forwardedProto: headerList.get("x-forwarded-proto"),
    hostHeader: headerList.get("x-forwarded-host") ?? headerList.get("host"),
  });
}

export function revalidateBlogPaths(slug?: string): void {
  try {
    revalidatePath("/blog");
    if (slug) {
      revalidatePath(`/blog/${slug}`);
    }
    revalidatePath("/blog/[slug]", "page");
    revalidatePath("/sitemap.xml");
  } catch {
    // Ignore outside Next.js request runtime
  }
}
