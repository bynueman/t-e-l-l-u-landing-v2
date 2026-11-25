"use client";

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import Image from "next/image";
import { TelluFloatingAccent } from "@/components/layout/tellu-floating-accent";
import { technologyProjects } from "@/lib/technology-portfolio";
import { Icon } from "@/components/ui/icon";
import { useMotionPaused } from "@/components/home/home-motion";

interface TechnologyHeroProps {
  title: string;
  description: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
}

function getProjectDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

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

function subscribeVisibility(callback: () => void) {
  if (typeof document === "undefined") return () => {};
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

function getVisibilitySnapshot() {
  if (typeof document === "undefined") return true;
  return document.visibilityState === "visible";
}

function getVisibilityServerSnapshot() {
  return true;
}

export function TechnologyHero({
  title,
  description,
  primaryCtaLabel = "Lihat Paket Website",
  primaryCtaHref = "#packages",
  secondaryCtaLabel = "Lihat Portfolio",
  secondaryCtaHref = "#selected-work",
}: TechnologyHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const globalMotionPaused = useMotionPaused();

  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  const isTabVisible = useSyncExternalStore(
    subscribeVisibility,
    getVisibilitySnapshot,
    getVisibilityServerSnapshot
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalSlides = technologyProjects.length;

  const goToNextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-advancing slideshow timer (respects reduced motion, tab visibility, and hover)
  useEffect(() => {
    const shouldAutoplay = isTabVisible && !prefersReducedMotion && !globalMotionPaused && !hovered;

    if (!shouldAutoplay) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      goToNextSlide();
    }, 3200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTabVisible, prefersReducedMotion, globalMotionPaused, hovered, goToNextSlide]);

  const activeProject = technologyProjects[currentIndex];
  const activeDomain = getProjectDomain(activeProject.url);

  return (
    <section className="tech-hero page-container" aria-labelledby="tech-hero-heading">
      <TelluFloatingAccent tone="charcoal" className="tech-hero-accent" />

      <div className="tech-hero-grid">
        {/* Left Column: Direct Heading & Clean Value Proposition */}
        <div className="tech-hero-content" data-reveal>
          <h1 id="tech-hero-heading" className="display tech-hero-title">
            {title}
          </h1>

          <p className="tech-hero-description">
            {description}
          </p>

          <div className="tech-hero-actions">
            <a href={primaryCtaHref} className="button-primary inline-flex items-center gap-2">
              <span>{primaryCtaLabel}</span>
              <Icon name="layers" size={17} />
            </a>
            <a href={secondaryCtaHref} className="button-outline inline-flex items-center gap-2">
              <span>{secondaryCtaLabel}</span>
              <Icon name="app" size={17} />
            </a>
          </div>
        </div>

        {/* Right Column: 3D Desktop Monitor Portfolio Showcase */}
        <div
          className="tech-hero-visual"
          data-reveal
          aria-roledescription="slideshow"
          aria-label="Portfolio website terpilih TELLU"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div className="tech-monitor-stage">
            <div className="tech-monitor-3d">
              {/* 3D Side Depth Rim */}
              <div className="tech-monitor-depth" aria-hidden="true" />

              {/* Monitor Chassis / Bezel */}
              <div className="tech-monitor-chassis">
                {/* Top Camera Dot */}
                <div className="tech-monitor-bezel-top" aria-hidden="true">
                  <span className="tech-monitor-camera" />
                </div>

                {/* Inner Screen Display */}
                <div className="tech-monitor-display">
                  {/* Browser Address Header */}
                  <div className="tech-hero-browser-chrome">
                    <span className="tech-browser-dots" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                    <a
                      href={activeProject.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tech-browser-url-link"
                      title={`Kunjungi ${activeDomain} (buka tab baru)`}
                    >
                      <svg
                        className="tech-browser-lock-icon"
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span className="tech-browser-url">{activeDomain}</span>
                      <Icon name="external" size={11} className="tech-browser-external-icon opacity-60" />
                    </a>
                  </div>

                  {/* Screen Viewport with Crossfade Project Slides */}
                  <div className="tech-hero-browser-screen">
                    {technologyProjects.map((project, index) => {
                      const isActive = index === currentIndex;
                      return (
                        <div
                          key={project.id}
                          className={`tech-hero-slide-layer ${isActive ? "active" : ""}`}
                          aria-hidden={!isActive}
                        >
                          <Image
                            src={project.image}
                            alt={`Tampilan website ${project.name}`}
                            width={1200}
                            height={675}
                            loading="eager"
                            priority={index === 0}
                            className="tech-hero-browser-img"
                          />
                        </div>
                      );
                    })}
                    <div className="tech-monitor-glass-sheen" aria-hidden="true" />
                  </div>
                </div>

                {/* Aluminum Monitor Chin */}
                <div className="tech-monitor-chin" aria-hidden="true">
                  <span className="tech-monitor-chin-led" />
                </div>
              </div>

              {/* Monitor Stand Neck & Desk Base */}
              <div className="tech-monitor-stand" aria-hidden="true">
                <div className="tech-monitor-neck" />
                <div className="tech-monitor-base">
                  <div className="tech-monitor-base-lip" />
                </div>
              </div>

              {/* Ground Contact Shadow */}
              <div className="tech-monitor-shadow" aria-hidden="true" />
            </div>
          </div>

          {/* Minimal Dots & Project Caption Bar (no pause button) */}
          <div className="tech-hero-slideshow-bar">
            <div className="tech-hero-dots" role="tablist" aria-label="Pilih proyek">
              {technologyProjects.map((project, index) => {
                const isActive = index === currentIndex;
                return (
                  <button
                    key={project.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Slide ${index + 1}: ${project.name}`}
                    className={`tech-hero-dot ${isActive ? "active" : ""}`}
                    onClick={() => goToSlide(index)}
                  />
                );
              })}
            </div>

            <div className="tech-hero-caption" aria-live="polite">
              <span className="tech-hero-caption-title">{activeProject.name}</span>
              <span className="tech-hero-caption-cat">{activeProject.category}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
