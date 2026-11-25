"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { Icon } from "@/components/ui/icon";
import { MediaPickerModal } from "./media-picker-modal";
import { isSafeHttpOrRelativeUrl, type StructuredDocument } from "@/lib/cms/content";
import type { AdminRole } from "@/lib/cms/rbac";

interface TiptapEditorProps {
  initialContent: StructuredDocument;
  userRole: AdminRole;
  onChange: (doc: StructuredDocument) => void;
}

export function TiptapEditor({ initialContent, userRole, onChange }: TiptapEditorProps) {
  const [mediaOpen, setMediaOpen] = useState(false);
  const [linkPromptOpen, setLinkPromptOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          HTMLAttributes: {
            rel: "noopener noreferrer nofollow",
          },
        },
      }),
      ImageExtension.configure({
        inline: false,
        allowBase64: false,
      }),
      TableKit.configure({
        table: {
          resizable: false,
        },
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "min-h-[420px] px-6 py-5 focus:outline-none text-base leading-relaxed text-[#20211f] prose-tellu-editor",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getJSON() as StructuredDocument);
    },
  });

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) {
    return (
      <div className="min-h-[480px] rounded-xl border border-[#e6e4dc] bg-white p-6 text-xs text-[#666961]">
        Menyiapkan editor artikel...
      </div>
    );
  }

  function applyLink() {
    if (!editor) return;
    setLinkError("");
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      editor.chain().focus().unsetLink().run();
      setLinkPromptOpen(false);
      return;
    }
    if (!isSafeHttpOrRelativeUrl(trimmed)) {
      setLinkError("URL tautan tidak valid atau tidak aman (gunakan https://, http://, atau /...).");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
    setLinkPromptOpen(false);
    setLinkUrl("");
  }

  const btnCls = (active = false) =>
    `inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-semibold transition-colors ${
      active
        ? "bg-[#20211f] text-white"
        : "text-[#44463f] hover:bg-[#f1efe7] hover:text-[#20211f]"
    }`;

  return (
    <div className="rounded-xl border border-[#e6e4dc] bg-white overflow-hidden">
      {/* Toolbar */}
      <div
        role="toolbar"
        aria-label="Alat format artikel"
        className="flex flex-wrap items-center gap-1 border-b border-[#e6e4dc] bg-[#f9f7f3] px-3 py-2"
      >
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={btnCls(editor.isActive("paragraph"))}
          title="Paragraf"
        >
          P
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btnCls(editor.isActive("heading", { level: 2 }))}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={btnCls(editor.isActive("heading", { level: 3 }))}
          title="Heading 3"
        >
          H3
        </button>

        <span className="mx-1 h-5 w-px bg-[#dcd9cf]" aria-hidden="true" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnCls(editor.isActive("bold"))}
          title="Tebal"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnCls(editor.isActive("italic"))}
          title="Miring"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btnCls(editor.isActive("underline"))}
          title="Garis bawah"
        >
          <u>U</u>
        </button>

        <span className="mx-1 h-5 w-px bg-[#dcd9cf]" aria-hidden="true" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnCls(editor.isActive("bulletList"))}
          title="Daftar Poin"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnCls(editor.isActive("orderedList"))}
          title="Daftar Bernomor"
        >
          1. List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btnCls(editor.isActive("blockquote"))}
          title="Kutipan"
        >
          “Kutipan”
        </button>

        <span className="mx-1 h-5 w-px bg-[#dcd9cf]" aria-hidden="true" />

        <button
          type="button"
          onClick={() => {
            setLinkUrl(editor.getAttributes("link").href ?? "");
            setLinkError("");
            setLinkPromptOpen((v) => !v);
          }}
          className={btnCls(editor.isActive("link"))}
          title="Sisipkan Tautan"
        >
          <Icon name="link" size={14} />
        </button>
        <button
          type="button"
          onClick={() => setMediaOpen(true)}
          className={btnCls(false)}
          title="Sisipkan Gambar dari Media Library"
        >
          <Icon name="image" size={14} />
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
          className={btnCls(editor.isActive("table"))}
          title="Sisipkan Tabel 3x3"
        >
          Tabel
        </button>
        {editor.isActive("table") && (
          <>
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className={btnCls(false)}
            >
              +Baris
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              className={btnCls(false)}
            >
              +Kolom
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteTable().run()}
              className="inline-flex h-8 items-center rounded-md px-2 text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              Hapus Tabel
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={btnCls(false)}
          title="Garis Pemisah"
        >
          ―
        </button>

        <span className="mx-1 h-5 w-px bg-[#dcd9cf]" aria-hidden="true" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={`${btnCls(false)} disabled:opacity-40`}
          title="Undo"
          aria-label="Undo"
        >
          <Icon name="undo" size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={`${btnCls(false)} disabled:opacity-40`}
          title="Redo"
          aria-label="Redo"
        >
          <Icon name="redo" size={14} />
        </button>
      </div>

      {/* Link URL Bar */}
      {linkPromptOpen && (
        <div className="flex flex-wrap items-center gap-2 border-b border-[#e6e4dc] bg-[#fcfbf8] px-4 py-2.5">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://... atau /technology"
            aria-label="URL tautan"
            className="flex-1 min-w-[200px] rounded-md border border-[#dcd9cf] bg-white px-3 py-1.5 text-xs focus:border-[#20211f] focus:outline-none"
          />
          <button
            type="button"
            onClick={applyLink}
            className="rounded-md bg-[#20211f] px-3 py-1.5 text-xs font-semibold text-white"
          >
            Terapkan
          </button>
          <button
            type="button"
            onClick={() => setLinkPromptOpen(false)}
            className="rounded-md border border-[#e6e4dc] bg-white px-3 py-1.5 text-xs text-[#666961]"
          >
            Batal
          </button>
          {linkError && <p className="w-full text-xs text-red-700">{linkError}</p>}
        </div>
      )}

      <EditorContent editor={editor} />

      <MediaPickerModal
        open={mediaOpen}
        userRole={userRole}
        title="Sisipkan Gambar ke Artikel"
        selectLabel="Sisipkan Gambar"
        onClose={() => setMediaOpen(false)}
        onSelect={(media) => {
          editor
            .chain()
            .focus()
            .setImage({
              src: `/api/media/${media.id}`,
              alt: media.altText || media.originalFilename,
            })
            .run();
        }}
      />
    </div>
  );
}
