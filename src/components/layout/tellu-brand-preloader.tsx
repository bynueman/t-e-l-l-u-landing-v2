"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import gsap from "gsap";

const LETTERS = ["T", "E", "L", "L", "U"] as const;

function subscribePreloader(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getPreloaderSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const seen = sessionStorage.getItem("tellu_brand_preloaded");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return !seen && !reducedMotion;
  } catch {
    return false;
  }
}

function getPreloaderServerSnapshot(): boolean {
  return false;
}

export function TelluBrandPreloader() {
  const shouldPlay = useSyncExternalStore(
    subscribePreloader,
    getPreloaderSnapshot,
    getPreloaderServerSnapshot
  );

  const [finished, setFinished] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<(HTMLSpanElement | null)[]>([]);
  const logoRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shouldPlay || finished || !overlayRef.current) return;

    const overlay = overlayRef.current;
    const letterEls = lettersRef.current.filter(Boolean) as HTMLSpanElement[];
    const logoEl = logoRef.current;
    const progressEl = progressRef.current;

    // Lock body scroll temporarily during brand intro
    document.body.style.overflow = "hidden";

    const finish = () => {
      try {
        sessionStorage.setItem("tellu_brand_preloaded", "1");
      } catch {
        // Ignore session storage errors
      }
      document.body.style.overflow = "";
      setFinished(true);
    };

    // Bounded fail-safe timeout
    const failSafeTimer = setTimeout(finish, 2400);

    // GSAP Timeline for T -> E -> L -> L -> U -> Logo -> Exit
    const tl = gsap.timeline({
      onComplete: finish,
      defaults: { ease: "power2.out" },
    });

    // Initial positioning
    gsap.set(letterEls, { opacity: 0, y: 22, scale: 0.95 });
    if (logoEl) gsap.set(logoEl, { opacity: 0, scale: 0.85 });
    if (progressEl) gsap.set(progressEl, { scaleX: 0, transformOrigin: "left center" });

    // Progress bar animation
    if (progressEl) {
      tl.to(progressEl, { scaleX: 1, duration: 1.55, ease: "power1.inOut" }, 0);
    }

    // Sequential letter transitions
    letterEls.forEach((el, index) => {
      const startTime = index * 0.22;
      tl.to(
        el,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.12,
          ease: "power2.out",
        },
        startTime
      ).to(
        el,
        {
          opacity: 0,
          y: -18,
          scale: 1.04,
          duration: 0.10,
          ease: "power2.in",
        },
        startTime + 0.12 + 0.08
      );
    });

    // Official Logo Reveal (after U completes at 1.10s)
    if (logoEl) {
      tl.to(
        logoEl,
        {
          opacity: 1,
          scale: 1,
          duration: 0.35,
          ease: "back.out(1.4)",
        },
        1.12
      ).to(
        logoEl,
        {
          opacity: 0,
          scale: 1.05,
          y: -14,
          duration: 0.25,
          ease: "power2.in",
        },
        1.50
      );
    }

    // Full Overlay Exit
    tl.to(
      overlay,
      {
        opacity: 0,
        duration: 0.32,
        ease: "power2.inOut",
      },
      1.60
    );

    return () => {
      clearTimeout(failSafeTimer);
      tl.kill();
      document.body.style.overflow = "";
    };
  }, [shouldPlay, finished]);

  if (!shouldPlay || finished) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      role="status"
      aria-label="Memuat TELLU"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#fcfbf8] select-none"
    >
      {/* Central Animation Stage */}
      <div className="relative flex items-center justify-center w-44 h-44">
        {/* Sequential Center Letters */}
        {LETTERS.map((char, index) => (
          <span
            key={index}
            ref={(el) => {
              lettersRef.current[index] = el;
            }}
            aria-hidden="true"
            className="absolute font-black text-7xl sm:text-8xl md:text-9xl tracking-[-0.08em] text-[#20211f] will-change-transform pointer-events-none"
          >
            {char}
          </span>
        ))}

        {/* Authentic Multicolor Logo Reveal */}
        <div
          ref={logoRef}
          aria-hidden="true"
          className="absolute flex items-center justify-center will-change-transform pointer-events-none"
        >
          <Image
            src="/brand/tellu-logo.png"
            alt="TELLU Logo"
            width={629}
            height={589}
            sizes="96px"
            className="h-20 w-20 sm:h-24 sm:w-24 object-contain"
            priority
          />
        </div>
      </div>

      {/* Subtle Bottom Accent Progress Line */}
      <div className="absolute bottom-0 inset-x-0 h-[2px] bg-black/[0.04] overflow-hidden">
        <div
          ref={progressRef}
          className="h-full w-full bg-gradient-to-r from-[#ee961e] via-[#97b926] to-[#6956dc]"
        />
      </div>
    </div>
  );
}
