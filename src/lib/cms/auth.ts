import { randomBytes, randomUUID, scryptSync, createHash, timingSafeEqual } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { withTransaction } from "./db.ts";
import { logActivity } from "./activity.ts";
import type { AdminRole, AdminUser, UserStatus } from "./rbac.ts";

export const SESSION_COOKIE_NAME = "tellu_admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 5;

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validatePasswordStrength(password: string): string | null {
  if (typeof password !== "string" || password.length < 10) {
    return "Kata sandi minimal harus 10 karakter.";
  }
  if (password.length > 128) {
    return "Kata sandi maksimal 128 karakter.";
  }
  return null;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  }).toString("hex");
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = parts[4];
  const expectedHex = parts[5];
  if (!n || !r || !p || !salt || !expectedHex) return false;

  try {
    const derived = scryptSync(password, salt, expectedHex.length / 2, { N: n, r, p });
    const expectedBuf = Buffer.from(expectedHex, "hex");
    if (derived.length !== expectedBuf.length) return false;
    return timingSafeEqual(derived, expectedBuf);
  } catch {
    return false;
  }
}

export function hashSessionToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

function getRateLimitKey(email: string, ip: string): string {
  return createHash("sha256")
    .update(`${normalizeEmail(email)}::${ip || "unknown"}`)
    .digest("hex");
}

export function checkLoginRateLimit(db: DatabaseSync, email: string, ip: string): { allowed: boolean; retryAfterSec?: number } {
  const key = getRateLimitKey(email, ip);
  const now = Date.now();
  const row = db
    .prepare("SELECT attempts, window_start, locked_until FROM login_rate_limits WHERE rate_key = ?")
    .get(key) as { attempts: number; window_start: number; locked_until: number | null } | undefined;

  if (!row) return { allowed: true };

  if (row.locked_until && row.locked_until > now) {
    return { allowed: false, retryAfterSec: Math.ceil((row.locked_until - now) / 1000) };
  }

  if (now - row.window_start > RATE_LIMIT_WINDOW_MS) {
    db.prepare("DELETE FROM login_rate_limits WHERE rate_key = ?").run(key);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedLoginAttempt(db: DatabaseSync, email: string, ip: string): void {
  const key = getRateLimitKey(email, ip);
  const now = Date.now();
  const row = db
    .prepare("SELECT attempts, window_start FROM login_rate_limits WHERE rate_key = ?")
    .get(key) as { attempts: number; window_start: number } | undefined;

  if (!row || now - row.window_start > RATE_LIMIT_WINDOW_MS) {
    db.prepare(
      `INSERT OR REPLACE INTO login_rate_limits (rate_key, attempts, window_start, locked_until)
       VALUES (?, 1, ?, NULL)`
    ).run(key, now);
    return;
  }

  const nextAttempts = row.attempts + 1;
  const lockedUntil = nextAttempts >= RATE_LIMIT_MAX_ATTEMPTS ? now + RATE_LIMIT_WINDOW_MS : null;
  db.prepare(
    `UPDATE login_rate_limits SET attempts = ?, locked_until = ? WHERE rate_key = ?`
  ).run(nextAttempts, lockedUntil, key);
}

export function clearLoginRateLimit(db: DatabaseSync, email: string, ip: string): void {
  const key = getRateLimitKey(email, ip);
  db.prepare("DELETE FROM login_rate_limits WHERE rate_key = ?").run(key);
}

export function createSession(db: DatabaseSync, userId: string, priorRawToken?: string | null): {
  rawToken: string;
  expiresAt: string;
} {
  const rawToken = generateSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();

  withTransaction(db, () => {
    if (priorRawToken) {
      const oldHash = hashSessionToken(priorRawToken);
      db.prepare("UPDATE sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL").run(
        now.toISOString(),
        oldHash
      );
    }

    db.prepare(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, revoked_at)
       VALUES (?, ?, ?, ?, ?, NULL)`
    ).run(`ses_${randomUUID()}`, userId, tokenHash, expiresAt, now.toISOString());
  });

  return { rawToken, expiresAt };
}

export function revokeSessionByRawToken(db: DatabaseSync, rawToken: string): void {
  const tokenHash = hashSessionToken(rawToken);
  db.prepare("UPDATE sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL").run(
    new Date().toISOString(),
    tokenHash
  );
}

export function revokeAllUserSessions(db: DatabaseSync, userId: string): void {
  db.prepare("UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL").run(
    new Date().toISOString(),
    userId
  );
}

export function getUserBySessionToken(db: DatabaseSync, rawToken: string | undefined | null): AdminUser | null {
  if (!rawToken) return null;
  const tokenHash = hashSessionToken(rawToken);
  const now = new Date().toISOString();

  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, u.status
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?
         AND s.revoked_at IS NULL
         AND s.expires_at > ?
         AND u.status = 'active'
       LIMIT 1`
    )
    .get(tokenHash, now) as
    | { id: string; name: string; email: string; role: AdminRole; status: UserStatus }
    | undefined;

  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
  };
}

export function authenticateCredentials(
  db: DatabaseSync,
  params: { email: string; password: string; ip: string; priorToken?: string | null }
): { ok: true; user: AdminUser; rawToken: string; expiresAt: string } | { ok: false; error: string; status: number } {
  const normalized = normalizeEmail(params.email);
  const rate = checkLoginRateLimit(db, normalized, params.ip);
  if (!rate.allowed) {
    return {
      ok: false,
      status: 429,
      error: "Terlalu banyak percobaan login yang gagal. Silakan coba lagi beberapa menit lagi.",
    };
  }

  const row = db
    .prepare(
      `SELECT id, name, email, password_hash, role, status
       FROM users
       WHERE email = ?
       LIMIT 1`
    )
    .get(normalized) as
    | {
        id: string;
        name: string;
        email: string;
        password_hash: string;
        role: AdminRole;
        status: UserStatus;
      }
    | undefined;

  if (!row || row.status !== "active" || !verifyPassword(params.password, row.password_hash)) {
    recordFailedLoginAttempt(db, normalized, params.ip);
    logActivity(db, {
      actorId: row?.id ?? null,
      action: "auth.login_failed",
      entityType: "session",
      entityId: row?.id ?? null,
      metadata: { reason: "invalid_credentials" },
    });
    return {
      ok: false,
      status: 401,
      error: "Email atau kata sandi tidak valid.",
    };
  }

  clearLoginRateLimit(db, normalized, params.ip);
  const { rawToken, expiresAt } = createSession(db, row.id, params.priorToken);
  const user: AdminUser = {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
  };

  logActivity(db, {
    actorId: user.id,
    action: "auth.login_success",
    entityType: "session",
    entityId: user.id,
    metadata: { role: user.role },
  });

  return { ok: true, user, rawToken, expiresAt };
}

export function buildSessionCookieOptions(expiresAt: string, isHttps: boolean) {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production" ? isHttps : false,
    path: "/",
    expires: new Date(expiresAt),
  };
}
