"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { home, portfolio as copy } from "@/i18n/dictionaries/id";
import { technologyProjects } from "@/lib/technology-portfolio";

export function FeaturedWork() {
  const [active, setActive] = useState(0);
  const scope = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(".featured-project", { opacity: .45, y: 12 }, { opacity: 1, y: 0, duration: .45, ease: "power2.out" });
    });
    return () => media.revert();
  }, { scope, dependencies: [active], revertOnUpdate: true });

  return <div ref={scope} className="featured-work" role="region" aria-roledescription={copy.carousel} aria-label={home.workLabel}>
    {technologyProjects.map((project, index) => <div key={project.id} hidden={active !== index} role="group" aria-roledescription={copy.slide} aria-label={`${index + 1} / ${technologyProjects.length}: ${project.name}`}>
      <Link href={`/technology?project=${project.id}#selected-work`} className="featured-project">
        <div className="featured-image"><Image src={project.image} alt={`${copy.screenshot}: ${project.name}`} width={1440} height={810} sizes="(max-width: 899px) 90vw, 85vw" /><span className="project-open" aria-hidden="true">↗</span></div>
        <div className="featured-caption"><div><p className="eyebrow">{project.category}</p><h3 className="display">{project.name}</h3></div><div><p>{project.description}</p><span className="text-link">{copy.viewProject} ↗</span></div></div>
      </Link>
    </div>)}
    <div className="slideshow-nav">
      <p role="status" aria-live="polite" aria-atomic="true">0{active + 1} / 0{technologyProjects.length} <span>{technologyProjects[active].name}</span></p>
      <div className="slideshow-arrows"><button type="button" aria-label={copy.previous} onClick={() => setActive((active + technologyProjects.length - 1) % technologyProjects.length)}>←</button><button type="button" aria-label={copy.next} onClick={() => setActive((active + 1) % technologyProjects.length)}>→</button></div>
    </div>
    <div className="slideshow-thumbnails" role="group" aria-label={copy.select}>
      {technologyProjects.map((project, index) => <button key={project.id} type="button" aria-pressed={active === index} onClick={() => setActive(index)}><Image src={project.image} alt="" width={240} height={135} sizes="(max-width: 540px) 35vw, 20vw" /><span><small>0{index + 1}</small>{project.name}</span></button>)}
    </div>
  </div>;
}
