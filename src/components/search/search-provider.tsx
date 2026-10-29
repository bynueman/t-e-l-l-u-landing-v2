"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { search as copy } from "@/i18n/dictionaries/id";
import { usePathname } from "next/navigation";
import { SmartSearch } from "./smart-search";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { BrandSymbol } from "@/components/layout/brand-mark";

gsap.registerPlugin(useGSAP);

const SearchContext = createContext<{ query: string; setQuery: (value: string) => void } | null>(null);

export function useSearchQuery() {
  const context = useContext(SearchContext);
  if (!context) throw new Error("Smart Search requires SearchProvider");
  return context;
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    try { const saved = sessionStorage.getItem("tellu-search"); if (saved) queueMicrotask(() => setQuery(saved)); } catch { /* session storage may be unavailable */ }
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem("tellu-search", query); } catch { /* session storage may be unavailable */ }
  }, [query]);

  return <SearchContext.Provider value={{ query, setQuery }}>{children}<FloatingSearch key={pathname} pathname={pathname} /></SearchContext.Provider>;
}

function FloatingSearch({ pathname }: { pathname: string }) {
  const [heroVisible, setHeroVisible] = useState(true);
  const [open, setOpen] = useState(false);
  const show = pathname !== "/" || !heroVisible;
  const expanded = open && show;
  const dock = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const transition = useRef<gsap.core.Tween | null>(null);

  useGSAP(() => {
    const element = dock.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animation = gsap.fromTo(element, { autoAlpha: 0, y: 12, scale: .97 }, { autoAlpha: 1, y: 0, scale: 1, duration: .38, ease: "power3.out", paused: true });
    transition.current = animation;
    const apply = () => {
      const visible = element.dataset.visible === "true";
      if (reduced.matches) animation.progress(visible ? 1 : 0).pause();
      else if (visible) animation.play();
      else animation.reverse();
    };
    apply();
    reduced.addEventListener("change", apply);
    return () => { reduced.removeEventListener("change", apply); transition.current = null; };
  }, { scope: dock });

  useEffect(() => {
    const animation = transition.current;
    if (!animation) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) animation.progress(show ? 1 : 0).pause();
    else if (show) animation.play();
    else animation.reverse();
  }, [show]);

  useEffect(() => {
    if (pathname !== "/") return;
    const primary = document.querySelector<HTMLElement>(".hero-search-zone");
    if (!primary) return;
    let visible = true;
    const headerBottom = document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 96;
    const observer = new IntersectionObserver(([entry]) => {
      const next = entry.intersectionRatio > (visible ? .05 : .25);
      if (next === visible) return;
      visible = next;
      setHeroVisible(next);
      if (next) {
        setOpen(false);
        primary.inert = false;
        if (dock.current?.contains(document.activeElement)) document.getElementById("hero-search")?.focus({ preventScroll: true });
      }
    }, { rootMargin: `-${Math.ceil(headerBottom + 8)}px 0px 0px`, threshold: [0, .05, .25, 1] });
    observer.observe(primary);
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    const primary = document.querySelector<HTMLElement>(".hero-search-zone");
    if (primary) primary.inert = expanded;
    if (expanded) input.current?.focus();
    function outside(event: PointerEvent) {
      if (!dock.current?.contains(event.target as Node)) setOpen(false);
    }
    if (expanded) document.addEventListener("pointerdown", outside);
    return () => { if (primary) primary.inert = false; document.removeEventListener("pointerdown", outside); };
  }, [expanded]);

  function close() { setOpen(false); trigger.current?.focus(); }

  return (
        <div ref={dock} className="floating-search-dock" data-visible={show} inert={!show} aria-hidden={!show}>
          {expanded && (
            <div id="floating-search-panel" className="search-panel floating-search-panel" role="region" aria-label={copy.region} onKeyDown={(event) => { if (event.key === "Escape") close(); }}>
              <div className="mb-4 flex items-center justify-between gap-4"><p className="font-bold">{copy.title}</p><button type="button" onClick={close} aria-label={copy.close} className="rounded-full px-2 py-1 text-xl">×</button></div>
              <SmartSearch compact inputRef={input} onNavigate={() => setOpen(false)} />
            </div>
          )}
          <button ref={trigger} type="button" aria-expanded={expanded} aria-controls="floating-search-panel" aria-label={expanded ? copy.close : copy.open} onClick={() => expanded ? close() : setOpen(true)} className="floating-search-trigger">
            <BrandSymbol /><span>{copy.dock}</span>
          </button>
        </div>
  );
}
