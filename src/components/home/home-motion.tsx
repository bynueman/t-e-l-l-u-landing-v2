"use client";

import { createContext, useContext, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);
const MotionPaused = createContext(false);
export const useMotionPaused = () => useContext(MotionPaused);

export function HomeMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add({ motion: "(prefers-reduced-motion: no-preference)", desktop: "(min-width: 900px)" }, context => {
      if (!context.conditions?.motion) return;
      const desktop = context.conditions.desktop;
      const root = scope.current;
      if (!root) return;
      root.dataset.motionReady = "true";

      // Hero copy entrance
      if (root.querySelector("#hero")) {
        gsap.timeline({ defaults: { ease: "power3.out", duration: 0.7 } })
          .from(".hero-copy", { opacity: 0, y: 16 }, 0.1)
          .from(".hero-search-zone", { opacity: 0, y: 16, duration: 0.75 }, 0.2);
      }

      // Proximity brand floaters
      const floats = Array.from(root.querySelectorAll<HTMLElement>(".brand-float")).map((element, index) => ({
        element, visible: false,
        tween: gsap.to(element, { y: desktop ? 8 : 4, x: index % 2 ? -3 : 3, rotation: index % 2 ? -3 : 4, duration: 6 + index % 4, delay: index * 0.35, repeat: -1, yoyo: true, ease: "sine.inOut", paused: true }),
      }));
      const sync = () => floats.forEach(item => item.tween.paused(!item.visible || document.hidden || root.dataset.motionPaused === "true"));
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => { const item = floats.find(item => item.element === entry.target); if (item) item.visible = entry.isIntersecting; }); sync();
      });
      floats.forEach(item => observer.observe(item.element));
      document.addEventListener("visibilitychange", sync);
      root.addEventListener("tellu-motion-change", sync);

      // Subtle scroll-linked brand parallax
      root.querySelectorAll<HTMLElement>("[data-brand-parallax]").forEach(element => {
        gsap.fromTo(element, { y: desktop ? 12 : 4 }, { y: desktop ? -12 : -4, ease: "none", scrollTrigger: { trigger: element.parentElement, start: "top bottom", end: "bottom top", scrub: 0.8 } });
      });

      // Editorial text reveals with natural 88% trigger
      scope.current?.querySelectorAll<HTMLElement>("[data-reveal], [data-story-copy]").forEach(section => {
        gsap.fromTo(
          section,
          { y: desktop ? 20 : 12, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            clearProps: "transform,opacity",
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 88%",
              once: true,
            },
          }
        );
      });

      // Staggered card and item reveals
      root.querySelectorAll<HTMLElement>("[data-stagger]").forEach(group => {
        gsap.fromTo(
          group.children,
          { y: desktop ? 16 : 10, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            clearProps: "transform,opacity",
            stagger: 0.08,
            duration: 0.7,
            ease: "power2.out",
            scrollTrigger: {
              trigger: group,
              start: "top 88%",
              once: true,
            },
          }
        );
      });

      // Coordinated sticky ecosystem storytelling
      if (desktop && root.querySelector(".story-layout")) {
        gsap.from(".story-symbol", {
          y: 35,
          scale: 0.94,
          ease: "none",
          scrollTrigger: {
            trigger: ".story-layout",
            start: "top 90%",
            end: "top 35%",
            scrub: 0.8,
          },
        });

        // Set initial piece & label opacities
        gsap.set(".piece-creative, .piece-business", { opacity: 0.2 });
        gsap.set(".label-creative, .label-business", { opacity: 0.45 });
        gsap.set(".piece-technology", { opacity: 1 });
        gsap.set(".label-technology", { opacity: 1 });

        // Coordinated scroll progression
        gsap.timeline({
          scrollTrigger: {
            trigger: ".story-steps",
            start: "top 35%",
            end: "bottom 70%",
            scrub: 0.6,
          },
          defaults: { duration: 0.35, ease: "power1.inOut" },
        })
          .to(".piece-technology", { opacity: 0.2 }, 0.6)
          .to(".label-technology", { opacity: 0.45 }, 0.6)
          .to(".piece-creative", { opacity: 1 }, 0.6)
          .to(".label-creative", { opacity: 1 }, 0.6)
          .to(".piece-creative", { opacity: 0.2 }, 1.6)
          .to(".label-creative", { opacity: 0.45 }, 1.6)
          .to(".piece-business", { opacity: 1 }, 1.6)
          .to(".label-business", { opacity: 1 }, 1.6)
          .to({}, { duration: 0.4 });
      }

      return () => {
        observer.disconnect();
        document.removeEventListener("visibilitychange", sync);
        root.removeEventListener("tellu-motion-change", sync);
        delete root.dataset.motionReady;
      };
    });
    return () => media.revert();
  }, { scope });

  return (
    <MotionPaused.Provider value={false}>
      <div ref={scope}>
        {children}
      </div>
    </MotionPaused.Provider>
  );
}
