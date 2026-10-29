"use client";

import { useId, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { deformPixel, pixelFills } from "@/lib/hero-grid";

gsap.registerPlugin(useGSAP);

export function HeroPixelGrid() {
  const scope = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const id = useId();

  useGSAP(() => {
    const layer = scope.current!;
    const hero = layer.closest<HTMLElement>("#hero")!;
    const surface = canvas.current!;
    const media = gsap.matchMedia();
    media.add("(min-width: 600px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const ctx = surface.getContext("2d");
      if (!ctx) return;
      const baseline = document.createElement("canvas");
      const baselineContext = baseline.getContext("2d");
      if (!baselineContext) return;
      const field = { x: 0, y: 0, strength: 0 };
      let width = 0, height = 0, step = 32, originX = 0, originY = 0, ratio = 1;
      let radius = 190, running = false, visible = false;
      let previous: { x: number; y: number } | null = null;
      const fills = new Map(pixelFills.map(([x, y, opacity]) => [`${x}:${y}`, opacity]));

      function draw(left: number, top: number, right: number, bottom: number, distort = true) {
        ctx!.save();
        ctx!.clearRect(left, top, right - left, bottom - top);
        ctx!.strokeStyle = "#6f6757";
        ctx!.fillStyle = "#7c7360";
        ctx!.lineWidth = .6;
        const firstX = Math.max(0, Math.floor(left / step));
        const firstY = Math.max(0, Math.floor(top / step));
        const lastX = Math.min(Math.ceil(width / step), Math.ceil(right / step));
        const lastY = Math.min(Math.ceil(height / step), Math.ceil(bottom / step));
        for (let row = firstY; row < lastY; row++) {
          for (let col = firstX; col < lastX; col++) {
            const x = col * step + step / 2, y = row * step + step / 2;
            const offset = deformPixel(x, y, field.x, field.y, distort ? field.strength : 0, radius);
            const shifted = offset.rotation !== 0;
            if (shifted) {
              ctx!.save();
              ctx!.translate(x + offset.x, y + offset.y);
              ctx!.rotate(offset.rotation);
            }
            const left = (shifted ? 0 : x) + 1 - step / 2;
            const top = (shifted ? 0 : y) + 1 - step / 2;
            ctx!.globalAlpha = .085 + offset.opacity;
            ctx!.strokeRect(left, top, step - 2, step - 2);
            const opacity = (fills.get(`${col % 6}:${row % 6}`) ?? 0) + offset.opacity;
            if (opacity) {
              ctx!.globalAlpha = opacity;
              ctx!.fillRect(left, top, step - 2, step - 2);
            }
            if (shifted) ctx!.restore();
          }
        }
        ctx!.restore();
      }

      function patch(point: { x: number; y: number }, distort = true) {
        // Whole-cell bounds and a quiet outer row avoid clipping seams during restoration.
        const extent = radius + step + 14;
        const left = Math.max(0, Math.floor((point.x - extent) / step) * step);
        const top = Math.max(0, Math.floor((point.y - extent) / step) * step);
        const right = Math.min(width, Math.ceil((point.x + extent) / step) * step);
        const bottom = Math.min(height, Math.ceil((point.y + extent) / step) * step);
        if (distort && field.strength) draw(left, top, right, bottom);
        else {
          ctx!.save();
          ctx!.clearRect(left, top, right - left, bottom - top);
          // Restore idle pixels with one blit instead of redrawing every previous cell.
          ctx!.drawImage(baseline, left * ratio, top * ratio, (right - left) * ratio, (bottom - top) * ratio, left, top, right - left, bottom - top);
          ctx!.restore();
        }
      }
      const xTo = gsap.quickTo(field, "x", { duration: .16, ease: "power3.out" });
      const yTo = gsap.quickTo(field, "y", { duration: .16, ease: "power3.out" });
      const strengthTo = gsap.quickTo(field, "strength", { duration: .16, ease: "power2.out" });
      function release() { strengthTo.tween.duration(.38); strengthTo(0); }
      const settle = gsap.delayedCall(.12, release).pause();

      function tick() {
        if (previous) patch(previous, false);
        const point = { x: field.x, y: field.y };
        patch(point);
        previous = point;
        if (!xTo.tween.isActive() && !yTo.tween.isActive() && !strengthTo.tween.isActive() && !settle.isActive()) {
          gsap.ticker.remove(tick);
          running = false;
          layer.dataset.active = "false";
        }
      }
      function reset() {
        gsap.ticker.remove(tick);
        xTo.tween.pause(); yTo.tween.pause(); strengthTo.tween.pause(); settle.pause();
        field.strength = 0;
        if (previous) patch(previous);
        previous = null;
        running = false;
        layer.dataset.active = "false";
      }
      function measure() {
        const bounds = hero.getBoundingClientRect();
        originX = bounds.left + window.scrollX;
        originY = bounds.top + window.scrollY;
        visible = bounds.bottom > 0 && bounds.top < window.innerHeight;
        const nextStep = Number.parseFloat(getComputedStyle(layer).getPropertyValue("--pixel-step"));
        if (width === bounds.width && height === bounds.height && step === nextStep) return;
        reset();
        width = bounds.width; height = bounds.height; step = nextStep;
        radius = width < 1000 ? 150 : 190;
        ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        surface.width = Math.ceil(width * ratio);
        surface.height = Math.ceil(height * ratio);
        ctx!.setTransform(ratio, 0, 0, ratio, 0, 0);
        draw(0, 0, width, height);
        baseline.width = surface.width; baseline.height = surface.height;
        baselineContext!.drawImage(surface, 0, 0);
        layer.dataset.ready = "true";
      }
      function move(event: PointerEvent) {
        if (event.pointerType === "touch" || !visible || !width || !height || document.hidden) return;
        const x = event.clientX + window.scrollX - originX;
        const y = event.clientY + window.scrollY - originY;
        xTo(x, running ? undefined : x); yTo(y, running ? undefined : y);
        strengthTo.tween.duration(.16);
        strengthTo(width < 1000 ? .7 : 1);
        settle.restart(true);
        if (!running) {
          running = true;
          layer.dataset.active = "true";
          gsap.ticker.add(tick);
        }
      }
      function leave() { if (running) { settle.pause(); release(); } }
      function visibility() { if (document.hidden) reset(); }
      const resize = new ResizeObserver(measure);
      const intersection = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (!visible) reset();
      });
      // Static SVG is already visible; defer canvas allocation until after the content renders.
      const initialize = window.setTimeout(() => { measure(); resize.observe(hero); }, 120);
      intersection.observe(hero);
      hero.addEventListener("pointerenter", measure);
      hero.addEventListener("pointermove", move, { passive: true });
      hero.addEventListener("pointerleave", leave);
      document.addEventListener("visibilitychange", visibility);
      return () => {
        window.clearTimeout(initialize);
        reset(); resize.disconnect(); intersection.disconnect();
        xTo.tween.kill(); yTo.tween.kill(); strengthTo.tween.kill(); settle.kill();
        hero.removeEventListener("pointerenter", measure);
        hero.removeEventListener("pointermove", move);
        hero.removeEventListener("pointerleave", leave);
        document.removeEventListener("visibilitychange", visibility);
        layer.dataset.ready = "false";
        surface.width = 0; surface.height = 0;
        baseline.width = 0; baseline.height = 0;
      };
    });
    return () => media.revert();
  }, { scope });

  return <div ref={scope} className="hero-pixel-grid" aria-hidden="true" data-active="false">
    <svg className="pixel-static" width="100%" height="100%">
      <defs>
        <pattern id={`${id}-cell`} width="32" height="32" patternUnits="userSpaceOnUse"><path d="M1 1h30v30H1Z" fill="none" stroke="#6f6757" strokeOpacity=".085" strokeWidth=".6" /></pattern>
        <pattern id={id} width="192" height="192" patternUnits="userSpaceOnUse">
          <rect width="192" height="192" fill={`url(#${id}-cell)`} />
          {pixelFills.map(([x, y, opacity]) => <rect key={`${x}:${y}`} x={x * 32 + 1} y={y * 32 + 1} width="30" height="30" fill="#7c7360" fillOpacity={opacity} />)}
        </pattern>
        <pattern id={`${id}-tablet`} href={`#${id}`} patternTransform="scale(1.25)" />
        <pattern id={`${id}-mobile`} href={`#${id}`} patternTransform="scale(1.5)" />
      </defs>
      <rect className="pixel-desktop" width="100%" height="100%" fill={`url(#${id})`} />
      <rect className="pixel-tablet" width="100%" height="100%" fill={`url(#${id}-tablet)`} />
      <rect className="pixel-mobile" width="100%" height="100%" fill={`url(#${id}-mobile)`} />
    </svg>
    <canvas ref={canvas} className="pixel-canvas" />
  </div>;
}
