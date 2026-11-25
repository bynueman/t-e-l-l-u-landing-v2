import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllPublicBlogPosts,
  getPublicBlogCategories,
  getPublicBlogSettings,
} from "@/lib/blog";
import { BlogExplorer } from "@/components/blog/blog-explorer";
import { HomeMotion } from "@/components/home/home-motion";
import { Icon } from "@/components/ui/icon";
import { TelluFloatingAccent } from "@/components/layout/tellu-floating-accent";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = getPublicBlogSettings();
  return {
    title: { absolute: "Blog TELLU — Teknologi, Branding & Bisnis Digital" },
    description: settings.defaultSeoDescription,
    openGraph: {
      title: "Blog TELLU — Teknologi, Branding & Bisnis Digital",
      description: settings.defaultSeoDescription,
      type: "website",
    },
  };
}

export default function BlogPage() {
  const settings = getPublicBlogSettings();
  const allPosts = getAllPublicBlogPosts();
  const categories = getPublicBlogCategories();
  const featuredPost = allPosts.find((p) => p.featured) ?? allPosts[0] ?? null;

  return (
    <main className="bg-[#fcfbf8] min-h-screen pt-32 sm:pt-40 pb-24">
      <HomeMotion>
        <div className="page-container">
          {/* 1. Blog Hero Header */}
          <div data-reveal className="max-w-4xl mb-12 sm:mb-16">
            <h1 className="display text-4xl sm:text-6xl font-bold tracking-tight text-foreground text-balance">
              {settings.blogTitle.replace(/\.$/, "")}
              <span className="text-[#ee961e]">.</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted leading-relaxed max-w-2xl text-pretty">
              {settings.blogDescription}
            </p>
          </div>

          {allPosts.length === 0 ? (
            /* 2A. Intentional Editorial Empty State */
            <section
              aria-label="Status Blog TELLU"
              data-reveal
              className="relative overflow-hidden rounded-[2rem] border border-line bg-white p-8 sm:p-14"
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-xl">
                  <h2 className="display text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
                    Artikel baru sedang kami siapkan.
                  </h2>
                  <p className="mt-3 text-sm sm:text-base text-muted leading-relaxed text-pretty">
                    Nantikan panduan dan pembahasan seputar website, branding, dan pengembangan bisnis dari TELLU.
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link href="/technology" className="button-outline text-xs sm:text-sm">
                      <span>Jelajahi TELLU Technology</span>
                      <Icon name="arrow-right" size={15} />
                    </Link>
                    <Link href="/#contact" className="button-ghost text-xs sm:text-sm">
                      <span>Hubungi Tim Kami</span>
                    </Link>
                  </div>
                </div>
                <div className="hidden sm:flex items-center justify-center pr-4">
                  <TelluFloatingAccent tone="muted" className="relative !static w-16" />
                </div>
              </div>
            </section>
          ) : (
            <>
              {/* 2B. Featured Article Banner */}
              {featuredPost && (
                <div data-reveal className="mb-14 sm:mb-20">
                  <div className="relative overflow-hidden rounded-[2.5rem] border border-line bg-white p-6 sm:p-10 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-black/5">
                    <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
                      <div className="lg:col-span-7">
                        <Link
                          href={`/blog/${featuredPost.slug}`}
                          className="group relative block aspect-[16/10] w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-line/60 bg-[#f4f2eb]"
                        >
                          {featuredPost.coverImage ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={featuredPost.coverImage}
                              alt={featuredPost.coverAlt}
                              className="h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[#f3f2eb] text-sm font-semibold text-muted">
                              TELLU {featuredPost.categoryLabel}
                            </div>
                          )}
                        </Link>
                      </div>

                      <div className="flex flex-col justify-center lg:col-span-5">
                        <div className="flex items-center gap-2.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ffd8bd] bg-[#fff2e8] px-3 py-1 text-xs font-bold text-[#9a3f00]">
                            <i className="h-1.5 w-1.5 rounded-full bg-[#ee961e]" />
                            {featuredPost.categoryLabel}
                          </span>
                          <span className="text-xs text-muted font-medium">
                            {featuredPost.readingTimeMinutes} mnt baca
                          </span>
                        </div>

                        <h2 className="display mt-4 text-2xl sm:text-3xl font-bold leading-tight text-foreground">
                          <Link
                            href={`/blog/${featuredPost.slug}`}
                            className="transition-colors hover:text-[#9a3f00]"
                          >
                            {featuredPost.title}
                          </Link>
                        </h2>

                        <p className="mt-3 text-sm leading-relaxed text-muted line-clamp-3">
                          {featuredPost.excerpt}
                        </p>

                        <div className="mt-6 flex items-center justify-between border-t border-line/70 pt-5">
                          <div className="text-xs text-muted">
                            <span className="font-semibold text-foreground block">{featuredPost.authorName}</span>
                            <span>{featuredPost.publishedAt}</span>
                          </div>
                          <Link
                            href={`/blog/${featuredPost.slug}`}
                            className="button-primary inline-flex items-center gap-2 text-xs font-bold !min-h-10 px-5"
                          >
                            <span>Baca Artikel</span>
                            <Icon name="arrow-right" size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Interactive Article Explorer */}
              {allPosts.length > 1 && (
                <section aria-labelledby="all-articles-heading" data-reveal>
                  <h2 id="all-articles-heading" className="sr-only">
                    Semua Artikel
                  </h2>
                  <BlogExplorer
                    posts={allPosts}
                    categories={categories}
                    featuredSlug={featuredPost?.slug}
                  />
                </section>
              )}
            </>
          )}

          {/* 4. Consultation CTA Banner */}
          <div data-reveal className="mt-20 sm:mt-28">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-foreground px-8 py-12 sm:px-14 sm:py-16 text-white text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-8">
              <div className="max-w-xl">
                <h3 className="display text-3xl sm:text-4xl font-bold">
                  Ingin berdiskusi tentang website, branding, atau sistem bisnis?
                </h3>
                <p className="mt-3 text-sm text-white/80 leading-relaxed">
                  Ceritakan kebutuhan bisnismu bersama tim TELLU untuk menentukan langkah pengerjaan yang paling sesuai.
                </p>
              </div>
              <div className="mt-6 sm:mt-0 flex-shrink-0">
                <Link
                  href="/#contact"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-7 text-xs font-bold text-foreground transition-all duration-200 hover:bg-[#fff2e8] hover:shadow-lg hover:shadow-black/20"
                >
                  <span>Mulai Konsultasi</span>
                  <Icon name="arrow-right" size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </HomeMotion>
    </main>
  );
}
