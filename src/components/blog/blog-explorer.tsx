"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { PublicBlogPost } from "@/lib/blog";
import type { CategoryRecord } from "@/lib/cms/categories";
import { Icon } from "@/components/ui/icon";

interface BlogExplorerProps {
  posts: PublicBlogPost[];
  categories: CategoryRecord[];
  featuredSlug?: string;
}

export function BlogExplorer({ posts, categories, featuredSlug }: BlogExplorerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("semua");
  const [searchQuery, setSearchQuery] = useState("");

  const activeCategories = useMemo(() => {
    const usedSlugs = new Set(posts.map((p) => p.category));
    return categories.filter((c) => usedSlugs.has(c.slug));
  }, [categories, posts]);

  const filteredPosts = useMemo(() => {
    const trimmedQuery = searchQuery.toLowerCase().trim();
    const isDefaultUnfiltered = selectedCategory === "semua" && trimmedQuery === "";

    return posts.filter((post) => {
      if (isDefaultUnfiltered && featuredSlug && posts.length > 1 && post.slug === featuredSlug) {
        return false;
      }

      if (selectedCategory !== "semua" && post.category !== selectedCategory) {
        return false;
      }

      if (trimmedQuery !== "") {
        const matchesTitle = post.title.toLowerCase().includes(trimmedQuery);
        const matchesExcerpt = post.excerpt.toLowerCase().includes(trimmedQuery);
        const matchesCategory = post.categoryLabel.toLowerCase().includes(trimmedQuery);
        const matchesTags = post.tags.some((tag) => tag.toLowerCase().includes(trimmedQuery));
        if (!matchesTitle && !matchesExcerpt && !matchesCategory && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [posts, selectedCategory, searchQuery, featuredSlug]);

  const resetFilters = () => {
    setSelectedCategory("semua");
    setSearchQuery("");
  };

  const getCategoryTheme = (ecosystem: PublicBlogPost["ecosystem"], slug: string) => {
    const key = ecosystem ?? slug;
    if (key === "creative") {
      return {
        pill: "bg-[#f5fae8] text-[#4c630e] border-[#e2f0b8]",
        dot: "bg-[#97b926]",
        activeBtn: "bg-[#4c630e] text-white shadow-sm",
        border: "hover:border-[#97b926]/40",
        hoverText: "group-hover:text-[#4c630e]",
      };
    }
    if (key === "business") {
      return {
        pill: "bg-[#f2efff] text-[#5540ba] border-[#ded7fc]",
        dot: "bg-[#6956dc]",
        activeBtn: "bg-[#5540ba] text-white shadow-sm",
        border: "hover:border-[#6956dc]/40",
        hoverText: "group-hover:text-[#5540ba]",
      };
    }
    return {
      pill: "bg-[#fff2e8] text-[#9a3f00] border-[#ffd8bd]",
      dot: "bg-[#ee961e]",
      activeBtn: "bg-[#b84300] text-white shadow-sm",
      border: "hover:border-[#ee961e]/40",
      hoverText: "group-hover:text-[#9a3f00]",
    };
  };

  if (posts.length === 0) return null;

  return (
    <div className="w-full">
      {/* Search and Category Filter Controls */}
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between border-b border-line pb-8 mb-10">
        {activeCategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Kategori Artikel">
            <button
              type="button"
              role="tab"
              aria-selected={selectedCategory === "semua"}
              onClick={() => setSelectedCategory("semua")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                selectedCategory === "semua"
                  ? "bg-foreground text-white shadow-sm"
                  : "bg-white border border-line text-muted hover:text-foreground hover:bg-black/[0.02]"
              }`}
            >
              <span>Semua</span>
            </button>

            {activeCategories.map((cat) => {
              const isActive = selectedCategory === cat.slug;
              const theme = getCategoryTheme(cat.ecosystem, cat.slug);
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? theme.activeBtn
                      : "bg-white border border-line text-muted hover:text-foreground hover:bg-black/[0.02]"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white" : theme.dot}`} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="relative w-full md:w-72">
          <Icon
            name="search"
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari artikel..."
            aria-label="Cari artikel"
            className="w-full rounded-full border border-line bg-white pl-9 pr-9 py-2 text-xs font-medium text-foreground placeholder:text-muted focus:border-foreground focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Hapus pencarian"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filtered Articles Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => {
            const theme = getCategoryTheme(post.ecosystem, post.category);
            const isFeatured = post.slug === featuredSlug;

            return (
              <article
                key={post.slug}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-line bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 ${theme.border}`}
              >
                <div>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="relative block aspect-[16/10] w-full overflow-hidden rounded-2xl border border-line/60 bg-[#f6f5ef]"
                  >
                    {post.coverImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={post.coverImage}
                        alt={post.coverAlt}
                        className="h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#f3f2eb] text-xs font-semibold text-muted">
                        TELLU {post.categoryLabel}
                      </div>
                    )}
                    {isFeatured && (
                      <span className="absolute top-3 left-3 rounded-full bg-foreground/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase text-white shadow-sm">
                        Pilihan
                      </span>
                    )}
                  </Link>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${theme.pill}`}
                    >
                      <i className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
                      {post.categoryLabel}
                    </span>
                    <span className="text-xs text-muted font-medium">
                      {post.readingTimeMinutes} mnt baca
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold leading-snug text-foreground">
                    <Link href={`/blog/${post.slug}`} className={`transition-colors ${theme.hoverText}`}>
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted line-clamp-3">{post.excerpt}</p>
                </div>

                <div className="mt-5 border-t border-line/60 pt-3.5 flex items-center justify-between">
                  <span className="text-xs text-muted">{post.publishedAt}</span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-foreground transition-colors group-hover:text-[#9a3f00]"
                  >
                    <span>Baca</span>
                    <Icon
                      name="arrow-right"
                      size={13}
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-line bg-white/70 p-12 text-center max-w-md mx-auto">
          <div className="mx-auto w-12 h-12 rounded-full bg-black/[0.03] flex items-center justify-center text-muted mb-4">
            <Icon name="search" size={20} />
          </div>
          <h4 className="text-base font-bold text-foreground">Tidak ada artikel yang cocok</h4>
          <p className="mt-1.5 text-xs text-muted leading-relaxed">
            Tidak ditemukan artikel untuk kata kunci &ldquo;{searchQuery}&rdquo; dalam kategori yang dipilih.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="button-outline mt-5 text-xs font-semibold !min-h-9 px-4 inline-flex items-center gap-1.5"
          >
            <Icon name="reset" size={13} />
            <span>Reset Pencarian</span>
          </button>
        </div>
      )}
    </div>
  );
}
