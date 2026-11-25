import { getDb } from "@/lib/cms/db";
import { adminJson, mapServiceError, requireAdminApi } from "@/lib/cms/http";
import { canManageUsers, type AdminRole, type UserStatus } from "@/lib/cms/rbac";
import {
  resetAdminUserPassword,
  revokeUserSessionsByAdmin,
  updateAdminUser,
} from "@/lib/cms/users";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi(request, { requireMutationOrigin: true });
  if (!auth.ok) return auth.response;

  if (!canManageUsers(auth.user.role)) {
    return adminJson({ error: "Hanya Owner yang dapat mengelola pengguna." }, 403);
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const db = getDb();

    if (body.action === "reset_password") {
      resetAdminUserPassword(db, auth.user, id, String(body.password ?? ""));
      return adminJson({ ok: true });
    }

    if (body.action === "revoke_sessions") {
      revokeUserSessionsByAdmin(db, auth.user, id);
      return adminJson({ ok: true });
    }

    const updated = updateAdminUser(db, auth.user, id, {
      name: typeof body.name === "string" ? body.name : undefined,
      role: typeof body.role === "string" ? (body.role as AdminRole) : undefined,
      status: typeof body.status === "string" ? (body.status as UserStatus) : undefined,
    });
    return adminJson({ user: updated });
  } catch (error) {
    return mapServiceError(error);
  }
}
