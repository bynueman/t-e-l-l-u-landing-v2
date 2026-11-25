import { getDb } from "@/lib/cms/db";
import { adminJson, mapServiceError, requireAdminApi } from "@/lib/cms/http";
import { canManageUsers, type AdminRole } from "@/lib/cms/rbac";
import { createInternalUser, listAdminUsers } from "@/lib/cms/users";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) return auth.response;

  if (!canManageUsers(auth.user.role)) {
    return adminJson({ error: "Hanya Owner yang dapat mengakses daftar pengguna." }, 403);
  }

  const db = getDb();
  return adminJson({ items: listAdminUsers(db) });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi(request, { requireMutationOrigin: true });
  if (!auth.ok) return auth.response;

  if (!canManageUsers(auth.user.role)) {
    return adminJson({ error: "Hanya Owner yang dapat menambahkan pengguna." }, 403);
  }

  try {
    const body = await request.json();
    const db = getDb();
    const user = createInternalUser(db, auth.user, {
      name: String(body.name ?? ""),
      email: String(body.email ?? ""),
      password: String(body.password ?? ""),
      role: (body.role as AdminRole) ?? "author",
    });
    return adminJson({ user }, 201);
  } catch (error) {
    return mapServiceError(error);
  }
}
