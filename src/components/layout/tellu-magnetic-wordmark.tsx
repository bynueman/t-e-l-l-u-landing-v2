"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";

interface LetterConfig {
  char: string;
  activeColor: string;
}

const lettersData: LetterConfig[] = [
  { char: "T", activeColor: "#ee961e" }, // Technology orange
  { char: "E", activeColor: "#f5a623" }, // Warm transition amber
  { char: "L", activeColor: "#97b926" }, // Creative lime
  { char: "L", activeColor: "#97b926" }, // Creative lime
  { char: "U", activeColor: "#6956dc" }, // Business blue-violet
];

const REST_COLOR = "rgba(255, 255, 255, 0.16)";
const INFLUENCE_RADIUS = 200;

export function TelluMagneticWordmark() {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const logoImgRef = useRef<HTMLImageElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Dragging state: index -1 is Logo, 0..4 are letters T-E-L-L-U
  const draggedIndexRef = useRef<number | null>(null);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    const logoEl = logoRef.current;
    const logoImgEl = logoImgRef.current;
    if (!container || !logoEl) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const letterEls = letterRefs.current.filter(Boolean) as HTMLSpanElement[];
    // All interactable items: [logoEl, ...letterEls]
    const allItems: HTMLElement[] = [logoEl, ...letterEls];

    let isVisible = false;
    let hasPlayedEntrance = false;

    // Set initial falling state if not reduced motion
    if (!reducedMotion) {
      gsap.set(logoEl, {
        y: -110,
        opacity: 0,
        rotation: -25,
      });
      if (logoImgEl) {
        gsap.set(logoImgEl, { opacity: 0.24, filter: "grayscale(70%)" });
      }
      gsap.set(letterEls, {
        y: -95,
        opacity: 0,
        rotation: (i) => [-14, 12, -9, 14, -11][i],
        color: REST_COLOR,
      });
    } else {
      gsap.set(allItems, { y: 0, opacity: 1, rotation: 0 });
      if (logoImgEl) {
        gsap.set(logoImgEl, { opacity: 0.28, filter: "grayscale(40%)" });
      }
      gsap.set(letterEls, { color: REST_COLOR });
    }

    // Play lively falling entrance animation with bounce
    const playFallingEntrance = () => {
      if (hasPlayedEntrance) return;
      hasPlayedEntrance = true;

      if (reducedMotion) {
        gsap.set(allItems, { y: 0, opacity: 1, rotation: 0 });
        if (logoImgEl) {
          gsap.set(logoImgEl, { opacity: 0.28, filter: "grayscale(40%)" });
        }
        gsap.set(letterEls, { color: REST_COLOR });
        updateBounds();
        return;
      }

      // Entrance timeline: Logo lands first with bounce, then letters cascade in
      const tl = gsap.timeline({
        onComplete: () => {
          updateBounds();
        },
      });

      tl.to(logoEl, {
        y: 0,
        opacity: 1,
        rotation: 0,
        duration: 1.05,
        ease: "bounce.out",
      }, 0);

      tl.to(letterEls, {
        y: 0,
        opacity: 1,
        rotation: 0,
        duration: 0.95,
        stagger: 0.08,
        ease: "bounce.out",
      }, 0.1);
    };

    // Cache item bounding boxes for smooth magnetic proximity
    let bounds: { centerX: number; centerY: number }[] = [];

    const updateBounds = () => {
      bounds = allItems.map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          centerX: rect.left + rect.width / 2,
          centerY: rect.top + rect.height / 2,
        };
      });
    };

    updateBounds();
    window.addEventListener("resize", updateBounds, { passive: true });
    window.addEventListener("scroll", updateBounds, { passive: true });

    // GSAP quickTo setters for high-performance fluid physics
    const setters = allItems.map((el) => ({
      x: gsap.quickTo(el, "x", { duration: 0.28, ease: "power2.out" }),
      y: gsap.quickTo(el, "y", { duration: 0.28, ease: "power2.out" }),
      rotation: gsap.quickTo(el, "rotation", { duration: 0.32, ease: "power2.out" }),
      scale: gsap.quickTo(el, "scale", { duration: 0.28, ease: "power2.out" }),
    }));

    // Reset items to rest state
    const resetItems = () => {
      allItems.forEach((el, itemIdx) => {
        if (draggedIndexRef.current === itemIdx) return;
        setters[itemIdx].x(0);
        setters[itemIdx].y(0);
        setters[itemIdx].rotation(0);
        setters[itemIdx].scale(1);

        if (itemIdx === 0 && logoImgEl) {
          gsap.to(logoImgEl, {
            opacity: 0.28,
            filter: "grayscale(40%)",
            duration: 0.45,
            ease: "power2.out",
            overwrite: "auto",
          });
        } else if (itemIdx > 0) {
          gsap.to(el, {
            color: REST_COLOR,
            duration: 0.45,
            ease: "power2.out",
            overwrite: "auto",
          });
        }
      });
    };

    // Magnetic fluid cursor movement
    const handlePointerMove = (e: PointerEvent) => {
      if (!isVisible || !hasPlayedEntrance) return;

      const activeIdx = draggedIndexRef.current;

      // When dragging an item (activeIdx !== null)
      if (activeIdx !== null && allItems[activeIdx]) {
        const el = allItems[activeIdx];
        const dx = e.clientX - dragStartPosRef.current.x;
        const dy = e.clientY - dragStartPosRef.current.y;

        // Generous, flexible drag boundary so user can freely fling it
        const clampedX = Math.max(-280, Math.min(280, dx));
        const clampedY = Math.max(-180, Math.min(140, dy));
        const rot = clampedX * 0.16;

        dragOffsetRef.current = { x: clampedX, y: clampedY };

        gsap.set(el, {
          x: clampedX,
          y: clampedY,
          rotation: activeIdx === 0 ? clampedX * 0.45 : rot,
        });

        // Chain / Jelly ripple effect on immediate neighbors
        allItems.forEach((otherEl, otherIdx) => {
          if (otherIdx === activeIdx) return;
          const distFromDragged = Math.abs(otherIdx - activeIdx);
          if (distFromDragged <= 2) {
            const pullFactor = distFromDragged === 1 ? 0.22 : 0.08;
            setters[otherIdx].x(clampedX * pullFactor);
            setters[otherIdx].y(clampedY * pullFactor);
            setters[otherIdx].rotation(rot * pullFactor);
          }
        });
        return;
      }

      // Magnetic hover wave when not dragging
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      allItems.forEach((el, itemIdx) => {
        const b = bounds[itemIdx];
        if (!b) return;

        const dx = mouseX - b.centerX;
        const dy = mouseY - b.centerY;
        const distance = Math.hypot(dx, dy);

        if (distance < INFLUENCE_RADIUS) {
          const factor = Math.cos((distance / INFLUENCE_RADIUS) * (Math.PI / 2));
          // Fluid organic tilt, lift, and repulsion
          const moveX = dx * 0.24 * factor;
          const moveY = (dy < 0 ? dy * 0.28 : -factor * 16) * factor;
          const rot = (dx / INFLUENCE_RADIUS) * (itemIdx === 0 ? 28 : 16) * factor;
          const scale = 1 + factor * 0.14;

          setters[itemIdx].x(moveX);
          setters[itemIdx].y(moveY);
          setters[itemIdx].rotation(rot);
          setters[itemIdx].scale(scale);

          if (itemIdx === 0 && logoImgEl) {
            gsap.to(logoImgEl, {
              opacity: 0.9 + factor * 0.1,
              filter: "grayscale(0%)",
              duration: 0.2,
              ease: "power1.out",
              overwrite: "auto",
            });
          } else if (itemIdx > 0) {
            const letterIdx = itemIdx - 1;
            gsap.to(el, {
              color: lettersData[letterIdx].activeColor,
              duration: 0.2,
              ease: "power1.out",
              overwrite: "auto",
            });
          }
        } else {
          setters[itemIdx].x(0);
          setters[itemIdx].y(0);
          setters[itemIdx].rotation(0);
          setters[itemIdx].scale(1);

          if (itemIdx === 0 && logoImgEl) {
            gsap.to(logoImgEl, {
              opacity: 0.28,
              filter: "grayscale(40%)",
              duration: 0.35,
              ease: "power2.out",
              overwrite: "auto",
            });
          } else if (itemIdx > 0) {
            gsap.to(el, {
              color: REST_COLOR,
              duration: 0.35,
              ease: "power2.out",
              overwrite: "auto",
            });
          }
        }
      });
    };

    // Pointer Down (Grab element to fling)
    const handlePointerDown = (itemIdx: number, e: PointerEvent) => {
      const el = allItems[itemIdx];
      if (!el) return;

      draggedIndexRef.current = itemIdx;
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
      dragOffsetRef.current = { x: 0, y: 0 };

      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // pointer capture fallback
      }

      gsap.to(el, {
        scale: 1.2,
        duration: 0.22,
        ease: "back.out(2)",
        overwrite: "auto",
      });

      if (itemIdx === 0 && logoImgEl) {
        gsap.to(logoImgEl, {
          opacity: 1,
          filter: "grayscale(0%) drop-shadow(0 8px 16px rgba(238, 150, 30, 0.35))",
          duration: 0.2,
          overwrite: "auto",
        });
      } else if (itemIdx > 0) {
        const letterIdx = itemIdx - 1;
        gsap.to(el, {
          color: lettersData[letterIdx].activeColor,
          duration: 0.2,
          overwrite: "auto",
        });
      }
    };

    // Pointer Up (Release with bouncy elastic snap-back)
    const handlePointerUp = (itemIdx: number, e: PointerEvent) => {
      const el = allItems[itemIdx];
      if (!el || draggedIndexRef.current !== itemIdx) return;

      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      draggedIndexRef.current = null;

      // Springy elastic return with playful overshoot
      gsap.to(el, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        duration: 0.95,
        ease: "elastic.out(1.25, 0.35)",
        overwrite: "auto",
        onComplete: () => {
          updateBounds();
        },
      });

      // Restore color/grayscale on release
      if (itemIdx === 0 && logoImgEl) {
        gsap.to(logoImgEl, {
          opacity: 0.28,
          filter: "grayscale(40%)",
          duration: 0.5,
          ease: "power2.out",
          overwrite: "auto",
        });
      } else if (itemIdx > 0) {
        gsap.to(el, {
          color: REST_COLOR,
          duration: 0.5,
          ease: "power2.out",
          overwrite: "auto",
        });
      }

      // Reset neighbors
      allItems.forEach((otherEl, otherIdx) => {
        if (otherIdx !== itemIdx) {
          setters[otherIdx].x(0);
          setters[otherIdx].y(0);
          setters[otherIdx].rotation(0);
        }
      });
    };

    // Playful 360 spin on Logo click/tap
    const handleLogoClick = () => {
      if (draggedIndexRef.current !== null) return;
      gsap.to(logoEl, {
        rotation: "+=360",
        duration: 0.75,
        ease: "back.out(2.2)",
      });
      if (logoImgEl) {
        gsap.fromTo(
          logoImgEl,
          { opacity: 1, filter: "grayscale(0%)" },
          { opacity: 0.28, filter: "grayscale(40%)", duration: 1.2, delay: 0.3 }
        );
      }
    };

    // IntersectionObserver to trigger falling entrance once scrolled into footer view
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisible = entry?.isIntersecting ?? false;
        if (isVisible) {
          playFallingEntrance();
        } else if (draggedIndexRef.current === null) {
          resetItems();
        }
      },
      { rootMargin: "60px", threshold: 0.15 }
    );

    observer.observe(container);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("mouseleave", resetItems);

    // Attach pointer listeners to all elements
    allItems.forEach((el, itemIdx) => {
      const onDown = (e: PointerEvent) => handlePointerDown(itemIdx, e);
      const onUp = (e: PointerEvent) => handlePointerUp(itemIdx, e);
      el.addEventListener("pointerdown", onDown);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onUp);

      (el as unknown as { __cleanupHandlers?: () => void }).__cleanupHandlers = () => {
        el.removeEventListener("pointerdown", onDown);
        el.removeEventListener("pointerup", onUp);
        el.removeEventListener("pointercancel", onUp);
      };
    });

    logoEl.addEventListener("click", handleLogoClick);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateBounds);
      window.removeEventListener("scroll", updateBounds);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("mouseleave", resetItems);
      logoEl.removeEventListener("click", handleLogoClick);

      allItems.forEach((el) => {
        (el as unknown as { __cleanupHandlers?: () => void }).__cleanupHandlers?.();
      });

      resetItems();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="TELLU Interactive Logo and Wordmark"
      className="magnetic-wordmark-container relative w-full overflow-visible select-none py-2 sm:py-3 touch-none"
    >
      <div className="flex items-center justify-center tracking-[-0.07em] font-black text-[clamp(3.2rem,9.5vw,6.5rem)] lg:text-[clamp(3.8rem,9.8vw,7.2rem)] leading-none text-center">
        {/* 0. Interactive Multicolor Logo Emblem */}
        <div
          ref={logoRef}
          aria-hidden="true"
          title="Tarik atau klik logo TELLU untuk memutar"
          className="magnetic-logo relative inline-flex items-center justify-center cursor-grab active:cursor-grabbing mr-2.5 sm:mr-4 lg:mr-6 will-change-transform select-none"
        >
          <Image
            ref={logoImgRef}
            src="/brand/tellu-logo.png"
            alt="TELLU Emblem"
            width={629}
            height={589}
            sizes="(max-width: 640px) 48px, (max-width: 1024px) 76px, 96px"
            className="w-[clamp(2.5rem,7.5vw,5.2rem)] h-[clamp(2.5rem,7.5vw,5.2rem)] object-contain pointer-events-none transition-[opacity,filter] duration-200"
            style={{ opacity: 0.28, filter: "grayscale(40%)" }}
          />
        </div>

        {/* 1..5. Interactive Letters T-E-L-L-U */}
        {lettersData.map((item, index) => (
          <span
            key={index}
            ref={(el) => {
              letterRefs.current[index] = el;
            }}
            aria-hidden="true"
            className="magnetic-letter inline-block will-change-transform cursor-grab active:cursor-grabbing px-0.5 sm:px-1 py-1 transition-[color,transform] duration-150"
            style={{ color: REST_COLOR }}
          >
            {item.char}
          </span>
        ))}
      </div>
    </div>
  );
}
