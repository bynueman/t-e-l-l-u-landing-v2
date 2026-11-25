import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StructuredArticleRenderer } from "@/components/blog/structured-article-renderer";
import { Icon } from "@/components/ui/icon";
import { requireAdminPageSession } from "@/lib/cms/admin-page-guard";
import { getDb } from "@/lib/cms/db";
import { getAdminPostById } from "@/lib/cms/posts";
import { formatJakartaDate, formatJakartaDateTime } from "@/lib/cms/time";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pratinjau Artikel — TELLU Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPostPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminPageSession();
  const { id } = await params;
  const db = getDb();
  const post = getAdminPostById(db, user, id);
  if (!post) notFound();

  const primaryEcosystem = post.categories.find((c) => c.ecosystem)?.ecosystem ?? "technology";
  const accentBorder =
    primaryEcosystem === "creative"
      ? "border-[#5d770b]"
      : primaryEcosystem === "business"
        ? "border-[#5e4dcc]"
        : "border-[#c25700]";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Admin Preview Top Banner */}
      <div className="sticky top-0 z-30 border-b border-amber-200 bg-amber-50/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-amber-950">
            <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 font-semibold uppercase tracking-wider text-[10px]">
              Pratinjau Admin ({post.status})
            </span>
            <span>
              {post.status === "published"
                ? `Terbit pada ${formatJakartaDateTime(post.publishedAt)}`
                : "Artikel ini belum terlihat oleh pengunjung publik."}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/posts/${post.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-[#fcfbf8]"
            >
              <Icon name="edit" className="w-3.5 h-3.5" />
              Kembali ke Editor
            </Link>
            {post.status === "published" && (
              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-xs font-semibold text-white"
              >
                Buka Halaman Publik
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Rendered Article Preview Matching Public Layout */}
      <article className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16 space-y-8">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            {post.categories.map((cat) => (
              <span
                key={cat.id}
                className="rounded-full border border-line bg-white px-3 py-1 font-semibold text-foreground"
              >
                {cat.name}
              </span>
            ))}
            <span>•</span>
            <span>{post.readingTimeMinutes} menit baca</span>
            <span>•</span>
            <span>
              {formatJakartaDate(post.publishedAt ?? post.updatedAt)}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.1] text-foreground text-balance">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-base sm:text-lg leading-relaxed text-muted">{post.excerpt}</p>
          )}

          <p className="text-xs font-medium text-muted">Oleh {post.authorName}</p>
        </header>

        {post.coverUrl && (
          <figure className="overflow-hidden rounded-2xl border border-line bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverUrl}
              alt={post.coverAlt || post.title}
              className="w-full h-auto max-h-[500px] object-cover"
            />
          </figure>
        )}

        <div className="rounded-2xl border border-line bg-white p-6 sm:p-10">
          <StructuredArticleRenderer
            document={post.structuredContent}
            accentBorderClass={accentBorder}
          />
        </div>
      </article>
    </div>
  );
}
