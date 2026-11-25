"use client";

import { useState } from "react";
import type { CmsSettings } from "@/lib/cms/settings";

export function SettingsManager({ initialSettings }: { initialSettings: CmsSettings }) {
  const [settings, setSettings] = useState<CmsSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan pengaturan.");
      setSettings(data.settings);
      setNotice("Pengaturan Blog & SEO berhasil disimpan.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl rounded-2xl border border-line bg-white p-6 space-y-5"
    >
      <div>
        <h2 className="text-base font-bold text-foreground">Pengaturan Blog & Default SEO</h2>
        <p className="text-xs text-muted mt-1">
          Perubahan langsung memengaruhi tajuk halaman publik Blog dan fallback metadata SEO.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          {notice}
        </div>
      )}

      <div>
        <label htmlFor="blog-title" className="block text-xs font-semibold mb-1.5">
          Judul Utama Halaman Blog
        </label>
        <input
          id="blog-title"
          type="text"
          required
          value={settings.blogTitle}
          onChange={(e) => setSettings({ ...settings, blogTitle: e.target.value })}
          className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-foreground focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="blog-desc" className="block text-xs font-semibold mb-1.5">
          Deskripsi Pembuka Blog
        </label>
        <textarea
          id="blog-desc"
          rows={3}
          required
          value={settings.blogDescription}
          onChange={(e) => setSettings({ ...settings, blogDescription: e.target.value })}
          className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-foreground focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="default-author" className="block text-xs font-semibold mb-1.5">
          Nama Penulis Default
        </label>
        <input
          id="default-author"
          type="text"
          required
          value={settings.defaultAuthorDisplay}
          onChange={(e) => setSettings({ ...settings, defaultAuthorDisplay: e.target.value })}
          className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-foreground focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="default-seo" className="block text-xs font-semibold mb-1.5">
          Default SEO Meta Description
        </label>
        <textarea
          id="default-seo"
          rows={3}
          required
          value={settings.defaultSeoDescription}
          onChange={(e) => setSettings({ ...settings, defaultSeoDescription: e.target.value })}
          className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-foreground focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-foreground px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#343632] disabled:opacity-50"
      >
        {saving ? "Menyimpan..." : "Simpan Pengaturan"}
      </button>
    </form>
  );
}
