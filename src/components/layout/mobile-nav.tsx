"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { technologyProjects } from "@/lib/technology-portfolio";
import { Icon, IconBadge } from "@/components/ui/icon";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  activePath?: string;
}

function ChevronDown({ className = "", open = false }: { className?: string; open?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        open ? "rotate-180" : "rotate-0"
      } ${className}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function MobileNav({ open, onClose, activePath }: MobileNavProps) {
  const [servicesExpanded, setServicesExpanded] = useState(true);
  const [workExpanded, setWorkExpanded] = useState(false);

  if (!open) return null;

  return (
    <div
      id="mobile-navigation"
      role="dialog"
      aria-modal="true"
      aria-label="Navigasi Menu Mobile TELLU"
      className="fixed inset-x-0 top-[76px] z-50 px-4 pb-6 transition-all duration-300 lg:hidden"
    >
      {/* Background Backdrop click-catcher */}
      <div
        className="fixed inset-0 -z-10 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Drawer Shell */}
      <nav className="max-h-[calc(100vh-96px)] overflow-y-auto rounded-3xl border border-line bg-white/98 p-4 shadow-2xl shadow-black/15 backdrop-blur-xl flex flex-col gap-2">
        {/* 1. Beranda */}
        <Link
          href="/"
          onClick={onClose}
          className={`flex items-center justify-between rounded-2xl px-4 py-3 text-base font-bold transition-colors ${
            activePath === "/" ? "bg-black/[0.04] text-foreground" : "text-foreground hover:bg-black/[0.02]"
          }`}
        >
          <span>Beranda</span>
          <Icon name="arrow-right" size={15} className="text-muted/60" />
        </Link>

        {/* 2. Layanan (Accordion) */}
        <div className="rounded-2xl border border-line/70 bg-[#fbfbf8] p-2">
          <button
            type="button"
            aria-expanded={servicesExpanded}
            onClick={() => setServicesExpanded(!servicesExpanded)}
            className="flex w-full items-center justify-between px-3 py-2 text-left text-base font-bold text-foreground"
          >
            <span>Layanan</span>
            <ChevronDown open={servicesExpanded} />
          </button>

          {servicesExpanded && (
            <div className="mt-2 flex flex-col gap-1.5 px-1 pb-1">
              {/* Technology */}
              <Link
                href="/technology"
                onClick={onClose}
                className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-line/60 transition-colors hover:bg-black/[0.02]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <IconBadge name="code" tone="technology" />
                  <div className="min-w-0">
                    <span className="block text-sm font-bold text-foreground">Technology</span>
                    <p className="text-[11px] text-muted truncate">Website, domain &amp; maintenance</p>
                  </div>
                </div>
                <Icon name="chevron-right" size={15} className="text-muted/50" />
              </Link>

              {/* Creative */}
              <Link
                href="/creative"
                onClick={onClose}
                className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-line/60 transition-colors hover:bg-black/[0.02]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <IconBadge name="palette" tone="creative" />
                  <div className="min-w-0">
                    <span className="block text-sm font-bold text-foreground">Creative</span>
                    <p className="text-[11px] text-muted truncate">Branding, konten &amp; media sosial</p>
                  </div>
                </div>
                <Icon name="chevron-right" size={15} className="text-muted/50" />
              </Link>

              {/* Business */}
              <Link
                href="/business"
                onClick={onClose}
                className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-line/60 transition-colors hover:bg-black/[0.02]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <IconBadge name="app" tone="business" />
                  <div className="min-w-0">
                    <span className="block text-sm font-bold text-foreground">Business</span>
                    <p className="text-[11px] text-muted truncate">Software &amp; SaaS bisnis</p>
                  </div>
                </div>
                <Icon name="chevron-right" size={15} className="text-muted/50" />
              </Link>
            </div>
          )}
        </div>

        {/* 3. Portfolio (Accordion) */}
        <div className="rounded-2xl border border-line/70 bg-[#fbfbf8] p-2">
          <button
            type="button"
            aria-expanded={workExpanded}
            onClick={() => setWorkExpanded(!workExpanded)}
            className="flex w-full items-center justify-between px-3 py-2 text-left text-base font-bold text-foreground"
          >
            <span>Portfolio</span>
            <ChevronDown open={workExpanded} />
          </button>

          {workExpanded && (
            <div className="mt-2 flex flex-col gap-2 px-1 pb-1">
              <Link
                href="/technology#selected-work"
                onClick={onClose}
                className="flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5 text-xs font-bold text-[#a44a00] border border-[#fed7aa] bg-[#fffaf5]"
              >
                <span>Lihat Semua Portfolio</span>
                <Icon name="arrow-right" size={14} />
              </Link>

              <div className="text-[11px] font-bold uppercase tracking-wider text-muted px-1 mt-1">
                Sorotan Pilihan
              </div>

              {technologyProjects.slice(0, 2).map((project) => (
                <Link
                  key={project.id}
                  href={`/technology?project=${project.id}#selected-work`}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl bg-white p-2 border border-line/60"
                >
                  <div className="relative h-9 w-12 flex-shrink-0 overflow-hidden rounded-md border border-line bg-gray-100">
                    <Image
                      src={project.image}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="truncate text-xs font-bold text-foreground">{project.name}</h5>
                    <p className="truncate text-[11px] text-muted">{project.category}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 4. Blog */}
        <Link
          href="/blog"
          onClick={onClose}
          className={`flex items-center justify-between rounded-2xl px-4 py-3 text-base font-bold transition-colors ${
            activePath?.startsWith("/blog")
              ? "bg-black/[0.04] text-foreground font-semibold"
              : "text-foreground hover:bg-black/[0.02]"
          }`}
        >
          <span>Blog</span>
          <Icon name="arrow-right" size={14} className="text-muted/60" />
        </Link>

        {/* 5. Tentang */}
        <Link
          href="/#tentang"
          onClick={onClose}
          className="flex items-center justify-between rounded-2xl px-4 py-3 text-base font-bold text-foreground hover:bg-black/[0.02] transition-colors"
        >
          <span>Tentang</span>
          <Icon name="arrow-right" size={14} className="text-muted/60" />
        </Link>

        {/* 5. Smart Search Banner */}
        <Link
          href="/#hero-search"
          onClick={onClose}
          className="flex items-center justify-between rounded-2xl border border-line bg-[#f6f5ef] px-4 py-3 text-xs font-semibold text-muted hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-2">
            <Icon name="search" size={15} />
            <span>Cari Layanan</span>
          </span>
          <Icon name="arrow-right" size={14} className="text-muted/60" />
        </Link>

        {/* 6. Hubungi Kami Primary CTA */}
        <Link
          href="/#contact"
          onClick={onClose}
          className="button-primary mt-2 w-full justify-center !min-h-12 text-sm font-bold inline-flex items-center gap-2"
        >
          <span>Hubungi Kami</span>
          <Icon name="message" size={16} />
        </Link>
      </nav>
    </div>
  );
}
