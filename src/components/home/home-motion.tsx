"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Icon } from "@/components/ui/icon";
import { hero as copy } from "@/i18n/dictionaries/id";

gsap.registerPlugin(useGSAP, ScrollTrigger);
const MotionPaused = createContext(false);
export const useMotionPaused = () => useContext(MotionPaused);

export function HomeMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => { scope.current?.dispatchEvent(new Event("tellu-motion-change")); }, [paused]);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add({ motion: "(prefers-reduced-motion: no-preference)", desktop: "(min-width: 900px)" }, context => {
      if (!context.conditions?.motion) return;
      const desktop = context.conditions.desktop;
      const root = scope.current!;
      root.dataset.motionReady = "true";
      if (root.querySelector("#hero")) {
        gsap.timeline({ defaults: { ease: "power3.out", duration: .65 } })
          .from(".hero-copy", { opacity: .6, y: 14 }, .15)
          // The input stays visible, focusable and usable throughout its entrance.
          .from(".hero-search-zone", { y: 18, duration: .7 }, .2);
      }

      const floats = Array.from(root.querySelectorAll<HTMLElement>(".brand-float")).map((element, index) => ({
        element, visible: false,
        tween: gsap.to(element, { y: desktop ? 9 : 5, x: index % 2 ? -4 : 4, rotation: index % 2 ? -4 : 5, duration: 6 + index % 4, delay: index * .35, repeat: -1, yoyo: true, ease: "sine.inOut", paused: true }),
      }));
      const sync = () => floats.forEach(item => item.tween.paused(!item.visible || document.hidden || root.dataset.motionPaused === "true"));
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => { const item = floats.find(item => item.element === entry.target); if (item) item.visible = entry.isIntersecting; }); sync();
      });
      floats.forEach(item => observer.observe(item.element));
      document.addEventListener("visibilitychange", sync);
      root.addEventListener("tellu-motion-change", sync);
      root.querySelectorAll<HTMLElement>("[data-brand-parallax]").forEach(element => {
        gsap.fromTo(element, { y: desktop ? 14 : 5 }, { y: desktop ? -14 : -5, ease: "none", scrollTrigger: { trigger: element.parentElement, start: "top bottom", end: "bottom top", scrub: 1 } });
      });

      scope.current?.querySelectorAll<HTMLElement>("[data-reveal], [data-story-copy]").forEach(section => {
        gsap.from(section, { y: desktop ? 26 : 14, opacity: .65, clearProps: "transform,opacity", duration: .75, ease: "power2.out", scrollTrigger: { trigger: section, start: "top 94%", once: true } });
      });
      root.querySelectorAll<HTMLElement>("[data-stagger]").forEach(group => {
        gsap.from(group.children, { y: desktop ? 20 : 10, opacity: .65, clearProps: "transform,opacity", stagger: .07, duration: .65, ease: "power2.out", scrollTrigger: { trigger: group, start: "top 92%", once: true } });
      });

      if (desktop && root.querySelector(".story-layout")) {
        gsap.from(".story-symbol", { y: 45, scale: .9, ease: "none", scrollTrigger: { trigger: ".story-layout", start: "top 95%", end: "top 35%", scrub: 1 } });
        gsap.set(".piece-creative, .piece-business", { opacity: .25 });
        gsap.timeline({ scrollTrigger: { trigger: ".story-steps", start: "top 35%", end: "bottom 70%", scrub: .7 }, defaults: { duration: .3, ease: "power1.inOut" } })
          .to(".piece-technology", { opacity: .25 }, .65)
          .to(".piece-creative", { opacity: 1 }, .65)
          .to(".piece-creative", { opacity: .25 }, 1.65)
          .to(".piece-business", { opacity: 1 }, 1.65)
          .to({}, { duration: .5 });
      }
      return () => { observer.disconnect(); document.removeEventListener("visibilitychange", sync); root.removeEventListener("tellu-motion-change", sync); delete root.dataset.motionReady; };
    });
    return () => media.revert();
  }, { scope });

  return <MotionPaused.Provider value={paused}><div ref={scope} data-motion-paused={paused}>{children}<button type="button" className="motion-toggle" aria-label={paused ? copy.play : copy.pause} title={paused ? copy.play : copy.pause} aria-pressed={paused} onClick={() => setPaused(value => !value)}><Icon name={paused ? "play" : "pause"} /></button></div></MotionPaused.Provider>;
}
