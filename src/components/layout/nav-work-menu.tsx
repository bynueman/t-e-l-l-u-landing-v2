"use client";

import Image from "next/image";
import Link from "next/link";
import { technologyProjects } from "@/lib/technology-portfolio";
import { Icon } from "@/components/ui/icon";

interface NavWorkMenuProps {
  open: boolean;
  onClose: () => void;
}

const portfolioCategories = [
  {
    id: "company-profile",
    title: "Company Profile",
    subtitle: "Website institusi & bisnis",
    icon: "browser" as const,
    href: "/technology#selected-work",
  },
  {
    id: "ecommerce",
    title: "Katalog & E-Commerce",
    subtitle: "Toko online & booking",
    icon: "cart" as const,
    href: "/technology#capabilities",
  },
  {
    id: "webapp",
    title: "Web App & SaaS",
    subtitle: "Sistem & platform digital",
    icon: "app" as const,
    href: "/technology#capabilities",
  },
  {
    id: "revamp",
    title: "Website Revamp",
    subtitle: "Pembaruan arsitektur & SEO",
    icon: "refresh" as const,
    href: "/technology#packages",
  },
] as const;

export function NavWorkMenu({ open, onClose }: NavWorkMenuProps) {
  // Show only top 2 curated projects as featured highlights to stay compact
  const featuredProjects = technologyProjects.slice(0, 2);

  return (
    <div
      id="work-dropdown"
      role="region"
      aria-label="Menu Portfolio TELLU"
      className={`nav-dropdown-panel absolute left-1/2 -translate-x-1/2 top-full pt-3 z-50 w-[440px] max-w-[calc(100vw-2rem)] transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        open
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-[5px] pointer-events-none invisible"
      }`}
    >
      <div className="overflow-hidden rounded-3xl border border-line bg-white/98 p-5 shadow-2xl shadow-black/10 backdrop-blur-xl">
        {/* Header Bar */}
        <div className="mb-3.5 flex items-center justify-between border-b border-line pb-3">
          <span className="text-xs font-bold text-foreground">Kategori Proyek Website</span>
          <Link
            href="/technology#selected-work"
            onClick={onClose}
            className="group inline-flex items-center gap-1 text-xs font-semibold text-[#a44a00] hover:text-[#b85400] transition-colors"
          >
            <span>Semua Portfolio</span>
            <Icon name="arrow-right" size={13} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* 1. Categorized Solutions (Scalable 2x2 Grid) */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {portfolioCategories.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              onClick={onClose}
              className="group flex items-start gap-2.5 rounded-xl p-2.5 border border-line/60 bg-[#fdfdfb] hover:bg-[#fff7ed] hover:border-[#fed7aa] transition-all"
            >
              <div className="mt-0.5 text-muted group-hover:text-[#a44a00] transition-colors">
                <Icon name={cat.icon} size={16} />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold text-foreground group-hover:text-[#a44a00] transition-colors truncate">
                  {cat.title}
                </span>
                <span className="block text-[11px] text-muted truncate mt-0.5">
                  {cat.subtitle}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* 2. Curated Featured Projects (Fixed 2 Highlights Side-by-Side) */}
        <div className="border-t border-line pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-muted">
              Sorotan Pilihan
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {featuredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/technology?project=${project.id}#selected-work`}
                onClick={onClose}
                className="group flex flex-col rounded-xl border border-line bg-white overflow-hidden hover:border-[#a44a00] hover:shadow-md transition-all"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#f0eee6]">
                  <Image
                    src={project.image}
                    alt={project.name}
                    fill
                    sizes="200px"
                    className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-2.5 min-w-0">
                  <h4 className="text-xs font-bold text-foreground truncate group-hover:text-[#a44a00] transition-colors">
                    {project.name}
                  </h4>
                  <p className="text-[11px] text-muted truncate mt-0.5">
                    {project.category.split("/")[0].trim()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-3.5 -mx-5 -mb-5 border-t border-line bg-[#faf9f5] px-5 py-2.5 text-center">
          <Link
            href="/technology#selected-work"
            onClick={onClose}
            className="group inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground"
          >
            <Icon name="browser" size={14} />
            <span>Lihat Semua Portfolio &amp; Demo Website</span>
            <Icon name="arrow-right" size={13} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
