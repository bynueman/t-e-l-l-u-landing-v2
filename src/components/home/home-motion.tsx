"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function HomeMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add({ motion: "(prefers-reduced-motion: no-preference)", desktop: "(min-width: 900px)" }, context => {
      if (!context.conditions?.motion) return;
      const desktop = context.conditions.desktop;
      const entrance = gsap.timeline({ defaults: { ease: "power3.out", duration: .65 } });
      entrance.from(".hero-title span", { yPercent: 105, duration: .85 }, 0)
        .from(".hero-copy", { opacity: 0, y: 14 }, .15)
        // The input stays visible, focusable and usable throughout its entrance.
        .from(".hero-search-zone", { y: 18, duration: .7 }, .2)
        .from(".hero-ornament", { opacity: 0, scale: .8, stagger: .07 }, .3);

      if (scope.current?.querySelector("#hero")) {
        gsap.to(".hero-ornament", {
          y: index => index === 1 ? -28 : 36,
          rotation: index => index === 1 ? -12 : 12,
          ease: "none",
          scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: 1 },
        });
      }

      scope.current?.querySelectorAll<HTMLElement>("[data-reveal], [data-story-copy]").forEach(section => {
        gsap.from(section, { y: desktop ? 30 : 16, duration: .7, ease: "power2.out", scrollTrigger: { trigger: section, start: "top 94%", once: true } });
      });

      gsap.from(".bridge-piece", {
        x: index => (index - 1) * (desktop ? 120 : 45),
        y: index => index === 1 ? -45 : 25,
        rotation: index => (index - 1) * 16,
        ease: "none",
        scrollTrigger: { trigger: "#tentang", start: "top 95%", end: "top 40%", scrub: 1 },
      });

      if (desktop) {
        gsap.from(".story-symbol", { y: 45, scale: .9, ease: "none", scrollTrigger: { trigger: ".story-layout", start: "top 95%", end: "top 35%", scrub: 1 } });
        gsap.set(".piece-creative, .piece-business", { opacity: .25 });
        gsap.timeline({ scrollTrigger: { trigger: ".story-steps", start: "top 35%", end: "bottom 70%", scrub: .7 }, defaults: { duration: .3, ease: "power1.inOut" } })
          .to(".piece-technology", { opacity: .25 }, .65)
          .to(".piece-creative", { opacity: 1 }, .65)
          .to(".piece-creative", { opacity: .25 }, 1.65)
          .to(".piece-business", { opacity: 1 }, 1.65)
          .to({}, { duration: .5 });
      }
    });
    return () => media.revert();
  }, { scope });

  return <div ref={scope}>{children}</div>;
}
