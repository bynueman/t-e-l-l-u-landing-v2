"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Gagal masuk. Periksa kembali email dan kata sandi Anda.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Koneksi ke server gagal. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800"
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor="admin-email" className="block text-xs font-semibold text-[#20211f] mb-1.5">
          Email
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@tellu.co"
          className="w-full rounded-lg border border-[#dcd9cf] bg-white px-3.5 py-2.5 text-sm text-[#20211f] placeholder:text-[#666961] focus:border-[#20211f] focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="admin-password" className="block text-xs font-semibold text-[#20211f] mb-1.5">
          Kata Sandi
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Masukkan kata sandi"
          className="w-full rounded-lg border border-[#dcd9cf] bg-white px-3.5 py-2.5 text-sm text-[#20211f] placeholder:text-[#666961] focus:border-[#20211f] focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-[#20211f] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#353733] disabled:opacity-60 cursor-pointer"
      >
        {submitting ? "Memverifikasi..." : "Masuk ke Control Center"}
      </button>
    </form>
  );
}
