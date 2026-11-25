import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";

const FORBIDDEN_KEYS = new Set([
  "password",
  "passwordhash",
  "password_hash",
  "token",
  "tokenhash",
  "token_hash",
  "secret",
  "cookie",
]);

function sanitizeMetadata(input: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!input) return {};
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) continue;
    if (value === undefined) continue;
    clean[key] = value;
  }
  return clean;
}

export function logActivity(
  db: DatabaseSync,
  entry: {
    actorId: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  }
): void {
  const safeMeta = JSON.stringify(sanitizeMetadata(entry.metadata));
  db.prepare(
    `INSERT INTO activity_logs (id, actor_id, action, entity_type, entity_id, safe_metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    `act_${randomUUID()}`,
    entry.actorId,
    entry.action,
    entry.entityType,
    entry.entityId ?? null,
    safeMeta,
    new Date().toISOString()
  );
}
