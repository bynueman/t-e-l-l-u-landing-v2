import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicBlogPost, getRelatedPublicBlogPosts } from "@/lib/blog";
import { buildArticleJsonLd, serializeJsonLd } from "@/lib/seo-jsonld";
import { StructuredArticleRenderer } from "@/components/blog/structured-article-renderer";
import { HomeMotion } from "@/components/home/home-motion";
import { Icon } from "@/components/ui/icon";
import { siteUrl } from "@/config/site";

export const dynamic = "force-dynamic";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPublicBlogPost(slug);

  if (!post) {
    return {
      title: "Artikel Tidak Ditemukan",
      description: "Halaman artikel yang kamu cari tidak tersedia.",
      robots: { index: false, follow: false },
    };
  }

  const pageTitle = post.seoTitle.toUpperCase().includes("TELLU")
    ? { absolute: `${post.seoTitle} — Blog` }
    : `${post.seoTitle} — Blog`;

  return {
    title: pageTitle,
    description: post.seoDescription,
    ...(post.canonicalUrl
      ? { alternates: { canonical: post.canonicalUrl } }
      : siteUrl
      ? { alternates: { canonical: new URL(`/blog/${post.slug}`, siteUrl).toString() } }
      : {}),
    openGraph: {
      title: `${post.seoTitle} — TELLU Blog`,
      description: post.seoDescription,
      type: "article",
      publishedTime: post.publishedAtIso,
      authors: [post.authorName],
      ...(post.coverImage ? { images: [{ url: post.coverImage, alt: post.coverAlt }] } : {}),
    },
  };
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const post = getPublicBlogPost(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPublicBlogPosts(post.slug, 2);
  const jsonLdSchemas = buildArticleJsonLd(post, siteUrl);

  const getCategoryStyles = (ecosystem: typeof post.ecosystem, category: string) => {
    const key = ecosystem ?? category;
    if (key === "creative") {
      return {
        pill: "bg-[#f5fae8] text-[#4c630e] border-[#e2f0b8]",
        dot: "bg-[#97b926]",
        accentBorder: "border-[#5d7712]",
      };
    }
    if (key === "business") {
      return {
        pill: "bg-[#f2efff] text-[#5540ba] border-[#ded7fc]",
        dot: "bg-[#6956dc]",
        accentBorder: "border-[#5540ba]",
      };
    }
    return {
      pill: "bg-[#fff2e8] text-[#9a3f00] border-[#ffd8bd]",
      dot: "bg-[#ee961e]",
      accentBorder: "border-[#c25700]",
    };
  };

  const catStyle = getCategoryStyles(post.ecosystem, post.category);

  return (
    <main className="bg-[#fcfbf8] min-h-screen pt-32 sm:pt-40 pb-28">
      {jsonLdSchemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
        />
      ))}
      <HomeMotion>
        <div className="page-container">
          <div data-reveal className="mb-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-muted transition-colors hover:text-foreground hover:bg-black/[0.02]"
            >
              <Icon name="arrow-left" size={13} />
              <span>Kembali ke Blog</span>
            </Link>
          </div>

          <header data-reveal className="max-w-3xl mb-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${catStyle.pill}`}
              >
                <i className={`h-1.5 w-1.5 rounded-full ${catStyle.dot}`} />
                {post.categoryLabel}
              </span>
              <span className="text-xs text-muted font-medium">
                {post.readingTimeMinutes} menit baca
              </span>
              <span className="text-xs text-muted" aria-hidden="true">•</span>
              <span className="text-xs text-muted">{post.publishedAt}</span>
            </div>

            <h1 className="display text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.12] text-balance">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="mt-4 text-base sm:text-lg text-muted leading-relaxed text-pretty">
                {post.excerpt}
              </p>
            )}

            <div className="mt-6 flex items-center gap-3 border-t border-line/70 pt-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-xs font-bold text-white uppercase">
                {post.authorName.charAt(0)}
              </div>
              <div>
                <span className="text-xs font-bold text-foreground block">{post.authorName}</span>
                <span className="text-xs text-muted">TELLU Editorial</span>
              </div>
            </div>
          </header>

          {post.coverImage && (
            <div data-reveal className="mb-14 sm:mb-16">
              <div className="relative aspect-[16/9] max-h-[500px] w-full overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-line/80 bg-[#f4f2eb] shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.coverImage}
                  alt={post.coverAlt}
                  className="h-full w-full object-cover object-top"
                />
              </div>
            </div>
          )}

          <article data-reveal className="mx-auto max-w-[66ch] text-foreground">
            <StructuredArticleRenderer
              document={post.structuredContent}
              accentBorderClass={catStyle.accentBorder}
            />

            {post.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-line pt-6">
                <span className="text-xs font-semibold text-muted mr-1">Topik:</span>
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-line bg-white px-3 py-1 text-xs text-muted"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </article>

          {relatedPosts.length > 0 && (
            <section data-reveal className="mt-20 sm:mt-28 border-t border-line pt-14 sm:pt-16">
              <div className="max-w-[66ch] mx-auto mb-8">
                <h3 className="display text-2xl sm:text-3xl font-bold text-foreground">
                  Artikel Terkait
                </h3>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 max-w-[66ch] mx-auto">
                {relatedPosts.map((rel) => (
                  <Link
                    key={rel.slug}
                    href={`/blog/${rel.slug}`}
                    className="group flex flex-col justify-between rounded-3xl border border-line bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5"
                  >
                    <div>
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-line/50 bg-[#f4f2eb] mb-3">
                        {rel.coverImage ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={rel.coverImage}
                            alt={rel.coverAlt}
                            className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[#f3f2eb] text-xs font-semibold text-muted">
                            TELLU {rel.categoryLabel}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">
                        {rel.categoryLabel}
                      </span>
                      <h4 className="text-sm font-bold text-foreground leading-snug group-hover:text-[#9a3f00] transition-colors line-clamp-2">
                        {rel.title}
                      </h4>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-foreground pt-3 border-t border-line/60">
                      <span>Baca artikel</span>
                      <Icon name="arrow-right" size={13} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div data-reveal className="mt-16 sm:mt-24 max-w-[66ch] mx-auto">
            <div className="rounded-[2rem] bg-foreground p-8 sm:p-10 text-white text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-6">
              <div>
                <h4 className="display text-xl sm:text-2xl font-bold">
                  Butuh bantuan menerapkannya di bisnismu?
                </h4>
                <p className="mt-1 text-xs sm:text-sm text-white/80">
                  Diskusikan kebutuhan website, branding, atau sistem operasional bisnismu bersama tim TELLU.
                </p>
              </div>
              <Link
                href="/#contact"
                className="mt-4 sm:mt-0 inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full bg-white px-5 text-xs font-bold text-foreground transition-all duration-200 hover:bg-[#fff2e8]"
              >
                <span>Hubungi Kami</span>
                <Icon name="message" size={14} />
              </Link>
            </div>
          </div>
        </div>
      </HomeMotion>
    </main>
  );
}
