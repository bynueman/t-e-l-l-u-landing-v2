import { getDb } from "@/lib/cms/db";
import { adminJson, requireAdminApi } from "@/lib/cms/http";
import { canViewActivity } from "@/lib/cms/rbac";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) return auth.response;

  if (!canViewActivity(auth.user.role)) {
    return adminJson({ error: "Anda tidak memiliki izin melihat log aktivitas." }, 403);
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));
  const db = getDb();

  const rows = db
    .prepare(
      `SELECT a.id, a.actor_id, u.name as actor_name, u.role as actor_role,
              a.action, a.entity_type, a.entity_id, a.safe_metadata, a.created_at
       FROM activity_logs a
       LEFT JOIN users u ON u.id = a.actor_id
       ORDER BY a.created_at DESC
       LIMIT ?`
    )
    .all(limit) as Record<string, unknown>[];

  const items = rows.map((r) => ({
    id: String(r.id),
    actorId: r.actor_id ? String(r.actor_id) : null,
    actorName: r.actor_name ? String(r.actor_name) : "Sistem",
    actorRole: r.actor_role ? String(r.actor_role) : null,
    action: String(r.action),
    entityType: String(r.entity_type),
    entityId: r.entity_id ? String(r.entity_id) : null,
    metadata: (() => {
      try {
        return JSON.parse(String(r.safe_metadata ?? "{}"));
      } catch {
        return {};
      }
    })(),
    createdAt: String(r.created_at),
  }));

  return adminJson({ items });
}
