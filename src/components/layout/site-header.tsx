"use client";

import Link from "next/link";
import { shared as copy } from "@/i18n/dictionaries/id";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Logo } from "./logo";
import { NavServicesMenu } from "./nav-services-menu";
import { NavWorkMenu } from "./nav-work-menu";
import { MobileNav } from "./mobile-nav";
import { Icon } from "@/components/ui/icon";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type DropdownId = "services" | "work" | null;

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

export function SiteHeader() {
  const pathname = usePathname();
  return <HeaderContent key={pathname} pathname={pathname} />;
}

function HeaderContent({ pathname }: { pathname: string }) {
  const [activeDropdown, setActiveDropdown] = useState<DropdownId>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<NodeJS.Timeout | null>(null);

  // Active route detections
  const isHome = pathname === "/";
  const isServicesActive =
    pathname.startsWith("/technology") ||
    pathname.startsWith("/creative") ||
    pathname.startsWith("/business");
  const isWorkActive = false;
  const isBlogActive = pathname.startsWith("/blog");
  const isAboutActive = false;

  // Clear debounce timer
  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  // Open dropdown with cancel of pending close
  const openDropdown = useCallback(
    (id: DropdownId) => {
      cancelClose();
      setActiveDropdown(id);
    },
    [cancelClose]
  );

  // Schedule close with safe 180ms grace period across gaps
  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 180);
  }, [cancelClose]);

  // Toggle dropdown on click
  const toggleDropdown = useCallback(
    (id: DropdownId) => {
      cancelClose();
      setActiveDropdown((prev) => (prev === id ? null : id));
    },
    [cancelClose]
  );

  // Keyboard navigation
  const handleKeyNav = useCallback((e: React.KeyboardEvent, id: DropdownId) => {
    if (e.key === "Escape") {
      setActiveDropdown(null);
    } else if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setActiveDropdown(id);
    }
  }, []);

  // Set --header-offset CSS variable on mount and window resize
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const updateOffset = () => {
      document.documentElement.style.setProperty(
        "--header-offset",
        `${Math.ceil(el.getBoundingClientRect().bottom + 16)}px`
      );
    };
    updateOffset();
    window.addEventListener("resize", updateOffset, { passive: true });
    return () => {
      window.removeEventListener("resize", updateOffset);
      document.documentElement.style.removeProperty("--header-offset");
    };
  }, []);

  // Scroll tracking for mobile / reduced-motion (desktop motion is driven by GSAP ScrollTrigger)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (prefers-reduced-motion: no-preference)");
    if (mq.matches) return;
    const onScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Continuous physics-based header morphing via GSAP ScrollTrigger:
  // Starts completely transparent & seamless with background at top (scrollY: 0),
  // then smoothly morphs into an elegant compact floating oval pill on scroll.
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const header = headerRef.current;
      const nav = navRef.current;
      if (!header || !nav) return;

      gsap.set(nav, {
        backgroundColor: "rgba(255, 255, 255, 0)",
        borderColor: "rgba(32, 33, 31, 0)",
        boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
        backdropFilter: "blur(0px)",
        maxWidth: 1240,
        minHeight: 68,
        paddingLeft: 32,
        paddingRight: 32,
        paddingTop: 10,
        paddingBottom: 10,
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          start: 0,
          end: 140,
          scrub: 0.45,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            setScrolled(self.progress > 0.05);
          },
        },
      });

      tl.to(header, {
        paddingTop: 14,
        ease: "none",
      }, 0)
      .to(nav, {
        backgroundColor: "rgba(255, 255, 255, 0.97)",
        borderColor: "rgba(32, 33, 31, 0.09)",
        boxShadow: "0 10px 32px rgba(32, 33, 31, 0.08)",
        backdropFilter: "blur(16px)",
        maxWidth: 1080,
        minHeight: 58,
        paddingLeft: 24,
        paddingRight: 24,
        paddingTop: 8,
        paddingBottom: 8,
        ease: "none",
      }, 0);
    });

    return () => media.revert();
  }, { scope: headerRef });

  // Outside click and Escape key handler to close dropdowns and mobile menu
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setMobileOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveDropdown(null);
        setMobileOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      data-scrolled={scrolled}
      data-dropdown-open={activeDropdown !== null}
      className={`site-header fixed inset-x-0 top-0 z-50 px-4 transition-all duration-300 sm:px-6 ${
        scrolled ? "pt-3.5" : "pt-4 lg:pt-6"
      }`}
    >
      <div
        ref={navRef}
        className="nav-shell relative flex items-center justify-between mx-auto rounded-full w-full max-w-[1240px] min-h-[58px] lg:min-h-[68px] px-5 sm:px-6 lg:px-8 py-2 lg:py-2.5"
      >
        {/* Logo on the left */}
        <Logo />

        {/* Center Navigation Links (Desktop): Beranda | Layanan | Portfolio | Blog | Tentang */}
        <nav
          aria-label={copy.main}
          className="hidden items-center lg:flex font-medium gap-1 text-[13.5px]"
        >
          {/* 1. Beranda */}
          <Link
            href="/"
            onClick={(e) => {
              if (pathname === "/") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className={`nav-item relative rounded-full px-3.5 py-1.5 transition-colors ${
              isHome
                ? "text-foreground font-semibold"
                : "text-muted hover:text-foreground hover:bg-black/[0.02]"
            }`}
          >
            <span>{copy.home}</span>
          </Link>

          {/* 2. Layanan (Services Dropdown Trigger) */}
          <div
            className="relative"
            onMouseEnter={() => openDropdown("services")}
            onMouseLeave={scheduleClose}
          >
            <button
              type="button"
              aria-expanded={activeDropdown === "services"}
              aria-controls="services-dropdown"
              onClick={() => toggleDropdown("services")}
              onKeyDown={(e) => handleKeyNav(e, "services")}
              className={`nav-item group inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-colors ${
                isServicesActive || activeDropdown === "services"
                  ? "text-foreground font-semibold bg-black/[0.03]"
                  : "text-muted hover:text-foreground hover:bg-black/[0.02]"
              }`}
            >
              <span>{copy.services}</span>
              <ChevronDown open={activeDropdown === "services"} />
            </button>

            {/* Services Dropdown */}
            <NavServicesMenu
              open={activeDropdown === "services"}
              onClose={() => setActiveDropdown(null)}
              activePath={pathname}
            />
          </div>

          {/* 3. Portfolio (Portfolio Dropdown Trigger) */}
          <div
            className="relative"
            onMouseEnter={() => openDropdown("work")}
            onMouseLeave={scheduleClose}
          >
            <button
              type="button"
              aria-expanded={activeDropdown === "work"}
              aria-controls="work-dropdown"
              onClick={() => toggleDropdown("work")}
              onKeyDown={(e) => handleKeyNav(e, "work")}
              className={`nav-item group inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-colors ${
                isWorkActive || activeDropdown === "work"
                  ? "text-foreground font-semibold bg-black/[0.03]"
                  : "text-muted hover:text-foreground hover:bg-black/[0.02]"
              }`}
            >
              <span>{copy.work}</span>
              <ChevronDown open={activeDropdown === "work"} />
            </button>

            {/* Portfolio Dropdown */}
            <NavWorkMenu
              open={activeDropdown === "work"}
              onClose={() => setActiveDropdown(null)}
            />
          </div>

          {/* 4. Blog */}
          <Link
            href="/blog"
            className={`nav-item relative rounded-full px-3.5 py-1.5 transition-colors ${
              isBlogActive
                ? "text-foreground font-semibold bg-black/[0.03]"
                : "text-muted hover:text-foreground hover:bg-black/[0.02]"
            }`}
          >
            <span>{copy.blog}</span>
          </Link>

          {/* 5. Tentang */}
          <Link
            href="/#tentang"
            className={`nav-item relative rounded-full px-3.5 py-1.5 transition-colors ${
              isAboutActive
                ? "text-foreground font-semibold"
                : "text-muted hover:text-foreground hover:bg-black/[0.02]"
            }`}
          >
            <span>{copy.about}</span>
          </Link>
        </nav>

        {/* Right Primary CTA (Hubungi Kami) */}
        <Link
          href="/#contact"
          className="site-cta group relative hidden shrink-0 items-center gap-2 rounded-full bg-foreground font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/15 lg:inline-flex min-h-[40px] px-5 text-xs"
        >
          <span>{copy.contact}</span>
          <Icon name="message" size={14} className="transition-transform duration-200 group-hover:scale-105" />
        </Link>

        {/* Mobile Menu Toggle Button */}
        <button
          type="button"
          aria-label={mobileOpen ? copy.close : copy.open}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-foreground transition-colors hover:bg-black/[0.04] lg:hidden"
        >
          <span className="sr-only">{mobileOpen ? copy.close : copy.open}</span>
          <div className="relative w-4 h-3 flex flex-col justify-between">
            <span
              className={`block h-0.5 w-full bg-current rounded-full transition-transform duration-200 ${
                mobileOpen ? "rotate-45 translate-y-1.5" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-full bg-current rounded-full transition-transform duration-200 ${
                mobileOpen ? "-rotate-45 -translate-y-1" : ""
              }`}
            />
          </div>
        </button>

        {/* Mobile Navigation Drawer */}
        <MobileNav
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          activePath={pathname}
        />
      </div>
    </header>
  );
}
