import React from "react";
import {
  isSafeHttpOrRelativeUrl,
  isSafeMediaImageSrc,
  type StructuredDocument,
  type StructuredNode,
} from "@/lib/cms/content";

function renderInlineContent(nodes: StructuredNode[] | undefined, keyPrefix: string): React.ReactNode {
  if (!nodes || nodes.length === 0) return null;

  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    if (node.type === "hardBreak") {
      return <br key={key} />;
    }
    if (node.type !== "text") {
      return null;
    }

    let content: React.ReactNode = node.text ?? "";
    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.type === "bold") {
          content = <strong>{content}</strong>;
        } else if (mark.type === "italic") {
          content = <em>{content}</em>;
        } else if (mark.type === "underline") {
          content = <u>{content}</u>;
        } else if (mark.type === "link") {
          const href = mark.attrs?.href ?? "";
          if (isSafeHttpOrRelativeUrl(href)) {
            const isExternal = href.startsWith("http");
            content = (
              <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer nofollow" : undefined}
                className="font-semibold text-[#a44a00] underline underline-offset-4 hover:text-[#20211f]"
              >
                {content}
              </a>
            );
          }
        }
      }
    }

    return <React.Fragment key={key}>{content}</React.Fragment>;
  });
}

function renderBlockNode(
  node: StructuredNode,
  index: number,
  accentBorderClass: string
): React.ReactNode {
  const key = `block-${index}`;

  switch (node.type) {
    case "paragraph": {
      const hasContent = Boolean(node.content && node.content.length > 0);
      if (!hasContent) {
        return <p key={key} className="h-3" aria-hidden="true" />;
      }
      return (
        <p key={key} className="text-base sm:text-[17px] leading-[1.8] text-foreground/85 text-pretty">
          {renderInlineContent(node.content, key)}
        </p>
      );
    }

    case "heading": {
      const level = node.attrs?.level === 3 ? 3 : 2;
      if (level === 3) {
        return (
          <h3 key={key} className="text-lg sm:text-xl font-bold tracking-tight text-foreground pt-2">
            {renderInlineContent(node.content, key)}
          </h3>
        );
      }
      return (
        <h2 key={key} className="display text-2xl sm:text-3xl font-bold tracking-tight text-foreground pt-4">
          {renderInlineContent(node.content, key)}
        </h2>
      );
    }

    case "bulletList":
      return (
        <ul key={key} className="my-4 space-y-2 list-disc pl-6 text-base sm:text-[17px] leading-[1.75] text-foreground/85">
          {node.content?.map((item, idx) => (
            <li key={`${key}-li-${idx}`}>{item.content?.map((c, ci) => renderBlockNode(c, ci, accentBorderClass))}</li>
          ))}
        </ul>
      );

    case "orderedList":
      return (
        <ol key={key} className="my-4 space-y-2 list-decimal pl-6 text-base sm:text-[17px] leading-[1.75] text-foreground/85">
          {node.content?.map((item, idx) => (
            <li key={`${key}-li-${idx}`}>{item.content?.map((c, ci) => renderBlockNode(c, ci, accentBorderClass))}</li>
          ))}
        </ol>
      );

    case "blockquote":
      return (
        <blockquote
          key={key}
          className={`my-6 border-l-2 ${accentBorderClass} pl-5 sm:pl-6 py-1 text-base sm:text-[17px] italic leading-relaxed text-foreground/90`}
        >
          {node.content?.map((c, ci) => renderBlockNode(c, ci, accentBorderClass))}
        </blockquote>
      );

    case "horizontalRule":
      return <hr key={key} className="my-8 border-t border-line" />;

    case "image": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
      if (!isSafeMediaImageSrc(src)) return null;
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      const title = typeof node.attrs?.title === "string" ? node.attrs.title : "";
      return (
        <figure key={key} className="my-8">
          <div className="overflow-hidden rounded-2xl border border-line bg-[#f4f2eb]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className="w-full h-auto object-cover" />
          </div>
          {(title || alt) && (
            <figcaption className="mt-2.5 text-xs text-muted text-center">
              {title || alt}
            </figcaption>
          )}
        </figure>
      );
    }

    case "table":
      return (
        <div key={key} className="my-6 overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {node.content?.map((row, rIdx) => (
                <tr key={`${key}-row-${rIdx}`} className="border-b border-line last:border-b-0">
                  {row.content?.map((cell, cIdx) => {
                    const Tag = cell.type === "tableHeader" ? "th" : "td";
                    const colSpan = typeof cell.attrs?.colspan === "number" ? cell.attrs.colspan : 1;
                    const rowSpan = typeof cell.attrs?.rowspan === "number" ? cell.attrs.rowspan : 1;
                    return (
                      <Tag
                        key={`${key}-cell-${rIdx}-${cIdx}`}
                        colSpan={colSpan}
                        rowSpan={rowSpan}
                        className={`px-4 py-2.5 text-left align-top border-r border-line last:border-r-0 ${
                          cell.type === "tableHeader" ? "bg-[#f9f7f3] font-semibold text-foreground" : "text-foreground/85"
                        }`}
                      >
                        {cell.content?.map((c, ci) => renderBlockNode(c, ci, accentBorderClass))}
                      </Tag>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      return null;
  }
}

export function StructuredArticleRenderer({
  document,
  accentBorderClass = "border-[#c25700]",
}: {
  document: StructuredDocument;
  accentBorderClass?: string;
}) {
  return (
    <div className="space-y-4">
      {document.content.map((node, index) => renderBlockNode(node, index, accentBorderClass))}
    </div>
  );
}
