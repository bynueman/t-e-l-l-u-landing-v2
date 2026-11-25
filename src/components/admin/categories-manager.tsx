"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import type { CategoryRecord } from "@/lib/cms/categories";

export function CategoriesManager({
  initialCategories,
}: {
  initialCategories: CategoryRecord[];
}) {
  const [categories, setCategories] = useState<CategoryRecord[]>(initialCategories);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [ecosystem, setEcosystem] = useState<"" | "technology" | "creative" | "business">("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reassignMap, setReassignMap] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reload = async () => {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    if (res.ok) setCategories(data.items ?? []);
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setEcosystem("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const payload = {
        name,
        slug: slug.trim() || undefined,
        description,
        ecosystem: ecosystem || null,
      };
      const res = await fetch(
        editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan kategori.");
      await reload();
      setNotice(editingId ? "Kategori diperbarui." : "Kategori baru ditambahkan.");
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan kategori.");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (cat: CategoryRecord) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description);
    setEcosystem(cat.ecosystem ?? "");
    setError(null);
    setNotice(null);
  };

  const handleDelete = async (cat: CategoryRecord) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const reassignTo = reassignMap[cat.id] || "";
      const query = reassignTo ? `?reassignTo=${encodeURIComponent(reassignTo)}` : "";
      const res = await fetch(`/api/admin/categories/${cat.id}${query}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus kategori.");
      await reload();
      setNotice(`Kategori "${cat.name}" dihapus.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus kategori.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-line bg-white p-5 space-y-4"
      >
        <h2 className="text-sm font-bold text-foreground">
          {editingId ? "Edit Kategori" : "Tambah Kategori Baru"}
        </h2>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            {notice}
          </p>
        )}

        <div>
          <label className="block text-xs font-semibold mb-1">Nama Kategori</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Misal: Automation & AI"
            className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-foreground focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Slug URL (opsional)</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="otomatis-dari-nama"
            className="w-full rounded-lg border border-line px-3 py-2 text-xs font-mono focus:border-foreground focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Ekosistem TELLU</label>
          <select
            value={ecosystem}
            onChange={(e) =>
              setEcosystem(e.target.value as "" | "technology" | "creative" | "business")
            }
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-foreground focus:outline-none"
          >
            <option value="">Umum (Tanpa Ekosistem Spesifik)</option>
            <option value="technology">Technology</option>
            <option value="creative">Creative</option>
            <option value="business">Business</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Deskripsi</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Penjelasan singkat kategori..."
            className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-foreground focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="flex-1 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-white hover:bg-[#343632] disabled:opacity-50"
          >
            {busy ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Kategori"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-line px-4 py-2 text-xs font-semibold hover:bg-[#f9f7f3]"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      <div className="lg:col-span-2 rounded-2xl border border-line bg-white overflow-hidden">
        <div className="border-b border-line bg-[#f9f7f3] px-5 py-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
            Daftar Kategori ({categories.length})
          </h2>
        </div>
        <div className="divide-y divide-line">
          {categories.map((cat) => {
            const others = categories.filter((c) => c.id !== cat.id);
            return (
              <div
                key={cat.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{cat.name}</span>
                    <span className="text-xs font-mono text-muted">/{cat.slug}</span>
                    {cat.ecosystem && (
                      <span className="rounded-full border border-line bg-[#fcfbf8] px-2 py-0.5 text-[11px] font-medium text-muted">
                        {cat.ecosystem}
                      </span>
                    )}
                  </div>
                  {cat.description && (
                    <p className="text-xs text-muted line-clamp-2">{cat.description}</p>
                  )}
                  <p className="text-xs text-muted">
                    Digunakan pada <strong className="text-foreground">{cat.usageCount}</strong>{" "}
                    artikel
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(cat)}
                    className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold hover:bg-[#f9f7f3]"
                  >
                    <Icon name="edit" className="w-3.5 h-3.5" />
                    Edit
                  </button>

                  {cat.usageCount > 0 && others.length > 0 && (
                    <select
                      aria-label={`Pindahkan artikel dari ${cat.name}`}
                      value={reassignMap[cat.id] ?? ""}
                      onChange={(e) =>
                        setReassignMap((prev) => ({ ...prev, [cat.id]: e.target.value }))
                      }
                      className="rounded-lg border border-line bg-white px-2 py-1.5 text-xs"
                    >
                      <option value="">Pindahkan artikel ke...</option>
                      {others.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleDelete(cat)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40"
                  >
                    <Icon name="trash" className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
