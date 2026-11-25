"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { Icon } from "@/components/ui/icon";
import type { MediaRecord } from "@/lib/cms/media";
import { canDeleteMedia, type AdminRole } from "@/lib/cms/rbac";

interface MediaManagerProps {
  initialItems: MediaRecord[];
  userRole: AdminRole;
  onSelect?: (media: MediaRecord) => void;
  selectLabel?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function MediaManager({
  initialItems,
  userRole,
  onSelect,
  selectLabel = "Pilih Gambar",
}: MediaManagerProps) {
  const [items, setItems] = useState<MediaRecord[]>(initialItems);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [editingAltId, setEditingAltId] = useState<string | null>(null);
  const [altDraft, setAltDraft] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function refreshList(q = search) {
    const res = await fetch(`/api/admin/media${q ? `?search=${encodeURIComponent(q)}` : ""}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items ?? []);
    }
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setFeedback("");
    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("altText", "");

      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Gagal mengunggah gambar.");
        return;
      }
      setFeedback(`Gambar '${data.media.originalFilename}' berhasil diunggah.`);
      await refreshList();
      if (onSelect && data.media) {
        onSelect(data.media);
      }
    } catch {
      setError("Koneksi gagal saat mengunggah media.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSaveAlt(mediaId: string) {
    setError("");
    const res = await fetch(`/api/admin/media/${mediaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ altText: altDraft }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Gagal memperbarui alt text.");
      return;
    }
    setItems((prev) => prev.map((m) => (m.id === mediaId ? { ...m, altText: data.media.altText } : m)));
    setEditingAltId(null);
    setFeedback("Alt text disimpan.");
  }

  async function handleDelete(media: MediaRecord) {
    if (!confirm(`Hapus gambar '${media.originalFilename}' secara permanen?`)) return;
    setError("");
    setFeedback("");
    const res = await fetch(`/api/admin/media/${media.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Gagal menghapus gambar.");
      return;
    }
    setItems((prev) => prev.filter((m) => m.id !== media.id));
    setFeedback(`Gambar '${media.originalFilename}' dihapus.`);
  }

  const filtered = search.trim()
    ? items.filter(
        (m) =>
          m.originalFilename.toLowerCase().includes(search.toLowerCase()) ||
          m.altText.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e6e4dc] bg-white p-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Icon
            name="search"
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666961] pointer-events-none"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama file atau alt text..."
            aria-label="Cari media"
            className="w-full rounded-lg border border-[#dcd9cf] bg-[#fcfbf8] pl-9 pr-3 py-2 text-xs text-[#20211f] placeholder:text-[#666961] focus:border-[#20211f] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="sr-only"
            id="media-upload-input"
          />
          <label
            htmlFor="media-upload-input"
            className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg bg-[#20211f] px-4 py-2 text-xs font-semibold text-white hover:bg-[#353733] ${
              uploading ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            <Icon name="upload" size={14} />
            <span>{uploading ? "Mengunggah..." : "Unggah Gambar (JPG/PNG/WebP)"}</span>
          </label>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-800">
          {error}
        </div>
      )}
      {feedback && (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-900">
          {feedback}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#e6e4dc] bg-white p-12 text-center">
          <Icon name="image" size={28} className="mx-auto text-[#666961] mb-3" />
          <p className="text-sm font-semibold text-[#20211f]">Belum ada media yang tersedia</p>
          <p className="mt-1 text-xs text-[#666961]">
            Unggah gambar JPEG, PNG, atau WebP (maksimal 5 MB) untuk digunakan di artikel.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((media) => (
            <div
              key={media.id}
              className="flex flex-col justify-between overflow-hidden rounded-xl border border-[#e6e4dc] bg-white"
            >
              <div>
                <div className="aspect-[16/10] w-full bg-[#f4f2eb] border-b border-[#e6e4dc] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/media/${media.id}`}
                    alt={media.altText || media.originalFilename}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-3.5 space-y-2">
                  <p className="truncate text-xs font-bold text-[#20211f]" title={media.originalFilename}>
                    {media.originalFilename}
                  </p>
                  <p className="text-xs text-[#666961] tabular-nums">
                    {media.width}×{media.height} · {formatBytes(media.fileSize)}
                  </p>

                  {editingAltId === media.id ? (
                    <div className="space-y-1.5 pt-1">
                      <input
                        type="text"
                        value={altDraft}
                        onChange={(e) => setAltDraft(e.target.value)}
                        placeholder="Deskripsi alt text..."
                        className="w-full rounded border border-[#dcd9cf] px-2.5 py-1.5 text-xs focus:border-[#20211f] focus:outline-none"
                      />
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSaveAlt(media.id)}
                          className="rounded bg-[#20211f] px-2.5 py-1 text-xs font-semibold text-white"
                        >
                          Simpan
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingAltId(null)}
                          className="rounded border border-[#e6e4dc] px-2.5 py-1 text-xs text-[#666961]"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="truncate text-xs text-[#666961]">
                        Alt: {media.altText || <em className="not-italic text-[#8a8d82]">Belum diisi</em>}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAltId(media.id);
                          setAltDraft(media.altText);
                        }}
                        className="shrink-0 text-xs font-semibold text-[#b84300] hover:underline"
                      >
                        Edit Alt
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-[#e6e4dc] bg-[#fcfbf8] px-3.5 py-2.5">
                {onSelect ? (
                  <button
                    type="button"
                    onClick={() => onSelect(media)}
                    className="w-full rounded-lg bg-[#20211f] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#353733]"
                  >
                    {selectLabel}
                  </button>
                ) : (
                  <>
                    <span className="text-xs text-[#666961]">
                      {media.usageCount ? `Dipakai (${media.usageCount})` : "Belum dipakai"}
                    </span>
                    {canDeleteMedia(userRole) && (
                      <button
                        type="button"
                        disabled={Boolean(media.usageCount && media.usageCount > 0)}
                        onClick={() => handleDelete(media)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Icon name="trash" size={13} />
                        <span>Hapus</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
