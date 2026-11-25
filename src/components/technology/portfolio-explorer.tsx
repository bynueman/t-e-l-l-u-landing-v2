"use client";

import Image from "next/image";
import { portfolio as copy } from "@/i18n/dictionaries/id";
import { Suspense, useState, useRef, useEffect, useCallback, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { technologyProjects } from "@/lib/technology-portfolio";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Icon } from "@/components/ui/icon";

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

export function PortfolioExplorer() {
  return (
    <Suspense fallback={<ProjectPreview />}>
      <ProjectFromQuery />
    </Suspense>
  );
}

function ProjectFromQuery() {
  const query = useSearchParams().get("project");
  return <ProjectPreview key={query} initialSelected={query ?? undefined} />;
}

function ProjectPreview({ initialSelected = technologyProjects[0].id }: { initialSelected?: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const initialIndex = Math.max(
    0,
    technologyProjects.findIndex((item) => item.id === initialSelected)
  );
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [live, setLive] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [revision, setRevision] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);

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

  const totalProjects = technologyProjects.length;

  const goToNextSlide = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % totalProjects);
    setLive(false);
  }, [totalProjects]);

  // Auto-advancing slideshow timer (pauses on hover, user pause, live preview, or reduced motion)
  useEffect(() => {
    const shouldAutoplay = !live && !userPaused && !hovered && isTabVisible && !prefersReducedMotion;

    if (!shouldAutoplay) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      goToNextSlide();
    }, 3600);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [live, userPaused, hovered, isTabVisible, prefersReducedMotion, goToNextSlide]);

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          frame.current,
          { opacity: 0.75, y: 8, scale: 0.995 },
          { opacity: 1, y: 0, scale: 1, duration: 0.38, ease: "power2.out" }
        );
        gsap.fromTo(
          infoRef.current,
          { opacity: 0.55, y: 5 },
          { opacity: 1, y: 0, duration: 0.32, ease: "power2.out" }
        );
      });
      return () => media.revert();
    },
    { dependencies: [selectedIndex, mobile, live], revertOnUpdate: true }
  );

  // Resolve IDs against fixed registry; arbitrary URLs never enter iframe.
  const project = technologyProjects[selectedIndex] ?? technologyProjects[0];
  const pending = project.previewStatus === "pending-server-permission";
  const canEmbed = project.embeddable && !pending;

  return (
    <div
      className="tech-explorer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Project Selector List (Continuous Auto-Advancing Loop) */}
      <div className="tech-selector" role="group" aria-label={copy.select}>
        {technologyProjects.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={selectedIndex === index}
            onClick={() => {
              setSelectedIndex(index);
              setLive(false);
            }}
          >
            <span>0{index + 1}</span>
            {item.name}
            <span aria-hidden="true">{selectedIndex === index && <Icon name="check" />}</span>
          </button>
        ))}
      </div>

      {/* Main Preview Area */}
      <div className="min-w-0">
        <div ref={infoRef} className="tech-project-info" aria-live="polite">
          <p className="eyebrow text-muted">{project.category}</p>
          <h3>{project.name}</h3>
          <p>{project.description}</p>
        </div>

        {/* Viewport & External Tools */}
        <div className="tech-preview-tools">
          <div role="group" aria-label={copy.width}>
            <button
              type="button"
              aria-pressed={!mobile}
              onClick={() => setMobile(false)}
            >
              {copy.desktop}
            </button>
            <button
              type="button"
              aria-pressed={mobile}
              onClick={() => setMobile(true)}
            >
              {copy.mobile}
            </button>
          </div>
          <div className="flex items-center gap-3 !border-0 !bg-transparent !p-0">
            {!live && (
              <button
                type="button"
                aria-label={userPaused ? "Lanjutkan putaran portfolio" : "Jeda putaran portfolio"}
                aria-pressed={userPaused}
                onClick={() => setUserPaused((p) => !p)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full !border !border-line !bg-white !p-0 text-foreground hover:!border-foreground"
              >
                <Icon name={userPaused ? "play" : "pause"} size={13} />
              </button>
            )}
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link"
            >
              {copy.original}
              <Icon name="external" />
            </a>
          </div>
        </div>

        {/* Safari Browser Shell */}
        <div ref={frame} className="tech-browser" data-mobile={mobile}>
          <div className="tech-address">
            <span className="browser-lights" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="browser-domain">{new URL(project.url).hostname}</span>
            {live && (
              <button
                type="button"
                onClick={() => setRevision((value) => value + 1)}
                className="text-link text-xs"
              >
                {copy.reload}
              </button>
            )}
          </div>

          {live && canEmbed ? (
            <iframe
              key={`${project.id}-${revision}`}
              src={project.previewUrl ?? project.url}
              title={`${copy.preview}: ${project.name}`}
              loading="lazy"
              referrerPolicy="no-referrer"
              sandbox={
                project.id === "intrax"
                  ? "allow-scripts allow-same-origin"
                  : "allow-scripts allow-same-origin allow-forms allow-popups"
              }
            />
          ) : (
            <div className="tech-cover">
              <Image
                src={project.image}
                alt={`${copy.screenshot}: ${project.name}`}
                width={1600}
                height={900}
                sizes="(max-width: 768px) 90vw, 65vw"
                priority={selectedIndex === 0}
              />
            </div>
          )}
        </div>

        {/* Clean, Uncluttered Portfolio Actions */}
        <div className="tech-preview-actions">
          {!live ? (
            canEmbed ? (
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  className="button-primary"
                  onClick={() => setLive(true)}
                >
                  {copy.explore} <Icon name="external" />
                </button>
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link text-sm"
                >
                  {copy.original} <Icon name="external" />
                </a>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4 w-full">
                <p className="text-sm text-muted">
                  {pending ? copy.pending : copy.unavailable}
                </p>
                <a
                  className="button-primary"
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {copy.openProject.replace("{name}", project.name)} <Icon name="external" />
                </a>
              </div>
            )
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setLive(false)}
                className="button-outline text-sm inline-flex items-center gap-1.5"
              >
                <Icon name="arrow-left" size={15} />
                <span>{copy.back}</span>
              </button>
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link text-sm"
              >
                {copy.original} <Icon name="external" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
