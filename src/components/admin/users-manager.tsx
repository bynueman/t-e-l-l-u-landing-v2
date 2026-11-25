"use client";

import { useState } from "react";
import type { AdminRole, UserStatus } from "@/lib/cms/rbac";
import { formatJakartaDateTime } from "@/lib/cms/time";
import type { AdminUserListItem } from "@/lib/cms/users";

export function UsersManager({
  currentUserId,
  initialUsers,
}: {
  currentUserId: string;
  initialUsers: AdminUserListItem[];
}) {
  const [users, setUsers] = useState<AdminUserListItem[]>(initialUsers);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("editor");
  const [resetTargetId, setResetTargetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reload = async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (res.ok) setUsers(data.items ?? []);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambahkan pengguna.");
      setName("");
      setEmail("");
      setPassword("");
      setRole("editor");
      await reload();
      setNotice("Akun internal baru berhasil dibuat.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambahkan pengguna.");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateUser = async (
    targetId: string,
    patch: { role?: AdminRole; status?: UserStatus }
  ) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/users/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui pengguna.");
      await reload();
      setNotice("Pengguna berhasil diperbarui.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui pengguna.");
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetId) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/users/${resetTargetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_password", password: resetPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mereset kata sandi.");
      setResetTargetId(null);
      setResetPassword("");
      setNotice("Kata sandi diperbarui dan seluruh sesi pengguna dicabut.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mereset kata sandi.");
    } finally {
      setBusy(false);
    }
  };

  const handleRevokeSessions = async (targetId: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/users/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke_sessions" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mencabut sesi.");
      setNotice("Seluruh sesi aktif pengguna dicabut.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencabut sesi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <form onSubmit={handleCreate} className="rounded-2xl border border-line bg-white p-5 space-y-4">
          <h2 className="text-sm font-bold text-foreground">Tambah Pengguna Internal</h2>
          <div>
            <label className="block text-xs font-semibold mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama anggota tim"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-foreground focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@tellu.co"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-foreground focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Kata Sandi Awal</label>
            <input
              type="password"
              required
              minLength={12}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 12 karakter kuat"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-foreground focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Peran (Role)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-foreground focus:outline-none"
            >
              <option value="editor">Editor (Kelola semua artikel & kategori)</option>
              <option value="author">Author (Tulis draft & kirim review)</option>
              <option value="owner">Owner (Akses penuh termasuk pengguna)</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-foreground px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#343632] disabled:opacity-50"
          >
            {busy ? "Memproses..." : "Buat Akun Internal"}
          </button>
        </form>

        <div className="lg:col-span-2 rounded-2xl border border-line bg-white overflow-hidden">
          <div className="border-b border-line bg-[#f9f7f3] px-5 py-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
              Pengguna CMS ({users.length})
            </h2>
          </div>

          <div className="divide-y divide-line">
            {users.map((u) => (
              <div key={u.id} className="p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{u.name}</span>
                      {u.id === currentUserId && (
                        <span className="rounded-full bg-[#f4f2eb] px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">
                          Anda
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          u.status === "active"
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {u.status === "active" ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    <p className="text-xs text-muted">{u.email}</p>
                    <p className="text-[11px] text-muted mt-0.5">
                      Dibuat {formatJakartaDateTime(u.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label={`Ubah role ${u.name}`}
                      disabled={busy}
                      value={u.role}
                      onChange={(e) =>
                        void handleUpdateUser(u.id, { role: e.target.value as AdminRole })
                      }
                      className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium"
                    >
                      <option value="owner">Owner</option>
                      <option value="editor">Editor</option>
                      <option value="author">Author</option>
                    </select>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void handleUpdateUser(u.id, {
                          status: u.status === "active" ? "inactive" : "active",
                        })
                      }
                      className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold hover:bg-[#f9f7f3] disabled:opacity-40"
                    >
                      {u.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setResetTargetId(u.id);
                        setResetPassword("");
                      }}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium hover:bg-[#f9f7f3]"
                    >
                      Reset Sandi
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleRevokeSessions(u.id)}
                      className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                    >
                      Cabut Sesi
                    </button>
                  </div>
                </div>

                {resetTargetId === u.id && (
                  <form
                    onSubmit={handleResetPassword}
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-[#fcfbf8] p-3"
                  >
                    <input
                      type="password"
                      required
                      minLength={12}
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="Kata sandi baru (min. 12 karakter kuat)"
                      className="flex-1 min-w-[200px] rounded-lg border border-line bg-white px-3 py-1.5 text-xs focus:border-foreground focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={busy}
                      className="rounded-full bg-foreground px-3.5 py-1.5 text-xs font-semibold text-white"
                    >
                      Simpan Sandi
                    </button>
                    <button
                      type="button"
                      onClick={() => setResetTargetId(null)}
                      className="rounded-full border border-line px-3 py-1.5 text-xs"
                    >
                      Batal
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
