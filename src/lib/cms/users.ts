import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { hashPassword, normalizeEmail, revokeAllUserSessions, validatePasswordStrength } from "./auth.ts";
import { logActivity } from "./activity.ts";
import { canManageUsers, type AdminRole, type AdminUser, type UserStatus } from "./rbac.ts";

export interface AdminUserListItem extends AdminUser {
  createdAt: string;
  updatedAt: string;
}

export function countActiveOwners(db: DatabaseSync): number {
  const row = db
    .prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'owner' AND status = 'active'")
    .get() as { cnt: number };
  return Number(row.cnt);
}

export function listAdminUsers(db: DatabaseSync): AdminUserListItem[] {
  const rows = db
    .prepare(
      `SELECT id, name, email, role, status, created_at, updated_at
       FROM users
       ORDER BY CASE role WHEN 'owner' THEN 0 WHEN 'editor' THEN 1 ELSE 2 END, name ASC`
    )
    .all() as Record<string, unknown>[];

  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    email: String(r.email),
    role: r.role as AdminRole,
    status: r.status as UserStatus,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  }));
}

export function createInternalUser(
  db: DatabaseSync,
  actor: AdminUser | null,
  input: {
    name: string;
    email: string;
    password: string;
    role: AdminRole;
  }
): AdminUserListItem {
  if (actor && !canManageUsers(actor.role)) {
    throw new Error("Hanya Owner yang dapat menambahkan pengguna baru.");
  }

  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  if (!name) throw new Error("Nama pengguna wajib diisi.");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Format email tidak valid.");
  }

  const pwError = validatePasswordStrength(input.password);
  if (pwError) throw new Error(pwError);

  if (!["owner", "editor", "author"].includes(input.role)) {
    throw new Error("Role pengguna tidak valid.");
  }

  const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (exists) {
    throw new Error("Email tersebut sudah terdaftar.");
  }

  const id = `usr_${randomUUID().replace(/-/g, "").slice(0, 14)}`;
  const passwordHash = hashPassword(input.password);
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`
  ).run(id, name, email, passwordHash, input.role, now, now);

  logActivity(db, {
    actorId: actor?.id ?? id,
    action: actor ? "user.create" : "user.init_owner",
    entityType: "user",
    entityId: id,
    metadata: { role: input.role, email },
  });

  return {
    id,
    name,
    email,
    role: input.role,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
}

export function updateAdminUser(
  db: DatabaseSync,
  actor: AdminUser,
  targetUserId: string,
  input: {
    name?: string;
    role?: AdminRole;
    status?: UserStatus;
  }
): AdminUserListItem {
  if (!canManageUsers(actor.role)) {
    throw new Error("Hanya Owner yang dapat mengelola akun pengguna.");
  }

  const target = db
    .prepare("SELECT id, name, email, role, status, created_at FROM users WHERE id = ?")
    .get(targetUserId) as
    | { id: string; name: string; email: string; role: AdminRole; status: UserStatus; created_at: string }
    | undefined;

  if (!target) throw new Error("Pengguna tidak ditemukan.");

  const nextName = input.name !== undefined ? input.name.trim() : target.name;
  if (!nextName) throw new Error("Nama pengguna tidak boleh kosong.");

  const nextRole = input.role ?? target.role;
  const nextStatus = input.status ?? target.status;

  if (!["owner", "editor", "author"].includes(nextRole)) {
    throw new Error("Role tidak valid.");
  }
  if (!["active", "inactive"].includes(nextStatus)) {
    throw new Error("Status pengguna tidak valid.");
  }

  const wasActiveOwner = target.role === "owner" && target.status === "active";
  const willRemainActiveOwner = nextRole === "owner" && nextStatus === "active";
  if (wasActiveOwner && !willRemainActiveOwner && countActiveOwners(db) <= 1) {
    throw new Error("Owner aktif terakhir tidak dapat dinonaktifkan atau diturunkan rolenya.");
  }

  const now = new Date().toISOString();
  db.prepare("UPDATE users SET name = ?, role = ?, status = ?, updated_at = ? WHERE id = ?").run(
    nextName,
    nextRole,
    nextStatus,
    now,
    targetUserId
  );

  if (nextStatus === "inactive" || nextRole !== target.role) {
    revokeAllUserSessions(db, targetUserId);
  }

  logActivity(db, {
    actorId: actor.id,
    action: "user.update",
    entityType: "user",
    entityId: targetUserId,
    metadata: { role: nextRole, status: nextStatus },
  });

  return {
    id: target.id,
    name: nextName,
    email: target.email,
    role: nextRole,
    status: nextStatus,
    createdAt: target.created_at,
    updatedAt: now,
  };
}

export function resetAdminUserPassword(
  db: DatabaseSync,
  actor: AdminUser,
  targetUserId: string,
  newPassword: string
): void {
  if (!canManageUsers(actor.role)) {
    throw new Error("Hanya Owner yang dapat mereset kata sandi pengguna.");
  }

  const pwError = validatePasswordStrength(newPassword);
  if (pwError) throw new Error(pwError);

  const target = db.prepare("SELECT id, email FROM users WHERE id = ?").get(targetUserId) as
    | { id: string; email: string }
    | undefined;
  if (!target) throw new Error("Pengguna tidak ditemukan.");

  const passwordHash = hashPassword(newPassword);
  const now = new Date().toISOString();

  db.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").run(
    passwordHash,
    now,
    targetUserId
  );
  revokeAllUserSessions(db, targetUserId);

  logActivity(db, {
    actorId: actor.id,
    action: "user.reset_password",
    entityType: "user",
    entityId: targetUserId,
    metadata: { email: target.email },
  });
}

export function revokeUserSessionsByAdmin(db: DatabaseSync, actor: AdminUser, targetUserId: string): void {
  if (!canManageUsers(actor.role)) {
    throw new Error("Hanya Owner yang dapat mencabut sesi pengguna.");
  }
  revokeAllUserSessions(db, targetUserId);
  logActivity(db, {
    actorId: actor.id,
    action: "user.revoke_sessions",
    entityType: "user",
    entityId: targetUserId,
  });
}
