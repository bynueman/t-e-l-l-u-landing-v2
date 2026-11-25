"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { home, portfolio as copy } from "@/i18n/dictionaries/id";
import { technologyProjects } from "@/lib/technology-portfolio";
import { Icon } from "@/components/ui/icon";
import { useMotionPaused } from "./home-motion";

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
function getReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function getReducedMotionServerSnapshot() {
  return false;
}

export function FeaturedWork() {
  const [active, setActive] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const globalMotionPaused = useMotionPaused();
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );
  const scope = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalProjects = technologyProjects.length;
  const isPaused = userPaused || hovered || globalMotionPaused || prefersReducedMotion;

  const nextSlide = useCallback(() => {
    setActive((prev) => (prev + 1) % totalProjects);
  }, [totalProjects]);

  const prevSlide = useCallback(() => {
    setActive((prev) => (prev + totalProjects - 1) % totalProjects);
  }, [totalProjects]);

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const handleVisibility = () => {
      if (document.hidden && timerRef.current) {
        clearInterval(timerRef.current);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    timerRef.current = setInterval(() => {
      if (!document.hidden) {
        nextSlide();
      }
    }, 3200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isPaused, nextSlide]);

  const handleManualSelect = (index: number) => {
    setActive(index);
  };

  const handleManualPrev = () => {
    prevSlide();
  };

  const handleManualNext = () => {
    nextSlide();
  };

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        ".featured-project",
        { opacity: 0.5, y: 10 },
        { opacity: 1, y: 0, duration: 0.38, ease: "power2.out" }
      );
    });
    return () => media.revert();
  }, { scope, dependencies: [active], revertOnUpdate: true });

  return (
    <div
      ref={scope}
      className="featured-work"
      data-reveal
      role="region"
      aria-roledescription={copy.carousel}
      aria-label={home.workLabel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {technologyProjects.map((project, index) => (
        <div
          key={project.id}
          hidden={active !== index}
          role="group"
          aria-roledescription={copy.slide}
          aria-label={`${index + 1} / ${totalProjects}: ${project.name}`}
        >
          <Link
            href={`/technology?project=${project.id}#selected-work`}
            className="featured-project"
          >
            <div className="featured-image">
              <Image
                src={project.image}
                alt={`${copy.screenshot}: ${project.name}`}
                width={1440}
                height={810}
                sizes="(max-width: 899px) 90vw, 85vw"
                loading="eager"
                priority={index === 0}
              />
              <span className="project-open" aria-hidden="true">
                <Icon name="arrow-right" />
              </span>
            </div>
            <div className="featured-caption">
              <div>
                <p className="eyebrow">{project.category}</p>
                <h3 className="display">{project.name}</h3>
              </div>
              <div>
                <p>{project.description}</p>
                <span className="text-link">
                  {copy.viewProject}
                  <Icon name="arrow-right" />
                </span>
              </div>
            </div>
          </Link>
        </div>
      ))}
      <div className="slideshow-nav">
        <p role="status" aria-live="polite" aria-atomic="true">
          0{active + 1} / 0{totalProjects} <span>{technologyProjects[active].name}</span>
        </p>
        <div className="slideshow-arrows">
          <button
            type="button"
            aria-label={userPaused ? "Lanjutkan slideshow portfolio" : "Jeda slideshow portfolio"}
            aria-pressed={userPaused}
            onClick={() => setUserPaused((p) => !p)}
          >
            <Icon name={userPaused ? "play" : "pause"} size={14} />
          </button>
          <button
            type="button"
            aria-label={copy.previous}
            onClick={handleManualPrev}
          >
            <Icon name="arrow-left" />
          </button>
          <button
            type="button"
            aria-label={copy.next}
            onClick={handleManualNext}
          >
            <Icon name="arrow-right" />
          </button>
        </div>
      </div>
      <div className="slideshow-thumbnails" data-stagger role="group" aria-label={copy.select}>
        {technologyProjects.map((project, index) => (
          <button
            key={project.id}
            type="button"
            aria-pressed={active === index}
            onClick={() => handleManualSelect(index)}
          >
            <Image
              src={project.image}
              alt=""
              width={240}
              height={135}
              sizes="(max-width: 540px) 35vw, 20vw"
            />
            <span>
              <small>0{index + 1}</small>
              {project.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
