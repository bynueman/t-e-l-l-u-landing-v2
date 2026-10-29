"use client";

import Link from "next/link";
import { shared as copy } from "@/i18n/dictionaries/id";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./logo";

const links = [
  { label: "Technology", href: "/technology" },
  { label: "Creative", href: "/creative" },
  { label: "Business", href: "/business" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return <HeaderContent key={pathname} />;
}

function HeaderContent() {
  const [compact, setCompact] = useState(false);
  const sentinel = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [ecosystemsOpen, setEcosystemsOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const firstMobileLink = useRef<HTMLAnchorElement>(null);
  const header = useRef<HTMLElement>(null);

  useEffect(() => { if (open) firstMobileLink.current?.focus(); }, [open]);
  useEffect(() => {
    const element = header.current!;
    const offset = new ResizeObserver(() => {
      document.documentElement.style.setProperty("--header-offset", `${Math.ceil(element.getBoundingClientRect().bottom + 16)}px`);
    });
    offset.observe(element);
    return () => { offset.disconnect(); document.documentElement.style.removeProperty("--header-offset"); };
  }, []);
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  useEffect(() => {
    const marker = sentinel.current;
    if (!marker) return;
    const observer = new IntersectionObserver(([entry]) => setCompact(!entry.isIntersecting));
    observer.observe(marker);
    return () => observer.disconnect();
  }, []);

  function closeMenu() { setOpen(false); menuButton.current?.focus(); }

  return (
    <>
    <span ref={sentinel} aria-hidden="true" className="pointer-events-none absolute top-40 h-px w-px" />
    <header ref={header} data-compact={compact} className="site-header fixed inset-x-0 top-0 z-40 px-4 pt-4 sm:px-6 sm:pt-6">
      <div className="nav-shell page-container relative flex min-h-16 items-center justify-between gap-4 rounded-full py-2 sm:min-h-18">
        <Logo />
        <nav aria-label={copy.main} className="hidden items-center gap-7 text-sm font-semibold lg:flex">
          <div className="relative" onMouseEnter={() => setEcosystemsOpen(true)} onMouseLeave={() => setEcosystemsOpen(false)}>
            <button type="button" aria-expanded={ecosystemsOpen} aria-controls="ecosystem-menu" onClick={() => setEcosystemsOpen(!ecosystemsOpen)} onKeyDown={(event) => { if (event.key === "Escape") setEcosystemsOpen(false); }} className="py-3 hover:opacity-60">{copy.services} <span aria-hidden="true">⌄</span></button>
            {ecosystemsOpen && <div id="ecosystem-menu" className="absolute left-0 top-full min-w-44 rounded-2xl border border-line bg-white p-2 shadow-xl">{links.map((link) => <Link key={link.href} href={link.href} onClick={() => setEcosystemsOpen(false)} className="block rounded-xl px-3 py-2 hover:bg-background">{link.label}</Link>)}</div>}
          </div>
          <Link href="/#work" className="hover:opacity-60">{copy.work}</Link>
          <Link href="/#tentang" className="hover:opacity-60">{copy.about}</Link>
        </nav>
        <Link href="/#contact" className="button-primary hidden !min-h-11 !px-5 lg:inline-flex">{copy.contact} <span aria-hidden="true">↗</span></Link>
        <button ref={menuButton} type="button" aria-label={open ? copy.close : copy.open} aria-expanded={open} aria-controls="mobile-menu" onClick={() => open ? closeMenu() : setOpen(true)} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-xl lg:hidden">{open ? "×" : "☰"}</button>
        {open && <nav id="mobile-menu" aria-label={copy.mobile} onKeyDown={(event) => { if (event.key === "Escape") closeMenu(); }} className="absolute inset-x-0 top-[calc(100%+0.5rem)] rounded-3xl border border-line bg-white p-5 shadow-xl lg:hidden">
          <p className="eyebrow mb-3 text-muted">{copy.services}</p>
          {links.map((link, index) => <Link ref={index === 0 ? firstMobileLink : undefined} key={link.href} href={link.href} onClick={() => setOpen(false)} className="block border-b border-line py-3 text-lg font-semibold">{link.label} ↗</Link>)}
          <Link href="/#work" onClick={() => setOpen(false)} className="block py-3 font-semibold">{copy.work}</Link>
          <Link href="/#tentang" onClick={() => setOpen(false)} className="block py-3 font-semibold">{copy.about}</Link>
          <Link href="/#contact" onClick={() => setOpen(false)} className="button-primary mt-3 w-full">{copy.contact} ↗</Link>
        </nav>}
      </div>
    </header>
    </>
  );
}
