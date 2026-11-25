"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { MediaManager } from "./media-manager";
import type { MediaRecord } from "@/lib/cms/media";
import type { AdminRole } from "@/lib/cms/rbac";

export function MediaPickerModal({
  open,
  userRole,
  title = "Pilih Media",
  selectLabel = "Gunakan Gambar",
  onClose,
  onSelect,
}: {
  open: boolean;
  userRole: AdminRole;
  title?: string;
  selectLabel?: string;
  onClose: () => void;
  onSelect: (media: MediaRecord) => void;
}) {
  const [items, setItems] = useState<MediaRecord[] | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/admin/media")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        if (!cancelled) setItems(d.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45"
    >
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#e6e4dc] bg-[#f9f7f3] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e6e4dc] bg-white px-5 py-4">
          <h2 className="text-base font-bold text-[#20211f]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pemilih media"
            className="rounded-lg p-1.5 text-[#666961] hover:bg-black/5 hover:text-[#20211f]"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {items === null ? (
            <p className="py-12 text-center text-xs text-[#666961]">Memuat Media Library...</p>
          ) : (
            <MediaManager
              initialItems={items}
              userRole={userRole}
              selectLabel={selectLabel}
              onSelect={(media) => {
                onSelect(media);
                onClose();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
