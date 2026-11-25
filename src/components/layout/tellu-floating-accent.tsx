"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export type OrnamentTone = "charcoal" | "muted" | "subtle" | "white";

interface TelluFloatingAccentProps {
  /** Legacy variant string for backward compatibility */
  variant?: string;
  /** Tone for monochrome rendering */
  tone?: OrnamentTone;
  /** Additional CSS class names */
  className?: string;
  /** Custom baseline resting opacity (default 0.22) */
  idleOpacity?: number;
}

export function TelluFloatingAccent({
  variant,
  tone,
  className = "",
  idleOpacity,
}: TelluFloatingAccentProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const monoRef = useRef<HTMLSpanElement>(null);
  const colorRef = useRef<HTMLSpanElement>(null);

  // Map legacy variant strings to clean monochrome neutral tones if tone is omitted
  const resolvedTone: OrnamentTone =
    tone ??
    (variant === "technology"
      ? "charcoal"
      : variant === "creative"
      ? "muted"
      : variant === "business"
      ? "subtle"
      : "charcoal");

  const baseOpacity = idleOpacity ?? 0.22;

  useEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    const mono = monoRef.current;
    const color = colorRef.current;
    if (!container || !inner || !mono || !color) return;

    // Respect reduced-motion accessibility: keep completely static at base opacity
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) {
      inner.style.opacity = `${baseOpacity}`;
      color.style.opacity = "0";
      mono.style.opacity = "1";
      return;
    }

    // Only enable interactive proximity on fine pointer devices (desktops/laptops)
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!finePointer.matches) {
      inner.style.opacity = `${baseOpacity}`;
      color.style.opacity = "0";
      mono.style.opacity = "1";
      return;
    }

    // Set initial resting styles
    inner.style.opacity = `${baseOpacity}`;
    color.style.opacity = "0";
    mono.style.opacity = "1";

    // High-performance GSAP quickTo setters for 60/120fps hardware-accelerated transforms
    const xTo = gsap.quickTo(inner, "x", { duration: 0.38, ease: "power2.out" });
    const yTo = gsap.quickTo(inner, "y", { duration: 0.38, ease: "power2.out" });
    const rotateTo = gsap.quickTo(inner, "rotation", { duration: 0.45, ease: "power2.out" });
    const scaleXTo = gsap.quickTo(inner, "scaleX", { duration: 0.38, ease: "power2.out" });
    const scaleYTo = gsap.quickTo(inner, "scaleY", { duration: 0.38, ease: "power2.out" });
    const containerOpacityTo = gsap.quickTo(inner, "opacity", { duration: 0.32, ease: "power2.out" });
    const colorOpacityTo = gsap.quickTo(color, "opacity", { duration: 0.32, ease: "power2.out" });
    const monoOpacityTo = gsap.quickTo(mono, "opacity", { duration: 0.32, ease: "power2.out" });

    let visible = false;
    let bounds = container.getBoundingClientRect();
    const proximityThreshold = 200; // px radius of cursor attraction/reaction

    function updateBounds() {
      if (container) bounds = container.getBoundingClientRect();
    }

    function resetToRest() {
      xTo(0);
      yTo(0);
      rotateTo(0);
      scaleXTo(1);
      scaleYTo(1);
      containerOpacityTo(baseOpacity);
      colorOpacityTo(0);
      monoOpacityTo(1);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) updateBounds();
        else resetToRest();
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    function onPointerMove(e: PointerEvent) {
      if (!visible || document.hidden) return;
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist < proximityThreshold) {
        const norm = Math.max(0, 1 - dist / proximityThreshold);
        // Smooth nonlinear curves: motion is quadratic; color transition ramps smoothly
        const motionInfluence = norm * norm;
        const colorInfluence = Math.pow(norm, 1.25);

        // Gentle floating shift away from cursor (max 7px)
        const angle = Math.atan2(dy, dx);
        const pushDist = -7 * motionInfluence;
        xTo(Math.cos(angle) * pushDist);
        yTo(Math.sin(angle) * pushDist);

        // Subtle tilt (max 5 degrees)
        rotateTo((-dx / proximityThreshold) * 5 * motionInfluence);

        // Slight scale up (1.0 -> 1.08)
        const targetScale = 1 + 0.08 * motionInfluence;
        scaleXTo(targetScale);
        scaleYTo(targetScale);

        // Transition to full official TELLU brand colors (orange, lime, blue-violet)
        colorOpacityTo(colorInfluence);
        monoOpacityTo(Math.max(0, 1 - colorInfluence * 0.9));

        // Container opacity lifts gracefully from resting opacity to vivid highlight
        const targetContainerOpacity = Math.min(0.96, baseOpacity + (0.95 - baseOpacity) * colorInfluence);
        containerOpacityTo(targetContainerOpacity);
      } else {
        resetToRest();
      }
    }

    function onWindowLeave() {
      resetToRest();
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", updateBounds, { passive: true });
    window.addEventListener("resize", updateBounds, { passive: true });
    window.addEventListener("blur", onWindowLeave);
    document.documentElement.addEventListener("mouseleave", onWindowLeave);

    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", updateBounds);
      window.removeEventListener("resize", updateBounds);
      window.removeEventListener("blur", onWindowLeave);
      document.documentElement.removeEventListener("mouseleave", onWindowLeave);
      xTo.tween.kill();
      yTo.tween.kill();
      rotateTo.tween.kill();
      scaleXTo.tween.kill();
      scaleYTo.tween.kill();
      containerOpacityTo.tween.kill();
      colorOpacityTo.tween.kill();
      monoOpacityTo.tween.kill();
    };
  }, [baseOpacity]);

  return (
    <span
      ref={containerRef}
      aria-hidden="true"
      className={`tellu-accent ${className}`}
      data-brand-parallax
      data-tone={resolvedTone}
    >
      <span ref={innerRef} className="tellu-ornament-inner block w-full h-full relative">
        <span ref={monoRef} className="tellu-ornament-mono" />
        <span ref={colorRef} className="tellu-ornament-color" />
      </span>
    </span>
  );
}
