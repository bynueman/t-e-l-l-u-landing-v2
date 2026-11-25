import Link from "next/link";
import { getHomepageBlogHighlight, type PublicBlogPost } from "@/lib/blog";
import { Icon } from "@/components/ui/icon";

function getCategoryAccent(ecosystem: PublicBlogPost["ecosystem"], category: string) {
  const key = ecosystem ?? category;
  if (key === "creative") {
    return {
      pill: "bg-[#f5fae8] text-[#4c630e] border-[#e2f0b8]",
      dot: "bg-[#97b926]",
      hoverTitle: "group-hover:text-[#4c630e]",
    };
  }
  if (key === "business") {
    return {
      pill: "bg-[#f2efff] text-[#5540ba] border-[#ded7fc]",
      dot: "bg-[#6956dc]",
      hoverTitle: "group-hover:text-[#5540ba]",
    };
  }
  return {
    pill: "bg-[#fff2e8] text-[#9a3f00] border-[#ffd8bd]",
    dot: "bg-[#ee961e]",
    hoverTitle: "group-hover:text-[#9a3f00]",
  };
}

function ArticleMetaRow({ post }: { post: PublicBlogPost }) {
  const accent = getCategoryAccent(post.ecosystem, post.category);
  return (
    <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-semibold ${accent.pill}`}
      >
        <i className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} aria-hidden="true" />
        {post.categoryLabel}
      </span>
      <span>{post.readingTimeMinutes} mnt baca</span>
      <span aria-hidden="true">·</span>
      <time dateTime={post.publishedAtIso}>{post.publishedAt}</time>
    </div>
  );
}

function FeaturedArticleBlock({ post }: { post: PublicBlogPost }) {
  const accent = getCategoryAccent(post.ecosystem, post.category);
  return (
    <article className="group flex flex-col">
      <Link
        href={`/blog/${post.slug}`}
        className="relative block aspect-[16/10] w-full overflow-hidden rounded-2xl border border-line/80 bg-[#f4f2eb]"
      >
        {post.coverImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={post.coverImage}
            alt={post.coverAlt}
            className="h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.025] motion-reduce:transition-none motion-reduce:group-hover:transform-none"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#f3f2eb] text-xs font-semibold text-muted">
            TELLU {post.categoryLabel}
          </div>
        )}
      </Link>

      <div className="mt-5">
        <ArticleMetaRow post={post} />

        <h3 className="display mt-3.5 text-2xl sm:text-3xl font-bold leading-tight text-foreground text-balance">
          <Link href={`/blog/${post.slug}`} className={`transition-colors ${accent.hoverTitle}`}>
            {post.title}
          </Link>
        </h3>

        {post.excerpt && (
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-muted line-clamp-3 text-pretty">
            {post.excerpt}
          </p>
        )}

        <Link
          href={`/blog/${post.slug}`}
          className="text-link mt-5 inline-flex items-center gap-1.5 text-xs sm:text-sm text-foreground"
        >
          <span>Baca Artikel</span>
          <Icon name="arrow-right" size={14} />
        </Link>
      </div>
    </article>
  );
}

function SupportingArticleItem({ post }: { post: PublicBlogPost }) {
  const accent = getCategoryAccent(post.ecosystem, post.category);
  return (
    <article className="group py-6 first:pt-0 last:pb-0">
      <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-4 sm:items-start">
        {post.coverImage && (
          <Link
            href={`/blog/${post.slug}`}
            className="relative block aspect-[16/10] w-full sm:w-40 lg:w-full xl:w-40 shrink-0 overflow-hidden rounded-xl border border-line/70 bg-[#f4f2eb]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage}
              alt={post.coverAlt}
              className="h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:transform-none"
            />
          </Link>
        )}

        <div className="min-w-0 flex-1">
          <ArticleMetaRow post={post} />
          <h3 className="mt-2.5 text-lg font-bold leading-snug tracking-tight text-foreground text-balance">
            <Link href={`/blog/${post.slug}`} className={`transition-colors ${accent.hoverTitle}`}>
              {post.title}
            </Link>
          </h3>
          {post.excerpt && (
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted line-clamp-2 text-pretty">
              {post.excerpt}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export function BlogHighlight() {
  const selection = getHomepageBlogHighlight();
  if (!selection) return null;

  const { primary, supporting } = selection;

  return (
    <section
      id="blog-highlight"
      aria-labelledby="blog-highlight-heading"
      className="page-container section-space border-t border-line"
    >
      <div
        data-reveal
        className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between border-b border-line pb-7 mb-10 sm:mb-12"
      >
        <div className="max-w-2xl">
          <h2
            id="blog-highlight-heading"
            className="display text-3xl sm:text-5xl font-bold tracking-tight text-foreground text-balance"
          >
            Wawasan untuk bisnismu.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted leading-relaxed text-pretty">
            Panduan praktis seputar website, branding, dan pengembangan bisnis.
          </p>
        </div>

        <Link
          href="/blog"
          className="text-link inline-flex items-center gap-1.5 text-xs sm:text-sm text-foreground shrink-0 w-fit"
        >
          <span>Lihat Semua Artikel</span>
          <Icon name="arrow-right" size={15} />
        </Link>
      </div>

      {supporting.length === 0 ? (
        /* Single published article: balanced editorial split */
        <article data-reveal className="group grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <Link
              href={`/blog/${primary.slug}`}
              className="relative block aspect-[16/10] w-full overflow-hidden rounded-2xl border border-line/80 bg-[#f4f2eb]"
            >
              {primary.coverImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={primary.coverImage}
                  alt={primary.coverAlt}
                  className="h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.025] motion-reduce:transition-none motion-reduce:group-hover:transform-none"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#f3f2eb] text-xs font-semibold text-muted">
                  TELLU {primary.categoryLabel}
                </div>
              )}
            </Link>
          </div>
          <div className="lg:col-span-5">
            <ArticleMetaRow post={primary} />
            <h3 className="display mt-4 text-2xl sm:text-4xl font-bold leading-tight text-foreground text-balance">
              <Link
                href={`/blog/${primary.slug}`}
                className={`transition-colors ${getCategoryAccent(primary.ecosystem, primary.category).hoverTitle}`}
              >
                {primary.title}
              </Link>
            </h3>
            {primary.excerpt && (
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-muted text-pretty">
                {primary.excerpt}
              </p>
            )}
            <Link
              href={`/blog/${primary.slug}`}
              className="text-link mt-6 inline-flex items-center gap-1.5 text-xs sm:text-sm text-foreground"
            >
              <span>Baca Artikel</span>
              <Icon name="arrow-right" size={14} />
            </Link>
          </div>
        </article>
      ) : supporting.length === 1 ? (
        /* Two published articles: balanced two-column editorial split */
        <div data-reveal className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          <FeaturedArticleBlock post={primary} />
          <div className="lg:border-l lg:border-line lg:pl-12">
            <FeaturedArticleBlock post={supporting[0]} />
          </div>
        </div>
      ) : (
        /* Three or more published articles: editorial magazine layout */
        <div data-reveal className="grid gap-10 lg:grid-cols-12 lg:gap-12 lg:items-start">
          <div className="lg:col-span-7">
            <FeaturedArticleBlock post={primary} />
          </div>
          <div
            data-stagger
            className="lg:col-span-5 lg:border-l lg:border-line lg:pl-10 flex flex-col divide-y divide-line border-t border-line pt-8 lg:border-t-0 lg:pt-0"
          >
            {supporting.map((post) => (
              <SupportingArticleItem key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
