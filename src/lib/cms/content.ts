export interface StructuredMark {
  type: "bold" | "italic" | "underline" | "link";
  attrs?: Record<string, string | null>;
}

export interface StructuredNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: StructuredNode[];
  marks?: StructuredMark[];
  text?: string;
}

export interface StructuredDocument {
  type: "doc";
  content: StructuredNode[];
}

const ALLOWED_NODE_TYPES = new Set([
  "doc",
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "horizontalRule",
  "hardBreak",
  "image",
  "table",
  "tableRow",
  "tableHeader",
  "tableCell",
  "text",
]);

const ALLOWED_MARK_TYPES = new Set(["bold", "italic", "underline", "link"]);

export function createEmptyDocument(): StructuredDocument {
  return {
    type: "doc",
    content: [{ type: "paragraph" }],
  };
}

export function isSafeHttpOrRelativeUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  // Disallow control chars and whitespace obfuscation
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) return false;

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return true;
  }
  if (trimmed.startsWith("#")) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return (
      parsed.protocol === "https:" ||
      parsed.protocol === "http:" ||
      parsed.protocol === "mailto:"
    );
  } catch {
    return false;
  }
}

export function isSafeMediaImageSrc(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed || /[\u0000-\u001f\u007f]/.test(trimmed)) return false;
  if (trimmed.startsWith("/api/media/") && !trimmed.includes("..")) {
    return /^\/api\/media\/[a-zA-Z0-9_-]+$/.test(trimmed);
  }
  if (trimmed.startsWith("/images/") && !trimmed.includes("..")) {
    return true;
  }
  return false;
}

function sanitizeMarks(marks: unknown): StructuredMark[] | undefined {
  if (!Array.isArray(marks)) return undefined;
  const out: StructuredMark[] = [];

  for (const rawMark of marks) {
    if (!rawMark || typeof rawMark !== "object") continue;
    const m = rawMark as Record<string, unknown>;
    if (typeof m.type !== "string" || !ALLOWED_MARK_TYPES.has(m.type)) {
      throw new Error(`Unsupported mark type: ${String(m.type)}`);
    }
    if (m.type === "link") {
      const attrs = (m.attrs && typeof m.attrs === "object" ? m.attrs : {}) as Record<string, unknown>;
      const href = typeof attrs.href === "string" ? attrs.href.trim() : "";
      if (!isSafeHttpOrRelativeUrl(href)) {
        throw new Error(`Unsafe link href rejected: ${href}`);
      }
      out.push({
        type: "link",
        attrs: {
          href,
          target: href.startsWith("http") ? "_blank" : null,
          rel: href.startsWith("http") ? "noopener noreferrer nofollow" : null,
        },
      });
    } else {
      out.push({ type: m.type as StructuredMark["type"] });
    }
  }

  return out.length > 0 ? out : undefined;
}

function sanitizeNode(raw: unknown): StructuredNode {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid content node");
  }

  const node = raw as Record<string, unknown>;
  if (typeof node.type !== "string" || !ALLOWED_NODE_TYPES.has(node.type)) {
    throw new Error(`Unsupported content node type: ${String(node.type)}`);
  }

  if (node.type === "text") {
    const text = typeof node.text === "string" ? node.text : "";
    const marks = sanitizeMarks(node.marks);
    return marks ? { type: "text", text, marks } : { type: "text", text };
  }

  const clean: StructuredNode = { type: node.type };

  if (node.type === "heading") {
    const rawAttrs = (node.attrs && typeof node.attrs === "object" ? node.attrs : {}) as Record<string, unknown>;
    const rawLevel = Number(rawAttrs.level);
    const level = rawLevel === 3 ? 3 : 2;
    clean.attrs = { level };
  } else if (node.type === "image") {
    const rawAttrs = (node.attrs && typeof node.attrs === "object" ? node.attrs : {}) as Record<string, unknown>;
    const src = typeof rawAttrs.src === "string" ? rawAttrs.src.trim() : "";
    if (!isSafeMediaImageSrc(src)) {
      throw new Error(`Unsafe or unsupported image source rejected: ${src}`);
    }
    const alt = typeof rawAttrs.alt === "string" ? rawAttrs.alt.trim().slice(0, 300) : "";
    const title = typeof rawAttrs.title === "string" ? rawAttrs.title.trim().slice(0, 200) : "";
    clean.attrs = {
      src,
      alt,
      ...(title ? { title } : {}),
      ...(typeof rawAttrs.mediaId === "string" ? { mediaId: rawAttrs.mediaId } : {}),
    };
  } else if (node.type === "tableCell" || node.type === "tableHeader") {
    const rawAttrs = (node.attrs && typeof node.attrs === "object" ? node.attrs : {}) as Record<string, unknown>;
    const colspan = Number.isInteger(rawAttrs.colspan) && Number(rawAttrs.colspan) > 1 ? Number(rawAttrs.colspan) : 1;
    const rowspan = Number.isInteger(rawAttrs.rowspan) && Number(rawAttrs.rowspan) > 1 ? Number(rawAttrs.rowspan) : 1;
    clean.attrs = { colspan, rowspan };
  }

  if (Array.isArray(node.content)) {
    clean.content = node.content.map((child) => sanitizeNode(child));
  }

  return clean;
}

export function validateAndSanitizeDocument(input: unknown): StructuredDocument {
  let parsed: unknown = input;
  if (typeof input === "string") {
    try {
      parsed = JSON.parse(input);
    } catch {
      throw new Error("Structured content must be valid JSON");
    }
  }

  if (!parsed || typeof parsed !== "object" || (parsed as Record<string, unknown>).type !== "doc") {
    throw new Error("Structured content root must have type 'doc'");
  }

  const rawDoc = parsed as Record<string, unknown>;
  const content = Array.isArray(rawDoc.content) ? rawDoc.content.map((child) => sanitizeNode(child)) : [];

  return {
    type: "doc",
    content: content.length > 0 ? content : [{ type: "paragraph" }],
  };
}

export function extractPlainText(doc: StructuredDocument): string {
  const parts: string[] = [];

  function walk(node: StructuredNode) {
    if (node.type === "text" && typeof node.text === "string") {
      parts.push(node.text);
      return;
    }
    if (node.type === "hardBreak") {
      parts.push(" ");
      return;
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        walk(child);
      }
      if (
        node.type === "paragraph" ||
        node.type === "heading" ||
        node.type === "listItem" ||
        node.type === "blockquote" ||
        node.type === "tableRow"
      ) {
        parts.push(" ");
      }
    }
  }

  for (const node of doc.content) {
    walk(node);
  }

  return parts.join("").replace(/\s+/g, " ").trim();
}

export function calculateReadingTimeMinutes(doc: StructuredDocument): number {
  const text = extractPlainText(doc);
  if (!text) return 1;
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function extractReferencedMediaIds(doc: StructuredDocument): string[] {
  const ids = new Set<string>();

  function walk(node: StructuredNode) {
    if (node.type === "image" && node.attrs) {
      const mediaId = typeof node.attrs.mediaId === "string" ? node.attrs.mediaId : "";
      if (mediaId) ids.add(mediaId);
      const src = typeof node.attrs.src === "string" ? node.attrs.src : "";
      const match = src.match(/^\/api\/media\/([a-zA-Z0-9_-]+)$/);
      if (match) ids.add(match[1]);
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        walk(child);
      }
    }
  }

  for (const node of doc.content) {
    walk(node);
  }

  return [...ids];
}
